  /* Tool and action routing */
  setTool = function(tool) {
    if (ui.tool === 'export-area' && tool !== 'export-area') {
      ui.exportAreaRequest = null;
      els.exportAreaPreview.style.display = 'none';
    }
    if (tool === 'export-area') {
      if (ui.editingId) finishEditing({ render: false });
      ui.tool = 'export-area';
      closePopover({ restoreFocus: false });
      updateToolUI();
      els.viewport.focus({ preventScroll: true });
      return;
    }
    v12Original.setTool(tool);
    if (tool !== 'select') ui.touchAdditive = false;
    updateToolUI();
  };

  handlePopoverAction = async function(action, source) {
    if (action === 'toggle-lock') { closePopover(); toggleSelectionLock(); return; }
    if (action === 'toggle-frame-collapse') { closePopover(); toggleFrameCollapse(); return; }
    if (action === 'quick-export' || action === 'mobile-quick-export') { closePopover({ restoreFocus: false }); quickExport(); return; }
    if (action === 'export-png-board-v12') return requestExport('png', 'board');
    if (action === 'export-png-view-v12') return requestExport('png', 'viewport');
    if (action === 'export-png-selection-v12') return requestExport('png', 'selection');
    if (action === 'export-png-area') { closePopover({ restoreFocus: false }); startAreaExport('png'); return; }
    if (action === 'export-pdf-board-v12') return requestExport('pdf', 'board', { tiled: false });
    if (action === 'export-pdf-tiled-v12') return requestExport('pdf', 'board', { tiled: true });
    if (action === 'export-pdf-view-v12') return requestExport('pdf', 'viewport', { tiled: false });
    if (action === 'export-pdf-selection-v12') return requestExport('pdf', 'selection', { tiled: false });
    if (action === 'export-pdf-area') { closePopover({ restoreFocus: false }); startAreaExport('pdf', { tiled: false }); return; }
    if (action === 'save-retry') { closePopover(); saveNow(); return; }
    if (action === 'save-backup') { closePopover(); exportBackupJSON(); return; }
    if (action === 'mobile-board') { const anchor = els.mobileMenuButton; closePopover({ restoreFocus: false }); openBoardMenu(anchor); return; }
    if (action === 'mobile-undo') { closePopover(); undo(); return; }
    if (action === 'mobile-redo') { closePopover(); redo(); return; }
    if (action === 'mobile-search') { closePopover({ restoreFocus: false }); openSearch(); return; }
    if (action === 'mobile-filter') { const anchor = els.mobileMenuButton; closePopover({ restoreFocus: false }); openFilterMenu(anchor); return; }
    if (action === 'mobile-export') { const anchor = els.mobileMenuButton; closePopover({ restoreFocus: false }); openExportMenu(anchor); return; }
    if (action === 'mobile-settings') { closePopover({ restoreFocus: false }); openSettings(); return; }
    if (action === 'mobile-help') { closePopover({ restoreFocus: false }); openHelp(); return; }
    return v12Original.handlePopoverAction(action, source);
  };

  handlePopoverClick = function(event) {
    const textColor = event.target.closest('[data-text-color]');
    if (textColor) { applySelectedTextColor(textColor.dataset.textColor || ''); return; }
    v12Original.handlePopoverClick(event);
  };

