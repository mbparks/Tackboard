  /* IndexedDB v2: save board records separately while retaining legacy import. */
  function idbWriteBatch(entries, deleteKeys = []) {
    return new Promise((resolve, reject) => {
      const tx = ui.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const [key, value] of entries) store.put(value, key);
      for (const key of deleteKeys) store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB batch write failed'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB batch write aborted'));
    });
  }

  function parseEmergencySnapshot() {
    try {
      const raw = localStorage.getItem(`${STATE_KEY}-emergency`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.state) return { savedAt: Number(parsed.savedAt) || 0, state: parsed.state };
      return { savedAt: latestBoardModified(parsed), state: parsed };
    } catch {
      return null;
    }
  }

  function applyEmergencyIfNewer() {
    const emergency = parseEmergencySnapshot();
    if (!emergency?.state) return;
    try {
      if (JSON.stringify(normalizeState(emergency.state)) === JSON.stringify(normalizeState(state))) return;
    } catch {}
    const persistedTime = Math.max(Number(ui.loadedSavedAt) || 0, latestBoardModified(state));
    const emergencyTime = Math.max(Number(emergency.savedAt) || 0, latestBoardModified(emergency.state));
    if (emergencyTime <= persistedTime + 50) return;
    state = normalizeState(emergency.state);
    ui.recoveredEmergency = true;
    ui.dirtyBoardIds = new Set(state.boards.map(board => board.id));
  }

  loadPersistedState = async function() {
    ui.usingLocalStorageFallback = false;
    try {
      ui.db = await openDatabase();
      const index = await idbGet(V12_INDEX_KEY);
      if (index?.format === 'tackboard-index' && Array.isArray(index.boardIds)) {
        const boards = (await Promise.all(index.boardIds.map(id => idbGet(`${V12_BOARD_KEY_PREFIX}${id}`)))).filter(Boolean);
        state = normalizeState({
          format: 'tackboard-backup',
          schemaVersion: index.schemaVersion || V12_SCHEMA_VERSION,
          appVersion: index.appVersion,
          currentBoardId: index.currentBoardId,
          settings: index.settings,
          boards
        });
        ui.loadedSavedAt = Number(index.savedAt) || 0;
        ui.lastSavedAt = ui.loadedSavedAt || null;
        ui.persistedBoardIds = new Set(boards.map(board => board.id));
        ui.persistedBoardVersions = new Map(boards.map(board => [board.id, board.modifiedAt]));
      } else {
        const legacy = await idbGet(STATE_KEY);
        if (legacy) state = normalizeState(legacy);
        ui.persistedBoardIds = new Set();
        ui.persistedBoardVersions = new Map();
        ui.dirtyBoardIds = new Set(state.boards.map(board => board.id));
      }
    } catch (error) {
      console.warn('TACKBOARD: IndexedDB unavailable; using localStorage fallback.', error);
      ui.usingLocalStorageFallback = true;
      try {
        const raw = localStorage.getItem(STATE_KEY);
        if (raw) state = normalizeState(JSON.parse(raw));
      } catch (storageError) {
        console.warn('TACKBOARD: Could not restore local data.', storageError);
        toast('Stored data could not be read. A new local workspace was opened.', 'error', 5200);
      }
    }
    applyEmergencyIfNewer();
    ensureV12State();
  };

  persistState = async function() {
    const snapshot = deepClone(state);
    snapshot.appVersion = APP_VERSION;
    snapshot.schemaVersion = V12_SCHEMA_VERSION;
    if (ui.usingLocalStorageFallback) {
      localStorage.setItem(STATE_KEY, JSON.stringify(snapshot));
      const savedAt = Date.now();
      ui.lastSavedAt = savedAt;
      ui.loadedSavedAt = savedAt;
      ui.dirtyBoardIds.clear();
      return;
    }
    const boardIds = snapshot.boards.map(board => board.id);
    const changedBoards = snapshot.boards.filter(board =>
      ui.dirtyBoardIds.has(board.id) ||
      !ui.persistedBoardIds.has(board.id) ||
      ui.persistedBoardVersions.get(board.id) !== board.modifiedAt
    );
    const savedAt = Date.now();
    const index = {
      format: 'tackboard-index',
      schemaVersion: V12_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      currentBoardId: snapshot.currentBoardId,
      settings: snapshot.settings,
      boardIds,
      boardMeta: snapshot.boards.map(({ id, name, description, createdAt, modifiedAt }) => ({ id, name, description, createdAt, modifiedAt })),
      savedAt
    };
    const entries = [[V12_INDEX_KEY, index], ...changedBoards.map(board => [`${V12_BOARD_KEY_PREFIX}${board.id}`, board])];
    const stale = Array.from(ui.persistedBoardIds).filter(id => !boardIds.includes(id)).map(id => `${V12_BOARD_KEY_PREFIX}${id}`);
    await idbWriteBatch(entries, stale);
    ui.persistedBoardIds = new Set(boardIds);
    ui.persistedBoardVersions = new Map(snapshot.boards.map(board => [board.id, board.modifiedAt]));
    ui.dirtyBoardIds.clear();
    ui.lastSavedAt = savedAt;
    ui.loadedSavedAt = savedAt;
  };

  touchBoard = function() {
    currentBoard().modifiedAt = nowISO();
    ui.dirtyBoardIds.add(currentBoard().id);
    scheduleSave();
  };

  saveNow = async function() {
    clearTimeout(ui.saveTimer);
    if (ui.saveInFlight) {
      ui.pendingSave = true;
      return;
    }
    ui.saveInFlight = true;
    ui.pendingSave = false;
    setSaveStatus('saving', 'Saving');
    try {
      await persistState();
      ui.lastSaveError = null;
      ui.saveErrorDismissed = false;
      setSaveStatus('saved', 'Saved');
      try { localStorage.setItem(`${STATE_KEY}-emergency`, JSON.stringify({ savedAt: Date.now(), state })); } catch {}
    } catch (error) {
      console.error('TACKBOARD save error', error);
      ui.lastSaveError = error;
      ui.saveErrorDismissed = false;
      setSaveStatus('error', 'Save Error');
    } finally {
      ui.saveInFlight = false;
      renderSaveReliability();
      if (ui.pendingSave) scheduleSave({ immediate: true });
    }
  };

  setViewport = function(next, options = {}) {
    ui.dirtyBoardIds.add(currentBoard().id);
    v12Original.setViewport(next, options);
    updateSelectionOverlay();
  };

  function renderSaveReliability() {
    if (!els.saveErrorBanner) return;
    const visible = Boolean(ui.lastSaveError) && !ui.saveErrorDismissed;
    els.saveErrorBanner.classList.toggle('visible', visible);
    document.body.classList.toggle('save-error-visible', visible);
    if (visible) els.saveErrorMessage.textContent = ui.lastSaveError?.message || 'Your latest changes may not be stored in this browser.';
    const statusLabel = ui.lastSaveError ? 'Save error. Open for recovery actions.' : ui.lastSavedAt ? `Saved ${new Date(ui.lastSavedAt).toLocaleTimeString()}. Open save details.` : 'Local save status';
    els.saveStatus.setAttribute('aria-label', statusLabel);
  }

  function openSaveStatusMenu(anchor = els.saveStatus) {
    const storage = ui.usingLocalStorageFallback ? 'localStorage fallback' : 'IndexedDB board records';
    const when = ui.lastSavedAt ? new Date(ui.lastSavedAt).toLocaleString() : 'Not yet saved in this session';
    openPopover(`<div class="popover-section"><h3>Local save</h3>
      <div class="menu-item" aria-disabled="true"><span class="menu-icon" aria-hidden="true">●</span><span class="menu-copy"><span class="menu-title">${escapeHTML(ui.lastSaveError ? 'Save needs attention' : 'Local storage ready')}</span><span class="menu-subtitle">Last successful save: ${escapeHTML(when)} · ${escapeHTML(storage)}</span></span></div>
      ${menuItem('save-retry', '↻', 'Save Now', 'Retry the local save immediately')}
      ${menuItem('save-backup', '▣', 'Export Complete Backup', 'Download every board and preference')}
    </div>`, anchor, { width: 330 });
  }

  toast = function(message, type = 'info', duration = 3200) {
    const key = `${type}:${message}`;
    const existing = ui.toastRegistry.get(key);
    if (existing?.node?.isConnected) {
      existing.count += 1;
      existing.countNode.textContent = `×${existing.count}`;
      existing.countNode.hidden = false;
      clearTimeout(existing.timer);
      existing.timer = setTimeout(() => dismissToast(key), duration);
      return existing.node;
    }
    const node = document.createElement('div');
    node.className = `toast ${type === 'error' || type === 'success' ? type : ''}`;
    const copy = document.createElement('span');
    copy.textContent = message;
    const countNode = document.createElement('span');
    countNode.className = 'toast-count';
    countNode.textContent = '×1';
    countNode.hidden = true;
    node.append(copy, countNode);
    els.toastHost.appendChild(node);
    const record = { node, countNode, count: 1, timer: null };
    record.timer = setTimeout(() => dismissToast(key), duration);
    ui.toastRegistry.set(key, record);
    return node;
  };

  function dismissToast(key) {
    const record = ui.toastRegistry.get(key);
    if (!record) return;
    record.node.style.opacity = '0';
    record.node.style.transform = 'translateY(-4px)';
    setTimeout(() => record.node.remove(), 180);
    ui.toastRegistry.delete(key);
  }

