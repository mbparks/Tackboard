  /* Event installation */
  setupEvents = function() {
    v12Original.setupEvents();

    els.mobileMenuButton?.addEventListener('click', () => els.popover.classList.contains('hidden') ? openMobileMenu() : closePopover());
    els.saveStatus?.addEventListener('click', () => els.popover.classList.contains('hidden') ? openSaveStatusMenu() : closePopover());
    els.retrySaveButton?.addEventListener('click', saveNow);
    els.backupNowButton?.addEventListener('click', exportBackupJSON);
    els.dismissSaveErrorButton?.addEventListener('click', () => { ui.saveErrorDismissed = true; renderSaveReliability(); });
    els.touchAddButton?.addEventListener('click', () => {
      ui.touchAdditive = !ui.touchAdditive;
      updateToolUI();
      toast(ui.touchAdditive ? 'Touch Add Selection is on. Tap or drag to add items.' : 'Touch Add Selection is off.');
    });
    els.zoomSelectionButton?.addEventListener('click', zoomToSelection);
    els.overviewButton?.addEventListener('click', overviewContent);
    els.activeFilterBar?.addEventListener('click', event => {
      const clear = event.target.closest('[data-clear-filter]');
      if (clear) {
        const key = clear.dataset.clearFilter;
        ui.filters[key] = '';
        if (key === 'due') { ui.filters.from = ''; ui.filters.to = ''; }
        renderAll();
        return;
      }
      if (event.target.closest('[data-reset-filter-bar]')) {
        ui.filters = { template: '', ticketType: '', team: '', status: '', onHold: '', needsVP: '', due: '', from: '', to: '' };
        renderAll();
      }
    });
    els.objectLayer.addEventListener('focusin', event => {
      if (isTypingTarget(event.target)) return;
      const root = event.target.closest('[data-object-id]');
      const id = root?.dataset.objectId;
      if (id && !ui.selection.has(id)) {
        selectId(id, { bypassGroup: event.altKey });
        requestAnimationFrame(() => els.objectLayer.querySelector(`[data-object-id="${cssEscape(id)}"]`)?.focus({ preventScroll: true }));
      }
    });
    els.vectorLayer.addEventListener('focusin', event => {
      const id = event.target.dataset.connectorId || event.target.dataset.drawingId;
      if (id && !ui.selection.has(id)) {
        selectId(id, { bypassGroup: true });
        requestAnimationFrame(() => els.vectorLayer.querySelector(`[data-connector-id="${cssEscape(id)}"], [data-drawing-id="${cssEscape(id)}"]`)?.focus({ preventScroll: true }));
      }
    });
    els.vectorLayer.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && (event.target.dataset.connectorId || event.target.dataset.drawingId)) {
        event.preventDefault();
        const id = event.target.dataset.connectorId || event.target.dataset.drawingId;
        selectId(id, { bypassGroup: true });
      }
    });
    els.popover.addEventListener('keydown', handlePopoverKeyboard);
    els.objectLayer.addEventListener('click', event => {
      if (event.target.closest('[data-finish-edit]')) {
        event.preventDefault();
        event.stopPropagation();
        finishEditing();
      }
      if (event.target.closest('[data-toggle-frame-collapse]')) {
        event.preventDefault();
        event.stopPropagation();
        const root = event.target.closest('[data-object-id]');
        toggleFrameCollapse(getObject(root?.dataset.objectId));
      }
    }, true);
    els.contextToolbar.addEventListener('click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'toggle-frame-collapse') {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleFrameCollapse();
      }
    }, true);
    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(`${STATE_KEY}-emergency`, JSON.stringify({ savedAt: Date.now(), state })); } catch {}
    });
    if (typeof installV13KanbanEvents === 'function') installV13KanbanEvents();
  };

  function installV12PostBoot() {
    ensureV12State();
    if (ui.recoveredEmergency) toast('Recovered newer unsaved work from the emergency snapshot.', 'success', 6000);
    renderAll();
    Object.assign(window.TACKBOARD_DEBUG || {}, {
      schemaVersion: V12_SCHEMA_VERSION,
      setTool,
      selectIds: ids => { ui.selection = new Set(ids); renderAll(); },
      getSelection: () => selectedIds(),
      toggleFrameCollapse: id => toggleFrameCollapse(getObject(id)),
      toggleSelectionLock,
      zoomToSelection,
      overviewContent,
      requestExport,
      renderActiveFilters,
      switchBoard,
      undo,
      redo,
      createBoardDirect: (name = 'Debug Board') => {
        const board = makeDefaultBoard(name);
        state.boards.push(board);
        state.currentBoardId = board.id;
        resetHistory(board.id);
        renderAll();
        scheduleSave();
        return board.id;
      }
    });
    if (typeof installV13PostBoot === 'function') installV13PostBoot();
  }


  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (error) {
      console.info('TACKBOARD service worker was not registered in this environment.', error);
    }
  }

  async function boot() {
    setupEvents();
    try {
      await loadPersistedState();
    } catch (error) {
      console.error('TACKBOARD startup error', error);
      state = makeDefaultState();
      toast('TACKBOARD opened a new workspace because local data could not be restored.', 'error', 5500);
    }
    renderAll();
    setSaveStatus('saved', 'Saved');
    registerServiceWorker();
    window.TACKBOARD_DEBUG = {
      version: APP_VERSION,
      getState: () => deepClone(state),
      getCurrentBoard: () => deepClone(currentBoard()),
      addBlankNote: point => addBlankNote(point || { x: 500, y: 400 }, { edit: false }),
      addKanbanNote: point => addKanbanNote(point || { x: 700, y: 400 }, { edit: false }),
      addSticker: (stickerId = 'check', point = null) => addSticker(point || { x: 900, y: 400 }, { stickerId }),
      loadExampleBoard,
      saveNow,
      renderAll
    };
    installV12PostBoot();
  }

  boot();
})();
