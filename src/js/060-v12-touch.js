  /* Touch and pointer interaction */
  function scheduleLongPress(event, callback) {
    ui.longPressOrigin = { x: event.clientX, y: event.clientY };
    clearTimeout(ui.longPressTimer);
    ui.longPressTimer = setTimeout(callback, 560);
  }

  function startExportArea(event) {
    const rect = els.viewport.getBoundingClientRect();
    const startClient = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    ui.action = {
      type: 'export-area', pointerId: event.pointerId,
      startClient, currentClient: startClient,
      startWorld: screenToWorld(event.clientX, event.clientY),
      currentWorld: screenToWorld(event.clientX, event.clientY)
    };
    els.exportAreaPreview.style.display = 'block';
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function updateExportArea(action, event) {
    const rect = els.viewport.getBoundingClientRect();
    action.currentClient = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    action.currentWorld = screenToWorld(event.clientX, event.clientY);
    updateBoxPreview(els.exportAreaPreview, action.startClient, action.currentClient);
  }

  async function finishExportArea(action) {
    els.exportAreaPreview.style.display = 'none';
    const a = action.startWorld;
    const b = action.currentWorld;
    const left = clamp(Math.min(a.x, b.x), 0, WORLD.width);
    const top = clamp(Math.min(a.y, b.y), 0, WORLD.height);
    const right = clamp(Math.max(a.x, b.x), 0, WORLD.width);
    const bottom = clamp(Math.max(a.y, b.y), 0, WORLD.height);
    const bounds = { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
    if (bounds.width < 10 || bounds.height < 10) {
      ui.exportAreaRequest = null;
      setTool('select');
      return toast('Export area cancelled. Drag a larger rectangle.');
    }
    ui.exportAreaBounds = bounds;
    const request = ui.exportAreaRequest;
    ui.exportAreaRequest = null;
    setTool('select');
    if (request) await requestExport(request.format, 'area', request.options || {});
  }

  handleViewportPointerDown = function(event) {
    if (event.button !== 0 && event.button !== 1) return;
    if (event.target.closest?.('#emptyState [data-empty-action]')) return;
    ui.pointerWorld = screenToWorld(event.clientX, event.clientY);

    if (event.target.closest?.('[data-group-resize]')) {
      startGroupResize(event);
      event.preventDefault();
      return;
    }
    if (event.target.closest?.('[data-group-drag]')) {
      const first = selectedObjects().find(obj => !obj.locked);
      if (first) startDrag(event, first.id);
      event.preventDefault();
      return;
    }

    closePopover({ restoreFocus: false });
    if (event.pointerType === 'touch') {
      ui.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (beginPinchIfReady()) { event.preventDefault(); return; }
    }

    if (ui.spaceDown || event.button === 1 || (ui.tool === 'pan' && event.button === 0)) {
      startPan(event);
      event.preventDefault();
      return;
    }

    if (ui.tool === 'export-area' && event.button === 0) {
      startExportArea(event);
      event.preventDefault();
      return;
    }

    if (ui.tool === 'sticker' && event.button === 0) {
      addSticker(ui.pointerWorld, { stickerId: state.settings.defaultStickerId });
      setTool('select');
      event.preventDefault();
      return;
    }

    const objectEl = event.target.closest?.('[data-object-id]');
    const drawingPath = event.target.closest?.('[data-drawing-id]');
    const connectorPath = event.target.closest?.('[data-connector-id]');
    const isControl = isFormControl(event.target);

    if (drawingPath) {
      const id = drawingPath.dataset.drawingId;
      if (ui.tool === 'eraser') { eraseId(id); event.preventDefault(); return; }
      if (ui.tool === 'select') {
        const additive = event.pointerType === 'touch' ? ui.touchAdditive : event.shiftKey;
        selectId(id, { additive, toggle: additive && ui.selection.has(id), bypassGroup: event.altKey });
        if (ui.selection.has(id)) startDrag(event, id);
        if (event.pointerType === 'touch') scheduleLongPress(event, () => {
          cancelCurrentAction({ restore: true, render: true });
          if (!ui.selection.has(id)) selectId(id, { additive: true, bypassGroup: true });
          openSelectionMore({ clientX: event.clientX, clientY: event.clientY });
        });
        event.preventDefault();
      }
      return;
    }

    if (connectorPath) {
      const id = connectorPath.dataset.connectorId;
      if (ui.tool === 'eraser') eraseId(id);
      else if (ui.tool === 'select') {
        const additive = event.pointerType === 'touch' ? ui.touchAdditive : event.shiftKey;
        selectId(id, { additive, toggle: additive && ui.selection.has(id), bypassGroup: true });
        if (event.pointerType === 'touch') scheduleLongPress(event, () => openSelectionMore({ clientX: event.clientX, clientY: event.clientY }));
      }
      event.preventDefault();
      return;
    }

    if (objectEl) {
      const id = objectEl.dataset.objectId;
      const obj = getObject(id);
      if (ui.tool === 'eraser') { eraseId(id); event.preventDefault(); return; }
      if (event.target.closest?.('[data-connector-handle]')) { startWire(event, id); event.preventDefault(); return; }
      if (ui.tool === 'connector') { handleConnectorClick(id); event.preventDefault(); return; }
      if (isControl) return;
      const resize = event.target.closest?.('[data-resize]');
      if (resize && ui.tool === 'select') { startResize(event, id, resize.dataset.resize); event.preventDefault(); return; }
      if (ui.tool === 'select' && obj?.objectType === 'frame' && !event.target.closest?.('.frame-header')) {
        const touch = event.pointerType === 'touch';
        if (touch) scheduleLongPress(event, () => {
          cancelCurrentAction({ restore: true, render: true });
          selectId(id, { additive: ui.touchAdditive, bypassGroup: true });
          openSelectionMore({ clientX: event.clientX, clientY: event.clientY });
        });
        startMarquee(event, { additive: touch ? ui.touchAdditive : event.shiftKey || event.ctrlKey || event.metaKey });
        event.preventDefault();
        return;
      }
      if (ui.tool === 'select') {
        const touch = event.pointerType === 'touch';
        const additive = touch ? ui.touchAdditive : event.shiftKey;
        const alreadySelected = ui.selection.has(id);
        if (!alreadySelected || additive) selectId(id, { additive, toggle: additive && alreadySelected, bypassGroup: event.altKey });
        if (ui.selection.has(id) && event.target.closest?.('[data-drag-handle]')) startDrag(event, id);
        if (touch) scheduleLongPress(event, () => {
          cancelCurrentAction({ restore: true, render: true });
          if (!ui.selection.has(id)) selectId(id, { additive: true, bypassGroup: true });
          openSelectionMore({ clientX: event.clientX, clientY: event.clientY });
        });
        event.preventDefault();
      }
      return;
    }

    if (ui.editingId) finishEditing({ render: true });
    if (event.pointerType === 'touch' && ui.tool === 'select') {
      scheduleLongPress(event, () => {
        cancelCurrentAction({ restore: true, render: true });
        openNotePicker({ clientX: event.clientX, clientY: event.clientY }, ui.pointerWorld);
      });
      startMarquee(event, { additive: ui.touchAdditive });
      event.preventDefault();
      return;
    }
    if (ui.tool === 'select') startMarquee(event, { additive: event.shiftKey || event.ctrlKey || event.metaKey });
    else if (ui.tool === 'sticky') createDefaultSticky(ui.pointerWorld);
    else if (ui.tool === 'text') { addText(ui.pointerWorld); setTool('select'); }
    else if (ui.tool === 'pen') startDrawing(event);
    else if (ui.tool === 'frame') startFrameDraw(event);
    else if (ui.tool === 'connector') { ui.connectorSourceId = null; toast('Choose an object to start a connector.'); }
    event.preventDefault();
  };

  handlePointerMove = function(event) {
    if (event.pointerType === 'touch' && ui.touchPoints.has(event.pointerId)) {
      ui.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (ui.longPressOrigin && Math.hypot(event.clientX - ui.longPressOrigin.x, event.clientY - ui.longPressOrigin.y) > 9) clearTimeout(ui.longPressTimer);
      if (ui.pinch) { updatePinch(); event.preventDefault(); return; }
    }
    if (ui.action?.type === 'group-resize' && ui.action.pointerId === event.pointerId) {
      event.preventDefault();
      updateGroupResize(ui.action, event);
      return;
    }
    if (ui.action?.type === 'export-area' && ui.action.pointerId === event.pointerId) {
      event.preventDefault();
      updateExportArea(ui.action, event);
      return;
    }
    v12Original.handlePointerMove(event);
  };

  handlePointerEnd = function(event) {
    if (event.pointerType === 'touch' && (ui.action?.type === 'group-resize' || ui.action?.type === 'export-area')) {
      ui.touchPoints.delete(event.pointerId);
      clearTimeout(ui.longPressTimer);
      ui.longPressOrigin = null;
    }
    const action = ui.action;
    if (action?.pointerId === event.pointerId && action.type === 'group-resize') {
      ui.action = null;
      try { els.viewport.releasePointerCapture?.(event.pointerId); } catch {}
      finishGroupResize(action);
      return;
    }
    if (action?.pointerId === event.pointerId && action.type === 'export-area') {
      ui.action = null;
      try { els.viewport.releasePointerCapture?.(event.pointerId); } catch {}
      finishExportArea(action);
      return;
    }
    v12Original.handlePointerEnd(event);
  };

  cancelCurrentAction = function(options = {}) {
    if (ui.action?.type === 'group-resize') {
      const action = ui.action;
      if (options.restore !== false) {
        for (const [id, initial] of action.initial.entries()) {
          const obj = getObject(id);
          if (!obj) continue;
          if (obj.objectType === 'drawing') obj.points = deepClone(initial.points);
          else Object.assign(obj, initial);
        }
      }
      if (action.historyPushed) syncHistoryAlias().undo.pop();
      ui.action = null;
      if (options.render !== false) renderAll();
      return;
    }
    if (ui.action?.type === 'export-area') {
      els.exportAreaPreview.style.display = 'none';
      ui.action = null;
      ui.exportAreaRequest = null;
      ui.exportAreaBounds = null;
      setTool('select');
      return;
    }
    v12Original.cancelCurrentAction(options);
  };

