  /* Popovers, mobile sheet, and keyboard navigation */
  openPopover = function(html, anchor, options = {}) {
    ui.popoverReturnFocus = document.activeElement;
    v12Original.openPopover(html, anchor, options);
    els.popover.classList.toggle('mobile-sheet', isNarrowViewport());
    requestAnimationFrame(() => {
      $$('.menu-item, .sticker-choice', els.popover).forEach(item => item.setAttribute('role', 'menuitem'));
      const heading = $('h3', els.popover)?.textContent?.trim();
      if (heading) els.popover.setAttribute('aria-label', heading);
      const target = $('input, select, textarea, button:not([aria-disabled="true"])', els.popover);
      target?.focus({ preventScroll: true });
    });
  };

  closePopover = function({ restoreFocus = true } = {}) {
    const returnFocus = ui.popoverReturnFocus;
    v12Original.closePopover();
    els.popover.classList.remove('mobile-sheet');
    ui.popoverReturnFocus = null;
    if (restoreFocus && returnFocus?.isConnected) requestAnimationFrame(() => returnFocus.focus?.({ preventScroll: true }));
  };

  function handlePopoverKeyboard(event) {
    if (els.popover.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePopover();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = $$('button:not([disabled]), input, select, textarea', els.popover).filter(item => !item.closest('[aria-disabled="true"]'));
    if (!items.length) return;
    event.preventDefault();
    event.stopPropagation();
    let index = items.indexOf(document.activeElement);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = items.length - 1;
    else if (event.key === 'ArrowDown') index = (index + 1 + items.length) % items.length;
    else index = (index - 1 + items.length) % items.length;
    items[index].focus({ preventScroll: true });
  }

  function openMobileMenu(anchor = els.mobileMenuButton) {
    const quick = state.settings.defaultExportFormat.toUpperCase();
    openPopover(`<div class="popover-section"><h3>TACKBOARD</h3>
      ${menuItem('mobile-board', '▦', currentBoard().name, 'Switch or manage boards')}
      ${menuItem('mobile-undo', '↶', 'Undo', syncHistoryAlias().undo.length ? syncHistoryAlias().undo.at(-1).label : 'Nothing to undo')}
      ${menuItem('mobile-redo', '↷', 'Redo', syncHistoryAlias().redo.length ? syncHistoryAlias().redo.at(-1).label : 'Nothing to redo')}
      ${menuItem('mobile-search', '⌕', 'Search Board')}
      ${menuItem('mobile-filter', '≡', 'Filters', hasActiveFilters() ? 'Filters are active' : 'Filter notes and objects')}
      ${menuItem('mobile-quick-export', '⇩', `Quick Export — ${quick}`, 'Uses the default export format')}
      ${menuItem('mobile-export', '▧', 'Import & Export')}
      ${menuItem('mobile-settings', '⚙', 'Settings')}
      ${menuItem('mobile-help', '?', 'Help & Shortcuts')}
    </div>`, anchor, { width: 330 });
  }

