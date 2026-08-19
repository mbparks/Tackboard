  /* Selection movement, resizing, locking, and keyboard transforms */
  startDrag = function(event, id) {
    const obj = getObject(id);
    if (!obj) return;
    if (obj.locked) {
      toast('This object position is locked. Unlock it from More before moving it.');
      return;
    }
    if (!ui.selection.has(id)) selectId(id, { additive: event.shiftKey, toggle: false, bypassGroup: event.altKey });
    const ids = new Set(selectedObjects().filter(item => !item.locked).map(item => item.id));
    if (obj.objectType === 'frame' && event.altKey) {
      const frameRect = obj.collapsed ? collapsedBoundsForFrame(obj) : objectRect(obj);
      currentBoard().objects.forEach(item => {
        if (item.id === obj.id || item.objectType === 'drawing' || item.locked) return;
        const center = objectRect(item);
        if (center.cx >= frameRect.x && center.cx <= frameRect.right && center.cy >= frameRect.y && center.cy <= frameRect.bottom) ids.add(item.id);
      });
    }
    if (!ids.size) return;
    const initial = new Map();
    for (const itemId of ids) {
      const item = getObject(itemId);
      if (!item) continue;
      initial.set(itemId, item.objectType === 'drawing' ? { points: deepClone(item.points) } : {
        x: item.x, y: item.y,
        collapsedBounds: item.objectType === 'frame' && item.collapsed ? deepClone(item.collapsedBounds) : null
      });
    }
    ui.action = {
      type: 'drag', pointerId: event.pointerId, id, ids: Array.from(ids),
      startWorld: screenToWorld(event.clientX, event.clientY),
      initial, historyPushed: false, moved: false
    };
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  };

  updateDragAction = function(action, event) {
    const point = screenToWorld(event.clientX, event.clientY);
    const dx = point.x - action.startWorld.x;
    const dy = point.y - action.startWorld.y;
    if (!action.moved && Math.hypot(dx, dy) < 1.2 / currentBoard().viewport.zoom) return;
    action.moved = true;
    ensureActionHistory(action, action.ids.length > 1 ? 'Move objects' : 'Move object');
    for (const id of action.ids) {
      const obj = getObject(id);
      const initial = action.initial.get(id);
      if (!obj || !initial || obj.locked) continue;
      if (obj.objectType === 'drawing') {
        obj.points = initial.points.map(p => ({ x: clamp(p.x + dx, 0, WORLD.width), y: clamp(p.y + dy, 0, WORLD.height) }));
      } else {
        obj.x = clamp(initial.x + dx, 0, WORLD.width - obj.width);
        obj.y = clamp(initial.y + dy, 0, WORLD.height - obj.height);
        if (obj.objectType === 'frame' && obj.collapsed && initial.collapsedBounds) {
          obj.collapsedBounds = { ...initial.collapsedBounds, x: initial.collapsedBounds.x + (obj.x - initial.x), y: initial.collapsedBounds.y + (obj.y - initial.y) };
        }
        updateObjectElement(obj);
      }
    }
    updateAlignmentGuides(getObject(action.id));
    renderVectors();
    drawMinimap();
    updateContextToolbar();
  };

  startResize = function(event, id, handle) {
    const obj = getObject(id);
    if (!obj) return;
    if (obj.locked) return toast('This object position is locked. Unlock it before resizing.');
    if (obj.objectType === 'frame' && obj.collapsed) return toast('Expand the frame before resizing it.');
    v12Original.startResize(event, id, handle);
  };

  alignSelection = function(mode) {
    const locked = selectedObjects().filter(obj => obj.locked).length;
    const originalSelection = new Set(ui.selection);
    if (locked) ui.selection = new Set(selectedIds().filter(id => !getObject(id)?.locked));
    try {
      v12Original.alignSelection(mode);
      if (locked) toast(`${locked} locked object${locked === 1 ? '' : 's'} stayed in place.`);
    } finally {
      ui.selection = originalSelection;
      renderAll();
    }
  };

  function startGroupResize(event) {
    const objects = selectedObjects().filter(obj => !obj.locked && !(obj.objectType === 'frame' && obj.collapsed));
    if (objects.length < 2) return;
    const bounds = unionBounds(objects.map(obj => obj.objectType === 'drawing' ? drawingBounds(obj) : objectRect(obj)));
    if (!bounds) return;
    const initial = new Map(objects.map(obj => [obj.id, obj.objectType === 'drawing' ? { points: deepClone(obj.points) } : { x: obj.x, y: obj.y, width: obj.width, height: obj.height }]));
    ui.action = {
      type: 'group-resize', pointerId: event.pointerId,
      startWorld: screenToWorld(event.clientX, event.clientY),
      bounds, initial, ids: objects.map(obj => obj.id), historyPushed: false, moved: false
    };
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function updateGroupResize(action, event) {
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
        obj.points = initial.points.map(p => ({ x: base.x + (p.x - base.x) * scale, y: base.y + (p.y - base.y) * scale }));
      } else {
        const min = minimumSize(obj);
        obj.x = clamp(base.x + (initial.x - base.x) * scale, 0, WORLD.width - min.width);
        obj.y = clamp(base.y + (initial.y - base.y) * scale, 0, WORLD.height - min.height);
        obj.width = clamp(initial.width * scale, min.width, WORLD.width - obj.x);
        obj.height = clamp(initial.height * scale, min.height, WORLD.height - obj.y);
        updateObjectElement(obj);
      }
    }
    renderVectors();
    drawMinimap();
    updateContextToolbar();
    updateSelectionOverlay();
  }

  function finishGroupResize(action) {
    if (action.historyPushed) {
      action.ids.forEach(id => { const obj = getObject(id); if (obj) obj.modifiedAt = nowISO(); });
      touchBoard();
    }
    renderAll();
  }

  function beginKeyboardTransform(label) {
    const now = Date.now();
    if (!ui.keyboardTransform || ui.keyboardTransform.label !== label || now - ui.keyboardTransform.last > 650) pushHistory(label);
    clearTimeout(ui.keyboardTransform?.timer);
    ui.keyboardTransform = { label, last: now, timer: setTimeout(() => { ui.keyboardTransform = null; }, 700) };
  }

  function nudgeSelection(dx, dy, resize = false) {
    const objects = selectedObjects().filter(obj => !obj.locked);
    if (!objects.length) return;
    beginKeyboardTransform(resize ? 'Resize with keyboard' : 'Move with keyboard');
    for (const obj of objects) {
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
        const min = minimumSize(obj);
        obj.width = clamp(obj.width + dx, min.width, WORLD.width - obj.x);
        obj.height = clamp(obj.height + dy, min.height, WORLD.height - obj.y);
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
    touchBoard();
    renderAll();
  }

