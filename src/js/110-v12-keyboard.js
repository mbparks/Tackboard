  /* Keyboard and accessible focus behavior */
  handleKeyboardDown = function(event) {
    if (!els.popover.classList.contains('hidden') && els.popover.contains(event.target)) return;
    const typing = isTypingTarget(event.target);
    if (!typing && event.key === 'Escape' && ui.tool === 'export-area') {
      event.preventDefault();
      ui.exportAreaRequest = null;
      ui.exportAreaBounds = null;
      els.exportAreaPreview.style.display = 'none';
      setTool('select');
      toast('Export area cancelled.');
      return;
    }
    if (!typing && !event.ctrlKey && !event.metaKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && selectedIds().length) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      nudgeSelection(dx, dy, event.altKey);
      return;
    }
    if (!typing && event.key === 'Enter' && selectedIds().length === 1) {
      const selected = getSelectable(selectedIds()[0]);
      if (selected?.objectType === 'frame') { event.preventDefault(); renameFrame(); return; }
      if (selected?.objectType === 'connector') { event.preventDefault(); editConnector(); return; }
      if (selected?.objectType === 'sticker') { event.preventDefault(); openStickerPicker(els.stickerTool, null, { replaceId: selected.id }); return; }
      if (selected?.objectType === 'drawing') { event.preventDefault(); openSelectionMore(els.contextToolbar); return; }
    }
    if (!typing && event.key === '2') { event.preventDefault(); zoomToSelection(); return; }
    if (!typing && event.key === '3') { event.preventDefault(); overviewContent(); return; }
    if (!typing && event.key === '?') { event.preventDefault(); openHelp(); return; }
    v12Original.handleKeyboardDown(event);
  };

  handleKeyboardUp = function(event) {
    v12Original.handleKeyboardUp(event);
  };

