  /* -----------------------------------------------------------------------
     TACKBOARD v1.2 foundation with v1.3.0 compatibility
     ----------------------------------------------------------------------- */
  const V12_SCHEMA_VERSION = 2;
  const V12_INDEX_KEY = `${STATE_KEY}-index-v2`;
  const V12_BOARD_KEY_PREFIX = `${STATE_KEY}-board-`;
  const V12_TOOL_LABELS = {
    select: 'Select', pan: 'Pan', sticky: 'Sticky Note', sticker: 'Sticker',
    text: 'Text', pen: 'Pen', connector: 'Connector', frame: 'Frame',
    eraser: 'Eraser', 'export-area': 'Export Area'
  };
  const V12_TEXT_COLORS = [
    { value: '', label: 'Automatic' },
    ...LINE_COLORS.map(value => ({ value, label: value.toUpperCase() }))
  ];

  Object.assign(els, {
    mobileMenuButton: $('#mobileMenuButton'),
    activeFilterBar: $('#activeFilterBar'),
    saveErrorBanner: $('#saveErrorBanner'),
    saveErrorMessage: $('#saveErrorMessage'),
    retrySaveButton: $('#retrySaveButton'),
    backupNowButton: $('#backupNowButton'),
    dismissSaveErrorButton: $('#dismissSaveErrorButton'),
    touchAddButton: $('#touchAddButton'),
    activeToolLabel: $('#activeToolLabel'),
    selectionBox: $('#selectionBox'),
    selectionBoxLabel: $('#selectionBoxLabel'),
    selectionBoxText: $('#selectionBoxText'),
    selectionBoxLockCount: $('#selectionBoxLockCount'),
    selectionBoxResize: $('#selectionBoxResize'),
    selectionStatus: $('#selectionStatus'),
    exportAreaPreview: $('#exportAreaPreview'),
    zoomSelectionButton: $('#zoomSelectionButton'),
    overviewButton: $('#overviewButton')
  });

  Object.assign(ui, {
    histories: new Map(),
    persistedBoardVersions: new Map(),
    persistedBoardIds: new Set(),
    dirtyBoardIds: new Set(),
    lastSavedAt: null,
    loadedSavedAt: null,
    lastSaveError: null,
    saveErrorDismissed: false,
    recoveredEmergency: false,
    touchAdditive: false,
    popoverReturnFocus: null,
    keyboardTransform: null,
    exportAreaRequest: null,
    exportAreaBounds: null,
    minimapModel: null,
    toastRegistry: new Map()
  });

  const v12Original = {
    makeDefaultState,
    normalizeObject,
    normalizeState,
    loadPersistedState,
    persistState,
    touchBoard,
    saveNow,
    renderAll,
    updateContextToolbar,
    updateToolUI,
    renderVectors,
    setViewport,
    setTool,
    fitContent,
    drawMinimap,
    handleMinimapPointer,
    openPopover,
    closePopover,
    openColorPalette,
    openSelectionMore,
    openTextOptions,
    openExportMenu,
    openSettings,
    openHelp,
    handlePopoverAction,
    handlePopoverClick,
    handleViewportPointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleKeyboardDown,
    handleKeyboardUp,
    startDrag,
    startResize,
    updateDragAction,
    updateResizeAction,
    exportBounds,
    exportIncludes,
    renderBoardCanvas,
    exportPNG,
    exportPDF,
    toast,
    switchBoard,
    deleteCurrentBoard,
    setupEvents,
    cancelCurrentAction,
    alignSelection
  };

  function isNarrowViewport() {
    return matchMedia('(max-width: 680px)').matches;
  }

  function latestBoardModified(snapshot = state) {
    const times = (snapshot?.boards || []).map(board => Date.parse(board.modifiedAt || board.createdAt || 0) || 0);
    return Math.max(0, ...times);
  }

  function boardAccessibleName(obj) {
    if (!obj) return 'Board object';
    if (obj.objectType === 'blank-note') return obj.title?.trim() ? `Sticky note: ${obj.title.trim()}` : 'Blank sticky note';
    if (obj.objectType === 'template-note') return `Kanban note: ${obj.fields?.ticketNumber || 'Untitled Ticket'}`;
    if (obj.objectType === 'text') return `Text label: ${String(obj.text || 'Text').slice(0, 80)}`;
    if (obj.objectType === 'sticker') return `${stickerDefinition(obj.stickerId).label} sticker`;
    if (obj.objectType === 'frame') return `Frame: ${obj.title || 'Frame'}`;
    if (obj.objectType === 'drawing') return 'Freehand drawing';
    return 'Board object';
  }

  function connectorAccessibleName(connector) {
    const from = boardAccessibleName(getObject(connector?.fromId)).replace(/^(Sticky note|Kanban note|Text label|Frame):?\s*/i, '');
    const to = boardAccessibleName(getObject(connector?.toId)).replace(/^(Sticky note|Kanban note|Text label|Frame):?\s*/i, '');
    return `Connector from ${from || 'object'} to ${to || 'object'}${connector?.label ? `, labeled ${connector.label}` : ''}`;
  }

  function collapsedBoundsForFrame(frame) {
    if (!frame?.collapsed) return null;
    const source = frame.collapsedBounds || {
      x: frame.x,
      y: frame.y,
      width: frame.expandedWidth || frame.width,
      height: frame.expandedHeight || Math.max(frame.height, 120)
    };
    return {
      x: Number(source.x) || frame.x,
      y: Number(source.y) || frame.y,
      width: Math.max(1, Number(source.width) || frame.width),
      height: Math.max(1, Number(source.height) || frame.expandedHeight || 120),
      right: (Number(source.x) || frame.x) + Math.max(1, Number(source.width) || frame.width),
      bottom: (Number(source.y) || frame.y) + Math.max(1, Number(source.height) || frame.expandedHeight || 120)
    };
  }

  function objectInsideCollapsedFrame(obj) {
    if (!obj || obj.objectType === 'frame') return false;
    const bounds = obj.objectType === 'drawing' ? drawingBounds(obj) : objectRect(obj);
    if (!bounds) return false;
    const center = { x: bounds.cx ?? (bounds.x + bounds.right) / 2, y: bounds.cy ?? (bounds.y + bounds.bottom) / 2 };
    return currentBoard().objects.some(frame => {
      const area = collapsedBoundsForFrame(frame);
      return area && center.x >= area.x && center.x <= area.right && center.y >= area.y && center.y <= area.bottom;
    });
  }

  /* Data model and migration */
  makeDefaultState = function() {
    const next = v12Original.makeDefaultState();
    next.schemaVersion = V12_SCHEMA_VERSION;
    next.settings.defaultExportFormat = ['json', 'png', 'pdf'].includes(next.settings.defaultExportFormat) ? next.settings.defaultExportFormat : 'png';
    return next;
  };

  normalizeObject = function(obj) {
    const normalized = v12Original.normalizeObject(obj);
    if (!normalized) return normalized;
    normalized.locked = Boolean(obj?.locked);
    if (normalized.objectType === 'frame') {
      normalized.expandedWidth = Math.max(200, Number(obj?.expandedWidth) || Number(obj?.collapsedBounds?.width) || normalized.width);
      normalized.expandedHeight = Math.max(120, Number(obj?.expandedHeight) || Number(obj?.collapsedBounds?.height) || normalized.height);
      normalized.collapsedBounds = obj?.collapsedBounds && typeof obj.collapsedBounds === 'object' ? {
        x: Number(obj.collapsedBounds.x) || normalized.x,
        y: Number(obj.collapsedBounds.y) || normalized.y,
        width: Math.max(200, Number(obj.collapsedBounds.width) || normalized.expandedWidth),
        height: Math.max(120, Number(obj.collapsedBounds.height) || normalized.expandedHeight)
      } : null;
      if (normalized.collapsed) {
        normalized.collapsedBounds ||= { x: normalized.x, y: normalized.y, width: normalized.expandedWidth, height: normalized.expandedHeight };
        normalized.height = 46;
      }
    }
    return normalized;
  };

  normalizeState = function(raw) {
    const normalized = v12Original.normalizeState(raw);
    normalized.schemaVersion = V12_SCHEMA_VERSION;
    if (!['json', 'png', 'pdf'].includes(normalized.settings.defaultExportFormat)) normalized.settings.defaultExportFormat = 'png';
    return normalized;
  };

  function ensureV12State() {
    state = normalizeState(state);
    state.schemaVersion = V12_SCHEMA_VERSION;
    ui.dirtyBoardIds ||= new Set();
    ui.persistedBoardVersions ||= new Map();
    ui.persistedBoardIds ||= new Set();
    syncHistoryAlias();
  }

