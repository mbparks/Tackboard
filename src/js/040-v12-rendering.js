  /* Rendering, selection, accessibility, and frame state */
  function enhanceRenderedObjects() {
    const selectedCount = selectedIds().length;
    const collapsedFrames = currentBoard().objects.filter(obj => obj.objectType === 'frame' && obj.collapsed);
    for (const root of $$('[data-object-id]', els.objectLayer)) {
      const obj = getObject(root.dataset.objectId);
      if (!obj) continue;
      root.setAttribute('aria-selected', String(ui.selection.has(obj.id)));
      root.classList.toggle('locked', Boolean(obj.locked));
      root.classList.toggle('collapsed', obj.objectType === 'frame' && Boolean(obj.collapsed));
      root.classList.toggle('inside-collapsed-frame', objectInsideCollapsedFrame(obj));
      const baseLabel = boardAccessibleName(obj);
      root.setAttribute('aria-label', `${baseLabel}${obj.locked ? ', position locked' : ''}${ui.selection.has(obj.id) ? ', selected' : ''}`);

      const header = root.querySelector('.object-header, .frame-header');
      if (obj.locked && header && !header.querySelector('.object-lock-badge')) {
        const badge = document.createElement('span');
        badge.className = 'object-lock-badge';
        badge.title = 'Position locked';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = '🔒';
        const action = header.querySelector('.header-action');
        header.insertBefore(badge, action || null);
      }
      if (ui.editingId === obj.id && !root.querySelector('[data-finish-edit]')) {
        const done = document.createElement('button');
        done.className = 'edit-done-button';
        done.type = 'button';
        done.dataset.finishEdit = 'true';
        done.textContent = 'Done';
        done.setAttribute('aria-label', 'Finish editing');
        if (header) header.appendChild(done); else root.appendChild(done);
      }
      if (obj.objectType === 'frame' && header && !header.querySelector('[data-toggle-frame-collapse]')) {
        const button = document.createElement('button');
        button.className = 'header-action';
        button.type = 'button';
        button.dataset.toggleFrameCollapse = 'true';
        button.title = obj.collapsed ? 'Expand frame' : 'Collapse frame';
        button.setAttribute('aria-label', obj.collapsed ? 'Expand frame' : 'Collapse frame');
        button.textContent = obj.collapsed ? '▾' : '▴';
        header.appendChild(button);
      }
      if (selectedCount > 1) {
        root.querySelectorAll('[data-resize],[data-connector-handle]').forEach(node => node.remove());
      }
      if (obj.locked || (obj.objectType === 'frame' && obj.collapsed)) {
        root.querySelectorAll('[data-resize]').forEach(node => node.remove());
      }
    }

    for (const path of $$('.connector-path', els.vectorLayer)) {
      const connector = getConnector(path.dataset.connectorId);
      if (!connector) continue;
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.setAttribute('aria-label', `${connectorAccessibleName(connector)}${ui.selection.has(connector.id) ? ', selected' : ''}`);
      path.setAttribute('aria-selected', String(ui.selection.has(connector.id)));
      path.classList.add('vector-focus');
      const dimmed = objectInsideCollapsedFrame(getObject(connector.fromId)) || objectInsideCollapsedFrame(getObject(connector.toId));
      path.classList.toggle('inside-collapsed-frame', dimmed);
    }
    for (const path of $$('.drawing-path', els.vectorLayer)) {
      const drawing = getObject(path.dataset.drawingId);
      if (!drawing) continue;
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.setAttribute('aria-label', `Freehand drawing${drawing.locked ? ', position locked' : ''}${ui.selection.has(drawing.id) ? ', selected' : ''}`);
      path.setAttribute('aria-selected', String(ui.selection.has(drawing.id)));
      path.classList.add('vector-focus');
      path.classList.toggle('inside-collapsed-frame', objectInsideCollapsedFrame(drawing));
    }
  }

  function updateSelectionOverlay() {
    if (!els.selectionBox) return;
    const ids = selectedIds();
    const objects = selectedObjects();
    const show = ids.length > 1 && objects.length > 0 && !ui.editingId && !ui.action?.type?.includes('marquee');
    els.viewport.classList.toggle('multi-selection-active', show);
    els.selectionBox.classList.toggle('visible', show);
    els.selectionBox.setAttribute('aria-hidden', String(!show));
    if (!show) return;
    const bounds = selectionScreenBounds();
    if (!bounds) return;
    const viewportRect = els.viewport.getBoundingClientRect();
    const left = bounds.x - viewportRect.left;
    const top = bounds.y - viewportRect.top;
    const width = Math.max(1, bounds.right - bounds.x);
    const height = Math.max(1, bounds.bottom - bounds.y);
    Object.assign(els.selectionBox.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    const lockedCount = objects.filter(obj => obj.locked).length;
    els.selectionBoxText.textContent = `${ids.length} items selected`;
    els.selectionBoxLockCount.textContent = lockedCount ? `${lockedCount} locked` : '';
    els.selectionBoxResize.hidden = objects.every(obj => obj.locked) || objects.some(obj => obj.objectType === 'frame' && obj.collapsed);
    if (!els.selectionBoxResize.hidden) {
      const margin = isNarrowViewport() ? 14 : 11;
      const clampPoint = (x, y) => ({
        x: clamp(x, viewportRect.left + margin, viewportRect.right - margin),
        y: clamp(y, viewportRect.top + margin, viewportRect.bottom - margin)
      });
      const candidates = [
        ['bottom-right', clampPoint(bounds.right, bounds.bottom)],
        ['top-right', clampPoint(bounds.right, bounds.y)],
        ['bottom-left', clampPoint(bounds.x, bounds.bottom)],
        ['top-left', clampPoint(bounds.x, bounds.y)]
      ];
      const reserved = [
        document.querySelector('.viewport-controls')?.getBoundingClientRect(),
        els.minimapWrap.classList.contains('visible') ? els.minimapWrap.getBoundingClientRect() : null,
        els.contextToolbar.classList.contains('visible') ? els.contextToolbar.getBoundingClientRect() : null,
        els.toolDock.getBoundingClientRect()
      ].filter(Boolean);
      const conflicts = point => {
        const r = { left: point.x - 12, right: point.x + 12, top: point.y - 12, bottom: point.y + 12 };
        return reserved.some(zone => !(r.right < zone.left || r.left > zone.right || r.bottom < zone.top || r.top > zone.bottom));
      };
      const [anchorName, anchorPoint] = candidates.find(([, point]) => !conflicts(point)) || candidates[1];
      els.selectionBoxResize.dataset.anchor = anchorName;
      Object.assign(els.selectionBoxResize.style, {
        left: `${anchorPoint.x - viewportRect.left - left - 8}px`,
        top: `${anchorPoint.y - viewportRect.top - top - 8}px`,
        right: 'auto',
        bottom: 'auto'
      });
    }
    if (top < 38) {
      els.selectionBoxLabel.style.top = `${height + 8}px`;
      els.selectionBoxLabel.style.bottom = 'auto';
    } else {
      els.selectionBoxLabel.style.top = isNarrowViewport() ? '-35px' : '-31px';
      els.selectionBoxLabel.style.bottom = 'auto';
    }
    els.selectionStatus.textContent = `${ids.length} items selected${lockedCount ? `, ${lockedCount} position locked` : ''}.`;
  }

  function renderActiveFilters() {
    const entries = Object.entries(ui.filters).filter(([key, value]) => value && !(['from', 'to'].includes(key) && ui.filters.due !== 'custom'));
    const visible = entries.length > 0;
    els.activeFilterBar.classList.toggle('visible', visible);
    els.viewport.classList.toggle('filters-visible', visible);
    document.body.classList.toggle('filters-visible', visible);
    let badge = $('.filter-badge', els.filterButton);
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'filter-badge';
      badge.setAttribute('aria-hidden', 'true');
      els.filterButton.appendChild(badge);
    }
    badge.textContent = String(entries.length);
    els.filterButton.classList.toggle('has-badge', visible);
    if (!visible) {
      els.activeFilterBar.innerHTML = '';
      return;
    }
    const labels = {
      template: 'Object', ticketType: 'Type', team: 'Team', status: 'Status',
      needsVP: 'Needs VP', due: 'Due', from: 'From', to: 'To'
    };
    const valueLabel = (key, value) => {
      if (key === 'template') return ({ 'template-note': 'Kanban', 'blank-note': 'Blank notes', text: 'Text labels', sticker: 'Stickers', frame: 'Frames' })[value] || value;
      if (key === 'due') return ({ none: 'No date', overdue: 'Overdue', today: 'Today', week: 'This week', month: 'This month', custom: 'Custom range' })[value] || value;
      if (key === 'needsVP') return value === 'yes' ? 'Yes' : 'No';
      if (key === 'from' || key === 'to') return formatDate(value) || value;
      return value;
    };
    const total = currentBoard().objects.length;
    const matching = ui.searchResults.length;
    els.activeFilterBar.innerHTML = `<span class="filter-summary">${matching} of ${total} objects match</span>${entries.map(([key, value]) => `<button class="filter-chip" type="button" data-clear-filter="${escapeAttr(key)}" title="Remove ${escapeAttr(labels[key] || key)} filter"><span>${escapeHTML(labels[key] || key)}: ${escapeHTML(valueLabel(key, value))}</span><span class="chip-x" aria-hidden="true">×</span></button>`).join('')}<button class="button ghost filter-reset-inline" type="button" data-reset-filter-bar>Reset</button>`;
  }

  renderAll = function(options = {}) {
    syncHistoryAlias();
    v12Original.renderAll(options);
    enhanceRenderedObjects();
    renderActiveFilters();
    renderSaveReliability();
    updateSelectionOverlay();
  };

  updateContextToolbar = function() {
    v12Original.updateContextToolbar();
    const ids = selectedIds();
    if (ids.length === 1 && els.contextToolbar.classList.contains('visible')) {
      const single = getSelectable(ids[0]);
      if (single?.objectType === 'text' && !els.contextToolbar.querySelector('[data-action="color"]')) {
        const duplicate = els.contextToolbar.querySelector('[data-action="duplicate"]');
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = 'color';
        button.textContent = 'Color';
        els.contextToolbar.insertBefore(button, duplicate || null);
      }
      if (single?.objectType === 'frame' && !els.contextToolbar.querySelector('[data-action="toggle-frame-collapse"]')) {
        const rename = els.contextToolbar.querySelector('[data-action="rename-frame"]');
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = 'toggle-frame-collapse';
        button.textContent = single.collapsed ? 'Expand' : 'Collapse';
        rename?.after(button);
      }
    }
    updateSelectionOverlay();
    requestAnimationFrame(() => {
      if (!els.contextToolbar.classList.contains('visible') || isNarrowViewport()) return;
      const toolbar = els.contextToolbar.getBoundingClientRect();
      const controls = document.querySelector('.viewport-controls')?.getBoundingClientRect();
      const minimap = els.minimapWrap.classList.contains('visible') ? els.minimapWrap.getBoundingClientRect() : null;
      const overlaps = rect => rect && !(toolbar.right < rect.left || toolbar.left > rect.right || toolbar.bottom < rect.top || toolbar.top > rect.bottom);
      if (overlaps(controls) || overlaps(minimap)) {
        const bounds = selectionScreenBounds();
        if (bounds) els.contextToolbar.style.top = `${Math.max(66, bounds.y - toolbar.height - 14)}px`;
      }
    });
  };

  updateToolUI = function() {
    v12Original.updateToolUI();
    if (ui.tool === 'export-area') els.viewport.dataset.tool = 'export-area';
    if (els.activeToolLabel) els.activeToolLabel.textContent = V12_TOOL_LABELS[ui.tool] || ui.tool;
    if (els.touchAddButton) {
      els.touchAddButton.classList.toggle('active', ui.touchAdditive);
      els.touchAddButton.setAttribute('aria-pressed', String(ui.touchAdditive));
    }
  };

  renderVectors = function() {
    v12Original.renderVectors();
    enhanceRenderedObjects();
  };

  function toggleFrameCollapse(frame = selectedObjects().find(obj => obj.objectType === 'frame')) {
    if (!frame) return;
    pushHistory(frame.collapsed ? 'Expand frame' : 'Collapse frame');
    if (!frame.collapsed) {
      frame.expandedWidth = frame.width;
      frame.expandedHeight = Math.max(120, frame.height);
      frame.collapsedBounds = { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
      frame.collapsed = true;
      frame.height = 46;
    } else {
      frame.collapsed = false;
      frame.width = Math.max(200, frame.expandedWidth || frame.collapsedBounds?.width || frame.width);
      frame.height = Math.max(120, frame.expandedHeight || frame.collapsedBounds?.height || 240);
      frame.collapsedBounds = null;
    }
    frame.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  }

  function toggleSelectionLock() {
    const objects = selectedObjects();
    if (!objects.length) return;
    const shouldLock = objects.some(obj => !obj.locked);
    pushHistory(shouldLock ? 'Lock object positions' : 'Unlock object positions');
    objects.forEach(obj => { obj.locked = shouldLock; obj.modifiedAt = nowISO(); });
    touchBoard();
    renderAll();
    toast(shouldLock ? `${objects.length} object position${objects.length === 1 ? '' : 's'} locked.` : `${objects.length} object position${objects.length === 1 ? '' : 's'} unlocked.`, 'success');
  }

  openSelectionMore = function(anchor) {
    const single = selectedIds().length === 1 ? getSelectable(selectedIds()[0]) : null;
    const objects = selectedObjects();
    let specific = '';
    if (single?.objectType === 'blank-note') specific += menuItem('toggle-checklist', '☑', single.checklist ? 'Use plain text' : 'Use checklist mode');
    if (single?.objectType === 'template-note') {
      specific += menuItem('clear-kanban', '⌫', 'Clear Field Values', 'Keep template defaults');
      specific += menuItem('convert-kanban', '▤', 'Convert to Blank Note', 'Preserve values as readable text');
    }
    if (single?.objectType === 'text') specific += menuItem('text-options', 'T', 'Text Options', 'Size, alignment, and color');
    if (single?.objectType === 'sticker') specific += menuItem('change-sticker', '★', 'Change Sticker', 'Choose another reaction or symbol');
    if (single?.objectType === 'connector') specific += menuItem('edit-connector', '↗', 'Connector Options');
    if (single?.objectType === 'frame') specific += menuItem('toggle-frame-collapse', single.collapsed ? '▾' : '▴', single.collapsed ? 'Expand Frame' : 'Collapse Frame', 'Temporarily dim content inside the frame');
    if (objects.length) specific += menuItem('toggle-lock', objects.some(obj => !obj.locked) ? '🔒' : '🔓', objects.some(obj => !obj.locked) ? 'Lock Position' : 'Unlock Position', 'Prevent accidental movement and resizing');
    openPopover(`<div class="popover-section">${specific || ''}
      ${menuItem('bring-forward', '↑', 'Bring Forward')}
      ${menuItem('send-backward', '↓', 'Send Backward')}
      ${menuItem('bring-front', '⇈', 'Bring to Front')}
      ${menuItem('send-back', '⇊', 'Send to Back')}
    </div><div class="popover-section">
      ${menuItem('copy', '⧉', 'Copy')}
      ${menuItem('delete', '×', 'Delete', '', 'danger')}
    </div>`, anchor, { width: 295 });
  };

  openColorPalette = function(anchor) {
    const objects = selectedObjects();
    const textOnly = objects.length && objects.every(obj => obj.objectType === 'text');
    if (textOnly) {
      const selectedColor = objects[0].textColor || '';
      openPopover(`<div class="popover-section"><h3>Text color</h3><div class="palette-grid"><button class="swatch ${selectedColor ? '' : 'selected'}" type="button" data-text-color="" aria-label="Use automatic text color" title="Automatic" style="background:linear-gradient(135deg,var(--ink) 0 48%,var(--surface) 49% 100%)"></button>${LINE_COLORS.map(color => `<button class="swatch ${selectedColor === color ? 'selected' : ''}" type="button" data-text-color="${escapeAttr(color)}" style="background:${escapeAttr(color)}" aria-label="Use ${escapeAttr(color)}"></button>`).join('')}</div></div>`, anchor, { width: 190 });
      return;
    }
    v12Original.openColorPalette(anchor);
  };

  function applySelectedTextColor(color) {
    const objects = selectedObjects().filter(obj => obj.objectType === 'text');
    if (!objects.length) return;
    pushHistory('Change text color');
    objects.forEach(obj => { obj.textColor = color; obj.modifiedAt = nowISO(); });
    closePopover();
    touchBoard();
    renderAll();
  }

  openTextOptions = async function() {
    closePopover();
    const text = selectedObjects().find(obj => obj.objectType === 'text');
    if (!text) return;
    const result = await promptForm('Text options', [
      { key: 'fontSize', label: 'Text size (12–96 px)', type: 'number', value: text.fontSize },
      { key: 'align', label: 'Alignment', type: 'select', value: text.align, options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
      { key: 'textColor', label: 'Text color', type: 'select', value: text.textColor || '', options: V12_TEXT_COLORS }
    ], 'Apply');
    if (!result) return;
    pushHistory('Change text options');
    text.fontSize = clamp(Number(result.fontSize) || 24, 12, 96);
    text.align = result.align;
    text.textColor = result.textColor || '';
    text.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  };

