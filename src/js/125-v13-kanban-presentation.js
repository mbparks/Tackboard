  /* -----------------------------------------------------------------------
     TACKBOARD v1.3.0 — stable Kanban summary cards and detached editor sheet
     ----------------------------------------------------------------------- */
  const V13_KANBAN_LAYOUT_VERSION = 1;
  const V13_KANBAN_MIN_WIDTH = 340;
  const V13_KANBAN_MAX_WIDTH = 520;
  const V13_KANBAN_HEIGHTS = Object.freeze({ compact: 286, expanded: 474 });
  const V13_KANBAN_EDITOR_GROUPS = Object.freeze([
    {
      id: 'identity',
      title: 'Identity',
      note: 'Ticket identity and planning context.',
      fields: [
        { key: 'ticketNumber' },
        { key: 'ticketType' },
        { key: 'sprintNumber' },
        { key: 'epic' }
      ]
    },
    {
      id: 'work',
      title: 'Work',
      note: 'Describe the work, issue, request, or expected result.',
      fields: [{ key: 'description', wide: true }]
    },
    {
      id: 'ownership',
      title: 'Ownership',
      note: 'Who reported the work and who owns the next action.',
      fields: [
        { key: 'team' },
        { key: 'reporter' },
        { key: 'assignee', wide: true }
      ]
    },
    {
      id: 'state',
      title: 'State',
      note: 'Current workflow state, flags, and required date.',
      fields: [
        { key: 'status' },
        { key: 'needByDate' },
        { key: 'onHold' },
        { key: 'needsVP' }
      ]
    }
  ]);

  Object.assign(els, {
    kanbanEditorBackdrop: $('#kanbanEditorBackdrop'),
    kanbanEditorSheet: $('#kanbanEditorSheet'),
    kanbanEditorHeader: $('.kanban-editor-header', $('#kanbanEditorSheet')),
    kanbanEditorTitle: $('#kanbanEditorTitle'),
    kanbanEditorSubtitle: $('#kanbanEditorSubtitle'),
    kanbanEditorClose: $('#kanbanEditorClose'),
    kanbanEditorForm: $('#kanbanEditorForm'),
    kanbanEditorBody: $('#kanbanEditorBody'),
    kanbanEditorStatus: $('#kanbanEditorStatus'),
    kanbanEditorCancel: $('#kanbanEditorCancel'),
    kanbanEditorDone: $('#kanbanEditorDone')
  });

  Object.assign(ui, {
    kanbanEditorId: null,
    kanbanEditorSnapshot: null,
    kanbanEditorChanged: false,
    kanbanEditorHistoryBefore: null,
    kanbanEditorOriginFocus: null,
    kanbanEditorRefreshFrame: null,
    kanbanEditorPositionFrame: null,
    kanbanLayoutMigrated: false,
    pendingKanbanLayoutMigrationSave: false
  });

  const v13Previous = {
    normalizeObject,
    loadPersistedState,
    renderKanbanNote,
    selectionDecorations,
    enhanceRenderedObjects,
    renderAll,
    enterEdit,
    finishEditing,
    focusEditor,
    toggleKanbanCompact,
    minimumSize,
    startResize,
    updateResizeAction,
    startDrag,
    updateGroupResize,
    nudgeSelection,
    handleObjectClick,
    setViewport,
    drawKanbanNoteExport,
    undo,
    redo
  };

  function v13KanbanMode(note) {
    return note?.displayMode === 'compact' ? 'compact' : 'expanded';
  }

  function v13CanonicalKanbanHeight(noteOrMode) {
    const mode = typeof noteOrMode === 'string' ? noteOrMode : v13KanbanMode(noteOrMode);
    return V13_KANBAN_HEIGHTS[mode] || V13_KANBAN_HEIGHTS.expanded;
  }

  function v13CanonicalizeKanban(note) {
    if (!note || note.objectType !== 'template-note') return false;
    const previousWidth = Number(note.width) || 380;
    const previousHeight = Number(note.height) || 0;
    const width = clamp(previousWidth, V13_KANBAN_MIN_WIDTH, V13_KANBAN_MAX_WIDTH);
    const height = v13CanonicalKanbanHeight(note);
    const changed = width !== previousWidth || height !== previousHeight || note.kanbanLayoutVersion !== V13_KANBAN_LAYOUT_VERSION;
    note.width = width;
    note.height = height;
    note.kanbanLayoutVersion = V13_KANBAN_LAYOUT_VERSION;
    note.x = clamp(Number(note.x) || 0, 0, Math.max(0, WORLD.width - width));
    note.y = clamp(Number(note.y) || 0, 0, Math.max(0, WORLD.height - height));
    return changed;
  }

  function v13CanonicalizeBoardKanban(board = currentBoard()) {
    let changed = false;
    for (const note of board.objects || []) {
      if (v13CanonicalizeKanban(note)) changed = true;
    }
    return changed;
  }

  normalizeObject = function(obj) {
    const normalized = v13Previous.normalizeObject(obj);
    if (!normalized || normalized.objectType !== 'template-note') return normalized;
    const rawMode = obj?.displayMode === 'compact' ? 'compact' : 'expanded';
    const rawWidth = Number.isFinite(Number(obj?.width)) ? Number(obj.width) : Number(obj?.size?.width);
    const rawHeight = Number.isFinite(Number(obj?.height)) ? Number(obj.height) : Number(obj?.size?.height);
    const expectedWidth = clamp(Number(rawWidth) || normalized.width || 380, V13_KANBAN_MIN_WIDTH, V13_KANBAN_MAX_WIDTH);
    const expectedHeight = v13CanonicalKanbanHeight(rawMode);
    if (obj?.kanbanLayoutVersion !== V13_KANBAN_LAYOUT_VERSION || Number(rawWidth) !== expectedWidth || Number(rawHeight) !== expectedHeight) ui.kanbanLayoutMigrated = true;
    normalized.displayMode = rawMode;
    normalized.width = expectedWidth;
    normalized.height = expectedHeight;
    normalized.kanbanLayoutVersion = V13_KANBAN_LAYOUT_VERSION;
    normalized.x = clamp(normalized.x, 0, Math.max(0, WORLD.width - normalized.width));
    normalized.y = clamp(normalized.y, 0, Math.max(0, WORLD.height - normalized.height));
    return normalized;
  };

  loadPersistedState = async function() {
    ui.kanbanLayoutMigrated = false;
    await v13Previous.loadPersistedState();
    const changed = state.boards.some(board => v13CanonicalizeBoardKanban(board));
    if (ui.kanbanLayoutMigrated || changed) {
      for (const board of state.boards) ui.dirtyBoardIds.add(board.id);
      ui.pendingKanbanLayoutMigrationSave = true;
    }
  };

  function v13KanbanField(key) {
    return KANBAN_SCHEMA.fields.find(field => field.key === key) || null;
  }

  function v13KanbanReadableValue(note, key) {
    const field = v13KanbanField(key);
    if (!field) return '—';
    const value = note.fields?.[key];
    const display = kanbanDisplayValue(field, value);
    return display || '—';
  }

  function v13RenderMetaField(note, key, label = null, extraClass = '') {
    const field = v13KanbanField(key);
    const value = v13KanbanReadableValue(note, key);
    const yes = field?.type === 'checkbox' && Boolean(note.fields?.[key]);
    const classes = ['kanban-field', 'kanban-meta-field', extraClass, field?.type === 'checkbox' ? 'flag-field' : '', yes ? 'is-yes' : ''].filter(Boolean).join(' ');
    return `<div class="${classes}" data-kanban-summary-field="${escapeAttr(key)}"><span class="kanban-label">${escapeHTML(label || field?.label || key)}</span><div class="kanban-value ${value === '—' ? 'empty' : ''}">${escapeHTML(value)}</div></div>`;
  }

  function v13DescriptionNeedsMore(text, width) {
    const value = String(text || '');
    if (!value) return false;
    const estimatedCharactersPerLine = Math.max(28, Math.floor((Number(width) - 48) / 7));
    const estimatedLines = value.split(/\r?\n/).reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / estimatedCharactersPerLine)), 0);
    return estimatedLines > 5;
  }

  function v13RenderCompactKanbanBody(note) {
    return `<div class="kanban-body kanban-card-body kanban-compact-body" data-edit-trigger="true">
      <div class="kanban-summary-grid">
        ${v13RenderMetaField(note, 'team', 'Team')}
        ${v13RenderMetaField(note, 'assignee', 'Assignee')}
        ${v13RenderMetaField(note, 'needByDate', 'Need By')}
        ${v13RenderMetaField(note, 'onHold', 'On Hold')}
        ${v13RenderMetaField(note, 'needsVP', 'Needs VP?')}
      </div>
    </div>`;
  }

  function v13RenderExpandedKanbanBody(note) {
    const description = String(note.fields?.description || '');
    const hasMore = v13DescriptionNeedsMore(description, note.width);
    return `<div class="kanban-body kanban-card-body kanban-expanded-body" data-edit-trigger="true">
      <section class="kanban-description-card ${hasMore ? 'has-more' : ''}" aria-label="Description">
        <span class="kanban-label">Description</span>
        <div class="kanban-description-text ${description ? '' : 'empty'}">${description ? nl2br(description) : '—'}</div>
        ${hasMore ? '<button class="kanban-read-more" type="button" data-kanban-read-more="true">Read more</button>' : ''}
      </section>
      <div class="kanban-summary-grid">
        ${v13RenderMetaField(note, 'sprintNumber', 'Sprint')}
        ${v13RenderMetaField(note, 'epic', 'Epic')}
        ${v13RenderMetaField(note, 'team', 'Team')}
        ${v13RenderMetaField(note, 'needByDate', 'Need By')}
        ${v13RenderMetaField(note, 'reporter', 'Reporter')}
        ${v13RenderMetaField(note, 'assignee', 'Assignee')}
        ${v13RenderMetaField(note, 'onHold', 'On Hold')}
        ${v13RenderMetaField(note, 'needsVP', 'Needs VP?')}
      </div>
    </div>`;
  }

  renderKanbanNote = function(obj) {
    v13CanonicalizeKanban(obj);
    const f = obj.fields;
    const title = String(f.ticketNumber || '').trim() || 'Untitled Ticket';
    const compact = v13KanbanMode(obj) === 'compact';
    const dueClass = f.needByDate && dateOnly(f.needByDate) < new Date(new Date().setHours(0, 0, 0, 0)) ? 'due-overdue' : '';
    const body = compact ? v13RenderCompactKanbanBody(obj) : v13RenderExpandedKanbanBody(obj);
    return `<article class="${noteViewClasses(obj)} kanban-mode-${compact ? 'compact' : 'expanded'}" data-object-id="${obj.id}" data-object-type="template-note" data-kanban-layout-version="${V13_KANBAN_LAYOUT_VERSION}" style="${objectStyle(obj)}" tabindex="0" aria-label="Kanban note: ${escapeAttr(title)}">
      <header class="object-header kanban-header" data-drag-handle="true">
        <span class="drag-dots" aria-hidden="true">⠿</span>
        <div class="kanban-head-copy">
          <div class="kanban-title-row"><span class="kanban-title">${escapeHTML(title)}</span><span class="template-chip">Kanban</span></div>
          <div class="kanban-badges">
            <span class="badge">${escapeHTML(f.ticketType || 'Story')}</span>
            <span class="badge ${statusClass(f.status)}">${escapeHTML(f.status || 'Backlog')}</span>
            ${f.onHold ? '<span class="badge on-hold flag-on-hold">On Hold</span>' : ''}
            ${f.needsVP ? '<span class="badge">Needs VP</span>' : ''}
            ${f.needByDate ? `<span class="badge ${dueClass}" title="${escapeAttr(formatDate(f.needByDate))}">${escapeHTML(formatRelativeDate(f.needByDate))}</span>` : ''}
          </div>
        </div>
        <button class="header-action" type="button" data-toggle-compact="true" title="${compact ? 'Expand note' : 'Collapse note'}" aria-label="${compact ? 'Expand Kanban note' : 'Collapse Kanban note'}">${compact ? '▾' : '▴'}</button>
      </header>
      ${body}
      ${selectionDecorations(obj)}
    </article>`;
  };

  selectionDecorations = function(obj) {
    if (obj?.objectType !== 'template-note') return v13Previous.selectionDecorations(obj);
    if (!ui.selection.has(obj.id) || ui.editingId === obj.id || obj.objectType === 'drawing') return '';
    const resize = obj.locked ? '' : '<span class="resize-handle e" data-resize="e" title="Resize Kanban card width" aria-hidden="true"></span>';
    const connect = '<span class="connector-handle" data-connector-handle="true" title="Drag to connect" aria-hidden="true"></span>';
    return `${resize}${connect}`;
  };

  enhanceRenderedObjects = function() {
    v13Previous.enhanceRenderedObjects();
    for (const root of $$('[data-object-type="template-note"]', els.objectLayer)) {
      root.querySelectorAll('[data-finish-edit], [data-resize="s"], [data-resize="se"]').forEach(node => node.remove());
      root.classList.toggle('kanban-editor-anchor', root.dataset.objectId === ui.kanbanEditorId);
    }
  };

  function v13EditorFieldControl(note, descriptor) {
    const field = v13KanbanField(descriptor.key);
    if (!field) return '';
    const value = note.fields?.[field.key];
    const id = `${note.id}-${field.key}`;
    const wideClass = descriptor.wide ? ' wide' : '';
    if (field.type === 'dropdown') {
      return `<div class="kanban-editor-field${wideClass}"><label for="${id}">${escapeHTML(field.label)}</label><select id="${id}" data-kanban-field="${field.key}" data-kanban-editor-field="${field.key}">${field.options.map(option => `<option value="${escapeAttr(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHTML(field.optionLabels?.[option] ?? option)}</option>`).join('')}</select></div>`;
    }
    if (field.type === 'multiline') {
      return `<div class="kanban-editor-field${wideClass}"><label for="${id}">${escapeHTML(field.label)}</label><textarea id="${id}" data-kanban-field="${field.key}" data-kanban-editor-field="${field.key}" placeholder="${escapeAttr(field.placeholder || '')}">${escapeHTML(value)}</textarea></div>`;
    }
    if (field.type === 'checkbox') {
      return `<div class="kanban-editor-check${wideClass}"><label for="${id}"><input id="${id}" type="checkbox" data-kanban-field="${field.key}" data-kanban-editor-field="${field.key}" ${value ? 'checked' : ''}><span>${escapeHTML(field.label)}</span></label></div>`;
    }
    return `<div class="kanban-editor-field${wideClass}"><label for="${id}">${escapeHTML(field.label)}</label><input id="${id}" type="${field.type === 'date' ? 'date' : 'text'}" data-kanban-field="${field.key}" data-kanban-editor-field="${field.key}" placeholder="${escapeAttr(field.placeholder || '')}" value="${escapeAttr(value)}"></div>`;
  }

  function v13RenderEditorBody(note) {
    return V13_KANBAN_EDITOR_GROUPS.map(group => `<section class="kanban-editor-section" data-kanban-editor-section="${escapeAttr(group.id)}">
      <div class="kanban-editor-section-heading"><span class="kanban-editor-section-title">${escapeHTML(group.title)}</span><span class="kanban-editor-section-note">${escapeHTML(group.note)}</span></div>
      <div class="kanban-editor-grid">${group.fields.map(descriptor => v13EditorFieldControl(note, descriptor)).join('')}</div>
    </section>`).join('');
  }

  function v13UpdateEditorHeading(note) {
    if (!note || !els.kanbanEditorTitle) return;
    const title = String(note.fields?.ticketNumber || '').trim() || 'Untitled Ticket';
    els.kanbanEditorTitle.textContent = `Edit ${title}`;
    els.kanbanEditorSubtitle.textContent = `${note.fields?.ticketType || 'Story'} · ${note.fields?.status || 'Backlog'} · Changes save locally as you work; Cancel restores this editing session.`;
  }

  function v13SetEditorAppearance(note) {
    if (!els.kanbanEditorSheet || !note) return;
    els.kanbanEditorSheet.dataset.noteColor = NOTE_COLORS.includes(note.color) ? note.color : 'yellow';
    els.kanbanEditorSheet.dataset.objectId = note.id;
    els.kanbanEditorSheet.dataset.kanbanEditorNoteId = note.id;
  }

  function v13PositionKanbanEditor() {
    cancelAnimationFrame(ui.kanbanEditorPositionFrame);
    ui.kanbanEditorPositionFrame = requestAnimationFrame(() => {
      const sheet = els.kanbanEditorSheet;
      if (!sheet || sheet.hidden || !ui.kanbanEditorId || isNarrowViewport()) {
        if (sheet) {
          sheet.style.removeProperty('left');
          sheet.style.removeProperty('top');
        }
        return;
      }
      const card = els.objectLayer.querySelector(`[data-object-id="${cssEscape(ui.kanbanEditorId)}"]`);
      if (!card) return;
      const cardRect = card.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();
      const margin = 12;
      const gap = 14;
      const minTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) + 8 || 66;
      let left = cardRect.right + gap;
      if (left + sheetRect.width > innerWidth - margin) left = cardRect.left - sheetRect.width - gap;
      if (left < margin) left = clamp(cardRect.left, margin, Math.max(margin, innerWidth - sheetRect.width - margin));
      const top = clamp(cardRect.top, minTop, Math.max(minTop, innerHeight - sheetRect.height - margin));
      sheet.style.left = `${Math.round(left)}px`;
      sheet.style.top = `${Math.round(top)}px`;
    });
  }

  function v13RenderKanbanEditor(note, { focus = true } = {}) {
    if (!note || !els.kanbanEditorSheet) return;
    v13SetEditorAppearance(note);
    v13UpdateEditorHeading(note);
    els.kanbanEditorBody.innerHTML = v13RenderEditorBody(note);
    els.kanbanEditorBody.scrollTop = 0;
    els.kanbanEditorStatus.textContent = ui.kanbanEditorChanged ? 'Changes queued for local save' : 'No changes yet';
    els.kanbanEditorSheet.hidden = false;
    els.kanbanEditorSheet.setAttribute('aria-hidden', 'false');
    els.kanbanEditorSheet.setAttribute('aria-modal', String(isNarrowViewport()));
    els.kanbanEditorBackdrop.hidden = !isNarrowViewport();
    document.body.classList.add('kanban-editor-open');
    requestAnimationFrame(() => {
      els.kanbanEditorBody.scrollTop = 0;
      v13PositionKanbanEditor();
      const description = els.kanbanEditorBody.querySelector('textarea[data-kanban-editor-field="description"]');
      if (description) v13GrowEditorTextarea(description);
      if (focus) {
        const first = els.kanbanEditorBody.querySelector('[data-kanban-editor-field]');
        first?.focus({ preventScroll: true });
        if (first?.select && first.matches('input[type="text"]')) first.select();
      }
    });
  }

  function v13HideKanbanEditor() {
    if (!els.kanbanEditorSheet) return;
    els.kanbanEditorSheet.hidden = true;
    els.kanbanEditorSheet.setAttribute('aria-hidden', 'true');
    els.kanbanEditorSheet.removeAttribute('data-object-id');
    els.kanbanEditorSheet.removeAttribute('data-kanban-editor-note-id');
    els.kanbanEditorBackdrop.hidden = true;
    els.kanbanEditorBody.innerHTML = '';
    document.body.classList.remove('kanban-editor-open');
  }

  function v13RestoreEditorHistory() {
    const before = ui.kanbanEditorHistoryBefore;
    if (!before) return;
    const history = syncHistoryAlias();
    if (history.undo.length > before.undoLength) history.undo.splice(before.undoLength);
    history.redo = deepClone(before.redo || []);
    updateHistoryButtons();
  }

  function v13OpenKanbanEditor(id, { focus = true } = {}) {
    const note = getObject(id);
    if (!note || note.objectType !== 'template-note') return;
    if (ui.kanbanEditorId && ui.kanbanEditorId !== id) v13CloseKanbanEditor({ commit: true, render: false, restoreFocus: false });
    if (ui.editingId && ui.editingId !== id) v13Previous.finishEditing({ render: false });
    closePopover({ restoreFocus: false });
    ui.kanbanEditorId = id;
    ui.editingId = id;
    ui.selection.clear();
    ui.selection.add(id);
    ui.kanbanEditorSnapshot = deepClone(note);
    ui.kanbanEditorChanged = false;
    const history = syncHistoryAlias();
    ui.kanbanEditorHistoryBefore = { undoLength: history.undo.length, redo: deepClone(history.redo) };
    ui.kanbanEditorOriginFocus = document.activeElement;
    renderAll({ preserveEditor: true });
    v13RenderKanbanEditor(note, { focus });
  }

  function v13CloseKanbanEditor({ commit = true, render = true, restoreFocus = true } = {}) {
    const id = ui.kanbanEditorId;
    if (!id) return;
    const note = getObject(id);
    const changed = ui.kanbanEditorChanged;
    if (!commit && changed && ui.kanbanEditorSnapshot) {
      const index = currentBoard().objects.findIndex(object => object.id === id);
      if (index >= 0) currentBoard().objects[index] = normalizeObject(ui.kanbanEditorSnapshot);
      v13RestoreEditorHistory();
      currentBoard().modifiedAt = nowISO();
      scheduleSave();
    }
    const origin = ui.kanbanEditorOriginFocus;
    ui.kanbanEditorId = null;
    ui.kanbanEditorSnapshot = null;
    ui.kanbanEditorChanged = false;
    ui.kanbanEditorHistoryBefore = null;
    ui.kanbanEditorOriginFocus = null;
    ui.editingId = null;
    v13HideKanbanEditor();
    if (render) renderAll();
    if (restoreFocus) requestAnimationFrame(() => {
      const card = els.objectLayer.querySelector(`[data-object-id="${cssEscape(id)}"]`);
      if (card) card.focus({ preventScroll: true });
      else if (origin?.isConnected) origin.focus({ preventScroll: true });
      else els.viewport.focus({ preventScroll: true });
    });
    if (commit && changed && note) toast('Kanban changes saved locally.', 'success');
  }

  enterEdit = function(id) {
    const obj = getObject(id);
    if (obj?.objectType === 'template-note') {
      v13OpenKanbanEditor(id);
      return;
    }
    v13Previous.enterEdit(id);
  };

  finishEditing = function(options = {}) {
    if (ui.kanbanEditorId) {
      v13CloseKanbanEditor({ commit: true, render: options.render !== false });
      return;
    }
    v13Previous.finishEditing(options);
  };

  focusEditor = function(id) {
    const obj = getObject(id);
    if (obj?.objectType === 'template-note') {
      v13OpenKanbanEditor(id);
      return;
    }
    v13Previous.focusEditor(id);
  };

  function v13GrowEditorTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${clamp(textarea.scrollHeight, 128, 260)}px`;
  }

  function v13ScheduleCardRefresh() {
    cancelAnimationFrame(ui.kanbanEditorRefreshFrame);
    ui.kanbanEditorRefreshFrame = requestAnimationFrame(() => {
      if (!ui.kanbanEditorId) return;
      renderAll({ preserveEditor: true });
      const note = getObject(ui.kanbanEditorId);
      if (note) v13UpdateEditorHeading(note);
      v13PositionKanbanEditor();
    });
  }

  function v13HandleEditorInput(event) {
    const fieldKey = event.target?.dataset?.kanbanEditorField;
    if (!fieldKey || !ui.kanbanEditorId) return;
    const note = getObject(ui.kanbanEditorId);
    if (!note || note.objectType !== 'template-note') return;
    const next = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (note.fields[fieldKey] === next) return;
    if (!ui.kanbanEditorChanged) pushHistory('Edit Kanban fields');
    ui.kanbanEditorChanged = true;
    note.fields[fieldKey] = next;
    note.modifiedAt = nowISO();
    els.kanbanEditorStatus.textContent = 'Changes queued for local save';
    if (event.target.matches('textarea')) v13GrowEditorTextarea(event.target);
    touchBoard();
    v13ScheduleCardRefresh();
  }

  async function v13OpenFullDescription(note) {
    if (!note) return;
    const title = String(note.fields?.ticketNumber || '').trim() || 'Untitled Ticket';
    const description = String(note.fields?.description || '');
    await showDialog({
      title: `${title} — Description`,
      bodyHTML: `<div class="kanban-description-reader ${description ? '' : 'empty'}">${description ? nl2br(description) : 'No description has been entered.'}</div>`,
      actions: [{ label: 'Close', value: null, primary: true }]
    });
  }

  handleObjectClick = function(event) {
    const readMore = event.target.closest?.('[data-kanban-read-more]');
    if (readMore) {
      event.preventDefault();
      event.stopPropagation();
      const root = readMore.closest('[data-object-id]');
      v13OpenFullDescription(getObject(root?.dataset.objectId));
      return;
    }
    const toggle = event.target.closest?.('[data-toggle-compact]');
    if (toggle && ui.kanbanEditorId) v13CloseKanbanEditor({ commit: true, render: false, restoreFocus: false });
    v13Previous.handleObjectClick(event);
  };

  toggleKanbanCompact = function(note = selectedObjects().find(obj => obj.objectType === 'template-note')) {
    if (!note) return;
    if (ui.kanbanEditorId === note.id) v13CloseKanbanEditor({ commit: true, render: false, restoreFocus: false });
    pushHistory(note.displayMode === 'compact' ? 'Expand Kanban note' : 'Collapse Kanban note');
    note.displayMode = note.displayMode === 'compact' ? 'expanded' : 'compact';
    v13CanonicalizeKanban(note);
    note.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  };

  minimumSize = function(obj) {
    if (obj?.objectType === 'template-note') return { width: V13_KANBAN_MIN_WIDTH, height: v13CanonicalKanbanHeight(obj) };
    return v13Previous.minimumSize(obj);
  };

  startDrag = function(event, id) {
    if (ui.kanbanEditorId === id) {
      toast('Finish editing before moving this Kanban card.');
      return;
    }
    v13Previous.startDrag(event, id);
  };

  startResize = function(event, id, handle) {
    const obj = getObject(id);
    if (obj?.objectType === 'template-note' && handle !== 'e') return;
    v13Previous.startResize(event, id, handle);
  };

  updateResizeAction = function(action, event) {
    const obj = getObject(action.id);
    if (!obj || obj.objectType !== 'template-note') {
      v13Previous.updateResizeAction(action, event);
      return;
    }
    const point = screenToWorld(event.clientX, event.clientY);
    const dx = point.x - action.startWorld.x;
    if (!action.moved && Math.abs(dx) < 1) return;
    action.moved = true;
    ensureActionHistory(action, 'Resize Kanban card width');
    obj.width = clamp(action.initial.width + dx, V13_KANBAN_MIN_WIDTH, Math.min(V13_KANBAN_MAX_WIDTH, WORLD.width - obj.x));
    obj.height = v13CanonicalKanbanHeight(obj);
    obj.kanbanLayoutVersion = V13_KANBAN_LAYOUT_VERSION;
    obj.modifiedAt = nowISO();
    updateObjectElement(obj);
    renderVectors();
    drawMinimap();
    updateContextToolbar();
    v13PositionKanbanEditor();
  };

  updateGroupResize = function(action, event) {
    const point = screenToWorld(event.clientX, event.clientY);
    const base = action.bounds;
    const dx = point.x - action.startWorld.x;
    const dy = point.y - action.startWorld.y;
    const scale = clamp(1 + Math.max(dx / Math.max(base.width, 1), dy / Math.max(base.height, 1)), .08, 12);
    if (!action.moved && Math.abs(scale - 1) < .005) return;
    action.moved = true;
    ensureActionHistory(action, 'Resize selection');
    for (const id of action.ids) {
      const obj = getObject(id);
      const initial = action.initial.get(id);
      if (!obj || !initial || obj.locked) continue;
      if (obj.objectType === 'drawing') {
        obj.points = initial.points.map(pointItem => ({ x: base.x + (pointItem.x - base.x) * scale, y: base.y + (pointItem.y - base.y) * scale }));
      } else {
        const min = minimumSize(obj);
        obj.x = clamp(base.x + (initial.x - base.x) * scale, 0, WORLD.width - min.width);
        obj.y = clamp(base.y + (initial.y - base.y) * scale, 0, WORLD.height - min.height);
        if (obj.objectType === 'template-note') {
          obj.width = clamp(initial.width * scale, V13_KANBAN_MIN_WIDTH, Math.min(V13_KANBAN_MAX_WIDTH, WORLD.width - obj.x));
          obj.height = v13CanonicalKanbanHeight(obj);
          obj.kanbanLayoutVersion = V13_KANBAN_LAYOUT_VERSION;
          obj.y = clamp(obj.y, 0, WORLD.height - obj.height);
        } else {
          obj.width = clamp(initial.width * scale, min.width, WORLD.width - obj.x);
          obj.height = clamp(initial.height * scale, min.height, WORLD.height - obj.y);
        }
        updateObjectElement(obj);
      }
    }
    renderVectors();
    drawMinimap();
    updateContextToolbar();
    updateSelectionOverlay();
  };

  nudgeSelection = function(dx, dy, resize = false) {
    const objects = selectedObjects().filter(obj => !obj.locked);
    if (!objects.length) return;
    let changed = false;
    for (const obj of objects) {
      if (resize && obj.objectType === 'template-note' && dx === 0) continue;
      if (!changed) beginKeyboardTransform(resize ? 'Resize with keyboard' : 'Move with keyboard');
      changed = true;
      if (obj.objectType === 'drawing') {
        const bounds = drawingBounds(obj);
        if (resize && bounds) {
          const nextWidth = Math.max(1, bounds.width + dx);
          const nextHeight = Math.max(1, bounds.height + dy);
          const sx = nextWidth / Math.max(bounds.width, 1);
          const sy = nextHeight / Math.max(bounds.height, 1);
          obj.points = obj.points.map(point => ({ x: bounds.x + (point.x - bounds.x) * sx, y: bounds.y + (point.y - bounds.y) * sy }));
        } else obj.points = obj.points.map(point => ({ x: clamp(point.x + dx, 0, WORLD.width), y: clamp(point.y + dy, 0, WORLD.height) }));
      } else if (resize) {
        if (obj.objectType === 'frame' && obj.collapsed) continue;
        if (obj.objectType === 'template-note') {
          obj.width = clamp(obj.width + dx, V13_KANBAN_MIN_WIDTH, Math.min(V13_KANBAN_MAX_WIDTH, WORLD.width - obj.x));
          obj.height = v13CanonicalKanbanHeight(obj);
          obj.kanbanLayoutVersion = V13_KANBAN_LAYOUT_VERSION;
        } else {
          const min = minimumSize(obj);
          obj.width = clamp(obj.width + dx, min.width, WORLD.width - obj.x);
          obj.height = clamp(obj.height + dy, min.height, WORLD.height - obj.y);
        }
      } else {
        obj.x = clamp(obj.x + dx, 0, WORLD.width - obj.width);
        obj.y = clamp(obj.y + dy, 0, WORLD.height - obj.height);
        if (obj.objectType === 'frame' && obj.collapsed && obj.collapsedBounds) {
          obj.collapsedBounds.x += dx;
          obj.collapsedBounds.y += dy;
        }
      }
      obj.modifiedAt = nowISO();
    }
    if (!changed) return;
    touchBoard();
    renderAll();
  };

  setViewport = function(next, options) {
    v13Previous.setViewport(next, options);
    if (ui.kanbanEditorId) v13PositionKanbanEditor();
  };

  renderAll = function(options = {}) {
    v13CanonicalizeBoardKanban();
    v13Previous.renderAll(options);
    if (ui.kanbanEditorId) {
      const note = getObject(ui.kanbanEditorId);
      if (!note) {
        ui.kanbanEditorId = null;
        ui.editingId = null;
        v13HideKanbanEditor();
      } else {
        v13SetEditorAppearance(note);
        v13UpdateEditorHeading(note);
        v13PositionKanbanEditor();
      }
    }
  };

  function v13CanvasBadgeRows(ctx, badges, x, y, maxX, ink) {
    let cursorX = x;
    let cursorY = y;
    for (const badge of badges) {
      ctx.font = '800 9px Inter, Arial, sans-serif';
      const width = Math.min(110, ctx.measureText(badge.text).width + 14);
      if (cursorX + width > maxX && cursorX > x) {
        cursorX = x;
        cursorY += 23;
      }
      drawCanvasBadge(ctx, badge.text, cursorX, cursorY, width, badge.fill || 'rgba(255,255,255,.24)', ink);
      cursorX += width + 5;
    }
    return cursorY + 19;
  }

  function v13CanvasMetaCell(ctx, label, value, x, y, width, ink, options = {}) {
    ctx.save();
    ctx.fillStyle = options.fill || 'rgba(255,255,255,.10)';
    canvasRoundRect(ctx, x, y, width, 48, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(35,40,42,.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.globalAlpha = 1;
    ctx.font = '800 8px Inter, Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(String(label).toUpperCase(), x + 7, y + 6, width - 14);
    ctx.globalAlpha = value === '—' ? .76 : 1;
    ctx.font = `${options.bold ? '800 ' : ''}12px Avenir, Arial, sans-serif`;
    drawClampedText(ctx, value || '—', x + 7, y + 20, width - 14, 15, 2);
    ctx.restore();
  }

  drawKanbanNoteExport = function(ctx, obj, palette) {
    v13CanonicalizeKanban(obj);
    withCanvasObjectTransform(ctx, obj, () => {
      const ink = noteTextColor(obj);
      const f = obj.fields;
      const badges = [
        { text: f.ticketType || 'Story' },
        { text: f.status || 'Backlog' },
        ...(f.onHold ? [{ text: 'On Hold', fill: 'rgba(177,120,35,.24)' }] : []),
        ...(f.needsVP ? [{ text: 'Needs VP' }] : []),
        ...(f.needByDate ? [{ text: formatRelativeDate(f.needByDate) }] : [])
      ];
      const headerHeight = badges.length > 3 || obj.width < 370 ? 76 : 66;
      drawNotePaper(ctx, obj, palette, headerHeight);
      ctx.save();
      ctx.beginPath();
      canvasRoundRect(ctx, obj.x, obj.y, obj.width, obj.height, 11);
      ctx.clip();
      ctx.fillStyle = ink;
      ctx.textBaseline = 'top';
      ctx.font = '900 14px Avenir, Arial, sans-serif';
      ctx.fillText(f.ticketNumber || 'Untitled Ticket', obj.x + 13, obj.y + 9, obj.width - 84);
      ctx.font = '800 8px Inter, Arial, sans-serif';
      ctx.fillText('KANBAN', obj.x + obj.width - 58, obj.y + 12, 48);
      v13CanvasBadgeRows(ctx, badges, obj.x + 13, obj.y + 31, obj.x + obj.width - 12, ink);

      const bodyX = obj.x + 13;
      const bodyWidth = obj.width - 26;
      const gap = 9;
      const cellWidth = (bodyWidth - gap) / 2;
      let y = obj.y + headerHeight + 11;
      if (obj.displayMode === 'compact') {
        const cells = [
          ['Team', v13KanbanReadableValue(obj, 'team')],
          ['Assignee', v13KanbanReadableValue(obj, 'assignee')],
          ['Need By', v13KanbanReadableValue(obj, 'needByDate')],
          ['On Hold', v13KanbanReadableValue(obj, 'onHold'), { bold: true }],
          ['Needs VP?', v13KanbanReadableValue(obj, 'needsVP'), { bold: true }]
        ];
        cells.forEach((cell, index) => {
          const column = index % 2;
          const row = Math.floor(index / 2);
          v13CanvasMetaCell(ctx, cell[0], cell[1], bodyX + column * (cellWidth + gap), y + row * 56, cellWidth, ink, cell[2] || {});
        });
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.13)';
        canvasRoundRect(ctx, bodyX, y, bodyWidth, 116, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(35,40,42,.10)';
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.font = '800 8px Inter, Arial, sans-serif';
        ctx.fillText('DESCRIPTION', bodyX + 9, y + 7, bodyWidth - 18);
        ctx.font = '12px Avenir, Arial, sans-serif';
        ctx.globalAlpha = f.description ? 1 : .76;
        drawClampedText(ctx, f.description || '—', bodyX + 9, y + 23, bodyWidth - 18, 16, 5);
        ctx.globalAlpha = 1;
        y += 127;
        const cells = [
          ['Sprint', v13KanbanReadableValue(obj, 'sprintNumber')],
          ['Epic', v13KanbanReadableValue(obj, 'epic')],
          ['Team', v13KanbanReadableValue(obj, 'team')],
          ['Need By', v13KanbanReadableValue(obj, 'needByDate')],
          ['Reporter', v13KanbanReadableValue(obj, 'reporter')],
          ['Assignee', v13KanbanReadableValue(obj, 'assignee')],
          ['On Hold', v13KanbanReadableValue(obj, 'onHold'), { bold: true }],
          ['Needs VP?', v13KanbanReadableValue(obj, 'needsVP'), { bold: true }]
        ];
        cells.forEach((cell, index) => {
          const column = index % 2;
          const row = Math.floor(index / 2);
          v13CanvasMetaCell(ctx, cell[0], cell[1], bodyX + column * (cellWidth + gap), y + row * 56, cellWidth, ink, cell[2] || {});
        });
      }
      ctx.restore();
    });
  };

  undo = function() {
    if (ui.kanbanEditorId) v13CloseKanbanEditor({ commit: true, render: false, restoreFocus: false });
    v13Previous.undo();
  };

  redo = function() {
    if (ui.kanbanEditorId) v13CloseKanbanEditor({ commit: true, render: false, restoreFocus: false });
    v13Previous.redo();
  };

  function v13EditorFocusable() {
    return $$('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', els.kanbanEditorSheet).filter(node => !node.hidden && node.offsetParent !== null);
  }

  function v13HandleEditorKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      v13CloseKanbanEditor({ commit: true });
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      v13CloseKanbanEditor({ commit: true });
      return;
    }
    if (event.key === 'Tab' && isNarrowViewport()) {
      const focusable = v13EditorFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function installV13KanbanEvents() {
    els.kanbanEditorForm?.addEventListener('input', v13HandleEditorInput);
    els.kanbanEditorForm?.addEventListener('change', v13HandleEditorInput);
    els.kanbanEditorForm?.addEventListener('submit', event => {
      event.preventDefault();
      v13CloseKanbanEditor({ commit: true });
    });
    els.kanbanEditorCancel?.addEventListener('click', () => v13CloseKanbanEditor({ commit: false }));
    els.kanbanEditorClose?.addEventListener('click', () => v13CloseKanbanEditor({ commit: false }));
    els.kanbanEditorBackdrop?.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    els.kanbanEditorSheet?.addEventListener('keydown', v13HandleEditorKeydown);
    window.addEventListener('resize', v13PositionKanbanEditor);
  }

  function installV13PostBoot() {
    if (ui.pendingKanbanLayoutMigrationSave) {
      ui.pendingKanbanLayoutMigrationSave = false;
      setTimeout(() => scheduleSave({ immediate: true }), 0);
      toast('Kanban cards were updated to the new stable layout.', 'success', 5200);
    }
    Object.assign(window.TACKBOARD_DEBUG || {}, {
      kanbanLayoutVersion: V13_KANBAN_LAYOUT_VERSION,
      canonicalKanbanHeight: mode => v13CanonicalKanbanHeight(mode),
      openKanbanEditor: id => v13OpenKanbanEditor(id),
      closeKanbanEditor: commit => v13CloseKanbanEditor({ commit: commit !== false }),
      isKanbanEditorOpen: () => Boolean(ui.kanbanEditorId)
    });
  }
