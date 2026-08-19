  /* Export scope, preview, and selected-area capture */
  exportBounds = function(mode) {
    if (mode === 'area') return ui.exportAreaBounds ? { ...ui.exportAreaBounds } : null;
    return v12Original.exportBounds(mode);
  };

  exportIncludes = function(mode) {
    if (mode === 'area') return { objectIds: null, connectorIds: null };
    return v12Original.exportIncludes(mode);
  };

  function exportRenderPlan(mode = 'board') {
    const baseBounds = exportBounds(mode);
    if (!baseBounds || baseBounds.width <= 0 || baseBounds.height <= 0) throw new Error('There is no board content to export.');
    const margin = mode === 'viewport' || mode === 'area' ? 0 : 60;
    const bounds = {
      x: Math.max(0, baseBounds.x - margin),
      y: Math.max(0, baseBounds.y - margin),
      width: Math.min(WORLD.width, baseBounds.width + margin * 2),
      height: Math.min(WORLD.height, baseBounds.height + margin * 2)
    };
    if (bounds.x + bounds.width > WORLD.width) bounds.x = Math.max(0, WORLD.width - bounds.width);
    if (bounds.y + bounds.height > WORLD.height) bounds.y = Math.max(0, WORLD.height - bounds.height);
    const maxDimension = 5000;
    const maxPixels = 18000000;
    const scale = clamp(Math.min(2, maxDimension / bounds.width, maxDimension / bounds.height, Math.sqrt(maxPixels / (bounds.width * bounds.height))), .2, 2);
    return { bounds, scale, pixelWidth: Math.max(1, Math.ceil(bounds.width * scale)), pixelHeight: Math.max(1, Math.ceil(bounds.height * scale)) };
  }

  renderBoardCanvas = function(mode = 'board') {
    const plan = exportRenderPlan(mode);
    const { bounds, scale } = plan;
    const canvas = document.createElement('canvas');
    canvas.width = plan.pixelWidth;
    canvas.height = plan.pixelHeight;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.translate(-bounds.x, -bounds.y);
    drawExportBackground(ctx, bounds);
    const include = exportIncludes(mode);
    const objectAllowed = obj => !include.objectIds || include.objectIds.has(obj.id);
    const connectorAllowed = connector => !include.connectorIds || include.connectorIds.has(connector.id);
    const objects = currentBoard().objects.filter(objectAllowed);
    const palette = paletteForCanvas();
    const withCollapsedAlpha = (obj, draw) => {
      ctx.save();
      if (objectInsideCollapsedFrame(obj)) ctx.globalAlpha = .3;
      draw();
      ctx.restore();
    };
    objects.filter(obj => obj.objectType === 'frame').sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).forEach(frame => drawFrameExport(ctx, frame, palette));
    currentBoard().connectors.filter(connectorAllowed).forEach(connector => {
      ctx.save();
      if (objectInsideCollapsedFrame(getObject(connector.fromId)) || objectInsideCollapsedFrame(getObject(connector.toId))) ctx.globalAlpha = .3;
      drawConnectorExport(ctx, connector);
      ctx.restore();
    });
    objects.filter(obj => obj.objectType === 'drawing').forEach(drawing => withCollapsedAlpha(drawing, () => drawDrawingExport(ctx, drawing)));
    objects.filter(obj => obj.objectType !== 'frame' && obj.objectType !== 'drawing').sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).forEach(obj => withCollapsedAlpha(obj, () => {
      if (obj.objectType === 'blank-note') drawBlankNoteExport(ctx, obj, palette);
      else if (obj.objectType === 'template-note') drawKanbanNoteExport(ctx, obj, palette);
      else if (obj.objectType === 'text') drawTextExport(ctx, obj, palette);
      else if (obj.objectType === 'sticker') drawStickerExport(ctx, obj);
    }));
    return { canvas, bounds, scale };
  };

  async function confirmExportPreview(format, mode, options = {}) {
    const plan = exportRenderPlan(mode);
    const tiled = Boolean(options.tiled);
    const columns = tiled ? Math.max(1, Math.ceil(plan.pixelWidth / 1600)) : 1;
    const rows = tiled ? Math.max(1, Math.ceil(plan.pixelHeight / Math.round(1600 / (11 / 8.5)))) : 1;
    const pages = columns * rows;
    const scope = mode === 'viewport' ? 'Visible viewport' : mode === 'selection' ? 'Selected objects' : mode === 'area' ? 'Selected area' : 'Entire board';
    const result = await showDialog({
      title: `${format.toUpperCase()} export preview`,
      bodyHTML: `<p>Review the planned export before TACKBOARD renders it.</p><div class="export-preview-grid">
        <div class="export-preview-stat"><span>Scope</span><strong>${escapeHTML(scope)}</strong></div>
        <div class="export-preview-stat"><span>Board area</span><strong>${Math.round(plan.bounds.width)} × ${Math.round(plan.bounds.height)}</strong></div>
        <div class="export-preview-stat"><span>Output pixels</span><strong>${plan.pixelWidth} × ${plan.pixelHeight}</strong></div>
        <div class="export-preview-stat"><span>Render scale</span><strong>${Math.round(plan.scale * 100)}%</strong></div>
        ${format === 'pdf' ? `<div class="export-preview-stat"><span>Pages</span><strong>${pages}${tiled ? ` (${columns} × ${rows})` : ''}</strong></div>` : ''}
        <div class="export-preview-stat"><span>Background</span><strong>${escapeHTML(currentBoard().background)}</strong></div>
      </div>`,
      actions: [{ label: 'Cancel', value: false }, { label: `Export ${format.toUpperCase()}`, value: true, primary: true }]
    });
    return Boolean(result);
  }

  async function performPDFExport(mode, { tiled = false, printWindow = null } = {}) {
    const targetWindow = printWindow || window.open('', '_blank');
    if (!targetWindow) return toast('The browser blocked the print window. Allow pop-ups for this site and try again.', 'error', 6000);
    try {
      targetWindow.opener = null;
      targetWindow.document.write('<!doctype html><title>Preparing TACKBOARD PDF…</title><body style="font-family:system-ui,sans-serif;padding:30px">Preparing clean board pages…</body>');
      const { canvas } = renderBoardCanvas(mode);
      const pages = tiled ? canvasTiles(canvas) : [{ dataURL: canvas.toDataURL('image/png'), row: 0, column: 0, rows: 1, columns: 1 }];
      const title = escapeHTML(currentBoard().name);
      const scopeLabel = mode === 'viewport' ? 'Visible Viewport' : mode === 'selection' ? 'Selection' : mode === 'area' ? 'Selected Area' : tiled ? 'Entire Board — Tiled' : 'Entire Board';
      const pageHTML = pages.map((page, index) => `<section class="print-page"><header><strong>${title}</strong><span>${escapeHTML(scopeLabel)}${pages.length > 1 ? ` · Page ${index + 1} of ${pages.length}` : ''}</span></header><div class="page-image"><img src="${page.dataURL}" alt="${title}, page ${index + 1}"></div></section>`).join('');
      targetWindow.document.open();
      targetWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title} — TACKBOARD</title><style>
        @page{size:landscape;margin:8mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#252a2e;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.print-page{width:100%;height:calc(100vh - 2mm);display:grid;grid-template-rows:auto 1fr;gap:4mm;break-after:page;page-break-after:always;overflow:hidden}.print-page:last-child{break-after:auto;page-break-after:auto}header{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:10pt;color:#60686d}header strong{font-size:12pt;color:#252a2e}.page-image{min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}@media screen{body{padding:20px;background:#e6e8e9}.print-page{max-width:1100px;min-height:720px;margin:0 auto 20px;padding:24px;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.16)}}@media print{.print-page{height:calc(100vh - 1mm)}}
      </style></head><body>${pageHTML}<script>const images=[...document.images];Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve}))).then(()=>setTimeout(()=>window.print(),180));<\/script></body></html>`);
      targetWindow.document.close();
      toast(`${pages.length > 1 ? `${pages.length}-page` : 'One-page'} print view opened. Choose “Save as PDF” in the print destination.`, 'success', 5600);
    } catch (error) {
      targetWindow.close();
      console.error('TACKBOARD PDF export error', error);
      toast(error.message || 'PDF export failed.', 'error', 5500);
    }
  }

  async function requestExport(format, mode = 'board', options = {}) {
    closePopover({ restoreFocus: false });
    if (mode === 'selection' && !selectedIds().length) return toast('Select one or more objects first.');
    let printWindow = null;
    if (format === 'pdf') {
      printWindow = window.open('', '_blank');
      if (!printWindow) return toast('The browser blocked the print window. Allow pop-ups for this site and try again.', 'error', 6000);
      printWindow.document.write('<!doctype html><title>TACKBOARD export preview</title><body style="font-family:system-ui,sans-serif;padding:30px">Waiting for export confirmation…</body>');
    }
    try {
      const approved = await confirmExportPreview(format, mode, options);
      if (!approved) {
        printWindow?.close();
        return;
      }
      if (format === 'png') await v12Original.exportPNG(mode);
      else if (format === 'pdf') await performPDFExport(mode, { ...options, printWindow });
    } catch (error) {
      printWindow?.close();
      console.error('TACKBOARD export preview error', error);
      toast(error.message || 'The export could not be prepared.', 'error', 5500);
    } finally {
      if (mode === 'area') ui.exportAreaBounds = null;
    }
  }

  function startAreaExport(format, options = {}) {
    ui.exportAreaRequest = { format, options };
    ui.exportAreaBounds = null;
    setTool('export-area');
    toast(`Drag a rectangle around the area to export as ${format.toUpperCase()}.`);
  }

  function quickExport() {
    const format = state.settings.defaultExportFormat;
    if (format === 'json') exportBoardJSON();
    else requestExport(format, 'board', { tiled: false });
  }

  openExportMenu = function(anchor = els.exportButton) {
    const hasSelection = selectedIds().length > 0;
    const quick = state.settings.defaultExportFormat.toUpperCase();
    openPopover(`<div class="popover-section"><h3>Quick export</h3>
      ${menuItem('quick-export', '⇩', `Export Board as ${quick}`, 'Change the default format in Settings')}
    </div><div class="popover-section"><h3>JSON</h3>
      ${menuItem('export-board-json', '{}', 'Current Board JSON', 'Preserves all objects and template fields')}
      ${hasSelection ? menuItem('export-selection-json', '◫', 'Selected Objects JSON', 'Export only the current selection') : ''}
      ${menuItem('export-backup-json', '▣', 'Complete Backup JSON', 'All boards and settings')}
    </div><div class="popover-section"><h3>PNG</h3>
      ${menuItem('export-png-board-v12', '▧', 'Board PNG', 'Clean image of all board content')}
      ${menuItem('export-png-view-v12', '▤', 'Visible Viewport PNG', 'What is currently on screen')}
      ${hasSelection ? menuItem('export-png-selection-v12', '▥', 'Selection PNG', 'Selected objects and attached content') : ''}
      ${menuItem('export-png-area', '⌗', 'Selected Area PNG', 'Drag a crop rectangle on the board')}
    </div><div class="popover-section"><h3>PDF / Print</h3>
      ${menuItem('export-pdf-board-v12', 'PDF', 'Entire Board — One Page', 'Fits all board content onto one landscape page')}
      ${menuItem('export-pdf-tiled-v12', '▦', 'Entire Board — Tiled Pages', 'Splits a large board across readable pages')}
      ${menuItem('export-pdf-view-v12', '▤', 'Visible Viewport PDF', 'Prints the current view on one page')}
      ${hasSelection ? menuItem('export-pdf-selection-v12', '▥', 'Selection PDF', 'Prints only selected objects') : ''}
      ${menuItem('export-pdf-area', '⌗', 'Selected Area PDF', 'Drag a crop rectangle on the board')}
    </div><div class="popover-section"><h3>Import</h3>
      ${menuItem('import-json', '⇧', 'Import JSON', 'Replace, add, or restore a backup')}
    </div>`, anchor, { width: 345 });
  };

