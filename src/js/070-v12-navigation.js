  /* View navigation */
  fitContent = function(ids = null, options = {}) {
    const bounds = contentBounds(ids);
    if (!bounds) return resetView();
    const margin = isNarrowViewport() ? 52 : 90;
    const vw = els.viewport.clientWidth;
    const vh = els.viewport.clientHeight;
    const rawZoom = Math.min((vw - margin * 2) / Math.max(bounds.width, 1), (vh - margin * 2) / Math.max(bounds.height, 1));
    const readableFloor = isNarrowViewport() && !options.overview ? .42 : .12;
    const zoom = clamp(Math.max(rawZoom, readableFloor), .12, options.maxZoom || 2.4);
    setViewport({ zoom, x: vw / 2 - bounds.cx * zoom, y: vh / 2 - bounds.cy * zoom });
  };

  function overviewContent() {
    fitContent(null, { overview: true, maxZoom: 2.4 });
  }

  function zoomToSelection() {
    if (!selectedIds().length) return toast('Select one or more objects first.');
    fitContent(ui.selection, { overview: true, maxZoom: 3 });
  }

  drawMinimap = function() {
    if (!state.settings.minimap || !els.minimap.isConnected) return;
    const canvas = els.minimap;
    const ctx = canvas.getContext('2d');
    const dark = effectiveTheme() === 'dark';
    const v = currentBoard().viewport;
    const viewportBounds = {
      x: clamp(-v.x / v.zoom, 0, WORLD.width),
      y: clamp(-v.y / v.zoom, 0, WORLD.height),
      width: Math.min(els.viewport.clientWidth / v.zoom, WORLD.width),
      height: Math.min(els.viewport.clientHeight / v.zoom, WORLD.height)
    };
    viewportBounds.right = viewportBounds.x + viewportBounds.width;
    viewportBounds.bottom = viewportBounds.y + viewportBounds.height;
    const content = contentBounds();
    let mapBounds = unionBounds([content, viewportBounds].filter(Boolean)) || { x: 0, y: 0, right: WORLD.width, bottom: WORLD.height, width: WORLD.width, height: WORLD.height };
    const margin = Math.max(160, Math.max(mapBounds.width, mapBounds.height) * .08);
    mapBounds = {
      x: clamp(mapBounds.x - margin, 0, WORLD.width),
      y: clamp(mapBounds.y - margin, 0, WORLD.height),
      right: clamp(mapBounds.right + margin, 0, WORLD.width),
      bottom: clamp(mapBounds.bottom + margin, 0, WORLD.height)
    };
    mapBounds.width = Math.max(1, mapBounds.right - mapBounds.x);
    mapBounds.height = Math.max(1, mapBounds.bottom - mapBounds.y);
    const scale = Math.min(canvas.width / mapBounds.width, canvas.height / mapBounds.height);
    const offsetX = (canvas.width - mapBounds.width * scale) / 2;
    const offsetY = (canvas.height - mapBounds.height * scale) / 2;
    const mapX = x => offsetX + (x - mapBounds.x) * scale;
    const mapY = y => offsetY + (y - mapBounds.y) * scale;
    ui.minimapModel = { bounds: mapBounds, scale, offsetX, offsetY };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dark ? '#252a2e' : '#f4f1e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = dark ? 'rgba(238,242,244,.10)' : 'rgba(37,43,46,.10)';
    ctx.strokeRect(.5, .5, canvas.width - 1, canvas.height - 1);
    const palette = {
      yellow: dark ? '#a88e3c' : '#ead16f', blue: dark ? '#4a7181' : '#a8cfdf',
      green: dark ? '#507850' : '#acd0ab', coral: dark ? '#8f594d' : '#e9a793',
      lavender: dark ? '#685477' : '#cbb4de', cream: dark ? '#786b53' : '#e4d5b8', charcoal: '#41484d'
    };
    for (const connector of currentBoard().connectors) {
      const from = getObject(connector.fromId), to = getObject(connector.toId);
      if (!from || !to) continue;
      const a = objectRect(from), b = objectRect(to);
      ctx.strokeStyle = connector.stroke || '#4c555a';
      ctx.lineWidth = 1;
      ctx.globalAlpha = objectInsideCollapsedFrame(from) || objectInsideCollapsedFrame(to) ? .3 : .75;
      ctx.beginPath(); ctx.moveTo(mapX(a.cx), mapY(a.cy)); ctx.lineTo(mapX(b.cx), mapY(b.cy)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const ordered = [...currentBoard().objects].sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const obj of ordered) {
      ctx.globalAlpha = objectInsideCollapsedFrame(obj) ? .3 : 1;
      if (obj.objectType === 'drawing') {
        if (obj.points.length < 2) continue;
        ctx.beginPath(); ctx.moveTo(mapX(obj.points[0].x), mapY(obj.points[0].y));
        for (const point of obj.points.slice(1)) ctx.lineTo(mapX(point.x), mapY(point.y));
        ctx.strokeStyle = obj.stroke || '#4c555a'; ctx.lineWidth = 1; ctx.stroke(); continue;
      }
      if (obj.objectType === 'frame') {
        const frameBounds = obj.collapsed ? collapsedBoundsForFrame(obj) : objectRect(obj);
        ctx.strokeStyle = dark ? 'rgba(120,174,177,.65)' : 'rgba(61,111,115,.65)'; ctx.lineWidth = 1;
        ctx.strokeRect(mapX(frameBounds.x), mapY(frameBounds.y), Math.max(2, frameBounds.width * scale), Math.max(2, frameBounds.height * scale)); continue;
      }
      if (obj.objectType === 'sticker') {
        ctx.fillStyle = stickerDefinition(obj.stickerId).accent;
        const size = Math.max(3, Math.min(Math.max(3, obj.width * scale), Math.max(3, obj.height * scale)));
        ctx.beginPath(); ctx.arc(mapX(obj.x + obj.width / 2), mapY(obj.y + obj.height / 2), Math.max(2, size / 2), 0, Math.PI * 2); ctx.fill(); continue;
      }
      ctx.fillStyle = obj.objectType === 'text' ? (dark ? '#dfe4e6' : '#4b5357') : (palette[obj.color] || palette.yellow);
      ctx.fillRect(mapX(obj.x), mapY(obj.y), Math.max(2, obj.width * scale), Math.max(2, obj.height * scale));
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = dark ? '#9ad0d2' : '#28585c';
    ctx.lineWidth = 3;
    ctx.strokeRect(mapX(viewportBounds.x), mapY(viewportBounds.y), viewportBounds.width * scale, viewportBounds.height * scale);
  };

  handleMinimapPointer = function(event) {
    const model = ui.minimapModel;
    if (!model) return;
    const rect = els.minimap.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) / rect.width * els.minimap.width;
    const canvasY = (event.clientY - rect.top) / rect.height * els.minimap.height;
    const x = model.bounds.x + (canvasX - model.offsetX) / model.scale;
    const y = model.bounds.y + (canvasY - model.offsetY) / model.scale;
    const v = currentBoard().viewport;
    setViewport({ x: els.viewport.clientWidth / 2 - x * v.zoom, y: els.viewport.clientHeight / 2 - y * v.zoom });
  };

