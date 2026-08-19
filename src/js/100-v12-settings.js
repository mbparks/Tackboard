  /* Settings and help */
  openSettings = async function() {
    closePopover();
    const board = currentBoard();
    const s = state.settings;
    const result = await showDialog({
      title: 'TACKBOARD settings',
      bodyHTML: `<form id="settingsForm" class="settings-form">
        <div class="form-row"><label for="settingTheme">Theme</label><select id="settingTheme" name="theme"><option value="system" ${s.theme === 'system' ? 'selected' : ''}>System</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option></select></div>
        <div class="form-row"><label for="settingBackground">Current board background</label><select id="settingBackground" name="background"><option value="blank" ${board.background === 'blank' ? 'selected' : ''}>Blank</option><option value="dots" ${board.background === 'dots' ? 'selected' : ''}>Dots</option><option value="grid" ${board.background === 'grid' ? 'selected' : ''}>Grid</option><option value="ruled" ${board.background === 'ruled' ? 'selected' : ''}>Ruled</option></select></div>
        <div class="toggle-row"><label for="settingGuides">Alignment guides</label><input id="settingGuides" name="alignmentGuides" type="checkbox" ${s.alignmentGuides ? 'checked' : ''}></div>
        <div class="toggle-row"><label for="settingMinimap">Show minimap</label><input id="settingMinimap" name="minimap" type="checkbox" ${s.minimap ? 'checked' : ''}></div>
        <div class="toggle-row"><label for="settingRotation">Slight note rotation</label><input id="settingRotation" name="noteRotation" type="checkbox" ${s.noteRotation ? 'checked' : ''}></div>
        <div class="toggle-row"><label for="settingReduced">Reduced motion</label><input id="settingReduced" name="reducedMotion" type="checkbox" ${s.reducedMotion ? 'checked' : ''}></div>
        <div class="toggle-row"><label for="settingConfirmDelete">Confirm before deleting objects</label><input id="settingConfirmDelete" name="confirmObjectDelete" type="checkbox" ${s.confirmObjectDelete ? 'checked' : ''}></div>
        <div class="form-row"><label for="settingBlankColor">Default blank-note color</label><select id="settingBlankColor" name="defaultBlankColor">${NOTE_COLORS.map(color => `<option value="${color}" ${s.defaultBlankColor === color ? 'selected' : ''}>${color[0].toUpperCase() + color.slice(1)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="settingStructuredColor">Default structured-note color</label><select id="settingStructuredColor" name="defaultStructuredColor">${NOTE_COLORS.map(color => `<option value="${color}" ${s.defaultStructuredColor === color ? 'selected' : ''}>${color[0].toUpperCase() + color.slice(1)}</option>`).join('')}</select></div>
        <div class="form-row"><label for="settingStickyType">Default sticky-note type</label><select id="settingStickyType" name="defaultStickyType"><option value="blank" ${s.defaultStickyType === 'blank' ? 'selected' : ''}>Blank Note</option><option value="kanban" ${s.defaultStickyType === 'kanban' ? 'selected' : ''}>Kanban</option></select></div>
        <div class="form-row"><label for="settingExportFormat">Default export format</label><select id="settingExportFormat" name="defaultExportFormat"><option value="json" ${s.defaultExportFormat === 'json' ? 'selected' : ''}>JSON</option><option value="png" ${s.defaultExportFormat === 'png' ? 'selected' : ''}>PNG</option><option value="pdf" ${s.defaultExportFormat === 'pdf' ? 'selected' : ''}>PDF</option></select></div>
        <div style="height:1px;background:var(--line);margin:4px 0"></div>
        <button class="button danger" type="button" data-clear-local-data>Clear all local TACKBOARD data</button>
      </form>`,
      actions: [{ label: 'Cancel', value: null }, { label: 'Save Settings', value: 'save', primary: true }]
    });
    if (result !== 'save') return;
    const form = $('#settingsForm', els.dialogBody);
    if (!form) return;
    state.settings.theme = form.elements.theme.value;
    board.background = form.elements.background.value;
    state.settings.alignmentGuides = form.elements.alignmentGuides.checked;
    state.settings.minimap = form.elements.minimap.checked;
    state.settings.noteRotation = form.elements.noteRotation.checked;
    state.settings.reducedMotion = form.elements.reducedMotion.checked;
    state.settings.confirmObjectDelete = form.elements.confirmObjectDelete.checked;
    state.settings.defaultBlankColor = form.elements.defaultBlankColor.value;
    state.settings.defaultStructuredColor = form.elements.defaultStructuredColor.value;
    state.settings.defaultStickyType = form.elements.defaultStickyType.value;
    state.settings.defaultExportFormat = form.elements.defaultExportFormat.value;
    ui.dirtyBoardIds.add(board.id);
    renderAll();
    scheduleSave({ immediate: true });
  };

  openHelp = function() {
    closePopover();
    showDialog({
      title: 'Help & keyboard shortcuts',
      bodyHTML: `<p>Use the arrow tool to select and arrange objects. Use the hand tool to pan the board with an ordinary left-drag. On touch devices, Select uses one finger for object movement or a selection rectangle, while Pan uses one finger for navigation; two fingers always pan and zoom.</p>
        <div class="shortcut-grid">
          <kbd>V / H</kbd><span>Select / Pan tool</span>
          <kbd>N / Shift + N</kbd><span>Create default note / open note picker</span>
          <kbd>S / Shift + S</kbd><span>Use last sticker / open sticker picker</span>
          <kbd>T / P / C / F</kbd><span>Text / Pen / Connector / Frame</span>
          <kbd>Arrow keys</kbd><span>Nudge selected objects by 1 pixel</span>
          <kbd>Shift + Arrow</kbd><span>Nudge selected objects by 10 pixels</span>
          <kbd>Alt/Option + Arrow</kbd><span>Resize selected objects</span>
          <kbd>Space + drag</kbd><span>Temporarily pan from any tool</span>
          <kbd>Ctrl/Cmd + wheel</kbd><span>Zoom at the pointer</span>
          <kbd>Enter</kbd><span>Edit or open the primary action for the selected object</span>
          <kbd>Esc</kbd><span>Finish editing, close a menu, or cancel an operation</span>
          <kbd>Ctrl/Cmd + Z</kbd><span>Undo on the current board</span>
          <kbd>Ctrl/Cmd + Shift + Z</kbd><span>Redo on the current board</span>
          <kbd>Ctrl/Cmd + C / V / D</kbd><span>Copy / paste / duplicate</span>
          <kbd>Ctrl/Cmd + F / S</kbd><span>Search / force local save</span>
          <kbd>0 / 1 / 2 / 3</kbd><span>Reset / fit readably / zoom selection / overview</span>
          <kbd>Delete</kbd><span>Delete selection</span>
        </div>
        <p style="margin-top:16px">The Add Selection button on phones and tablets provides a touch equivalent to Shift-click. Long-press a selected object for its More menu. All data stays in this browser unless you explicitly export it.</p>`,
      actions: [{ label: 'Close', value: null, primary: true }]
    });
  };

