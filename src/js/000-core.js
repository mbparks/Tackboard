
(() => {
  'use strict';
  const APP_VERSION = '1.3.0';
  const WORLD = Object.freeze({ width: 12000, height: 8000 });
  const DB_NAME = 'tackboard-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'application';
  const STATE_KEY = 'tackboard-state';
  const SAVE_DEBOUNCE_MS = 420;

  const NOTE_COLORS = ['yellow', 'blue', 'green', 'coral', 'lavender', 'cream', 'charcoal'];
  const FRAME_COLORS = ['neutral', 'blue', 'green', 'coral', 'lavender'];
  const LINE_COLORS = ['#4c555a', '#3d6f73', '#567d5d', '#9f6255', '#735f87', '#b07c2d'];
  const TEAM_OPTIONS = ['SPA', 'PIC', 'PPD', 'CPPD', 'FES', 'R&A', 'P&BA', 'CMDSPT', 'HCM', 'SEC', 'EEO'];
  const TICKET_TYPES = ['Story', 'Bug', 'Subtask'];
  const STATUS_OPTIONS = ['Backlog', 'VP Scheduled', 'VP Held', 'Ready', 'In Dev', 'UAT', 'Done'];
  const STICKER_CATALOG = Object.freeze([
    { id: 'thumbs-up', label: 'Thumbs Up', width: 92, height: 92, accent: '#4389d6', svg: `<path d="M29 43h16l6-23c1.3-5.5 7.5-8.3 12-5.2 3.1 2.1 4.3 5.9 3.3 9.6L62 40h18c7.1 0 11.9 6.8 9.8 13.5l-7 23.2A11 11 0 0 1 72.3 85H29Z" fill="#4389d6" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><rect x="10" y="42" width="22" height="45" rx="7" fill="#2e6cae" stroke="#fff" stroke-width="6"/>` },
    { id: 'thumbs-down', label: 'Thumbs Down', width: 92, height: 92, accent: '#e1695d', svg: `<g transform="rotate(180 50 50)"><path d="M29 43h16l6-23c1.3-5.5 7.5-8.3 12-5.2 3.1 2.1 4.3 5.9 3.3 9.6L62 40h18c7.1 0 11.9 6.8 9.8 13.5l-7 23.2A11 11 0 0 1 72.3 85H29Z" fill="#e1695d" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><rect x="10" y="42" width="22" height="45" rx="7" fill="#b74840" stroke="#fff" stroke-width="6"/></g>` },
    { id: 'check', label: 'Green Check', width: 90, height: 90, accent: '#35a85a', svg: `<circle cx="50" cy="50" r="39" fill="#35a85a" stroke="#fff" stroke-width="6"/><path d="M28 51l14 15 31-33" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` },
    { id: 'red-x', label: 'Red X', width: 90, height: 90, accent: '#d94b48', svg: `<circle cx="50" cy="50" r="39" fill="#d94b48" stroke="#fff" stroke-width="6"/><path d="M34 34l32 32M66 34 34 66" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>` },
    { id: 'exclamation', label: 'Red Exclamation', width: 90, height: 90, accent: '#d94b48', svg: `<circle cx="50" cy="50" r="39" fill="#d94b48" stroke="#fff" stroke-width="6"/><path d="M50 27v31" stroke="#fff" stroke-width="10" stroke-linecap="round"/><circle cx="50" cy="72" r="5.5" fill="#fff"/>` },
    { id: 'question', label: 'Yellow Question', width: 90, height: 90, accent: '#f0c84d', svg: `<circle cx="50" cy="50" r="39" fill="#f0c84d" stroke="#fff" stroke-width="6"/><text x="50" y="69" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="900" fill="#293136">?</text>` },
    { id: 'blue-box', label: 'Blue Box', width: 88, height: 88, accent: '#3784d4', svg: `<rect x="12" y="12" width="76" height="76" rx="13" fill="#3784d4" stroke="#fff" stroke-width="6"/><rect x="26" y="26" width="48" height="48" rx="6" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="4"/>` },
    { id: 'arrow-right', label: 'Right Arrow', width: 128, height: 76, accent: '#4d75cf', svg: `<path d="M8 37h46V19l38 31-38 31V63H8Z" fill="#4d75cf" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` },
    { id: 'arrow-left', label: 'Left Arrow', width: 128, height: 76, accent: '#4d75cf', svg: `<path d="M92 37H46V19L8 50l38 31V63h46Z" fill="#4d75cf" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` },
    { id: 'arrow-up', label: 'Up Arrow', width: 76, height: 128, accent: '#3a9c9a', svg: `<path d="M37 92V46H19L50 8l31 38H63v46Z" fill="#3a9c9a" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` },
    { id: 'arrow-down', label: 'Down Arrow', width: 76, height: 128, accent: '#3a9c9a', svg: `<path d="M37 8v46H19l31 38 31-38H63V8Z" fill="#3a9c9a" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` },
    { id: 'star', label: 'Star', width: 92, height: 92, accent: '#f0b83f', svg: `<path d="M50 9l12.4 25.1 27.7 4-20 19.5 4.7 27.5L50 72.1 25.2 85.1l4.7-27.5-20-19.5 27.7-4Z" fill="#f0b83f" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` },
    { id: 'heart', label: 'Heart', width: 94, height: 88, accent: '#e35c6d', svg: `<path d="M50 84 16 52C-2 35 8 13 28 13c10 0 18 5 22 13 4-8 12-13 22-13 20 0 30 22 12 39Z" fill="#e35c6d" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` },
    { id: 'idea', label: 'Idea', width: 88, height: 98, accent: '#f0c84d', svg: `<path d="M50 10c-20 0-34 14-34 33 0 13 7 22 16 29 4 3 6 7 6 12h24c0-5 2-9 6-12 9-7 16-16 16-29 0-19-14-33-34-33Z" fill="#f0c84d" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M38 85h24M41 94h18" stroke="#65531d" stroke-width="6" stroke-linecap="round"/><path d="M50 27v24M38 39h24" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` },
    { id: 'flag', label: 'Flag', width: 96, height: 96, accent: '#df554e', svg: `<path d="M25 89V12" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M28 16h54L68 36l14 20H28Z" fill="#df554e" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><circle cx="25" cy="12" r="6" fill="#384247" stroke="#fff" stroke-width="4"/>` },
    { id: 'plus', label: 'Plus', width: 88, height: 88, accent: '#34a66a', svg: `<circle cx="50" cy="50" r="39" fill="#34a66a" stroke="#fff" stroke-width="6"/><path d="M50 29v42M29 50h42" stroke="#fff" stroke-width="10" stroke-linecap="round"/>` },
    { id: 'minus', label: 'Minus', width: 88, height: 88, accent: '#db6558', svg: `<circle cx="50" cy="50" r="39" fill="#db6558" stroke="#fff" stroke-width="6"/><path d="M29 50h42" stroke="#fff" stroke-width="10" stroke-linecap="round"/>` }
  ]);
  const STICKER_BY_ID = new Map(STICKER_CATALOG.map(sticker => [sticker.id, sticker]));
  const STICKER_IDS = STICKER_CATALOG.map(sticker => sticker.id);

  const KANBAN_SCHEMA = Object.freeze({
    templateId: 'kanban',
    templateName: 'Kanban',
    templateVersion: 2,
    defaultDimensions: { width: 380, height: 474 },
    compactDimensions: { width: 340, height: 286 },
    defaultColor: 'yellow',
    headerFields: ['ticketNumber', 'ticketType', 'status'],
    compactViewFields: ['ticketNumber', 'ticketType', 'status', 'team', 'assignee', 'onHold', 'needByDate', 'needsVP'],
    fields: [
      { key: 'ticketNumber', label: 'Ticket #:', type: 'text', placeholder: 'ABC-123', defaultValue: '', searchable: true },
      { key: 'ticketType', label: 'Ticket Type:', type: 'dropdown', options: TICKET_TYPES, defaultValue: 'Story', searchable: true, filterable: true },
      { key: 'sprintNumber', label: 'Sprint #:', type: 'text', placeholder: '24 or FY26-PI3-S2', defaultValue: '', searchable: true },
      { key: 'epic', label: 'Epic:', type: 'text', placeholder: 'Epic name or identifier', defaultValue: '', searchable: true },
      { key: 'description', label: 'Description:', type: 'multiline', placeholder: 'Describe the work, issue, or desired outcome…', defaultValue: '', searchable: true },
      { key: 'team', label: 'Team:', type: 'dropdown', options: ['', ...TEAM_OPTIONS], optionLabels: { '': 'Select team' }, defaultValue: '', searchable: true, filterable: true },
      { key: 'reporter', label: 'Reporter:', type: 'text', placeholder: 'Name, username, email, or team', defaultValue: '', searchable: true },
      { key: 'assignee', label: 'Assignee:', type: 'text', placeholder: 'Name, username, email, or team', defaultValue: '', searchable: true },
      { key: 'status', label: 'Status:', type: 'dropdown', options: STATUS_OPTIONS, defaultValue: 'Backlog', searchable: true, filterable: true },
      { key: 'onHold', label: 'On Hold', type: 'checkbox', defaultValue: false, searchable: true, filterable: true },
      { key: 'needsVP', label: 'Needs VP?', type: 'checkbox', defaultValue: false, searchable: true, filterable: true },
      { key: 'needByDate', label: 'Need By Date:', type: 'date', defaultValue: '', searchable: true, filterable: true }
    ]
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    app: $('#app'),
    viewport: $('#viewport'),
    world: $('#world'),
    vectorLayer: $('#vectorLayer'),
    connectorGroup: $('#connectorGroup'),
    drawingGroup: $('#drawingGroup'),
    wirePreview: $('#wirePreview'),
    objectLayer: $('#objectLayer'),
    marquee: $('#marquee'),
    framePreview: $('#framePreview'),
    guideV: $('#guideV'),
    guideH: $('#guideH'),
    emptyState: $('#emptyState'),
    boardButton: $('#boardButton'),
    currentBoardName: $('#currentBoardName'),
    undoButton: $('#undoButton'),
    redoButton: $('#redoButton'),
    searchButton: $('#searchButton'),
    searchStrip: $('#searchStrip'),
    searchInput: $('#searchInput'),
    searchCount: $('#searchCount'),
    searchPrev: $('#searchPrev'),
    searchNext: $('#searchNext'),
    searchClose: $('#searchClose'),
    filterButton: $('#filterButton'),
    exportButton: $('#exportButton'),
    settingsButton: $('#settingsButton'),
    helpButton: $('#helpButton'),
    saveStatus: $('#saveStatus'),
    saveStatusText: $('#saveStatusText'),
    toolDock: $('#toolDock'),
    stickyTool: $('#stickyTool'),
    stickerTool: $('#stickerTool'),
    dockMoreButton: $('#dockMoreButton'),
    contextToolbar: $('#contextToolbar'),
    zoomOut: $('#zoomOut'),
    zoomIn: $('#zoomIn'),
    zoomReadout: $('#zoomReadout'),
    fitButton: $('#fitButton'),
    resetButton: $('#resetButton'),
    minimapButton: $('#minimapButton'),
    minimapWrap: $('#minimapWrap'),
    minimap: $('#minimap'),
    popover: $('#popover'),
    dialog: $('#dialog'),
    dialogTitle: $('#dialogTitle'),
    dialogBody: $('#dialogBody'),
    dialogFooter: $('#dialogFooter'),
    dialogClose: $('#dialogClose'),
    importInput: $('#importInput'),
    toastHost: $('#toastHost')
  };

  function uuid(prefix = 'id') {
    if (crypto && typeof crypto.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function deepClone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function round(value, precision = 2) {
    const p = 10 ** precision;
    return Math.round(value * p) / p;
  }
  function nowISO() { return new Date().toISOString(); }
  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
  function escapeAttr(value) { return escapeHTML(value).replaceAll('`', '&#096;'); }
  function nl2br(value) { return escapeHTML(value).replace(/\r?\n/g, '<br>'); }
  function slugify(value) {
    const slug = String(value || 'tackboard')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || 'tackboard';
  }
  function isFormControl(target) {
    return Boolean(target?.closest('input, textarea, select, button, [contenteditable="true"], [role="menu"], dialog'));
  }
  function isTypingTarget(target = document.activeElement) {
    return Boolean(target && (target.matches?.('input, textarea, select, [contenteditable="true"]') || target.closest?.('.editing')));
  }
  function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, '\\$&');
  }
  function dateOnly(value) {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  function formatDate(value) {
    const date = dateOnly(value);
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    } catch { return value; }
  }
  function formatRelativeDate(value) {
    const date = dateOnly(value);
    if (!date) return '';
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diff = Math.round((date - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff <= 14) return `In ${diff}d`;
    return formatDate(value);
  }
  function statusClass(value) { return `status-${String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`; }
  function stickerDefinition(id) { return STICKER_BY_ID.get(id) || STICKER_BY_ID.get('check') || STICKER_CATALOG[0]; }
  function stickerSVG(id, extraClass = '') {
    const sticker = stickerDefinition(id);
    return `<svg class="sticker-svg ${escapeAttr(extraClass)}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">${sticker.svg}</svg>`;
  }
  function prefersDark() { return matchMedia('(prefers-color-scheme: dark)').matches; }
  function effectiveTheme() {
    const setting = state?.settings?.theme || 'system';
    return setting === 'system' ? (prefersDark() ? 'dark' : 'light') : setting;
  }

  function makeDefaultBoard(name = 'Untitled Board') {
    const created = nowISO();
    return {
      id: uuid('board'),
      name,
      description: '',
      createdAt: created,
      modifiedAt: created,
      background: 'dots',
      viewport: { x: 100, y: 90, zoom: 1 },
      objects: [],
      connectors: []
    };
  }

  function makeDefaultState() {
    const board = makeDefaultBoard('My First Board');
    return {
      format: 'tackboard-backup',
      appVersion: APP_VERSION,
      schemaVersion: 2,
      currentBoardId: board.id,
      boards: [board],
      settings: {
        theme: 'system',
        alignmentGuides: true,
        minimap: false,
        noteRotation: true,
        defaultBlankColor: 'yellow',
        defaultStructuredColor: 'yellow',
        defaultStickyType: 'blank',
        defaultStickerId: 'check',
        defaultExportFormat: 'png',
        reducedMotion: false,
        confirmObjectDelete: false,
        penColor: '#4c555a',
        penWidth: 3,
        connectorColor: '#4c555a',
        connectorWidth: 2,
        connectorStyle: 'curved',
        connectorArrow: true
      }
    };
  }

  let state = makeDefaultState();
  const ui = {
    tool: 'select',
    selection: new Set(),
    editingId: null,
    connectorSourceId: null,
    searchQuery: '',
    searchResults: [],
    searchIndex: -1,
    filters: {
      template: '', ticketType: '', team: '', status: '', onHold: '', needsVP: '', due: '', from: '', to: ''
    },
    history: { undo: [], redo: [] },
    clipboard: null,
    action: null,
    pointerWorld: { x: 300, y: 250 },
    spaceDown: false,
    longPressTimer: null,
    longPressOrigin: null,
    touchPoints: new Map(),
    pinch: null,
    saveTimer: null,
    saveInFlight: false,
    pendingSave: false,
    db: null,
    usingLocalStorageFallback: false,
    dialogResolver: null,
    lastFocused: null,
    menuAnchor: null,
    stickerReplaceId: null
  };

  function normalizeObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const base = {
      id: obj.id || uuid('object'),
      objectType: obj.objectType || 'blank-note',
      x: Number.isFinite(Number(obj.x)) ? Number(obj.x) : Number(obj.position?.x) || 100,
      y: Number.isFinite(Number(obj.y)) ? Number(obj.y) : Number(obj.position?.y) || 100,
      width: Number.isFinite(Number(obj.width)) ? Number(obj.width) : Number(obj.size?.width) || 260,
      height: Number.isFinite(Number(obj.height)) ? Number(obj.height) : Number(obj.size?.height) || 210,
      color: obj.color || 'yellow',
      zIndex: Number.isFinite(Number(obj.zIndex)) ? Number(obj.zIndex) : 1,
      rotation: Number.isFinite(Number(obj.rotation)) ? Number(obj.rotation) : 0,
      groupId: obj.groupId || null,
      frameId: obj.frameId || null,
      createdAt: obj.createdAt || nowISO(),
      modifiedAt: obj.modifiedAt || obj.createdAt || nowISO()
    };
    if (base.objectType === 'blank-note') {
      return {
        ...base,
        title: String(obj.title || ''),
        content: String(obj.content || ''),
        tag: String(obj.tag || ''),
        checklist: Boolean(obj.checklist),
        checkedItems: Array.isArray(obj.checkedItems) ? obj.checkedItems.map(Boolean) : []
      };
    }
    if (base.objectType === 'template-note') {
      const fields = {};
      for (const field of KANBAN_SCHEMA.fields) {
        const supplied = obj.fields?.[field.key];
        fields[field.key] = supplied === undefined ? deepClone(field.defaultValue) : supplied;
      }
      return {
        ...base,
        templateId: obj.templateId || 'kanban',
        templateVersion: KANBAN_SCHEMA.templateVersion,
        displayMode: obj.displayMode === 'compact' ? 'compact' : 'expanded',
        fields
      };
    }
    if (base.objectType === 'text') {
      return { ...base, text: String(obj.text || 'Text'), fontSize: clamp(Number(obj.fontSize) || 24, 12, 96), align: obj.align || 'left', textColor: obj.textColor || '' };
    }
    if (base.objectType === 'sticker') {
      const sticker = stickerDefinition(obj.stickerId);
      const suppliedWidth = Number.isFinite(Number(obj.width)) ? Number(obj.width) : Number.isFinite(Number(obj.size?.width)) ? Number(obj.size.width) : sticker.width;
      const suppliedHeight = Number.isFinite(Number(obj.height)) ? Number(obj.height) : Number.isFinite(Number(obj.size?.height)) ? Number(obj.size.height) : sticker.height;
      return { ...base, width: clamp(suppliedWidth, 44, 900), height: clamp(suppliedHeight, 44, 900), stickerId: sticker.id };
    }
    if (base.objectType === 'frame') {
      return { ...base, title: String(obj.title || 'Frame'), description: String(obj.description || ''), color: FRAME_COLORS.includes(obj.color) ? obj.color : 'neutral', collapsed: Boolean(obj.collapsed) };
    }
    if (base.objectType === 'drawing') {
      const points = Array.isArray(obj.points) ? obj.points.filter(p => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))).map(p => ({ x: Number(p.x), y: Number(p.y) })) : [];
      return { ...base, points, stroke: obj.stroke || '#4c555a', strokeWidth: clamp(Number(obj.strokeWidth) || 3, 1, 16) };
    }
    return base;
  }

  function normalizeConnector(connector) {
    if (!connector || typeof connector !== 'object') return null;
    return {
      id: connector.id || uuid('connector'),
      objectType: 'connector',
      fromId: connector.fromId || '',
      toId: connector.toId || '',
      style: connector.style === 'straight' ? 'straight' : 'curved',
      arrow: connector.arrow !== false,
      stroke: connector.stroke || '#4c555a',
      strokeWidth: clamp(Number(connector.strokeWidth) || 2, 1, 10),
      dash: connector.dash || 'solid',
      label: String(connector.label || ''),
      zIndex: Number(connector.zIndex) || 1,
      createdAt: connector.createdAt || nowISO(),
      modifiedAt: connector.modifiedAt || connector.createdAt || nowISO()
    };
  }

  function normalizeBoard(board, index = 0) {
    const fallback = makeDefaultBoard(`Board ${index + 1}`);
    const normalized = {
      id: board?.id || fallback.id,
      name: String(board?.name || fallback.name),
      description: String(board?.description || ''),
      createdAt: board?.createdAt || fallback.createdAt,
      modifiedAt: board?.modifiedAt || board?.createdAt || fallback.modifiedAt,
      background: ['blank', 'dots', 'grid', 'ruled'].includes(board?.background) ? board.background : 'dots',
      viewport: {
        x: Number.isFinite(Number(board?.viewport?.x)) ? Number(board.viewport.x) : 100,
        y: Number.isFinite(Number(board?.viewport?.y)) ? Number(board.viewport.y) : 90,
        zoom: clamp(Number(board?.viewport?.zoom) || 1, .12, 4)
      },
      objects: Array.isArray(board?.objects) ? board.objects.map(normalizeObject).filter(Boolean) : [],
      connectors: Array.isArray(board?.connectors) ? board.connectors.map(normalizeConnector).filter(Boolean) : []
    };
    const ids = new Set(normalized.objects.map(o => o.id));
    normalized.connectors = normalized.connectors.filter(c => ids.has(c.fromId) && ids.has(c.toId));
    return normalized;
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object') return makeDefaultState();
    const defaults = makeDefaultState();
    const boards = Array.isArray(raw.boards) ? raw.boards.map(normalizeBoard).filter(Boolean) : [];
    if (!boards.length) boards.push(makeDefaultBoard('My First Board'));
    const settings = { ...defaults.settings, ...(raw.settings || {}) };
    if (!['light', 'dark', 'system'].includes(settings.theme)) settings.theme = 'system';
    if (!NOTE_COLORS.includes(settings.defaultBlankColor)) settings.defaultBlankColor = 'yellow';
    if (!NOTE_COLORS.includes(settings.defaultStructuredColor)) settings.defaultStructuredColor = 'yellow';
    if (!['blank', 'kanban'].includes(settings.defaultStickyType)) settings.defaultStickyType = 'blank';
    if (!STICKER_IDS.includes(settings.defaultStickerId)) settings.defaultStickerId = 'check';
    const currentBoardId = boards.some(b => b.id === raw.currentBoardId) ? raw.currentBoardId : boards[0].id;
    return {
      format: 'tackboard-backup',
      appVersion: APP_VERSION,
      schemaVersion: 2,
      currentBoardId,
      boards,
      settings
    };
  }

  function currentBoard() {
    let board = state.boards.find(item => item.id === state.currentBoardId);
    if (!board) {
      board = state.boards[0] || makeDefaultBoard();
      if (!state.boards.length) state.boards.push(board);
      state.currentBoardId = board.id;
    }
    return board;
  }

  function getObject(id) { return currentBoard().objects.find(obj => obj.id === id) || null; }
  function getConnector(id) { return currentBoard().connectors.find(connector => connector.id === id) || null; }
  function getSelectable(id) { return getObject(id) || getConnector(id); }
  function maxZ() { return currentBoard().objects.reduce((max, obj) => Math.max(max, Number(obj.zIndex) || 0), 0); }
  function minZ() { return currentBoard().objects.reduce((min, obj) => Math.min(min, Number(obj.zIndex) || 0), 0); }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB failed to open'));
    });
  }

  function idbGet(key) {
    return new Promise((resolve, reject) => {
      const tx = ui.db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
    });
  }

  function idbSet(key, value) {
    return new Promise((resolve, reject) => {
      const tx = ui.db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB write aborted'));
    });
  }

  async function loadPersistedState() {
    try {
      ui.db = await openDatabase();
      const stored = await idbGet(STATE_KEY);
      if (stored) state = normalizeState(stored);
      return;
    } catch (error) {
      console.warn('TACKBOARD: IndexedDB unavailable; using localStorage fallback.', error);
      ui.usingLocalStorageFallback = true;
    }
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) state = normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn('TACKBOARD: Could not restore local data.', error);
      toast('Stored data could not be read. A new local workspace was opened.', 'error', 5200);
    }
  }

  async function persistState() {
    const snapshot = deepClone(state);
    snapshot.appVersion = APP_VERSION;
    if (ui.usingLocalStorageFallback) {
      localStorage.setItem(STATE_KEY, JSON.stringify(snapshot));
    } else {
      await idbSet(STATE_KEY, snapshot);
    }
  }

  function setSaveStatus(kind, text) {
    els.saveStatus.dataset.state = kind;
    els.saveStatusText.textContent = text;
  }

  function scheduleSave({ immediate = false } = {}) {
    setSaveStatus('unsaved', 'Unsaved');
    ui.pendingSave = true;
    clearTimeout(ui.saveTimer);
    if (immediate) return saveNow();
    ui.saveTimer = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
  }

  async function saveNow() {
    clearTimeout(ui.saveTimer);
    if (ui.saveInFlight) {
      ui.pendingSave = true;
      return;
    }
    ui.saveInFlight = true;
    ui.pendingSave = false;
    setSaveStatus('saving', 'Saving');
    try {
      await persistState();
      setSaveStatus('saved', 'Saved');
    } catch (error) {
      console.error('TACKBOARD save error', error);
      setSaveStatus('error', 'Save Error');
      toast('TACKBOARD could not save locally. Export a backup before closing this tab.', 'error', 6500);
    } finally {
      ui.saveInFlight = false;
      if (ui.pendingSave) scheduleSave({ immediate: true });
    }
  }

  function touchBoard() {
    currentBoard().modifiedAt = nowISO();
    scheduleSave();
  }

  function resetHistory() {
    ui.history.undo = [];
    ui.history.redo = [];
    updateHistoryButtons();
  }

  function pushHistory(label = 'Change') {
    const snapshot = deepClone(currentBoard());
    ui.history.undo.push({ label, board: snapshot });
    if (ui.history.undo.length > 80) ui.history.undo.shift();
    ui.history.redo = [];
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    els.undoButton.disabled = ui.history.undo.length === 0;
    els.redoButton.disabled = ui.history.redo.length === 0;
    els.undoButton.title = ui.history.undo.length ? `Undo ${ui.history.undo.at(-1).label} (Ctrl/Cmd+Z)` : 'Undo (Ctrl/Cmd+Z)';
    els.redoButton.title = ui.history.redo.length ? `Redo ${ui.history.redo.at(-1).label} (Ctrl/Cmd+Shift+Z)` : 'Redo (Ctrl/Cmd+Shift+Z)';
  }

  function replaceCurrentBoard(board) {
    const index = state.boards.findIndex(item => item.id === state.currentBoardId);
    if (index >= 0) state.boards[index] = normalizeBoard(board, index);
    else state.boards.push(normalizeBoard(board, state.boards.length));
  }

  function undo() {
    if (!ui.history.undo.length) return;
    const entry = ui.history.undo.pop();
    ui.history.redo.push({ label: entry.label, board: deepClone(currentBoard()) });
    replaceCurrentBoard(entry.board);
    ui.selection.clear();
    ui.editingId = null;
    renderAll();
    touchBoard();
    updateHistoryButtons();
  }

  function redo() {
    if (!ui.history.redo.length) return;
    const entry = ui.history.redo.pop();
    ui.history.undo.push({ label: entry.label, board: deepClone(currentBoard()) });
    replaceCurrentBoard(entry.board);
    ui.selection.clear();
    ui.editingId = null;
    renderAll();
    touchBoard();
    updateHistoryButtons();
  }

  function slightRotation() {
    if (!state.settings.noteRotation) return 0;
    return round((Math.random() - .5) * 1.4, 2);
  }

  function defaultPlacement(width, height, point = null) {
    const board = currentBoard();
    const center = point || screenToWorld(
      els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2,
      els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2
    );
    const offset = (board.objects.length % 7) * 12;
    return {
      x: clamp(center.x - width / 2 + offset, 20, WORLD.width - width - 20),
      y: clamp(center.y - height / 2 + offset, 20, WORLD.height - height - 20)
    };
  }

  function createBlankNote(point = null, overrides = {}) {
    const width = Number(overrides.width) || 270;
    const height = Number(overrides.height) || 220;
    const pos = defaultPlacement(width, height, point);
    return normalizeObject({
      id: uuid('note'),
      objectType: 'blank-note',
      x: pos.x,
      y: pos.y,
      width,
      height,
      color: overrides.color || state.settings.defaultBlankColor,
      zIndex: maxZ() + 1,
      rotation: slightRotation(),
      title: overrides.title || '',
      content: overrides.content || '',
      tag: overrides.tag || '',
      checklist: Boolean(overrides.checklist),
      checkedItems: overrides.checkedItems || []
    });
  }

  function createKanbanNote(point = null, overrides = {}) {
    const mode = overrides.displayMode === 'compact' ? 'compact' : 'expanded';
    const dimensions = mode === 'compact' ? KANBAN_SCHEMA.compactDimensions : KANBAN_SCHEMA.defaultDimensions;
    const width = Number(overrides.width) || dimensions.width;
    const height = Number(overrides.height) || dimensions.height;
    const pos = defaultPlacement(width, height, point);
    const fields = {};
    for (const field of KANBAN_SCHEMA.fields) fields[field.key] = deepClone(field.defaultValue);
    Object.assign(fields, overrides.fields || {});
    return normalizeObject({
      id: uuid('kanban'),
      objectType: 'template-note',
      templateId: 'kanban',
      templateVersion: KANBAN_SCHEMA.templateVersion,
      x: pos.x,
      y: pos.y,
      width,
      height,
      color: overrides.color || state.settings.defaultStructuredColor,
      zIndex: maxZ() + 1,
      rotation: slightRotation(),
      displayMode: mode,
      fields
    });
  }

  function createTextObject(point = null, overrides = {}) {
    const width = Number(overrides.width) || 240;
    const height = Number(overrides.height) || 70;
    const pos = defaultPlacement(width, height, point);
    return normalizeObject({
      id: uuid('text'),
      objectType: 'text',
      x: pos.x,
      y: pos.y,
      width,
      height,
      zIndex: maxZ() + 1,
      rotation: 0,
      text: overrides.text || 'Text label',
      fontSize: overrides.fontSize || 24,
      align: overrides.align || 'left',
      textColor: overrides.textColor || ''
    });
  }

  function createSticker(point = null, overrides = {}) {
    const sticker = stickerDefinition(overrides.stickerId || state.settings.defaultStickerId);
    const width = Number(overrides.width) || sticker.width;
    const height = Number(overrides.height) || sticker.height;
    const pos = defaultPlacement(width, height, point);
    return normalizeObject({
      id: uuid('sticker'),
      objectType: 'sticker',
      stickerId: sticker.id,
      x: pos.x,
      y: pos.y,
      width,
      height,
      zIndex: maxZ() + 1,
      rotation: Number(overrides.rotation) || 0
    });
  }

  function createFrame(point = null, overrides = {}) {
    const width = Number(overrides.width) || 520;
    const height = Number(overrides.height) || 360;
    const pos = defaultPlacement(width, height, point);
    return normalizeObject({
      id: uuid('frame'),
      objectType: 'frame',
      x: pos.x,
      y: pos.y,
      width,
      height,
      zIndex: minZ() - 1,
      rotation: 0,
      title: overrides.title || 'Frame',
      description: overrides.description || '',
      color: overrides.color || 'neutral'
    });
  }

  function addObject(object, { edit = false, select = true, historyLabel = 'Create object' } = {}) {
    pushHistory(historyLabel);
    currentBoard().objects.push(object);
    if (select) {
      ui.selection.clear();
      ui.selection.add(object.id);
    }
    ui.editingId = edit ? object.id : null;
    touchBoard();
    renderAll();
    if (edit) focusEditor(object.id);
    return object;
  }

  function addBlankNote(point, { edit = true, ...overrides } = {}) {
    state.settings.defaultStickyType = 'blank';
    return addObject(createBlankNote(point, overrides), { edit, historyLabel: 'Create blank note' });
  }

  function addKanbanNote(point, { edit = true, ...overrides } = {}) {
    state.settings.defaultStickyType = 'kanban';
    return addObject(createKanbanNote(point, overrides), { edit, historyLabel: 'Create Kanban note' });
  }

  function addText(point, { edit = true, ...overrides } = {}) {
    return addObject(createTextObject(point, overrides), { edit, historyLabel: 'Create text label' });
  }

  function addSticker(point, overrides = {}) {
    const sticker = stickerDefinition(overrides.stickerId || state.settings.defaultStickerId);
    state.settings.defaultStickerId = sticker.id;
    return addObject(createSticker(point, { ...overrides, stickerId: sticker.id }), { edit: false, historyLabel: 'Add sticker' });
  }

  function addFrame(point, overrides = {}) {
    return addObject(createFrame(point, overrides), { edit: false, historyLabel: 'Create frame' });
  }

  function objectStyle(obj) {
    const z = obj.objectType === 'frame' ? 10 + (Number(obj.zIndex) || 0) : 200 + (Number(obj.zIndex) || 0);
    const rotation = obj.objectType === 'frame' || obj.objectType === 'text' ? 0 : Number(obj.rotation) || 0;
    return `left:${round(obj.x)}px;top:${round(obj.y)}px;width:${round(obj.width)}px;height:${round(obj.height)}px;z-index:${z};transform:rotate(${rotation}deg);`;
  }

  function selectionDecorations(obj) {
    if (!ui.selection.has(obj.id) || ui.editingId === obj.id || obj.objectType === 'drawing') return '';
    const canResize = ['blank-note', 'template-note', 'text', 'sticker', 'frame'].includes(obj.objectType);
    const canConnect = ['blank-note', 'template-note', 'text', 'sticker', 'frame'].includes(obj.objectType);
    return `${canResize ? '<span class="resize-handle e" data-resize="e" aria-hidden="true"></span><span class="resize-handle s" data-resize="s" aria-hidden="true"></span><span class="resize-handle se" data-resize="se" aria-hidden="true"></span>' : ''}${canConnect ? '<span class="connector-handle" data-connector-handle="true" title="Drag to connect" aria-hidden="true"></span>' : ''}`;
  }

  function noteViewClasses(obj) {
    const classes = ['board-object'];
    if (obj.objectType === 'blank-note' || obj.objectType === 'template-note') classes.push('sticky-note', `note-${obj.color || 'yellow'}`);
    if (obj.objectType === 'template-note') classes.push('kanban-note');
    if (obj.objectType === 'text') classes.push('text-object');
    if (obj.objectType === 'sticker') classes.push('sticker-object');
    if (obj.objectType === 'frame') classes.push('frame-object', `frame-${obj.color || 'neutral'}`);
    if (ui.selection.has(obj.id)) classes.push('selected');
    if (ui.connectorSourceId === obj.id) classes.push('connector-source');
    if (ui.editingId === obj.id) classes.push('editing');
    const matchState = matchStateForId(obj.id);
    if (matchState === 'matched') classes.push('matched');
    if (matchState === 'dimmed') classes.push('dimmed');
    return classes.join(' ');
  }

  function renderBlankNote(obj) {
    const editing = ui.editingId === obj.id;
    const headerTitle = obj.title.trim() || 'Blank Note';
    let body = '';
    if (editing) {
      body = `
        <div class="note-edit-grid" data-editor-root>
          <input data-blank-field="title" aria-label="Note title" placeholder="Optional title" value="${escapeAttr(obj.title)}">
          <input data-blank-field="tag" aria-label="Note tag" placeholder="Optional tag" value="${escapeAttr(obj.tag)}">
          <textarea data-blank-field="content" aria-label="Note content" placeholder="Write a note…">${escapeHTML(obj.content)}</textarea>
        </div>`;
    } else if (obj.checklist) {
      const lines = obj.content.split(/\r?\n/).filter((line, index, array) => line.trim() || array.length === 1);
      body = `<div class="blank-note-body" data-edit-trigger="true">
        ${obj.title ? `<h3 class="blank-note-title">${escapeHTML(obj.title)}</h3>` : ''}
        <div class="checklist">${lines.length && lines.some(line => line.trim()) ? lines.map((line, index) => `
          <label class="check-row ${obj.checkedItems[index] ? 'done' : ''}">
            <input type="checkbox" data-check-index="${index}" ${obj.checkedItems[index] ? 'checked' : ''} aria-label="Mark checklist item complete">
            <span>${escapeHTML(line || 'Untitled item')}</span>
          </label>`).join('') : '<span class="blank-note-placeholder">Double-click to add checklist items…</span>'}</div>
      </div>`;
    } else {
      body = `<div class="blank-note-body" data-edit-trigger="true">
        ${obj.title ? `<h3 class="blank-note-title">${escapeHTML(obj.title)}</h3>` : ''}
        <div class="blank-note-content ${obj.content ? '' : 'blank-note-placeholder'}">${obj.content ? nl2br(obj.content) : 'Double-click to write…'}</div>
      </div>`;
    }
    return `<article class="${noteViewClasses(obj)}" data-object-id="${obj.id}" data-object-type="blank-note" style="${objectStyle(obj)}" tabindex="0" aria-label="Blank sticky note${obj.title ? `: ${escapeAttr(obj.title)}` : ''}">
      <header class="object-header" data-drag-handle="true">
        <span class="drag-dots" aria-hidden="true">⠿</span>
        <span class="object-heading">${escapeHTML(headerTitle)}</span>
        ${obj.tag ? `<span class="note-tag">${escapeHTML(obj.tag)}</span>` : ''}
      </header>
      ${body}
      ${selectionDecorations(obj)}
    </article>`;
  }

  function kanbanFieldInput(field, value, obj) {
    const id = `${obj.id}-${field.key}`;
    if (field.type === 'dropdown') {
      return `<div class="field-control"><label for="${id}">${escapeHTML(field.label)}</label><select id="${id}" data-kanban-field="${field.key}">${field.options.map(option => `<option value="${escapeAttr(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHTML(field.optionLabels?.[option] ?? option)}</option>`).join('')}</select></div>`;
    }
    if (field.type === 'multiline') {
      return `<div class="field-control"><label for="${id}">${escapeHTML(field.label)}</label><textarea id="${id}" data-kanban-field="${field.key}" placeholder="${escapeAttr(field.placeholder || '')}">${escapeHTML(value)}</textarea></div>`;
    }
    if (field.type === 'checkbox') {
      return `<div class="checkbox-control"><label for="${id}"><input id="${id}" type="checkbox" data-kanban-field="${field.key}" ${value ? 'checked' : ''}><span>${escapeHTML(field.label)}</span></label></div>`;
    }
    return `<div class="field-control"><label for="${id}">${escapeHTML(field.label)}</label><input id="${id}" type="${field.type === 'date' ? 'date' : 'text'}" data-kanban-field="${field.key}" placeholder="${escapeAttr(field.placeholder || '')}" value="${escapeAttr(value)}"></div>`;
  }

  function kanbanDisplayValue(field, value) {
    if (field.type === 'checkbox') return value ? 'Yes' : 'No';
    if (field.type === 'date') return value ? formatDate(value) : '';
    return String(value ?? '');
  }

  function renderKanbanNote(obj) {
    const editing = ui.editingId === obj.id;
    const f = obj.fields;
    const title = String(f.ticketNumber || '').trim() || 'Untitled Ticket';
    const compact = obj.displayMode === 'compact';
    const dueClass = f.needByDate && dateOnly(f.needByDate) < new Date(new Date().setHours(0,0,0,0)) ? 'due-overdue' : '';
    let body;
    if (editing) {
      body = `<div class="kanban-body"><div class="kanban-edit" data-editor-root>${KANBAN_SCHEMA.fields.map(field => kanbanFieldInput(field, f[field.key], obj)).join('')}</div></div>`;
    } else {
      const fields = compact ? KANBAN_SCHEMA.fields.filter(field => KANBAN_SCHEMA.compactViewFields.includes(field.key) && !['ticketNumber', 'ticketType', 'status'].includes(field.key)) : KANBAN_SCHEMA.fields;
      body = `<div class="kanban-body" data-edit-trigger="true"><div class="kanban-view">${fields.map(field => {
        if (compact && field.key === 'description') return '';
        const display = kanbanDisplayValue(field, f[field.key]);
        return `<div class="kanban-field"><span class="kanban-label">${escapeHTML(field.label)}</span><div class="kanban-value ${display ? '' : 'empty'} ${field.key === 'description' ? 'description-clamp' : ''}">${display ? nl2br(display) : '—'}</div></div>`;
      }).join('')}</div></div>`;
    }
    return `<article class="${noteViewClasses(obj)}" data-object-id="${obj.id}" data-object-type="template-note" style="${objectStyle(obj)}" tabindex="0" aria-label="Kanban note: ${escapeAttr(title)}">
      <header class="object-header kanban-header" data-drag-handle="true">
        <span class="drag-dots" aria-hidden="true">⠿</span>
        <div class="kanban-head-copy">
          <div class="kanban-title-row"><span class="kanban-title">${escapeHTML(title)}</span><span class="template-chip">Kanban</span></div>
          <div class="kanban-badges">
            <span class="badge">${escapeHTML(f.ticketType || 'Story')}</span>
            <span class="badge ${statusClass(f.status)}">${escapeHTML(f.status || 'Backlog')}</span>
            ${f.onHold ? '<span class="badge on-hold flag-on-hold">On Hold</span>' : ''}
            ${f.needsVP ? '<span class="badge">Needs VP</span>' : ''}
            ${f.needByDate ? `<span class="badge ${dueClass}" title="${escapeAttr(formatDate(f.needByDate))}">${escapeHTML(formatRelativeDate(f.needByDate))}</span>` : ''}
          </div>
        </div>
        <button class="header-action" type="button" data-toggle-compact="true" title="${compact ? 'Expand note' : 'Collapse note'}" aria-label="${compact ? 'Expand Kanban note' : 'Collapse Kanban note'}">${compact ? '▾' : '▴'}</button>
      </header>
      ${body}
      ${selectionDecorations(obj)}
    </article>`;
  }

  function renderTextObject(obj) {
    const editing = ui.editingId === obj.id;
    const color = obj.textColor ? `color:${escapeAttr(obj.textColor)};` : '';
    return `<div class="${noteViewClasses(obj)}" data-object-id="${obj.id}" data-object-type="text" data-drag-handle="true" style="${objectStyle(obj)}font-size:${obj.fontSize}px;text-align:${escapeAttr(obj.align)};${color}" tabindex="0" aria-label="Text label">
      ${editing ? `<textarea data-text-field="text" data-editor-root aria-label="Text label content">${escapeHTML(obj.text)}</textarea>` : `<div data-edit-trigger="true">${obj.text ? nl2br(obj.text) : '<span class="blank-note-placeholder">Text label</span>'}</div>`}
      ${selectionDecorations(obj)}
    </div>`;
  }

  function renderSticker(obj) {
    const sticker = stickerDefinition(obj.stickerId);
    return `<div class="${noteViewClasses(obj)}" data-object-id="${obj.id}" data-object-type="sticker" data-drag-handle="true" style="${objectStyle(obj)}" tabindex="0" title="${escapeAttr(sticker.label)}" aria-label="${escapeAttr(sticker.label)} sticker">
      ${stickerSVG(sticker.id)}
      ${selectionDecorations(obj)}
    </div>`;
  }

  function renderFrame(obj) {
    return `<section class="${noteViewClasses(obj)}" data-object-id="${obj.id}" data-object-type="frame" style="${objectStyle(obj)}" tabindex="0" aria-label="Frame: ${escapeAttr(obj.title)}">
      <header class="frame-header" data-drag-handle="true">
        <span class="drag-dots" aria-hidden="true">⠿</span><span class="frame-title">${escapeHTML(obj.title || 'Frame')}</span>
      </header>
      ${obj.description ? `<div class="frame-description">${nl2br(obj.description)}</div>` : ''}
      ${selectionDecorations(obj)}
    </section>`;
  }

  function renderObjects() {
    const board = currentBoard();
    const sorted = [...board.objects].filter(obj => obj.objectType !== 'drawing').sort((a, b) => {
      if (a.objectType === 'frame' && b.objectType !== 'frame') return -1;
      if (a.objectType !== 'frame' && b.objectType === 'frame') return 1;
      return (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0);
    });
    els.objectLayer.innerHTML = sorted.map(obj => {
      if (obj.objectType === 'blank-note') return renderBlankNote(obj);
      if (obj.objectType === 'template-note') return renderKanbanNote(obj);
      if (obj.objectType === 'text') return renderTextObject(obj);
      if (obj.objectType === 'sticker') return renderSticker(obj);
      if (obj.objectType === 'frame') return renderFrame(obj);
      return '';
    }).join('');
  }

  function objectRect(obj) {
    return { x: obj.x, y: obj.y, width: obj.width, height: obj.height, right: obj.x + obj.width, bottom: obj.y + obj.height, cx: obj.x + obj.width / 2, cy: obj.y + obj.height / 2 };
  }

  function edgePoint(rect, toward) {
    const dx = toward.x - rect.cx;
    const dy = toward.y - rect.cy;
    if (dx === 0 && dy === 0) return { x: rect.cx, y: rect.cy };
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH);
    return { x: rect.cx + dx * scale, y: rect.cy + dy * scale };
  }

  function connectorGeometry(connector) {
    const from = getObject(connector.fromId);
    const to = getObject(connector.toId);
    if (!from || !to) return null;
    const aRect = objectRect(from);
    const bRect = objectRect(to);
    const a = edgePoint(aRect, { x: bRect.cx, y: bRect.cy });
    const b = edgePoint(bRect, { x: aRect.cx, y: aRect.cy });
    if (connector.style === 'straight') return { a, b, d: `M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}` };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    const curve = Math.min(90, Math.max(24, distance * .16));
    const nx = distance ? -dy / distance : 0;
    const ny = distance ? dx / distance : 0;
    const mx = (a.x + b.x) / 2 + nx * curve;
    const my = (a.y + b.y) / 2 + ny * curve;
    return { a, b, c: { x: mx, y: my }, d: `M ${round(a.x)} ${round(a.y)} Q ${round(mx)} ${round(my)} ${round(b.x)} ${round(b.y)}` };
  }

  function pointsToPath(points) {
    if (!points?.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} l .01 .01`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const mx = (current.x + next.x) / 2;
      const my = (current.y + next.y) / 2;
      d += ` Q ${round(current.x)} ${round(current.y)} ${round(mx)} ${round(my)}`;
    }
    const last = points.at(-1);
    d += ` L ${round(last.x)} ${round(last.y)}`;
    return d;
  }

  function connectorLabelPosition(geometry) {
    if (!geometry) return { x: 0, y: 0 };
    if (!geometry.c) return { x: (geometry.a.x + geometry.b.x) / 2, y: (geometry.a.y + geometry.b.y) / 2 };
    const t = .5;
    const x = (1 - t) ** 2 * geometry.a.x + 2 * (1 - t) * t * geometry.c.x + t ** 2 * geometry.b.x;
    const y = (1 - t) ** 2 * geometry.a.y + 2 * (1 - t) * t * geometry.c.y + t ** 2 * geometry.b.y;
    return { x, y };
  }

  function renderVectors() {
    const board = currentBoard();
    els.connectorGroup.innerHTML = board.connectors.map(connector => {
      const geo = connectorGeometry(connector);
      if (!geo) return '';
      const selected = ui.selection.has(connector.id) ? 'selected' : '';
      const stateClass = matchStateForId(connector.id);
      const dash = connector.dash === 'dashed' ? 'stroke-dasharray="9 7"' : connector.dash === 'dotted' ? 'stroke-dasharray="2 7"' : '';
      const marker = connector.arrow ? 'marker-end="url(#arrow-default)"' : '';
      const labelPos = connectorLabelPosition(geo);
      return `<g data-connector-id="${connector.id}" class="${stateClass}">
        <path class="connector-path ${selected}" data-connector-id="${connector.id}" d="${geo.d}" stroke="${escapeAttr(connector.stroke)}" stroke-width="${connector.strokeWidth}" style="--stroke-width:${connector.strokeWidth}px" ${dash} ${marker}></path>
        ${connector.label ? `<text x="${round(labelPos.x)}" y="${round(labelPos.y - 7)}" text-anchor="middle" font-family="${escapeAttr(getComputedStyle(document.body).fontFamily)}" font-size="12" font-weight="700" fill="${effectiveTheme() === 'dark' ? '#e8ecee' : '#333a3e'}" paint-order="stroke" stroke="${effectiveTheme() === 'dark' ? '#252a2e' : '#f4f1e9'}" stroke-width="5" stroke-linejoin="round" pointer-events="none">${escapeHTML(connector.label)}</text>` : ''}
      </g>`;
    }).join('');

    els.drawingGroup.innerHTML = board.objects.filter(obj => obj.objectType === 'drawing').map(drawing => {
      const selected = ui.selection.has(drawing.id) ? 'selected' : '';
      const stateClass = matchStateForId(drawing.id);
      return `<path class="drawing-path ${selected} ${stateClass}" data-drawing-id="${drawing.id}" d="${pointsToPath(drawing.points)}" fill="none" stroke="${escapeAttr(drawing.stroke)}" stroke-width="${drawing.strokeWidth}" style="--stroke-width:${drawing.strokeWidth}px" stroke-linecap="round" stroke-linejoin="round"></path>`;
    }).join('');
  }

  function hasActiveFilters() {
    return Object.values(ui.filters).some(value => String(value || '') !== '');
  }

  function objectSearchText(obj) {
    if (!obj) return '';
    if (obj.objectType === 'blank-note') return [obj.title, obj.content, obj.tag].join(' ');
    if (obj.objectType === 'template-note') {
      const parts = KANBAN_SCHEMA.fields.map(field => {
        if (field.key === 'onHold') return obj.fields.onHold ? 'On Hold Hold Yes' : 'No';
        if (field.key === 'needsVP') return obj.fields.needsVP ? 'VP Needs VP Yes' : 'No';
        return obj.fields[field.key];
      });
      return parts.join(' ');
    }
    if (obj.objectType === 'text') return obj.text;
    if (obj.objectType === 'sticker') { const sticker = stickerDefinition(obj.stickerId); return `${sticker.label} ${sticker.id.replaceAll('-', ' ')}`; }
    if (obj.objectType === 'frame') return `${obj.title} ${obj.description}`;
    return '';
  }

  function matchesDueFilter(note, dueFilter) {
    if (!dueFilter) return true;
    const value = note.fields.needByDate;
    const due = dateOnly(value);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    if (dueFilter === 'none') return !due;
    if (!due) return false;
    if (dueFilter === 'overdue') return due < today;
    if (dueFilter === 'today') return due.getTime() === today.getTime();
    if (dueFilter === 'week') {
      const end = new Date(today); end.setDate(end.getDate() + (7 - end.getDay()));
      return due >= today && due <= end;
    }
    if (dueFilter === 'month') return due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth();
    if (dueFilter === 'custom') {
      const from = dateOnly(ui.filters.from);
      const to = dateOnly(ui.filters.to);
      if (from && due < from) return false;
      if (to && due > to) return false;
      return Boolean(from || to);
    }
    return true;
  }

  function objectMatchesFilters(obj) {
    if (!hasActiveFilters()) return true;
    if (ui.filters.template && ui.filters.template !== obj.objectType) return false;
    if (obj.objectType !== 'template-note') {
      return !ui.filters.ticketType && !ui.filters.team && !ui.filters.status && !ui.filters.onHold && !ui.filters.needsVP && !ui.filters.due && !ui.filters.from && !ui.filters.to;
    }
    const fields = obj.fields;
    if (ui.filters.ticketType && fields.ticketType !== ui.filters.ticketType) return false;
    if (ui.filters.team && fields.team !== ui.filters.team) return false;
    if (ui.filters.status && fields.status !== ui.filters.status) return false;
    if (ui.filters.onHold === 'yes' && !fields.onHold) return false;
    if (ui.filters.onHold === 'no' && fields.onHold) return false;
    if (ui.filters.needsVP === 'yes' && !fields.needsVP) return false;
    if (ui.filters.needsVP === 'no' && fields.needsVP) return false;
    if (!matchesDueFilter(obj, ui.filters.due)) return false;
    return true;
  }

  function objectMatchesSearch(obj) {
    const query = ui.searchQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return objectSearchText(obj).toLocaleLowerCase().includes(query);
  }

  function connectorMatchesSearch(connector) {
    const query = ui.searchQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return String(connector.label || '').toLocaleLowerCase().includes(query);
  }

  function matchStateForId(id) {
    const queryActive = Boolean(ui.searchQuery.trim());
    const filterActive = hasActiveFilters();
    if (!queryActive && !filterActive) return '';
    const obj = getObject(id);
    if (obj) {
      const matches = objectMatchesSearch(obj) && objectMatchesFilters(obj);
      return matches ? 'matched' : 'dimmed';
    }
    const connector = getConnector(id);
    if (connector) {
      const matches = connectorMatchesSearch(connector) && !filterActive;
      return matches ? 'matched' : 'dimmed';
    }
    return 'dimmed';
  }

  function updateSearchResults({ preserveIndex = false } = {}) {
    const queryActive = Boolean(ui.searchQuery.trim());
    const filterActive = hasActiveFilters();
    const results = [];
    if (queryActive || filterActive) {
      for (const obj of currentBoard().objects) {
        if (objectMatchesSearch(obj) && objectMatchesFilters(obj)) results.push(obj.id);
      }
      if (queryActive && !filterActive) {
        for (const connector of currentBoard().connectors) {
          if (connectorMatchesSearch(connector)) results.push(connector.id);
        }
      }
    }
    const previousId = preserveIndex ? ui.searchResults[ui.searchIndex] : null;
    ui.searchResults = results;
    ui.searchIndex = previousId ? results.indexOf(previousId) : (results.length ? clamp(ui.searchIndex, 0, results.length - 1) : -1);
    if (ui.searchIndex < 0 && results.length) ui.searchIndex = 0;
    const label = results.length === 1 ? '1 result' : `${results.length} results`;
    els.searchCount.textContent = label;
    els.filterButton.classList.toggle('active', filterActive);
  }

  function navigateSearch(direction = 1) {
    updateSearchResults({ preserveIndex: true });
    if (!ui.searchResults.length) return;
    ui.searchIndex = (ui.searchIndex + direction + ui.searchResults.length) % ui.searchResults.length;
    const id = ui.searchResults[ui.searchIndex];
    centerOnId(id, true);
    ui.selection.clear();
    ui.selection.add(id);
    renderAll({ preserveEditor: true });
  }

  function applyTheme() {
    const theme = effectiveTheme();
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle('reduced-motion', Boolean(state.settings.reducedMotion));
    const themeColor = theme === 'dark' ? '#1f2327' : '#ece8df';
    $('meta[name="theme-color"]').setAttribute('content', themeColor);
  }

  function applyViewport() {
    const viewport = currentBoard().viewport;
    els.world.style.transform = `translate(${round(viewport.x)}px, ${round(viewport.y)}px) scale(${round(viewport.zoom, 4)})`;
    els.zoomReadout.textContent = `${Math.round(viewport.zoom * 100)}%`;
    els.world.className = `bg-${currentBoard().background || 'dots'}`;
    els.minimapWrap.classList.toggle('visible', Boolean(state.settings.minimap));
    els.minimapButton.classList.toggle('active', Boolean(state.settings.minimap));
  }

  function updateTopbar() {
    const board = currentBoard();
    els.currentBoardName.textContent = board.name;
    els.boardButton.title = `${board.name} — switch or manage boards`;
  }

  function renderAll({ preserveEditor = false } = {}) {
    if (!preserveEditor && ui.editingId && !getObject(ui.editingId)) ui.editingId = null;
    applyTheme();
    updateTopbar();
    updateSearchResults({ preserveIndex: true });
    renderObjects();
    renderVectors();
    applyViewport();
    updateEmptyState();
    updateToolUI();
    updateContextToolbar();
    updateHistoryButtons();
    drawMinimap();
  }

  function updateEmptyState() {
    const hasContent = currentBoard().objects.length > 0 || currentBoard().connectors.length > 0;
    els.emptyState.classList.toggle('hidden', hasContent);
  }

  function updateToolUI() {
    els.viewport.dataset.tool = ui.tool;
    $$('.tool-button[data-tool]', els.toolDock).forEach(button => {
      const active = button.dataset.tool === ui.tool;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function screenToWorld(clientX, clientY) {
    const rect = els.viewport.getBoundingClientRect();
    const v = currentBoard().viewport;
    return {
      x: (clientX - rect.left - v.x) / v.zoom,
      y: (clientY - rect.top - v.y) / v.zoom
    };
  }

  function worldToScreen(x, y) {
    const rect = els.viewport.getBoundingClientRect();
    const v = currentBoard().viewport;
    return { x: rect.left + v.x + x * v.zoom, y: rect.top + v.y + y * v.zoom };
  }

  function setViewport(next, { save = true } = {}) {
    const viewport = currentBoard().viewport;
    viewport.x = Number.isFinite(next.x) ? next.x : viewport.x;
    viewport.y = Number.isFinite(next.y) ? next.y : viewport.y;
    viewport.zoom = clamp(Number.isFinite(next.zoom) ? next.zoom : viewport.zoom, .12, 4);
    applyViewport();
    drawMinimap();
    updateContextToolbar();
    if (save) scheduleSave();
  }

  function zoomAt(clientX, clientY, targetZoom) {
    const boardViewport = currentBoard().viewport;
    const rect = els.viewport.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const wx = (sx - boardViewport.x) / boardViewport.zoom;
    const wy = (sy - boardViewport.y) / boardViewport.zoom;
    const zoom = clamp(targetZoom, .12, 4);
    setViewport({
      zoom,
      x: sx - wx * zoom,
      y: sy - wy * zoom
    });
  }

  function zoomBy(factor, clientX = null, clientY = null) {
    const rect = els.viewport.getBoundingClientRect();
    zoomAt(
      clientX ?? rect.left + rect.width / 2,
      clientY ?? rect.top + rect.height / 2,
      currentBoard().viewport.zoom * factor
    );
  }

  function resetView() {
    setViewport({ x: 100, y: 90, zoom: 1 });
  }

  function drawingBounds(drawing) {
    if (!drawing?.points?.length) return null;
    const xs = drawing.points.map(p => p.x);
    const ys = drawing.points.map(p => p.y);
    const pad = drawing.strokeWidth || 2;
    const x = Math.min(...xs) - pad;
    const y = Math.min(...ys) - pad;
    const right = Math.max(...xs) + pad;
    const bottom = Math.max(...ys) + pad;
    return { x, y, width: right - x, height: bottom - y, right, bottom, cx: (x + right) / 2, cy: (y + bottom) / 2 };
  }

  function getIdBounds(id) {
    const obj = getObject(id);
    if (obj) return obj.objectType === 'drawing' ? drawingBounds(obj) : objectRect(obj);
    const connector = getConnector(id);
    if (connector) {
      const geo = connectorGeometry(connector);
      if (!geo) return null;
      const xs = [geo.a.x, geo.b.x, geo.c?.x].filter(Number.isFinite);
      const ys = [geo.a.y, geo.b.y, geo.c?.y].filter(Number.isFinite);
      const x = Math.min(...xs), y = Math.min(...ys), right = Math.max(...xs), bottom = Math.max(...ys);
      return { x, y, right, bottom, width: right - x, height: bottom - y, cx: (x + right) / 2, cy: (y + bottom) / 2 };
    }
    return null;
  }

  function unionBounds(boundsList) {
    const valid = boundsList.filter(Boolean);
    if (!valid.length) return null;
    const x = Math.min(...valid.map(b => b.x));
    const y = Math.min(...valid.map(b => b.y));
    const right = Math.max(...valid.map(b => b.right ?? b.x + b.width));
    const bottom = Math.max(...valid.map(b => b.bottom ?? b.y + b.height));
    return { x, y, right, bottom, width: right - x, height: bottom - y, cx: (x + right) / 2, cy: (y + bottom) / 2 };
  }

  function contentBounds(ids = null) {
    const sourceIds = ids ? Array.from(ids) : [
      ...currentBoard().objects.map(obj => obj.id),
      ...currentBoard().connectors.map(connector => connector.id)
    ];
    return unionBounds(sourceIds.map(getIdBounds));
  }

  function fitContent(ids = null) {
    const bounds = contentBounds(ids);
    if (!bounds) return resetView();
    const margin = 90;
    const vw = els.viewport.clientWidth;
    const vh = els.viewport.clientHeight;
    const zoom = clamp(Math.min((vw - margin * 2) / Math.max(bounds.width, 1), (vh - margin * 2) / Math.max(bounds.height, 1)), .12, 2.4);
    setViewport({
      zoom,
      x: vw / 2 - bounds.cx * zoom,
      y: vh / 2 - bounds.cy * zoom
    });
  }

  function centerOnId(id, animate = false) {
    const bounds = getIdBounds(id);
    if (!bounds) return;
    const viewport = currentBoard().viewport;
    const x = els.viewport.clientWidth / 2 - bounds.cx * viewport.zoom;
    const y = els.viewport.clientHeight / 2 - bounds.cy * viewport.zoom;
    if (animate && !state.settings.reducedMotion) {
      const start = { x: viewport.x, y: viewport.y };
      const started = performance.now();
      const duration = 220;
      const tick = now => {
        const t = clamp((now - started) / duration, 0, 1);
        const eased = 1 - (1 - t) ** 3;
        setViewport({ x: start.x + (x - start.x) * eased, y: start.y + (y - start.y) * eased }, { save: false });
        if (t < 1) requestAnimationFrame(tick); else scheduleSave();
      };
      requestAnimationFrame(tick);
    } else setViewport({ x, y });
  }

  function drawMinimap() {
    if (!state.settings.minimap || !els.minimap.isConnected) return;
    const canvas = els.minimap;
    const ctx = canvas.getContext('2d');
    const scaleX = canvas.width / WORLD.width;
    const scaleY = canvas.height / WORLD.height;
    const dark = effectiveTheme() === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dark ? '#252a2e' : '#f4f1e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = dark ? 'rgba(238,242,244,.10)' : 'rgba(37,43,46,.10)';
    ctx.strokeRect(.5, .5, canvas.width - 1, canvas.height - 1);
    const palette = {
      yellow: dark ? '#a88e3c' : '#ead16f', blue: dark ? '#4a7181' : '#a8cfdf',
      green: dark ? '#507850' : '#acd0ab', coral: dark ? '#8f594d' : '#e9a793',
      lavender: dark ? '#685477' : '#cbb4de', cream: dark ? '#786b53' : '#e4d5b8',
      charcoal: '#41484d'
    };
    const ordered = [...currentBoard().objects].sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const obj of ordered) {
      if (obj.objectType === 'drawing') {
        if (obj.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x * scaleX, obj.points[0].y * scaleY);
        for (const point of obj.points.slice(1)) ctx.lineTo(point.x * scaleX, point.y * scaleY);
        ctx.strokeStyle = obj.stroke || '#4c555a';
        ctx.lineWidth = 1;
        ctx.stroke();
        continue;
      }
      if (obj.objectType === 'frame') {
        ctx.strokeStyle = dark ? 'rgba(120,174,177,.55)' : 'rgba(61,111,115,.55)';
        ctx.lineWidth = 1;
        ctx.strokeRect(obj.x * scaleX, obj.y * scaleY, Math.max(2, obj.width * scaleX), Math.max(2, obj.height * scaleY));
        continue;
      }
      if (obj.objectType === 'sticker') {
        ctx.fillStyle = stickerDefinition(obj.stickerId).accent;
        const size = Math.max(3, Math.min(Math.max(3, obj.width * scaleX), Math.max(3, obj.height * scaleY)));
        ctx.beginPath();
        ctx.arc((obj.x + obj.width / 2) * scaleX, (obj.y + obj.height / 2) * scaleY, Math.max(2, size / 2), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.fillStyle = obj.objectType === 'text' ? (dark ? '#dfe4e6' : '#4b5357') : (palette[obj.color] || palette.yellow);
      ctx.fillRect(obj.x * scaleX, obj.y * scaleY, Math.max(2, obj.width * scaleX), Math.max(2, obj.height * scaleY));
    }
    const v = currentBoard().viewport;
    const wx = -v.x / v.zoom;
    const wy = -v.y / v.zoom;
    const ww = els.viewport.clientWidth / v.zoom;
    const wh = els.viewport.clientHeight / v.zoom;
    ctx.strokeStyle = dark ? '#9ad0d2' : '#28585c';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx * scaleX, wy * scaleY, ww * scaleX, wh * scaleY);
  }

  function selectedIds() { return Array.from(ui.selection).filter(id => getSelectable(id)); }
  function selectedObjects() { return selectedIds().map(getObject).filter(Boolean); }
  function selectedConnectors() { return selectedIds().map(getConnector).filter(Boolean); }

  function finishEditing({ render = true } = {}) {
    if (!ui.editingId) return;
    ui.editingId = null;
    if (render) renderAll();
  }

  function enterEdit(id) {
    const obj = getObject(id);
    if (!obj || !['blank-note', 'template-note', 'text'].includes(obj.objectType)) return;
    if (ui.editingId === id) return;
    if (ui.editingId) finishEditing({ render: false });
    pushHistory(obj.objectType === 'template-note' ? 'Edit Kanban fields' : obj.objectType === 'text' ? 'Edit text' : 'Edit note');
    ui.selection.clear();
    ui.selection.add(id);
    ui.editingId = id;
    renderAll();
    focusEditor(id);
  }

  function focusEditor(id) {
    requestAnimationFrame(() => {
      const root = els.objectLayer.querySelector(`[data-object-id="${cssEscape(id)}"]`);
      if (!root) return;
      const target = root.querySelector('[data-editor-root] input, [data-editor-root] textarea, [data-editor-root] select, textarea[data-text-field]');
      target?.focus({ preventScroll: true });
      if (target?.select && target.matches('textarea[data-text-field]')) target.select();
    });
  }

  function selectionGroupIds(id) {
    const obj = getObject(id);
    if (!obj?.groupId) return [id];
    return currentBoard().objects.filter(item => item.groupId === obj.groupId).map(item => item.id);
  }

  function selectId(id, { additive = false, toggle = false, bypassGroup = false } = {}) {
    if (!getSelectable(id)) return;
    if (ui.editingId && ui.editingId !== id) finishEditing({ render: false });
    const ids = bypassGroup ? [id] : selectionGroupIds(id);
    if (!additive) ui.selection.clear();
    for (const itemId of ids) {
      if (toggle && ui.selection.has(itemId)) ui.selection.delete(itemId);
      else ui.selection.add(itemId);
    }
    renderAll({ preserveEditor: true });
  }

  function clearSelection({ render = true } = {}) {
    ui.selection.clear();
    ui.connectorSourceId = null;
    if (render) renderAll({ preserveEditor: true });
  }

  function selectionScreenBounds() {
    const rects = [];
    for (const id of selectedIds()) {
      const el = els.objectLayer.querySelector(`[data-object-id="${cssEscape(id)}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        rects.push({ x: r.left, y: r.top, right: r.right, bottom: r.bottom });
        continue;
      }
      const bounds = getIdBounds(id);
      if (!bounds) continue;
      const a = worldToScreen(bounds.x, bounds.y);
      const b = worldToScreen(bounds.right, bounds.bottom);
      rects.push({ x: a.x, y: a.y, right: b.x, bottom: b.y });
    }
    if (!rects.length) return null;
    return {
      x: Math.min(...rects.map(r => r.x)),
      y: Math.min(...rects.map(r => r.y)),
      right: Math.max(...rects.map(r => r.right)),
      bottom: Math.max(...rects.map(r => r.bottom))
    };
  }

  function updateContextToolbar() {
    const ids = selectedIds();
    if (!ids.length || ui.editingId || ui.action?.type === 'marquee') {
      els.contextToolbar.classList.remove('visible');
      els.contextToolbar.innerHTML = '';
      return;
    }
    const objects = selectedObjects();
    const connectors = selectedConnectors();
    const single = ids.length === 1 ? getSelectable(ids[0]) : null;
    let html = '';
    if (single?.objectType === 'template-note') {
      html += `<button type="button" data-action="edit">Edit Fields</button>`;
      html += `<button type="button" data-action="toggle-compact">${single.displayMode === 'compact' ? 'Expand' : 'Collapse'}</button>`;
    } else if (single && ['blank-note', 'text'].includes(single.objectType)) {
      html += `<button type="button" data-action="edit">Edit</button>`;
    } else if (single?.objectType === 'sticker') {
      html += `<button type="button" data-action="change-sticker">Change</button>`;
    } else if (single?.objectType === 'frame') {
      html += `<button type="button" data-action="rename-frame">Rename</button>`;
    } else if (single?.objectType === 'connector') {
      html += `<button type="button" data-action="edit-connector">Edit</button>`;
    }
    if (objects.length > 1) {
      html += `<button type="button" data-action="align-menu">Align</button>`;
      html += `<button type="button" data-action="group-menu">Group</button>`;
    }
    const hasColorable = connectors.length || objects.some(obj => ['blank-note', 'template-note', 'frame', 'drawing'].includes(obj.objectType));
    if (hasColorable) html += `<button type="button" data-action="color">Color</button>`;
    html += `<button type="button" data-action="duplicate">Duplicate</button>`;
    if (single && ['blank-note', 'template-note', 'text', 'sticker', 'frame'].includes(single.objectType)) html += `<button type="button" data-action="connect">Connect</button>`;
    html += `<button type="button" data-action="more">More</button>`;
    els.contextToolbar.innerHTML = html;
    els.contextToolbar.classList.add('visible');
    requestAnimationFrame(() => {
      const bounds = selectionScreenBounds();
      if (!bounds) return;
      const toolbarRect = els.contextToolbar.getBoundingClientRect();
      const left = clamp((bounds.x + bounds.right) / 2 - toolbarRect.width / 2, 8, innerWidth - toolbarRect.width - 8);
      let top = bounds.y - toolbarRect.height - 12;
      if (top < 66) top = Math.min(innerHeight - toolbarRect.height - 8, bounds.bottom + 12);
      els.contextToolbar.style.left = `${left}px`;
      els.contextToolbar.style.top = `${top}px`;
    });
  }

  async function deleteSelection({ force = false } = {}) {
    const ids = selectedIds();
    if (!ids.length) return;
    if (!force && state.settings.confirmObjectDelete) {
      const confirmed = await confirmDialog('Delete selection?', `Delete ${ids.length === 1 ? 'this object' : `these ${ids.length} objects`}? This can be undone during the current session.`, 'Delete');
      if (!confirmed) return;
    }
    pushHistory('Delete selection');
    const idSet = new Set(ids);
    const removedObjectIds = new Set(currentBoard().objects.filter(obj => idSet.has(obj.id)).map(obj => obj.id));
    currentBoard().objects = currentBoard().objects.filter(obj => !idSet.has(obj.id));
    currentBoard().connectors = currentBoard().connectors.filter(connector => !idSet.has(connector.id) && !removedObjectIds.has(connector.fromId) && !removedObjectIds.has(connector.toId));
    ui.selection.clear();
    ui.editingId = null;
    touchBoard();
    renderAll();
    toast(ids.length === 1 ? 'Object deleted.' : `${ids.length} objects deleted.`);
  }

  function copySelection() {
    const objectIds = new Set(selectedObjects().map(obj => obj.id));
    const objects = selectedObjects().map(deepClone);
    const connectors = currentBoard().connectors
      .filter(connector => ui.selection.has(connector.id) || (objectIds.has(connector.fromId) && objectIds.has(connector.toId)))
      .map(deepClone);
    if (!objects.length && !connectors.length) return false;
    ui.clipboard = { objects, connectors, copiedAt: Date.now() };
    toast(`${objects.length + connectors.length} item${objects.length + connectors.length === 1 ? '' : 's'} copied.`);
    return true;
  }

  function pasteClipboard(point = null) {
    if (!ui.clipboard) return toast('Nothing has been copied yet.');
    pushHistory('Paste selection');
    const idMap = new Map();
    const groupMap = new Map();
    const offset = point ? { x: 0, y: 0 } : { x: 28, y: 28 };
    const sourceBounds = unionBounds(ui.clipboard.objects.map(obj => obj.objectType === 'drawing' ? drawingBounds(obj) : objectRect(obj)));
    if (point && sourceBounds) {
      offset.x = point.x - sourceBounds.cx;
      offset.y = point.y - sourceBounds.cy;
    }
    const newObjects = ui.clipboard.objects.map(source => {
      const copy = deepClone(source);
      const oldId = copy.id;
      copy.id = uuid(copy.objectType === 'template-note' ? 'kanban' : copy.objectType === 'blank-note' ? 'note' : copy.objectType);
      idMap.set(oldId, copy.id);
      copy.x = clamp(copy.x + offset.x, 10, WORLD.width - (copy.width || 10) - 10);
      copy.y = clamp(copy.y + offset.y, 10, WORLD.height - (copy.height || 10) - 10);
      copy.zIndex = maxZ() + 1 + idMap.size;
      copy.createdAt = copy.modifiedAt = nowISO();
      if (copy.groupId) {
        if (!groupMap.has(copy.groupId)) groupMap.set(copy.groupId, uuid('group'));
        copy.groupId = groupMap.get(copy.groupId);
      }
      return normalizeObject(copy);
    });
    const newConnectors = ui.clipboard.connectors.map(source => {
      const copy = deepClone(source);
      copy.id = uuid('connector');
      copy.fromId = idMap.get(source.fromId) || source.fromId;
      copy.toId = idMap.get(source.toId) || source.toId;
      copy.createdAt = copy.modifiedAt = nowISO();
      return normalizeConnector(copy);
    }).filter(connector => getObject(connector.fromId) || newObjects.some(obj => obj.id === connector.fromId))
      .filter(connector => getObject(connector.toId) || newObjects.some(obj => obj.id === connector.toId));
    currentBoard().objects.push(...newObjects);
    currentBoard().connectors.push(...newConnectors);
    ui.selection = new Set([...newObjects.map(obj => obj.id), ...newConnectors.map(connector => connector.id)]);
    touchBoard();
    renderAll();
  }

  function duplicateSelection() {
    if (!selectedIds().length) return;
    copySelection();
    pasteClipboard();
  }

  function groupSelection() {
    const objects = selectedObjects();
    if (objects.length < 2) return toast('Select at least two board objects to group them.');
    pushHistory('Group objects');
    const groupId = uuid('group');
    objects.forEach(obj => { obj.groupId = groupId; obj.modifiedAt = nowISO(); });
    touchBoard();
    renderAll();
    toast(`${objects.length} objects grouped.`);
  }

  function ungroupSelection() {
    const objects = selectedObjects().filter(obj => obj.groupId);
    if (!objects.length) return toast('The selection is not grouped.');
    pushHistory('Ungroup objects');
    const groups = new Set(objects.map(obj => obj.groupId));
    currentBoard().objects.forEach(obj => {
      if (groups.has(obj.groupId)) { obj.groupId = null; obj.modifiedAt = nowISO(); }
    });
    touchBoard();
    renderAll();
    toast('Objects ungrouped.');
  }

  function alignSelection(mode) {
    const objects = selectedObjects().filter(obj => obj.objectType !== 'drawing');
    if (objects.length < 2) return;
    pushHistory(`Align ${mode}`);
    const bounds = unionBounds(objects.map(objectRect));
    if (!bounds) return;
    if (mode === 'left') objects.forEach(obj => obj.x = bounds.x);
    if (mode === 'center') objects.forEach(obj => obj.x = bounds.cx - obj.width / 2);
    if (mode === 'right') objects.forEach(obj => obj.x = bounds.right - obj.width);
    if (mode === 'top') objects.forEach(obj => obj.y = bounds.y);
    if (mode === 'middle') objects.forEach(obj => obj.y = bounds.cy - obj.height / 2);
    if (mode === 'bottom') objects.forEach(obj => obj.y = bounds.bottom - obj.height);
    if (mode === 'distribute-h') {
      const sorted = [...objects].sort((a,b) => a.x - b.x);
      const totalWidth = sorted.reduce((sum, obj) => sum + obj.width, 0);
      const gap = sorted.length > 1 ? (bounds.width - totalWidth) / (sorted.length - 1) : 0;
      let x = bounds.x;
      sorted.forEach(obj => { obj.x = x; x += obj.width + gap; });
    }
    if (mode === 'distribute-v') {
      const sorted = [...objects].sort((a,b) => a.y - b.y);
      const totalHeight = sorted.reduce((sum, obj) => sum + obj.height, 0);
      const gap = sorted.length > 1 ? (bounds.height - totalHeight) / (sorted.length - 1) : 0;
      let y = bounds.y;
      sorted.forEach(obj => { obj.y = y; y += obj.height + gap; });
    }
    objects.forEach(obj => obj.modifiedAt = nowISO());
    touchBoard();
    renderAll();
  }

  function layerSelection(action) {
    const objects = selectedObjects();
    if (!objects.length) return;
    pushHistory('Change object order');
    const max = maxZ();
    const min = minZ();
    for (const obj of objects) {
      if (action === 'front') obj.zIndex = max + 10;
      if (action === 'back') obj.zIndex = min - 10;
      if (action === 'forward') obj.zIndex = (obj.zIndex || 0) + 1;
      if (action === 'backward') obj.zIndex = (obj.zIndex || 0) - 1;
      obj.modifiedAt = nowISO();
    }
    touchBoard();
    renderAll();
  }

  function toggleChecklist() {
    const note = selectedObjects().find(obj => obj.objectType === 'blank-note');
    if (!note) return;
    pushHistory('Toggle checklist');
    note.checklist = !note.checklist;
    note.checkedItems = [];
    note.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  }

  function toggleKanbanCompact(note = selectedObjects().find(obj => obj.objectType === 'template-note')) {
    if (!note) return;
    pushHistory(note.displayMode === 'compact' ? 'Expand Kanban note' : 'Collapse Kanban note');
    note.displayMode = note.displayMode === 'compact' ? 'expanded' : 'compact';
    const min = note.displayMode === 'compact' ? KANBAN_SCHEMA.compactDimensions : { width: 320, height: 420 };
    note.width = Math.max(note.width, min.width);
    note.height = note.displayMode === 'compact' ? Math.max(230, Math.min(note.height, 330)) : Math.max(note.height, min.height);
    note.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  }

  async function clearKanbanValues() {
    const note = selectedObjects().find(obj => obj.objectType === 'template-note');
    if (!note) return;
    const confirmed = await confirmDialog('Clear all Kanban fields?', 'All entered values will be cleared. Ticket Type will return to Story, Status to Backlog, and On Hold and Needs VP will be unchecked.', 'Clear Fields');
    if (!confirmed) return;
    pushHistory('Clear Kanban fields');
    for (const field of KANBAN_SCHEMA.fields) note.fields[field.key] = deepClone(field.defaultValue);
    note.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  }

  function kanbanAsText(note) {
    const f = note.fields;
    return [
      `Ticket #: ${f.ticketNumber || ''}`,
      `Ticket Type: ${f.ticketType || 'Story'}`,
      `Sprint #: ${f.sprintNumber || ''}`,
      `Epic: ${f.epic || ''}`,
      `Description:\n${f.description || ''}`,
      `Team: ${f.team || ''}`,
      `Reporter: ${f.reporter || ''}`,
      `Assignee: ${f.assignee || ''}`,
      `Status: ${f.status || 'Backlog'}`,
      `On Hold: ${f.onHold ? 'Yes' : 'No'}`,
      `Needs VP?: ${f.needsVP ? 'Yes' : 'No'}`,
      `Need By Date: ${f.needByDate || ''}`
    ].join('\n');
  }

  async function convertKanbanToBlank() {
    const note = selectedObjects().find(obj => obj.objectType === 'template-note');
    if (!note) return;
    const confirmed = await confirmDialog('Convert to a blank note?', 'The field values will be preserved as readable text, but they will no longer be independently editable.', 'Convert');
    if (!confirmed) return;
    pushHistory('Convert Kanban note');
    const replacement = createBlankNote({ x: note.x + note.width / 2, y: note.y + note.height / 2 }, {
      width: Math.max(300, note.width),
      height: Math.max(300, Math.min(note.height, 560)),
      color: note.color,
      title: note.fields.ticketNumber || 'Kanban Ticket',
      content: kanbanAsText(note),
      tag: 'Converted'
    });
    replacement.id = note.id;
    replacement.x = note.x;
    replacement.y = note.y;
    replacement.zIndex = note.zIndex;
    replacement.rotation = note.rotation;
    replacement.groupId = note.groupId;
    replacement.frameId = note.frameId;
    const index = currentBoard().objects.findIndex(obj => obj.id === note.id);
    currentBoard().objects[index] = replacement;
    touchBoard();
    renderAll();
  }

  async function renameFrame() {
    const frame = selectedObjects().find(obj => obj.objectType === 'frame');
    if (!frame) return;
    const result = await promptForm('Edit frame', [
      { key: 'title', label: 'Title', value: frame.title, required: true },
      { key: 'description', label: 'Description', value: frame.description, multiline: true }
    ], 'Save');
    if (!result) return;
    pushHistory('Edit frame');
    frame.title = result.title.trim() || 'Frame';
    frame.description = result.description.trim();
    frame.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  }

  async function editConnector() {
    const connector = selectedConnectors()[0];
    if (!connector) return;
    const result = await promptForm('Edit connector', [
      { key: 'label', label: 'Label', value: connector.label },
      { key: 'style', label: 'Line style', type: 'select', value: connector.style, options: [{ value: 'curved', label: 'Curved' }, { value: 'straight', label: 'Straight' }] },
      { key: 'dash', label: 'Stroke style', type: 'select', value: connector.dash, options: [{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }] },
      { key: 'arrow', label: 'Arrowhead', type: 'checkbox', value: connector.arrow }
    ], 'Save');
    if (!result) return;
    pushHistory('Edit connector');
    connector.label = result.label;
    connector.style = result.style;
    connector.dash = result.dash;
    connector.arrow = Boolean(result.arrow);
    connector.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  }

  function closePopover() {
    els.popover.classList.add('hidden');
    els.popover.innerHTML = '';
    els.boardButton.setAttribute('aria-expanded', 'false');
    ui.menuAnchor = null;
    ui.stickerReplaceId = null;
    els.viewport.classList.remove('sticker-drop-target');
  }

  function positionPopover(anchor, { align = 'left', width = null } = {}) {
    const pop = els.popover;
    if (width) pop.style.width = `${width}px`; else pop.style.removeProperty('width');
    pop.classList.remove('hidden');
    const popRect = pop.getBoundingClientRect();
    let left, top;
    if (anchor && typeof anchor.clientX === 'number') {
      left = anchor.clientX;
      top = anchor.clientY;
    } else {
      const rect = anchor?.getBoundingClientRect?.() || { left: 12, right: 12, top: 70, bottom: 70 };
      left = align === 'right' ? rect.right - popRect.width : rect.left;
      top = rect.bottom + 7;
      if (top + popRect.height > innerHeight - 8) top = Math.max(8, rect.top - popRect.height - 7);
    }
    left = clamp(left, 8, innerWidth - popRect.width - 8);
    top = clamp(top, 8, innerHeight - popRect.height - 8);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  function openPopover(html, anchor, options = {}) {
    els.popover.innerHTML = html;
    els.popover.classList.remove('hidden');
    ui.menuAnchor = anchor;
    requestAnimationFrame(() => positionPopover(anchor, options));
  }

  function menuItem(action, icon, title, subtitle = '', extraClass = '') {
    return `<button class="menu-item ${extraClass}" type="button" data-pop-action="${escapeAttr(action)}"><span class="menu-icon" aria-hidden="true">${icon}</span><span class="menu-copy"><span class="menu-title">${escapeHTML(title)}</span>${subtitle ? `<span class="menu-subtitle">${escapeHTML(subtitle)}</span>` : ''}</span></button>`;
  }

  function openNotePicker(anchor, worldPoint = null) {
    ui.pointerWorld = worldPoint || ui.pointerWorld;
    openPopover(`
      <div class="popover-section"><h3>Create</h3>
        ${menuItem('new-blank', '▤', 'Blank Note', 'Freeform text, optional tag, or checklist')}
        ${menuItem('new-kanban', '▦', 'Kanban', 'Structured ticket fields and compact view')}
        ${menuItem('open-stickers', '★', 'Sticker', 'Reactions, markers, arrows, and symbols')}
      </div>`, anchor, { width: 300 });
  }

  function openStickerPicker(anchor, worldPoint = null, { replaceId = null } = {}) {
    ui.pointerWorld = worldPoint || ui.pointerWorld;
    ui.stickerReplaceId = replaceId;
    const selectedId = replaceId ? getObject(replaceId)?.stickerId : state.settings.defaultStickerId;
    openPopover(`<div class="popover-section"><h3>${replaceId ? 'Change sticker' : 'Choose sticker'}</h3>
      <div class="sticker-grid">${STICKER_CATALOG.map(sticker => `<button class="sticker-choice ${selectedId === sticker.id ? 'selected' : ''}" type="button" draggable="true" data-sticker-choice="${escapeAttr(sticker.id)}" aria-label="${escapeAttr(sticker.label)}" title="${escapeAttr(sticker.label)} — click to choose or drag onto the board">${stickerSVG(sticker.id)}<span class="sticker-choice-label">${escapeHTML(sticker.label)}</span></button>`).join('')}</div>
      <p class="sticker-hint">Click a sticker, then click the board to place it. On desktop, you can also drag a sticker directly onto the board.</p>
    </div>`, anchor, { width: 360 });
  }

  function chooseSticker(stickerId) {
    if (!STICKER_IDS.includes(stickerId)) return;
    const replaceId = ui.stickerReplaceId;
    state.settings.defaultStickerId = stickerId;
    if (replaceId) {
      const obj = getObject(replaceId);
      if (!obj || obj.objectType !== 'sticker') { closePopover(); return; }
      pushHistory('Change sticker');
      obj.stickerId = stickerId;
      obj.modifiedAt = nowISO();
      closePopover();
      touchBoard();
      renderAll();
      toast(`Changed to ${stickerDefinition(stickerId).label}.`, 'success');
      return;
    }
    setTool('sticker');
    scheduleSave();
    toast(`${stickerDefinition(stickerId).label} selected. Click the board to place it.`);
  }

  function openColorPalette(anchor) {
    const objects = selectedObjects();
    const connectorLike = selectedConnectors().length || objects.some(obj => obj.objectType === 'drawing');
    if (connectorLike && !objects.some(obj => ['blank-note', 'template-note', 'frame'].includes(obj.objectType))) {
      openPopover(`<div class="popover-section"><h3>Line color</h3><div class="palette-grid">${LINE_COLORS.map(color => `<button class="swatch" type="button" data-line-color="${escapeAttr(color)}" style="background:${escapeAttr(color)}" aria-label="Use ${escapeAttr(color)}"></button>`).join('')}</div></div>`, anchor, { width: 190 });
      return;
    }
    const frameOnly = objects.length && objects.every(obj => obj.objectType === 'frame');
    const colors = frameOnly ? FRAME_COLORS : NOTE_COLORS;
    const selectedColor = objects[0]?.color;
    openPopover(`<div class="popover-section"><h3>${frameOnly ? 'Frame color' : 'Note color'}</h3><div class="palette-grid">${colors.map(color => `<button class="swatch swatch-${color} ${selectedColor === color ? 'selected' : ''}" type="button" data-object-color="${escapeAttr(color)}" aria-label="Use ${escapeAttr(color)}"></button>`).join('')}</div></div>`, anchor, { width: 190 });
  }

  function openAlignMenu(anchor) {
    openPopover(`<div class="popover-section"><h3>Align selection</h3>
      ${menuItem('align-left', '⇤', 'Align left')}
      ${menuItem('align-center', '↔', 'Align center')}
      ${menuItem('align-right', '⇥', 'Align right')}
      ${menuItem('align-top', '↥', 'Align top')}
      ${menuItem('align-middle', '↕', 'Align middle')}
      ${menuItem('align-bottom', '↧', 'Align bottom')}
    </div><div class="popover-section"><h3>Distribute</h3>
      ${menuItem('distribute-h', '⇔', 'Distribute horizontally')}
      ${menuItem('distribute-v', '⇕', 'Distribute vertically')}
    </div>`, anchor, { width: 250 });
  }

  function openGroupMenu(anchor) {
    const hasGroup = selectedObjects().some(obj => obj.groupId);
    openPopover(`<div class="popover-section"><h3>Grouping</h3>
      ${menuItem('group', '⊞', 'Group selection', 'Move related objects together')}
      ${menuItem('ungroup', '⊟', 'Ungroup', hasGroup ? 'Remove the selected group relationship' : 'No grouped objects selected')}
    </div>`, anchor, { width: 270 });
  }

  function openSelectionMore(anchor) {
    const single = selectedIds().length === 1 ? getSelectable(selectedIds()[0]) : null;
    let specific = '';
    if (single?.objectType === 'blank-note') specific += menuItem('toggle-checklist', '☑', single.checklist ? 'Use plain text' : 'Use checklist mode');
    if (single?.objectType === 'template-note') {
      specific += menuItem('clear-kanban', '⌫', 'Clear Field Values', 'Keep template defaults');
      specific += menuItem('convert-kanban', '▤', 'Convert to Blank Note', 'Preserve values as readable text');
    }
    if (single?.objectType === 'text') specific += menuItem('text-options', 'T', 'Text Options', 'Size and alignment');
    if (single?.objectType === 'sticker') specific += menuItem('change-sticker', '★', 'Change Sticker', 'Choose another reaction or symbol');
    if (single?.objectType === 'connector') specific += menuItem('edit-connector', '↗', 'Connector Options');
    openPopover(`<div class="popover-section">${specific || ''}
      ${menuItem('bring-forward', '↑', 'Bring Forward')}
      ${menuItem('send-backward', '↓', 'Send Backward')}
      ${menuItem('bring-front', '⇈', 'Bring to Front')}
      ${menuItem('send-back', '⇊', 'Send to Back')}
    </div><div class="popover-section">
      ${menuItem('copy', '⧉', 'Copy')}
      ${menuItem('delete', '×', 'Delete', '', 'danger')}
    </div>`, anchor, { width: 285 });
  }

  function openDrawingOptions(anchor) {
    const s = state.settings;
    openPopover(`<div class="popover-section"><h3>Pen</h3>
      <div class="filter-form">
        <div class="form-row"><label for="penWidthMenu">Line thickness</label><input id="penWidthMenu" type="range" min="1" max="12" value="${s.penWidth}" data-setting-live="penWidth"><span style="font-size:11px;color:var(--muted)">${s.penWidth}px</span></div>
        <div class="form-row"><label>Pen color</label><div class="palette-grid">${LINE_COLORS.map(color => `<button class="swatch" type="button" data-pen-color="${escapeAttr(color)}" style="background:${escapeAttr(color)}" aria-label="Use ${escapeAttr(color)}"></button>`).join('')}</div></div>
      </div>
    </div><div class="popover-section"><h3>Connector</h3>
      <div class="filter-form">
        <div class="form-row"><label for="connectorStyleMenu">Routing</label><select id="connectorStyleMenu" data-setting-live="connectorStyle"><option value="curved" ${s.connectorStyle === 'curved' ? 'selected' : ''}>Curved</option><option value="straight" ${s.connectorStyle === 'straight' ? 'selected' : ''}>Straight</option></select></div>
        <div class="toggle-row"><label for="connectorArrowMenu">Arrowhead</label><input id="connectorArrowMenu" type="checkbox" data-setting-live="connectorArrow" ${s.connectorArrow ? 'checked' : ''}></div>
      </div>
    </div>`, anchor, { width: 295 });
  }

  function openBoardMenu(anchor = els.boardButton, query = '') {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const boards = state.boards.filter(board => board.name.toLocaleLowerCase().includes(normalizedQuery));
    openPopover(`<div class="popover-section">
      <input id="boardMenuSearch" class="menu-search" type="search" value="${escapeAttr(query)}" placeholder="Search boards…" aria-label="Search boards">
      <div class="board-list">${boards.length ? boards.map(board => `<button class="menu-item ${board.id === state.currentBoardId ? 'active' : ''}" type="button" data-switch-board="${board.id}"><span class="menu-icon" aria-hidden="true">${board.id === state.currentBoardId ? '●' : '○'}</span><span class="menu-copy"><span class="menu-title">${escapeHTML(board.name)}</span><span class="menu-subtitle">Modified ${escapeHTML(new Date(board.modifiedAt).toLocaleString())}</span></span></button>`).join('') : '<div class="board-list-empty">No boards match that search.</div>'}</div>
    </div><div class="popover-section">
      ${menuItem('new-board', '+', 'New Board', 'Always starts empty')}
      ${menuItem('rename-board', '✎', 'Rename Current Board')}
      ${menuItem('duplicate-board', '⧉', 'Duplicate Current Board')}
      ${menuItem('load-example', '★', 'Load Example Board', 'Only when you choose it')}
      ${menuItem('delete-board', '×', 'Delete Current Board', '', 'danger')}
    </div>`, anchor, { width: 330 });
    els.boardButton.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => $('#boardMenuSearch', els.popover)?.focus({ preventScroll: true }));
  }

  function openExportMenu(anchor = els.exportButton) {
    const hasSelection = selectedIds().length > 0;
    openPopover(`<div class="popover-section"><h3>Export</h3>
      ${menuItem('export-board-json', '{}', 'Current Board JSON', 'Preserves all objects and template fields')}
      ${hasSelection ? menuItem('export-selection-json', '◫', 'Selected Objects JSON', 'Export only the current selection') : ''}
      ${menuItem('export-backup-json', '▣', 'Complete Backup JSON', 'All boards and settings')}
      ${menuItem('export-png-board', '▧', 'Board PNG', 'Clean image of all board content')}
      ${menuItem('export-png-view', '▤', 'Visible Viewport PNG', 'What is currently on screen')}
      ${hasSelection ? menuItem('export-png-selection', '▥', 'Selection PNG', 'Selected objects and attached content') : ''}
    </div><div class="popover-section"><h3>PDF / Print</h3>
      ${menuItem('export-pdf-board', 'PDF', 'Entire Board — One Page', 'Fits all board content onto one landscape page')}
      ${menuItem('export-pdf-tiled', '▦', 'Entire Board — Tiled Pages', 'Splits a large board across readable pages')}
      ${menuItem('export-pdf-view', '▤', 'Visible Viewport PDF', 'Prints the current view on one page')}
      ${hasSelection ? menuItem('export-pdf-selection', '▥', 'Selection PDF', 'Prints only selected objects') : ''}
    </div><div class="popover-section"><h3>Import</h3>
      ${menuItem('import-json', '⇧', 'Import JSON', 'Replace, add, or restore a backup')}
    </div>`, anchor, { width: 330 });
  }

  function filterOptions(values, selected, emptyLabel = 'Any') {
    return `<option value="">${escapeHTML(emptyLabel)}</option>${values.map(value => `<option value="${escapeAttr(value)}" ${selected === value ? 'selected' : ''}>${escapeHTML(value)}</option>`).join('')}`;
  }

  function openFilterMenu(anchor = els.filterButton) {
    const f = ui.filters;
    openPopover(`<div class="popover-section"><h3>Kanban filters</h3>
      <form id="filterForm" class="filter-form">
        <div class="form-row"><label for="filterTemplate">Template</label><select id="filterTemplate" name="template"><option value="" ${!f.template ? 'selected' : ''}>Any object</option><option value="template-note" ${f.template === 'template-note' ? 'selected' : ''}>Kanban</option><option value="blank-note" ${f.template === 'blank-note' ? 'selected' : ''}>Blank notes</option><option value="text" ${f.template === 'text' ? 'selected' : ''}>Text labels</option><option value="sticker" ${f.template === 'sticker' ? 'selected' : ''}>Stickers</option><option value="frame" ${f.template === 'frame' ? 'selected' : ''}>Frames</option></select></div>
        <div class="form-row"><label for="filterTicketType">Ticket Type</label><select id="filterTicketType" name="ticketType">${filterOptions(TICKET_TYPES, f.ticketType)}</select></div>
        <div class="form-row"><label for="filterTeam">Team</label><select id="filterTeam" name="team">${filterOptions(TEAM_OPTIONS, f.team)}</select></div>
        <div class="form-row"><label for="filterStatus">Status</label><select id="filterStatus" name="status">${filterOptions(STATUS_OPTIONS, f.status)}</select></div>
        <div class="form-row"><label for="filterOnHold">On Hold</label><select id="filterOnHold" name="onHold"><option value="" ${!f.onHold ? 'selected' : ''}>Either</option><option value="yes" ${f.onHold === 'yes' ? 'selected' : ''}>Yes</option><option value="no" ${f.onHold === 'no' ? 'selected' : ''}>No</option></select></div>
        <div class="form-row"><label for="filterNeedsVP">Needs VP</label><select id="filterNeedsVP" name="needsVP"><option value="" ${!f.needsVP ? 'selected' : ''}>Either</option><option value="yes" ${f.needsVP === 'yes' ? 'selected' : ''}>Yes</option><option value="no" ${f.needsVP === 'no' ? 'selected' : ''}>No</option></select></div>
        <div class="form-row"><label for="filterDue">Need By Date</label><select id="filterDue" name="due"><option value="" ${!f.due ? 'selected' : ''}>Any date</option><option value="none" ${f.due === 'none' ? 'selected' : ''}>No date</option><option value="overdue" ${f.due === 'overdue' ? 'selected' : ''}>Overdue</option><option value="today" ${f.due === 'today' ? 'selected' : ''}>Due today</option><option value="week" ${f.due === 'week' ? 'selected' : ''}>Due this week</option><option value="month" ${f.due === 'month' ? 'selected' : ''}>Due this month</option><option value="custom" ${f.due === 'custom' ? 'selected' : ''}>Custom range</option></select></div>
        <div class="form-row ${f.due === 'custom' ? '' : 'hidden'}" data-custom-dates><label>Date range</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px"><input type="date" name="from" value="${escapeAttr(f.from)}" aria-label="Start date"><input type="date" name="to" value="${escapeAttr(f.to)}" aria-label="End date"></div></div>
        <div class="form-actions"><button class="button ghost" type="button" data-pop-action="reset-filters">Reset Filters</button><button class="button primary" type="submit">Apply</button></div>
      </form>
    </div>`, anchor, { width: 325 });
  }

  function showDialog({ title, bodyHTML, actions = [{ label: 'Close', value: null }], initialFocus = null }) {
    if (els.dialog.open) els.dialog.close();
    ui.lastFocused = document.activeElement;
    els.dialogTitle.textContent = title;
    els.dialogBody.innerHTML = bodyHTML;
    els.dialogFooter.innerHTML = actions.map((action, index) => `<button class="button ${action.primary ? 'primary' : ''} ${action.danger ? 'danger' : ''}" type="button" data-dialog-value="${escapeAttr(String(index))}">${escapeHTML(action.label)}</button>`).join('');
    return new Promise(resolve => {
      ui.dialogResolver = { resolve, actions };
      els.dialog.showModal();
      requestAnimationFrame(() => {
        const target = initialFocus ? $(initialFocus, els.dialog) : $('[autofocus], input, textarea, select, button', els.dialogBody) || $('[data-dialog-value]', els.dialogFooter);
        target?.focus();
      });
    });
  }

  function resolveDialog(value) {
    if (!ui.dialogResolver) return;
    const resolver = ui.dialogResolver;
    ui.dialogResolver = null;
    if (els.dialog.open) els.dialog.close();
    resolver.resolve(value);
    requestAnimationFrame(() => ui.lastFocused?.focus?.());
  }

  async function confirmDialog(title, message, confirmLabel = 'Confirm') {
    const result = await showDialog({
      title,
      bodyHTML: `<p>${escapeHTML(message)}</p>`,
      actions: [{ label: 'Cancel', value: false }, { label: confirmLabel, value: true, primary: true, danger: /delete|clear/i.test(confirmLabel) }]
    });
    return Boolean(result);
  }

  async function promptForm(title, fields, submitLabel = 'Save') {
    const bodyHTML = `<form id="promptForm" class="settings-form">${fields.map(field => {
      const id = `prompt-${field.key}`;
      if (field.type === 'select') return `<div class="form-row"><label for="${id}">${escapeHTML(field.label)}</label><select id="${id}" name="${escapeAttr(field.key)}">${field.options.map(option => `<option value="${escapeAttr(option.value)}" ${String(option.value) === String(field.value) ? 'selected' : ''}>${escapeHTML(option.label)}</option>`).join('')}</select></div>`;
      if (field.type === 'checkbox') return `<div class="toggle-row"><label for="${id}">${escapeHTML(field.label)}</label><input id="${id}" name="${escapeAttr(field.key)}" type="checkbox" ${field.value ? 'checked' : ''}></div>`;
      if (field.multiline) return `<div class="form-row"><label for="${id}">${escapeHTML(field.label)}</label><textarea id="${id}" name="${escapeAttr(field.key)}" ${field.required ? 'required' : ''}>${escapeHTML(field.value || '')}</textarea></div>`;
      return `<div class="form-row"><label for="${id}">${escapeHTML(field.label)}</label><input id="${id}" name="${escapeAttr(field.key)}" type="${field.type || 'text'}" value="${escapeAttr(field.value || '')}" ${field.required ? 'required' : ''}></div>`;
    }).join('')}</form>`;
    const result = await showDialog({ title, bodyHTML, actions: [{ label: 'Cancel', value: null }, { label: submitLabel, value: 'submit', primary: true }], initialFocus: 'input, textarea, select' });
    if (result !== 'submit') return null;
    const form = $('#promptForm', els.dialogBody);
    if (!form?.reportValidity()) return null;
    const data = {};
    for (const field of fields) {
      const input = form.elements[field.key];
      data[field.key] = field.type === 'checkbox' ? input.checked : input.value;
    }
    return data;
  }

  function switchBoard(boardId) {
    if (!state.boards.some(board => board.id === boardId) || boardId === state.currentBoardId) { closePopover(); return; }
    finishEditing({ render: false });
    state.currentBoardId = boardId;
    ui.selection.clear();
    ui.searchQuery = '';
    ui.searchResults = [];
    ui.searchIndex = -1;
    ui.filters = { template: '', ticketType: '', team: '', status: '', onHold: '', needsVP: '', due: '', from: '', to: '' };
    ui.connectorSourceId = null;
    resetHistory();
    closePopover();
    renderAll();
    scheduleSave({ immediate: true });
    toast(`Opened “${currentBoard().name}”.`);
  }

  async function createBoard() {
    closePopover();
    const result = await promptForm('Create a new board', [
      { key: 'name', label: 'Board name', value: `Board ${state.boards.length + 1}`, required: true },
      { key: 'description', label: 'Description (optional)', value: '', multiline: true }
    ], 'Create Board');
    if (!result) return;
    const board = makeDefaultBoard(result.name.trim() || `Board ${state.boards.length + 1}`);
    board.description = result.description.trim();
    state.boards.push(board);
    state.currentBoardId = board.id;
    ui.selection.clear();
    resetHistory();
    renderAll();
    scheduleSave({ immediate: true });
    toast('New empty board created.', 'success');
  }

  async function renameCurrentBoard() {
    closePopover();
    const board = currentBoard();
    const result = await promptForm('Rename board', [
      { key: 'name', label: 'Board name', value: board.name, required: true },
      { key: 'description', label: 'Description (optional)', value: board.description, multiline: true }
    ], 'Save');
    if (!result) return;
    board.name = result.name.trim() || board.name;
    board.description = result.description.trim();
    board.modifiedAt = nowISO();
    renderAll();
    scheduleSave({ immediate: true });
  }

  function duplicateCurrentBoard() {
    closePopover();
    const copy = deepClone(currentBoard());
    const oldToNew = new Map();
    copy.id = uuid('board');
    copy.name = `${copy.name} Copy`;
    copy.createdAt = copy.modifiedAt = nowISO();
    copy.objects.forEach(obj => {
      const old = obj.id;
      obj.id = uuid(obj.objectType === 'template-note' ? 'kanban' : obj.objectType === 'blank-note' ? 'note' : obj.objectType);
      oldToNew.set(old, obj.id);
      if (obj.groupId) obj.groupId = `copy-${obj.groupId}`;
    });
    copy.connectors.forEach(connector => {
      connector.id = uuid('connector');
      connector.fromId = oldToNew.get(connector.fromId) || connector.fromId;
      connector.toId = oldToNew.get(connector.toId) || connector.toId;
    });
    state.boards.push(normalizeBoard(copy, state.boards.length));
    state.currentBoardId = copy.id;
    ui.selection.clear();
    resetHistory();
    renderAll();
    scheduleSave({ immediate: true });
    toast('Board duplicated.', 'success');
  }

  async function deleteCurrentBoard() {
    closePopover();
    const board = currentBoard();
    const confirmed = await confirmDialog('Delete this board?', `Delete “${board.name}” and all of its local content? This action cannot be undone after leaving the dialog.`, 'Delete Board');
    if (!confirmed) return;
    const index = state.boards.findIndex(item => item.id === board.id);
    state.boards.splice(index, 1);
    if (!state.boards.length) state.boards.push(makeDefaultBoard('My First Board'));
    state.currentBoardId = state.boards[Math.min(index, state.boards.length - 1)].id;
    ui.selection.clear();
    resetHistory();
    renderAll();
    scheduleSave({ immediate: true });
    toast('Board deleted.');
  }

  function makeExampleBoard() {
    const board = makeDefaultBoard('TACKBOARD Example');
    board.description = 'A small example showing blank notes, a Kanban ticket, stickers, a frame, drawing, and connectors.';
    board.background = 'dots';
    board.viewport = { x: 40, y: 70, zoom: .9 };
    const frame = createFrame({ x: 900, y: 560 }, { width: 1100, height: 620, title: 'Release Planning', description: 'Arrange, connect, and refine the work for the next release.', color: 'blue' });
    frame.x = 350; frame.y = 250; frame.zIndex = -10;
    const welcome = createBlankNote({ x: 620, y: 500 }, { width: 290, height: 220, title: 'Start here', content: 'Double-click notes to edit them.\n\nDrag headers to move. Resize from the selected handles.', tag: 'WELCOME', color: 'yellow' });
    welcome.x = 450; welcome.y = 360; welcome.zIndex = 2;
    const ideas = createBlankNote({ x: 980, y: 500 }, { width: 280, height: 230, title: 'Release checklist', content: 'Confirm scope\nReview design\nRun accessibility pass\nExport evidence', checklist: true, tag: 'CHECKLIST', color: 'green' });
    ideas.x = 810; ideas.y = 350; ideas.zIndex = 3;
    const ticket = createKanbanNote({ x: 1350, y: 620 }, { displayMode: 'compact', width: 350, height: 285, color: 'blue', fields: {
      ticketNumber: 'TB-101', ticketType: 'Story', sprintNumber: 'Sprint 1', epic: 'Canvas Basics', description: 'Make the first-use board experience calm, clear, and fast.', team: 'SPA', reporter: 'Alex Morgan', assignee: 'Casey Lee', status: 'In Dev', onHold: false, needsVP: true, needByDate: ''
    }});
    ticket.x = 1160; ticket.y = 350; ticket.zIndex = 4;
    const label = createTextObject({ x: 910, y: 950 }, { width: 440, height: 64, text: 'CREATE → ARRANGE → CONNECT → REFINE → SAVE', fontSize: 22 });
    label.x = 560; label.y = 805; label.zIndex = 5;
    const drawing = normalizeObject({ id: uuid('drawing'), objectType: 'drawing', points: [{x:740,y:700},{x:780,y:670},{x:830,y:690},{x:870,y:650},{x:930,y:675}], stroke: '#3d6f73', strokeWidth: 4, zIndex: 1 });
    const checkSticker = createSticker({ x: 1090, y: 700 }, { stickerId: 'check', width: 72, height: 72 });
    checkSticker.x = 1015; checkSticker.y = 670; checkSticker.zIndex = 6;
    const arrowSticker = createSticker({ x: 1130, y: 720 }, { stickerId: 'arrow-right', width: 118, height: 70 });
    arrowSticker.x = 1030; arrowSticker.y = 735; arrowSticker.zIndex = 7;
    board.objects = [frame, welcome, ideas, ticket, label, drawing, checkSticker, arrowSticker];
    board.connectors = [
      normalizeConnector({ id: uuid('connector'), fromId: welcome.id, toId: ideas.id, style: 'curved', arrow: true, stroke: '#4c555a', strokeWidth: 2, label: 'then' }),
      normalizeConnector({ id: uuid('connector'), fromId: ideas.id, toId: ticket.id, style: 'curved', arrow: true, stroke: '#3d6f73', strokeWidth: 2, label: 'creates' })
    ];
    return normalizeBoard(board);
  }

  function loadExampleBoard() {
    closePopover();
    const board = makeExampleBoard();
    state.boards.push(board);
    state.currentBoardId = board.id;
    ui.selection.clear();
    resetHistory();
    renderAll();
    scheduleSave({ immediate: true });
    requestAnimationFrame(() => fitContent());
    toast('Example board loaded as a separate board.', 'success');
  }

  async function openTextOptions() {
    closePopover();
    const text = selectedObjects().find(obj => obj.objectType === 'text');
    if (!text) return;
    const result = await promptForm('Text options', [
      { key: 'fontSize', label: 'Text size (12–96 px)', type: 'number', value: text.fontSize },
      { key: 'align', label: 'Alignment', type: 'select', value: text.align, options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] }
    ], 'Apply');
    if (!result) return;
    pushHistory('Change text options');
    text.fontSize = clamp(Number(result.fontSize) || 24, 12, 96);
    text.align = result.align;
    text.modifiedAt = nowISO();
    touchBoard();
    renderAll();
  }

  async function openSettings() {
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
    renderAll();
    scheduleSave({ immediate: true });
  }

  async function clearAllLocalData() {
    const confirmed = await confirmDialog('Clear all local data?', 'Every local board, note, drawing, connector, and preference will be removed from this browser. Export a backup first if anything matters.', 'Clear All Data');
    if (!confirmed) return;
    state = makeDefaultState();
    ui.selection.clear();
    ui.editingId = null;
    resetHistory();
    renderAll();
    await saveNow();
    toast('Local data cleared. A new empty board is ready.', 'success', 5000);
  }

  function openHelp() {
    closePopover();
    showDialog({
      title: 'Help & keyboard shortcuts',
      bodyHTML: `<p>TACKBOARD is a local-first visual thinking space. Use the arrow tool to select and arrange objects, or the hand tool to pan the board with an ordinary left-drag.</p>
        <div class="shortcut-grid">
          <kbd>V</kbd><span>Select tool — click objects or left-drag empty space for a selection rectangle</span>
          <kbd>H</kbd><span>Pan tool — left-drag anywhere on the board, including over objects</span>
          <kbd>N</kbd><span>Create the default sticky note</span>
          <kbd>Shift + N</kbd><span>Open note-template picker</span>
          <kbd>S / Shift + S</kbd><span>Use the last sticker / open the sticker picker</span>
          <kbd>T / P / C / F</kbd><span>Text / Pen / Connector / Frame tools</span>
          <kbd>Select + left-drag empty board</kbd><span>Marquee-select every object touched by the selection rectangle</span>
          <kbd>Shift/Ctrl/Cmd + left-drag</kbd><span>Add marquee results to the current selection</span>
          <kbd>Pan + left-drag</kbd><span>Pan the complete board from any starting point</span>
          <kbd>Space + drag / middle-drag</kbd><span>Temporarily pan from any tool</span>
          <kbd>Ctrl/Cmd + wheel</kbd><span>Zoom at the pointer</span>
          <kbd>Enter</kbd><span>Edit a selected note or label</span>
          <kbd>Esc</kbd><span>Finish editing or cancel an operation</span>
          <kbd>Ctrl/Cmd + Z</kbd><span>Undo</span>
          <kbd>Ctrl/Cmd + Shift + Z</kbd><span>Redo</span>
          <kbd>Ctrl/Cmd + C / V</kbd><span>Copy / paste</span>
          <kbd>Ctrl/Cmd + D</kbd><span>Duplicate selection</span>
          <kbd>Ctrl/Cmd + F</kbd><span>Search</span>
          <kbd>Ctrl/Cmd + S</kbd><span>Force local save</span>
          <kbd>0 / 1</kbd><span>Reset view / fit content</span>
          <kbd>Delete</kbd><span>Delete selection</span>
        </div>
        <p style="margin-top:16px">All data stays in this browser unless you explicitly export it. TACKBOARD includes no accounts, telemetry, advertising, or third-party tracking.</p>`,
      actions: [{ label: 'Close', value: null, primary: true }]
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function exportBoardJSON() {
    const payload = {
      format: 'tackboard-board',
      schemaVersion: 2,
      appVersion: APP_VERSION,
      exportedAt: nowISO(),
      board: deepClone(currentBoard())
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${slugify(currentBoard().name)}.tackboard.json`);
    toast('Current board exported.', 'success');
  }

  function selectionPayload() {
    const ids = new Set(selectedIds());
    const objectIds = new Set(currentBoard().objects.filter(obj => ids.has(obj.id)).map(obj => obj.id));
    const objects = currentBoard().objects.filter(obj => ids.has(obj.id)).map(deepClone);
    const connectors = currentBoard().connectors.filter(connector => ids.has(connector.id) || (objectIds.has(connector.fromId) && objectIds.has(connector.toId))).map(deepClone);
    return {
      format: 'tackboard-selection',
      schemaVersion: 2,
      appVersion: APP_VERSION,
      exportedAt: nowISO(),
      sourceBoard: { id: currentBoard().id, name: currentBoard().name },
      objects,
      connectors
    };
  }

  function exportSelectionJSON() {
    if (!selectedIds().length) return toast('Select one or more objects first.');
    const payload = selectionPayload();
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${slugify(currentBoard().name)}-selection.tackboard.json`);
    toast('Selection exported.', 'success');
  }

  function exportBackupJSON() {
    const payload = deepClone(state);
    payload.format = 'tackboard-backup';
    payload.appVersion = APP_VERSION;
    payload.exportedAt = nowISO();
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `tackboard-backup-${new Date().toISOString().slice(0,10)}.json`);
    toast('Complete backup exported.', 'success');
  }

  function validateImportedData(data) {
    if (!data || typeof data !== 'object') throw new Error('The file does not contain a JSON object.');
    if (data.schemaVersion && Number(data.schemaVersion) > 2) throw new Error('This file was created by a newer incompatible data format.');
    if (data.format === 'tackboard-backup' || Array.isArray(data.boards)) {
      if (!Array.isArray(data.boards)) throw new Error('The backup does not contain a boards collection.');
      return { type: 'backup', data: normalizeState(data) };
    }
    if (data.format === 'tackboard-board' || data.board) {
      if (!data.board || typeof data.board !== 'object') throw new Error('The board package is missing its board data.');
      return { type: 'board', data: normalizeBoard(data.board) };
    }
    if (data.format === 'tackboard-selection' || Array.isArray(data.objects)) {
      return {
        type: 'selection',
        data: {
          objects: (data.objects || []).map(normalizeObject).filter(Boolean),
          connectors: (data.connectors || []).map(normalizeConnector).filter(Boolean)
        }
      };
    }
    throw new Error('This is not a recognized TACKBOARD board, selection, or backup file.');
  }

  function addImportedObjects(imported, point = null) {
    pushHistory('Import objects');
    const idMap = new Map();
    const groupMap = new Map();
    const objects = imported.objects.map(source => {
      const copy = deepClone(source);
      const oldId = copy.id;
      copy.id = uuid(copy.objectType === 'template-note' ? 'kanban' : copy.objectType === 'blank-note' ? 'note' : copy.objectType);
      idMap.set(oldId, copy.id);
      if (copy.groupId) {
        if (!groupMap.has(copy.groupId)) groupMap.set(copy.groupId, uuid('group'));
        copy.groupId = groupMap.get(copy.groupId);
      }
      copy.zIndex = maxZ() + 1 + idMap.size;
      copy.createdAt = copy.modifiedAt = nowISO();
      return normalizeObject(copy);
    });
    const sourceBounds = unionBounds(objects.map(obj => obj.objectType === 'drawing' ? drawingBounds(obj) : objectRect(obj)));
    const target = point || screenToWorld(
      els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2,
      els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2
    );
    if (sourceBounds) {
      const dx = target.x - sourceBounds.cx;
      const dy = target.y - sourceBounds.cy;
      objects.forEach(obj => {
        if (obj.objectType === 'drawing') obj.points = obj.points.map(p => ({ x: clamp(p.x + dx, 0, WORLD.width), y: clamp(p.y + dy, 0, WORLD.height) }));
        else { obj.x = clamp(obj.x + dx, 10, WORLD.width - obj.width - 10); obj.y = clamp(obj.y + dy, 10, WORLD.height - obj.height - 10); }
      });
    }
    const connectorCandidates = imported.connectors.map(source => normalizeConnector({
      ...source,
      id: uuid('connector'),
      fromId: idMap.get(source.fromId) || '',
      toId: idMap.get(source.toId) || '',
      createdAt: nowISO(), modifiedAt: nowISO()
    }));
    const ids = new Set(objects.map(obj => obj.id));
    const connectors = connectorCandidates.filter(c => ids.has(c.fromId) && ids.has(c.toId));
    currentBoard().objects.push(...objects);
    currentBoard().connectors.push(...connectors);
    ui.selection = new Set([...objects.map(obj => obj.id), ...connectors.map(c => c.id)]);
    touchBoard();
    renderAll();
    fitContent(ui.selection);
  }

  async function importParsedData(parsed) {
    if (parsed.type === 'backup') {
      const result = await showDialog({
        title: 'Restore complete backup?',
        bodyHTML: `<p>This backup contains ${parsed.data.boards.length} board${parsed.data.boards.length === 1 ? '' : 's'}. Restoring it replaces every board and preference currently stored in this browser.</p>`,
        actions: [{ label: 'Cancel', value: null }, { label: 'Restore Backup', value: 'restore', primary: true, danger: true }]
      });
      if (result !== 'restore') return;
      state = normalizeState(parsed.data);
      ui.selection.clear();
      ui.editingId = null;
      resetHistory();
      renderAll();
      await saveNow();
      toast('Complete backup restored.', 'success', 4800);
      return;
    }

    if (parsed.type === 'board') {
      const result = await showDialog({
        title: 'Import board',
        bodyHTML: `<p>“${escapeHTML(parsed.data.name)}” contains ${parsed.data.objects.length} object${parsed.data.objects.length === 1 ? '' : 's'}. Choose how to import it.</p>`,
        actions: [
          { label: 'Cancel', value: null },
          { label: 'Add Objects Here', value: 'add' },
          { label: 'Replace Current', value: 'replace', danger: true },
          { label: 'Create New Board', value: 'new', primary: true }
        ]
      });
      if (!result) return;
      if (result === 'add') {
        addImportedObjects(parsed.data);
      } else if (result === 'replace') {
        pushHistory('Replace board from import');
        const replacement = deepClone(parsed.data);
        replacement.id = currentBoard().id;
        replacement.name = currentBoard().name;
        replacement.modifiedAt = nowISO();
        replaceCurrentBoard(replacement);
        ui.selection.clear();
        renderAll();
        touchBoard();
      } else if (result === 'new') {
        const board = deepClone(parsed.data);
        board.id = uuid('board');
        board.name = state.boards.some(item => item.name === board.name) ? `${board.name} Imported` : board.name;
        board.createdAt = board.modifiedAt = nowISO();
        state.boards.push(normalizeBoard(board, state.boards.length));
        state.currentBoardId = board.id;
        ui.selection.clear();
        resetHistory();
        renderAll();
        scheduleSave({ immediate: true });
      }
      toast('Board import complete.', 'success');
      return;
    }

    if (parsed.type === 'selection') {
      if (!parsed.data.objects.length) throw new Error('The selection package contains no usable objects.');
      addImportedObjects(parsed.data);
      toast('Imported objects added to this board.', 'success');
    }
  }

  async function handleImportFile(file) {
    if (!file) return;
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('The selected file is larger than the 50 MB import limit.');
      const text = await file.text();
      const data = JSON.parse(text);
      const parsed = validateImportedData(data);
      await importParsedData(parsed);
    } catch (error) {
      console.error('TACKBOARD import error', error);
      toast(error.message || 'The JSON file could not be imported.', 'error', 6500);
    } finally {
      els.importInput.value = '';
    }
  }

  function paletteForCanvas() {
    const dark = effectiveTheme() === 'dark';
    return {
      background: dark ? '#252a2e' : '#f4f1e9',
      grid: dark ? 'rgba(235,240,242,.12)' : 'rgba(52,59,62,.12)',
      ink: dark ? '#edf1f2' : '#283034',
      muted: dark ? '#b1b9bd' : '#687176',
      notes: dark ? {
        yellow: '#d8bf60', blue: '#86b5c8', green: '#90bd8f', coral: '#d9907a', lavender: '#aa8ec0', cream: '#caba99', charcoal: '#41484d'
      } : {
        yellow: '#f5df83', blue: '#bddbe8', green: '#beddbd', coral: '#efb9a7', lavender: '#d8c6e6', cream: '#efe5cf', charcoal: '#41484d'
      }
    };
  }

  function canvasRoundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function wrapCanvasLines(ctx, text, maxWidth) {
    const paragraphs = String(text ?? '').split(/\r?\n/);
    const lines = [];
    for (const paragraph of paragraphs) {
      if (!paragraph) { lines.push(''); continue; }
      const words = paragraph.split(/\s+/);
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
        else { lines.push(line); line = word; }
      }
      lines.push(line);
    }
    return lines;
  }

  function drawClampedText(ctx, text, x, y, maxWidth, lineHeight, maxLines, { ellipsis = true } = {}) {
    const lines = wrapCanvasLines(ctx, text, maxWidth);
    const visible = lines.slice(0, maxLines);
    if (ellipsis && lines.length > maxLines && visible.length) {
      let last = visible.at(-1);
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length) last = last.slice(0, -1);
      visible[visible.length - 1] = `${last}…`;
    }
    visible.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return y + visible.length * lineHeight;
  }

  function exportBounds(mode) {
    if (mode === 'viewport') {
      const v = currentBoard().viewport;
      return {
        x: clamp(-v.x / v.zoom, 0, WORLD.width),
        y: clamp(-v.y / v.zoom, 0, WORLD.height),
        width: Math.min(els.viewport.clientWidth / v.zoom, WORLD.width),
        height: Math.min(els.viewport.clientHeight / v.zoom, WORLD.height)
      };
    }
    if (mode === 'selection') return contentBounds(ui.selection);
    return contentBounds();
  }

  function exportIncludes(mode) {
    if (mode !== 'selection') return { objectIds: null, connectorIds: null };
    const ids = new Set(selectedIds());
    const objectIds = new Set(currentBoard().objects.filter(obj => ids.has(obj.id)).map(obj => obj.id));
    const connectorIds = new Set(currentBoard().connectors.filter(connector => ids.has(connector.id) || (objectIds.has(connector.fromId) && objectIds.has(connector.toId))).map(connector => connector.id));
    return { objectIds, connectorIds };
  }

  function drawExportBackground(ctx, bounds) {
    const palette = paletteForCanvas();
    ctx.fillStyle = palette.background;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    const background = currentBoard().background;
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.grid;
    ctx.lineWidth = 1;
    if (background === 'dots') {
      const startX = Math.floor(bounds.x / 24) * 24;
      const startY = Math.floor(bounds.y / 24) * 24;
      for (let x = startX; x < bounds.x + bounds.width; x += 24) {
        for (let y = startY; y < bounds.y + bounds.height; y += 24) {
          ctx.beginPath(); ctx.arc(x, y, 1.05, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (background === 'grid') {
      const startX = Math.floor(bounds.x / 32) * 32;
      const startY = Math.floor(bounds.y / 32) * 32;
      ctx.beginPath();
      for (let x = startX; x < bounds.x + bounds.width; x += 32) { ctx.moveTo(x, bounds.y); ctx.lineTo(x, bounds.y + bounds.height); }
      for (let y = startY; y < bounds.y + bounds.height; y += 32) { ctx.moveTo(bounds.x, y); ctx.lineTo(bounds.x + bounds.width, y); }
      ctx.stroke();
    } else if (background === 'ruled') {
      const startY = Math.floor(bounds.y / 30) * 30;
      ctx.beginPath();
      for (let y = startY; y < bounds.y + bounds.height; y += 30) { ctx.moveTo(bounds.x, y); ctx.lineTo(bounds.x + bounds.width, y); }
      ctx.stroke();
    }
  }

  function withCanvasObjectTransform(ctx, obj, draw) {
    ctx.save();
    const rotation = (Number(obj.rotation) || 0) * Math.PI / 180;
    if (rotation) {
      ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
      ctx.rotate(rotation);
      ctx.translate(-(obj.x + obj.width / 2), -(obj.y + obj.height / 2));
    }
    draw();
    ctx.restore();
  }

  function drawFrameExport(ctx, frame, palette) {
    const colors = { neutral: '#767b7e', blue: '#537f93', green: '#5d8460', coral: '#a76a58', lavender: '#78658e' };
    const color = colors[frame.color] || colors.neutral;
    ctx.save();
    ctx.globalAlpha = .15;
    ctx.fillStyle = color;
    canvasRoundRect(ctx, frame.x, frame.y, frame.width, frame.height, 18);
    ctx.fill();
    ctx.globalAlpha = .65;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const headerW = Math.min(frame.width - 24, Math.max(160, ctx.measureText(frame.title || 'Frame').width + 60));
    ctx.fillStyle = palette.background;
    canvasRoundRect(ctx, frame.x + 12, frame.y - 16, headerW, 33, 9);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha = .7;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.ink;
    ctx.font = '800 12px Inter, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(frame.title || 'Frame', frame.x + 23, frame.y + .5, headerW - 30);
    if (frame.description) {
      ctx.font = '11px Inter, Arial, sans-serif';
      ctx.fillStyle = palette.muted;
      ctx.textBaseline = 'top';
      drawClampedText(ctx, frame.description, frame.x + 16, frame.y + 29, frame.width - 32, 15, 4);
    }
    ctx.restore();
  }

  function drawConnectorExport(ctx, connector) {
    const geo = connectorGeometry(connector);
    if (!geo) return;
    ctx.save();
    ctx.strokeStyle = connector.stroke;
    ctx.fillStyle = connector.stroke;
    ctx.lineWidth = connector.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(connector.dash === 'dashed' ? [9,7] : connector.dash === 'dotted' ? [2,7] : []);
    ctx.beginPath();
    ctx.moveTo(geo.a.x, geo.a.y);
    if (geo.c) ctx.quadraticCurveTo(geo.c.x, geo.c.y, geo.b.x, geo.b.y);
    else ctx.lineTo(geo.b.x, geo.b.y);
    ctx.stroke();
    if (connector.arrow) {
      let angle;
      if (geo.c) angle = Math.atan2(geo.b.y - geo.c.y, geo.b.x - geo.c.x);
      else angle = Math.atan2(geo.b.y - geo.a.y, geo.b.x - geo.a.x);
      const size = 9 + connector.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(geo.b.x, geo.b.y);
      ctx.lineTo(geo.b.x - size * Math.cos(angle - Math.PI / 6), geo.b.y - size * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(geo.b.x - size * Math.cos(angle + Math.PI / 6), geo.b.y - size * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
    if (connector.label) {
      const p = connectorLabelPosition(geo);
      const palette = paletteForCanvas();
      ctx.font = '700 12px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const width = ctx.measureText(connector.label).width + 12;
      ctx.fillStyle = palette.background;
      canvasRoundRect(ctx, p.x - width / 2, p.y - 23, width, 19, 6);
      ctx.fill();
      ctx.fillStyle = palette.ink;
      ctx.fillText(connector.label, p.x, p.y - 7);
    }
    ctx.restore();
  }

  function drawDrawingExport(ctx, drawing) {
    if (!drawing.points?.length) return;
    ctx.save();
    ctx.strokeStyle = drawing.stroke;
    ctx.lineWidth = drawing.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
    if (drawing.points.length === 1) ctx.lineTo(drawing.points[0].x + .01, drawing.points[0].y + .01);
    else {
      for (let i = 1; i < drawing.points.length - 1; i++) {
        const p = drawing.points[i];
        const n = drawing.points[i + 1];
        ctx.quadraticCurveTo(p.x, p.y, (p.x + n.x) / 2, (p.y + n.y) / 2);
      }
      const last = drawing.points.at(-1);
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function noteTextColor(obj) { return obj.color === 'charcoal' ? '#f4f6f7' : '#101619'; }

  function drawNotePaper(ctx, obj, palette, headerHeight) {
    const fill = palette.notes[obj.color] || palette.notes.yellow;
    ctx.save();
    ctx.shadowColor = effectiveTheme() === 'dark' ? 'rgba(0,0,0,.35)' : 'rgba(35,39,41,.18)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 7;
    ctx.fillStyle = fill;
    canvasRoundRect(ctx, obj.x, obj.y, obj.width, obj.height, 11);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = obj.color === 'charcoal' ? 'rgba(255,255,255,.12)' : 'rgba(35,40,42,.14)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = obj.color === 'charcoal' ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.14)';
    ctx.fillRect(obj.x, obj.y, obj.width, headerHeight);
    ctx.strokeStyle = obj.color === 'charcoal' ? 'rgba(255,255,255,.11)' : 'rgba(35,40,42,.10)';
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y + headerHeight);
    ctx.lineTo(obj.x + obj.width, obj.y + headerHeight);
    ctx.stroke();
    ctx.restore();
  }

  function drawBlankNoteExport(ctx, obj, palette) {
    withCanvasObjectTransform(ctx, obj, () => {
      drawNotePaper(ctx, obj, palette, 38);
      const ink = noteTextColor(obj);
      ctx.save();
      ctx.beginPath();
      canvasRoundRect(ctx, obj.x, obj.y, obj.width, obj.height, 11);
      ctx.clip();
      ctx.fillStyle = ink;
      ctx.textBaseline = 'middle';
      ctx.font = '800 13px Avenir, Arial, sans-serif';
      ctx.fillText(obj.title || 'Blank Note', obj.x + 27, obj.y + 19, obj.width - 52 - (obj.tag ? 75 : 0));
      if (obj.tag) {
        ctx.font = '800 9px Inter, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(obj.tag.toUpperCase(), obj.x + obj.width - 12, obj.y + 19, 80);
        ctx.textAlign = 'left';
      }
      let y = obj.y + 54;
      if (obj.title) {
        ctx.font = '800 17px Avenir, Arial, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(obj.title, obj.x + 14, y, obj.width - 28);
        y += 27;
      }
      ctx.font = '14px Avenir, Arial, sans-serif';
      ctx.textBaseline = 'top';
      if (obj.checklist) {
        const lines = obj.content.split(/\r?\n/).filter(line => line.trim());
        for (let i = 0; i < lines.length && y < obj.y + obj.height - 20; i++) {
          ctx.strokeStyle = ink;
          ctx.globalAlpha = .84;
          ctx.strokeRect(obj.x + 15, y + 1, 12, 12);
          if (obj.checkedItems[i]) {
            ctx.beginPath(); ctx.moveTo(obj.x + 17, y + 7); ctx.lineTo(obj.x + 21, y + 11); ctx.lineTo(obj.x + 26, y + 3); ctx.stroke();
          }
          ctx.globalAlpha = obj.checkedItems[i] ? .78 : 1;
          drawClampedText(ctx, lines[i], obj.x + 35, y, obj.width - 50, 18, 2);
          ctx.globalAlpha = 1;
          y += 25;
        }
      } else {
        drawClampedText(ctx, obj.content || '', obj.x + 14, y, obj.width - 28, 20, Math.max(1, Math.floor((obj.y + obj.height - 16 - y) / 20)));
      }
      ctx.restore();
    });
  }

  function drawCanvasBadge(ctx, text, x, y, maxWidth, fill = 'rgba(255,255,255,.25)', ink = '#101619') {
    ctx.save();
    ctx.font = '800 9px Inter, Arial, sans-serif';
    const width = Math.min(maxWidth, ctx.measureText(text).width + 14);
    ctx.fillStyle = fill;
    canvasRoundRect(ctx, x, y, width, 19, 9.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(35,40,42,.12)';
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 7, y + 9.5, width - 12);
    ctx.restore();
    return width;
  }

  function drawKanbanNoteExport(ctx, obj, palette) {
    withCanvasObjectTransform(ctx, obj, () => {
      drawNotePaper(ctx, obj, palette, 52);
      const ink = noteTextColor(obj);
      const f = obj.fields;
      ctx.save();
      ctx.beginPath();
      canvasRoundRect(ctx, obj.x, obj.y, obj.width, obj.height, 11);
      ctx.clip();
      ctx.fillStyle = ink;
      ctx.textBaseline = 'top';
      ctx.font = '900 14px Avenir, Arial, sans-serif';
      ctx.fillText(f.ticketNumber || 'Untitled Ticket', obj.x + 28, obj.y + 9, obj.width - 95);
      ctx.font = '800 8px Inter, Arial, sans-serif';
      ctx.fillText('KANBAN', obj.x + obj.width - 58, obj.y + 12, 48);
      let badgeX = obj.x + 28;
      const badgeY = obj.y + 29;
      badgeX += drawCanvasBadge(ctx, f.ticketType || 'Story', badgeX, badgeY, 105, 'rgba(255,255,255,.24)', ink) + 5;
      badgeX += drawCanvasBadge(ctx, f.status || 'Backlog', badgeX, badgeY, Math.max(90, obj.width - (badgeX - obj.x) - 12), 'rgba(255,255,255,.24)', ink) + 5;
      if (f.onHold && badgeX < obj.x + obj.width - 60) badgeX += drawCanvasBadge(ctx, 'On Hold', badgeX, badgeY, 70, 'rgba(177,120,35,.24)', ink) + 5;
      if (f.needsVP && badgeX < obj.x + obj.width - 60) drawCanvasBadge(ctx, 'Needs VP', badgeX, badgeY, 80, 'rgba(255,255,255,.24)', ink);

      const compact = obj.displayMode === 'compact';
      const fields = compact
        ? KANBAN_SCHEMA.fields.filter(field => KANBAN_SCHEMA.compactViewFields.includes(field.key) && !['ticketNumber','ticketType','status'].includes(field.key))
        : KANBAN_SCHEMA.fields;
      let y = obj.y + 66;
      const bottom = obj.y + obj.height - 15;
      for (const field of fields) {
        if (y > bottom - 24) break;
        const display = kanbanDisplayValue(field, f[field.key]) || '—';
        ctx.fillStyle = ink;
        ctx.globalAlpha = 1;
        ctx.font = '800 9px Inter, Arial, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(field.label.toUpperCase(), obj.x + 13, y, obj.width - 26);
        ctx.globalAlpha = display === '—' ? .78 : 1;
        ctx.font = '13px Avenir, Arial, sans-serif';
        const maxLines = field.key === 'description' ? Math.max(2, Math.min(5, Math.floor((bottom - y - 14) / 17))) : 2;
        const nextY = drawClampedText(ctx, display, obj.x + 13, y + 13, obj.width - 26, 17, maxLines);
        ctx.globalAlpha = 1;
        y = nextY + 7;
      }
      ctx.restore();
    });
  }

  function fillStickerPath(ctx, data, fill, stroke = '#fff', lineWidth = 6) {
    const path = new Path2D(data);
    ctx.fillStyle = fill;
    ctx.fill(path);
    if (stroke && lineWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke(path);
    }
  }

  function drawStickerGlyph(ctx, stickerId) {
    const thumbPath = 'M29 43h16l6-23c1.3-5.5 7.5-8.3 12-5.2 3.1 2.1 4.3 5.9 3.3 9.6L62 40h18c7.1 0 11.9 6.8 9.8 13.5l-7 23.2A11 11 0 0 1 72.3 85H29Z';
    if (stickerId === 'thumbs-up' || stickerId === 'thumbs-down') {
      ctx.save();
      if (stickerId === 'thumbs-down') { ctx.translate(100, 100); ctx.rotate(Math.PI); }
      fillStickerPath(ctx, thumbPath, stickerId === 'thumbs-up' ? '#4389d6' : '#e1695d');
      ctx.fillStyle = stickerId === 'thumbs-up' ? '#2e6cae' : '#b74840';
      canvasRoundRect(ctx, 10, 42, 22, 45, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.restore();
      return;
    }
    if (stickerId === 'check' || stickerId === 'red-x' || stickerId === 'exclamation' || stickerId === 'question' || stickerId === 'plus' || stickerId === 'minus') {
      const fills = { check: '#35a85a', 'red-x': '#d94b48', exclamation: '#d94b48', question: '#f0c84d', plus: '#34a66a', minus: '#db6558' };
      ctx.fillStyle = fills[stickerId]; ctx.beginPath(); ctx.arc(50, 50, 39, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (stickerId === 'check') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(28,51); ctx.lineTo(42,66); ctx.lineTo(73,33); ctx.stroke(); }
      else if (stickerId === 'red-x') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(34,34); ctx.lineTo(66,66); ctx.moveTo(66,34); ctx.lineTo(34,66); ctx.stroke(); }
      else if (stickerId === 'exclamation') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(50,27); ctx.lineTo(50,58); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(50,72,5.5,0,Math.PI*2); ctx.fill(); }
      else if (stickerId === 'question') { ctx.fillStyle = '#293136'; ctx.font = '900 56px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 50, 54); }
      else if (stickerId === 'plus') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(50,29); ctx.lineTo(50,71); ctx.moveTo(29,50); ctx.lineTo(71,50); ctx.stroke(); }
      else { ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(29,50); ctx.lineTo(71,50); ctx.stroke(); }
      return;
    }
    if (stickerId === 'blue-box') {
      ctx.fillStyle = '#3784d4'; canvasRoundRect(ctx, 12,12,76,76,13); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; canvasRoundRect(ctx,26,26,48,48,6); ctx.stroke(); return;
    }
    if (stickerId.startsWith('arrow-')) {
      const paths = {
        'arrow-right': 'M8 37h46V19l38 31-38 31V63H8Z',
        'arrow-left': 'M92 37H46V19L8 50l38 31V63h46Z',
        'arrow-up': 'M37 92V46H19L50 8l31 38H63v46Z',
        'arrow-down': 'M37 8v46H19l31 38 31-38H63V8Z'
      };
      fillStickerPath(ctx, paths[stickerId], stickerId === 'arrow-right' || stickerId === 'arrow-left' ? '#4d75cf' : '#3a9c9a'); return;
    }
    if (stickerId === 'star') { fillStickerPath(ctx, 'M50 9l12.4 25.1 27.7 4-20 19.5 4.7 27.5L50 72.1 25.2 85.1l4.7-27.5-20-19.5 27.7-4Z', '#f0b83f'); return; }
    if (stickerId === 'heart') { fillStickerPath(ctx, 'M50 84 16 52C-2 35 8 13 28 13c10 0 18 5 22 13 4-8 12-13 22-13 20 0 30 22 12 39Z', '#e35c6d'); return; }
    if (stickerId === 'idea') {
      fillStickerPath(ctx, 'M50 10c-20 0-34 14-34 33 0 13 7 22 16 29 4 3 6 7 6 12h24c0-5 2-9 6-12 9-7 16-16 16-29 0-19-14-33-34-33Z', '#f0c84d');
      ctx.strokeStyle = '#65531d'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(38,85); ctx.lineTo(62,85); ctx.moveTo(41,94); ctx.lineTo(59,94); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(50,27); ctx.lineTo(50,51); ctx.moveTo(38,39); ctx.lineTo(62,39); ctx.stroke(); return;
    }
    if (stickerId === 'flag') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(25,89); ctx.lineTo(25,12); ctx.stroke();
      fillStickerPath(ctx, 'M28 16h54L68 36l14 20H28Z', '#df554e');
      ctx.fillStyle = '#384247'; ctx.beginPath(); ctx.arc(25,12,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); return;
    }
    drawStickerGlyph(ctx, 'check');
  }

  function drawStickerExport(ctx, obj) {
    const sticker = stickerDefinition(obj.stickerId);
    ctx.save();
    ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
    ctx.rotate((Number(obj.rotation) || 0) * Math.PI / 180);
    ctx.translate(-obj.width / 2, -obj.height / 2);
    const scale = Math.min(obj.width / 100, obj.height / 100);
    ctx.translate((obj.width - 100 * scale) / 2, (obj.height - 100 * scale) / 2);
    ctx.scale(scale, scale);
    ctx.shadowColor = effectiveTheme() === 'dark' ? 'rgba(0,0,0,.38)' : 'rgba(28,32,34,.22)';
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 4;
    drawStickerGlyph(ctx, sticker.id);
    ctx.restore();
  }

  function drawTextExport(ctx, obj, palette) {
    ctx.save();
    ctx.fillStyle = obj.textColor || palette.ink;
    ctx.font = `760 ${obj.fontSize}px Inter, Arial, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = obj.align || 'left';
    const x = obj.align === 'center' ? obj.x + obj.width / 2 : obj.align === 'right' ? obj.x + obj.width : obj.x;
    const lines = wrapCanvasLines(ctx, obj.text, obj.width);
    lines.slice(0, Math.max(1, Math.floor(obj.height / (obj.fontSize * 1.25)))).forEach((line, index) => ctx.fillText(line, x, obj.y + index * obj.fontSize * 1.25, obj.width));
    ctx.restore();
  }

  function renderBoardCanvas(mode = 'board') {
    const baseBounds = exportBounds(mode);
    if (!baseBounds || baseBounds.width <= 0 || baseBounds.height <= 0) throw new Error('There is no board content to export.');
    const margin = mode === 'viewport' ? 0 : 60;
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
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(bounds.width * scale));
    canvas.height = Math.max(1, Math.ceil(bounds.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.translate(-bounds.x, -bounds.y);
    drawExportBackground(ctx, bounds);
    const include = exportIncludes(mode);
    const objectAllowed = obj => !include.objectIds || include.objectIds.has(obj.id);
    const connectorAllowed = connector => !include.connectorIds || include.connectorIds.has(connector.id);
    const objects = currentBoard().objects.filter(objectAllowed);
    const palette = paletteForCanvas();
    objects.filter(obj => obj.objectType === 'frame').sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).forEach(frame => drawFrameExport(ctx, frame.collapsed ? { ...frame, description: '' } : frame, palette));
    currentBoard().connectors.filter(connectorAllowed).forEach(connector => drawConnectorExport(ctx, connector));
    objects.filter(obj => obj.objectType === 'drawing').forEach(drawing => drawDrawingExport(ctx, drawing));
    objects.filter(obj => obj.objectType !== 'frame' && obj.objectType !== 'drawing').sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).forEach(obj => {
      if (obj.objectType === 'blank-note') drawBlankNoteExport(ctx, obj, palette);
      else if (obj.objectType === 'template-note') drawKanbanNoteExport(ctx, obj, palette);
      else if (obj.objectType === 'text') drawTextExport(ctx, obj, palette);
      else if (obj.objectType === 'sticker') drawStickerExport(ctx, obj);
    });
    return { canvas, bounds, scale };
  }

  function canvasBlob(canvas, type = 'image/png', quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not create the image file.')), type, quality));
  }

  async function exportPNG(mode = 'board') {
    closePopover();
    try {
      toast('Rendering a clean board image…');
      const { canvas } = renderBoardCanvas(mode);
      const blob = await canvasBlob(canvas);
      const suffix = mode === 'viewport' ? '-viewport' : mode === 'selection' ? '-selection' : '';
      downloadBlob(blob, `${slugify(currentBoard().name)}${suffix}.png`);
      toast('PNG export complete.', 'success');
    } catch (error) {
      console.error('TACKBOARD PNG export error', error);
      toast(error.message || 'PNG export failed.', 'error', 5500);
    }
  }

  function canvasTiles(canvas, { maxPageWidth = 1600, pageAspect = 11 / 8.5 } = {}) {
    const maxPageHeight = Math.round(maxPageWidth / pageAspect);
    const columns = Math.max(1, Math.ceil(canvas.width / maxPageWidth));
    const rows = Math.max(1, Math.ceil(canvas.height / maxPageHeight));
    const tileWidth = Math.ceil(canvas.width / columns);
    const tileHeight = Math.ceil(canvas.height / rows);
    const pages = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const sx = column * tileWidth;
        const sy = row * tileHeight;
        const sw = Math.min(tileWidth, canvas.width - sx);
        const sh = Math.min(tileHeight, canvas.height - sy);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = Math.max(1, sw);
        pageCanvas.height = Math.max(1, sh);
        const pageContext = pageCanvas.getContext('2d');
        pageContext.fillStyle = '#ffffff';
        pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageContext.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        pages.push({ dataURL: pageCanvas.toDataURL('image/png'), row, column, rows, columns });
      }
    }
    return pages;
  }

  async function exportPDF(mode = 'board', { tiled = false } = {}) {
    closePopover();
    if (mode === 'selection' && !selectedIds().length) return toast('Select one or more objects first.');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast('The browser blocked the print window. Allow pop-ups for this site and try again.', 'error', 6000);
    try {
      printWindow.opener = null;
      printWindow.document.write('<!doctype html><title>Preparing TACKBOARD PDF…</title><body style="font-family:system-ui,sans-serif;padding:30px">Preparing clean board pages…</body>');
      const { canvas } = renderBoardCanvas(mode);
      const pages = tiled ? canvasTiles(canvas) : [{ dataURL: canvas.toDataURL('image/png'), row: 0, column: 0, rows: 1, columns: 1 }];
      const title = escapeHTML(currentBoard().name);
      const scopeLabel = mode === 'viewport' ? 'Visible Viewport' : mode === 'selection' ? 'Selection' : tiled ? 'Entire Board — Tiled' : 'Entire Board';
      const pageHTML = pages.map((page, index) => `<section class="print-page"><header><strong>${title}</strong><span>${escapeHTML(scopeLabel)}${pages.length > 1 ? ` · Page ${index + 1} of ${pages.length}` : ''}</span></header><div class="page-image"><img src="${page.dataURL}" alt="${title}, page ${index + 1}"></div></section>`).join('');
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title} — TACKBOARD</title><style>
        @page{size:landscape;margin:8mm}
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;background:#fff;color:#252a2e;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .print-page{width:100%;height:calc(100vh - 2mm);display:grid;grid-template-rows:auto 1fr;gap:4mm;break-after:page;page-break-after:always;overflow:hidden}
        .print-page:last-child{break-after:auto;page-break-after:auto}
        header{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:10pt;color:#60686d}
        header strong{font-size:12pt;color:#252a2e}
        .page-image{min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
        img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}
        @media screen{body{padding:20px;background:#e6e8e9}.print-page{max-width:1100px;min-height:720px;margin:0 auto 20px;padding:24px;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.16)}}
        @media print{.print-page{height:calc(100vh - 1mm)}}
      </style></head><body>${pageHTML}<script>
        const images=[...document.images];
        Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve}))).then(()=>setTimeout(()=>window.print(),180));
      <\/script></body></html>`);
      printWindow.document.close();
      toast(`${pages.length > 1 ? `${pages.length}-page` : 'One-page'} print view opened. Choose “Save as PDF” in the print destination.`, 'success', 5600);
    } catch (error) {
      printWindow.close();
      console.error('TACKBOARD PDF export error', error);
      toast(error.message || 'PDF export failed.', 'error', 5500);
    }
  }

  function toast(message, type = 'info', duration = 3200) {
    const node = document.createElement('div');
    node.className = `toast ${type === 'error' || type === 'success' ? type : ''}`;
    node.textContent = message;
    els.toastHost.appendChild(node);
    setTimeout(() => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(-4px)';
      setTimeout(() => node.remove(), 180);
    }, duration);
  }

  function setTool(tool) {
    if (!['select', 'pan', 'sticky', 'sticker', 'text', 'pen', 'connector', 'frame', 'eraser'].includes(tool)) return;
    if (ui.editingId && tool !== 'select') finishEditing({ render: false });
    if (ui.tool === 'connector' && tool !== 'connector') {
      ui.connectorSourceId = null;
      els.wirePreview.hidden = true;
    }
    ui.tool = tool;
    closePopover();
    updateToolUI();
    if (tool === 'select' || tool === 'pan') els.viewport.focus({ preventScroll: true });
  }

  function createDefaultSticky(point) {
    if (state.settings.defaultStickyType === 'kanban') addKanbanNote(point, { edit: true });
    else addBlankNote(point, { edit: true });
    setTool('select');
  }

  function updateObjectElement(obj) {
    if (obj.objectType === 'drawing') return;
    const el = els.objectLayer.querySelector(`[data-object-id="${cssEscape(obj.id)}"]`);
    if (!el) return;
    el.style.left = `${round(obj.x)}px`;
    el.style.top = `${round(obj.y)}px`;
    el.style.width = `${round(obj.width)}px`;
    el.style.height = `${round(obj.height)}px`;
    if (!['frame', 'text'].includes(obj.objectType)) el.style.transform = `rotate(${Number(obj.rotation) || 0}deg)`;
  }

  function hideGuides() {
    els.guideV.style.display = 'none';
    els.guideH.style.display = 'none';
  }

  function updateAlignmentGuides(primary) {
    hideGuides();
    if (!state.settings.alignmentGuides || !primary || primary.objectType === 'drawing') return;
    const tolerance = 5 / currentBoard().viewport.zoom;
    const moving = objectRect(primary);
    const movingX = [moving.x, moving.cx, moving.right];
    const movingY = [moving.y, moving.cy, moving.bottom];
    let vMatch = null, hMatch = null;
    for (const other of currentBoard().objects) {
      if (ui.selection.has(other.id) || other.objectType === 'drawing') continue;
      const rect = objectRect(other);
      const otherX = [rect.x, rect.cx, rect.right];
      const otherY = [rect.y, rect.cy, rect.bottom];
      if (vMatch === null) {
        outerX: for (const mx of movingX) for (const ox of otherX) if (Math.abs(mx - ox) <= tolerance) { vMatch = ox; break outerX; }
      }
      if (hMatch === null) {
        outerY: for (const my of movingY) for (const oy of otherY) if (Math.abs(my - oy) <= tolerance) { hMatch = oy; break outerY; }
      }
      if (vMatch !== null && hMatch !== null) break;
    }
    if (vMatch !== null) {
      const screen = worldToScreen(vMatch, 0);
      els.guideV.style.left = `${screen.x - els.viewport.getBoundingClientRect().left}px`;
      els.guideV.style.display = 'block';
    }
    if (hMatch !== null) {
      const screen = worldToScreen(0, hMatch);
      els.guideH.style.top = `${screen.y - els.viewport.getBoundingClientRect().top}px`;
      els.guideH.style.display = 'block';
    }
  }

  function ensureActionHistory(action, label) {
    if (action.historyPushed) return;
    pushHistory(label);
    action.historyPushed = true;
  }

  function startPan(event, { clearSelectionOnTap = false } = {}) {
    finishEditing({ render: false });
    closePopover();
    ui.action = {
      type: 'pan', pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startViewport: deepClone(currentBoard().viewport),
      clearSelectionOnTap,
      moved: false
    };
    els.viewport.classList.add('panning');
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function startDrag(event, id) {
    const obj = getObject(id);
    if (!obj) return;
    if (!ui.selection.has(id)) selectId(id, { additive: event.shiftKey, toggle: false, bypassGroup: event.altKey });
    const ids = new Set(selectedObjects().map(item => item.id));
    if (obj.objectType === 'frame' && event.altKey) {
      const frameRect = objectRect(obj);
      currentBoard().objects.forEach(item => {
        if (item.id === obj.id || item.objectType === 'drawing') return;
        const center = objectRect(item);
        if (center.cx >= frameRect.x && center.cx <= frameRect.right && center.cy >= frameRect.y && center.cy <= frameRect.bottom) ids.add(item.id);
      });
    }
    const initial = new Map();
    for (const itemId of ids) {
      const item = getObject(itemId);
      if (!item) continue;
      initial.set(itemId, item.objectType === 'drawing' ? { points: deepClone(item.points) } : { x: item.x, y: item.y });
    }
    ui.action = {
      type: 'drag', pointerId: event.pointerId, id, ids: Array.from(ids),
      startWorld: screenToWorld(event.clientX, event.clientY),
      initial, historyPushed: false, moved: false
    };
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function minimumSize(obj) {
    if (obj.objectType === 'template-note') return obj.displayMode === 'compact' ? { width: 300, height: 230 } : { width: 320, height: 390 };
    if (obj.objectType === 'blank-note') return { width: 180, height: 130 };
    if (obj.objectType === 'frame') return { width: 200, height: 120 };
    if (obj.objectType === 'text') return { width: 80, height: 36 };
    if (obj.objectType === 'sticker') return { width: 44, height: 44 };
    return { width: 40, height: 40 };
  }

  function startResize(event, id, handle) {
    const obj = getObject(id);
    if (!obj) return;
    if (!ui.selection.has(id)) selectId(id);
    ui.action = {
      type: 'resize', pointerId: event.pointerId, id, handle,
      startWorld: screenToWorld(event.clientX, event.clientY),
      initial: { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
      historyPushed: false, moved: false
    };
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function startMarquee(event, { additive = false } = {}) {
    const rect = els.viewport.getBoundingClientRect();
    ui.action = {
      type: 'marquee', pointerId: event.pointerId,
      additive,
      startClient: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      currentClient: { x: event.clientX - rect.left, y: event.clientY - rect.top }
    };
    els.marquee.style.display = 'block';
    els.contextToolbar.classList.remove('visible');
    els.viewport.classList.add('marquee-selecting');
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function startFrameDraw(event) {
    const rect = els.viewport.getBoundingClientRect();
    ui.action = {
      type: 'frame-draw', pointerId: event.pointerId,
      startClient: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      startWorld: screenToWorld(event.clientX, event.clientY),
      currentClient: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      currentWorld: screenToWorld(event.clientX, event.clientY)
    };
    els.framePreview.style.display = 'block';
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function startDrawing(event) {
    const point = screenToWorld(event.clientX, event.clientY);
    ui.action = { type: 'draw', pointerId: event.pointerId, points: [point] };
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = 'temporaryDrawing';
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', state.settings.penColor);
    path.setAttribute('stroke-width', state.settings.penWidth);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.style.pointerEvents = 'none';
    els.drawingGroup.appendChild(path);
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function connectorPreviewPath(sourceId, point) {
    const source = getObject(sourceId);
    if (!source) return '';
    const rect = objectRect(source);
    const a = edgePoint(rect, point);
    if (state.settings.connectorStyle === 'straight') return `M ${a.x} ${a.y} L ${point.x} ${point.y}`;
    const dx = point.x - a.x, dy = point.y - a.y;
    const distance = Math.hypot(dx,dy) || 1;
    const curve = Math.min(80, Math.max(22, distance * .15));
    const c = { x: (a.x + point.x) / 2 - dy / distance * curve, y: (a.y + point.y) / 2 + dx / distance * curve };
    return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${point.x} ${point.y}`;
  }

  function startWire(event, sourceId) {
    ui.connectorSourceId = sourceId;
    ui.action = { type: 'wire', pointerId: event.pointerId, sourceId };
    els.wirePreview.hidden = false;
    els.wirePreview.setAttribute('d', connectorPreviewPath(sourceId, screenToWorld(event.clientX, event.clientY)));
    try { els.viewport.setPointerCapture?.(event.pointerId); } catch {}
  }

  function handleConnectorClick(id) {
    const obj = getObject(id);
    if (!obj || !['blank-note', 'template-note', 'text', 'sticker', 'frame'].includes(obj.objectType)) return;
    if (!ui.connectorSourceId) {
      ui.connectorSourceId = id;
      ui.selection.clear();
      renderAll();
      toast('Connector started. Choose another object to finish it.');
      return;
    }
    if (ui.connectorSourceId === id) {
      ui.connectorSourceId = null;
      toast('Connector cancelled.');
      renderAll();
      return;
    }
    createConnector(ui.connectorSourceId, id);
    ui.connectorSourceId = null;
  }

  function createConnector(fromId, toId) {
    if (!getObject(fromId) || !getObject(toId) || fromId === toId) return;
    pushHistory('Create connector');
    const connector = normalizeConnector({
      id: uuid('connector'), fromId, toId,
      style: state.settings.connectorStyle,
      arrow: state.settings.connectorArrow,
      stroke: state.settings.connectorColor,
      strokeWidth: state.settings.connectorWidth,
      dash: 'solid', label: ''
    });
    currentBoard().connectors.push(connector);
    ui.selection.clear();
    ui.selection.add(connector.id);
    touchBoard();
    renderAll();
    toast('Objects connected.', 'success');
  }

  function eraseId(id) {
    const obj = getObject(id);
    const connector = getConnector(id);
    if (!connector && obj?.objectType !== 'drawing') {
      toast('The eraser removes pen strokes and connectors. Use Delete for notes and frames.');
      return;
    }
    pushHistory('Erase');
    if (connector) currentBoard().connectors = currentBoard().connectors.filter(item => item.id !== id);
    if (obj) currentBoard().objects = currentBoard().objects.filter(item => item.id !== id);
    ui.selection.delete(id);
    touchBoard();
    renderAll();
  }

  function updateBoxPreview(element, start, current) {
    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  }

  function updateDragAction(action, event) {
    const point = screenToWorld(event.clientX, event.clientY);
    const dx = point.x - action.startWorld.x;
    const dy = point.y - action.startWorld.y;
    if (!action.moved && Math.hypot(dx, dy) < 1.2 / currentBoard().viewport.zoom) return;
    action.moved = true;
    ensureActionHistory(action, action.ids.length > 1 ? 'Move objects' : 'Move object');
    for (const id of action.ids) {
      const obj = getObject(id);
      const initial = action.initial.get(id);
      if (!obj || !initial) continue;
      if (obj.objectType === 'drawing') {
        obj.points = initial.points.map(p => ({ x: clamp(p.x + dx, 0, WORLD.width), y: clamp(p.y + dy, 0, WORLD.height) }));
      } else {
        obj.x = clamp(initial.x + dx, 0, WORLD.width - obj.width);
        obj.y = clamp(initial.y + dy, 0, WORLD.height - obj.height);
        updateObjectElement(obj);
      }
    }
    updateAlignmentGuides(getObject(action.id));
    renderVectors();
    drawMinimap();
    updateContextToolbar();
  }

  function updateResizeAction(action, event) {
    const obj = getObject(action.id);
    if (!obj) return;
    const point = screenToWorld(event.clientX, event.clientY);
    const dx = point.x - action.startWorld.x;
    const dy = point.y - action.startWorld.y;
    if (!action.moved && Math.hypot(dx, dy) < 1) return;
    action.moved = true;
    ensureActionHistory(action, 'Resize object');
    const min = minimumSize(obj);
    if (action.handle.includes('e')) obj.width = clamp(action.initial.width + dx, min.width, WORLD.width - obj.x);
    if (action.handle.includes('s')) obj.height = clamp(action.initial.height + dy, min.height, WORLD.height - obj.y);
    obj.modifiedAt = nowISO();
    updateObjectElement(obj);
    renderVectors();
    drawMinimap();
    updateContextToolbar();
  }

  function updateMarqueeAction(action, event) {
    const rect = els.viewport.getBoundingClientRect();
    action.currentClient = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    updateBoxPreview(els.marquee, action.startClient, action.currentClient);
  }

  function updateFrameAction(action, event) {
    const rect = els.viewport.getBoundingClientRect();
    action.currentClient = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    action.currentWorld = screenToWorld(event.clientX, event.clientY);
    updateBoxPreview(els.framePreview, action.startClient, action.currentClient);
  }

  function updateDrawingAction(action, event) {
    const point = screenToWorld(event.clientX, event.clientY);
    const last = action.points.at(-1);
    if (Math.hypot(point.x - last.x, point.y - last.y) < 1.2 / currentBoard().viewport.zoom) return;
    action.points.push(point);
    $('#temporaryDrawing', els.drawingGroup)?.setAttribute('d', pointsToPath(action.points));
  }

  function updateWireAction(action, event) {
    const point = screenToWorld(event.clientX, event.clientY);
    els.wirePreview.setAttribute('d', connectorPreviewPath(action.sourceId, point));
  }

  function beginPinchIfReady() {
    if (ui.touchPoints.size !== 2) return false;
    const points = Array.from(ui.touchPoints.values());
    const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) || 1;
    const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    if (ui.action) cancelCurrentAction({ restore: true, render: false });
    clearTimeout(ui.longPressTimer);
    const rect = els.viewport.getBoundingClientRect();
    const v = deepClone(currentBoard().viewport);
    const sx = midpoint.x - rect.left;
    const sy = midpoint.y - rect.top;
    ui.pinch = {
      initialDistance: distance,
      initialMidpoint: midpoint,
      initialViewport: v,
      anchorWorld: { x: (sx - v.x) / v.zoom, y: (sy - v.y) / v.zoom }
    };
    els.viewport.classList.add('panning');
    return true;
  }

  function updatePinch() {
    if (!ui.pinch || ui.touchPoints.size < 2) return;
    const points = Array.from(ui.touchPoints.values());
    const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) || 1;
    const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    const rect = els.viewport.getBoundingClientRect();
    const zoom = clamp(ui.pinch.initialViewport.zoom * distance / ui.pinch.initialDistance, .12, 4);
    const sx = midpoint.x - rect.left;
    const sy = midpoint.y - rect.top;
    setViewport({
      zoom,
      x: sx - ui.pinch.anchorWorld.x * zoom,
      y: sy - ui.pinch.anchorWorld.y * zoom
    }, { save: false });
  }

  function simplifyStroke(points) {
    if (points.length <= 2) return points;
    const output = [points[0]];
    let last = points[0];
    for (let i = 1; i < points.length - 1; i++) {
      const point = points[i];
      if (Math.hypot(point.x - last.x, point.y - last.y) >= 1.4) {
        output.push(point);
        last = point;
      }
    }
    output.push(points.at(-1));
    return output;
  }

  function finishMarquee(action) {
    els.marquee.style.display = 'none';
    els.viewport.classList.remove('marquee-selecting');
    const rect = els.viewport.getBoundingClientRect();
    const left = Math.min(action.startClient.x, action.currentClient.x) + rect.left;
    const top = Math.min(action.startClient.y, action.currentClient.y) + rect.top;
    const right = Math.max(action.startClient.x, action.currentClient.x) + rect.left;
    const bottom = Math.max(action.startClient.y, action.currentClient.y) + rect.top;
    if (right - left < 3 && bottom - top < 3) {
      if (!action.additive) ui.selection.clear();
      renderAll();
      return;
    }
    const a = screenToWorld(left, top);
    const b = screenToWorld(right, bottom);
    const area = { x: Math.min(a.x,b.x), y: Math.min(a.y,b.y), right: Math.max(a.x,b.x), bottom: Math.max(a.y,b.y) };
    if (!action.additive) ui.selection.clear();
    const intersects = bounds => bounds && bounds.right >= area.x && bounds.x <= area.right && bounds.bottom >= area.y && bounds.y <= area.bottom;
    currentBoard().objects.forEach(obj => {
      const bounds = obj.objectType === 'drawing' ? drawingBounds(obj) : objectRect(obj);
      if (intersects(bounds)) ui.selection.add(obj.id);
    });
    currentBoard().connectors.forEach(connector => { if (intersects(getIdBounds(connector.id))) ui.selection.add(connector.id); });
    renderAll();
  }

  function finishFrameDraw(action) {
    els.framePreview.style.display = 'none';
    const a = action.startWorld;
    const b = action.currentWorld;
    const x = clamp(Math.min(a.x, b.x), 0, WORLD.width);
    const y = clamp(Math.min(a.y, b.y), 0, WORLD.height);
    const width = Math.min(Math.abs(a.x - b.x), WORLD.width - x);
    const height = Math.min(Math.abs(a.y - b.y), WORLD.height - y);
    if (width < 40 || height < 40) {
      addFrame(a);
    } else {
      const frame = normalizeObject({ id: uuid('frame'), objectType: 'frame', x, y, width: Math.max(200,width), height: Math.max(120,height), zIndex: minZ() - 1, color: 'neutral', title: 'Frame', description: '' });
      addObject(frame, { historyLabel: 'Create frame' });
    }
    setTool('select');
  }

  function finishDrawing(action) {
    $('#temporaryDrawing', els.drawingGroup)?.remove();
    const points = simplifyStroke(action.points);
    if (!points.length) return;
    pushHistory('Draw annotation');
    const bounds = unionBounds(points.map(point => ({ x: point.x, y: point.y, right: point.x, bottom: point.y, width: 0, height: 0 })));
    const drawing = normalizeObject({
      id: uuid('drawing'), objectType: 'drawing',
      x: bounds?.x || points[0].x, y: bounds?.y || points[0].y,
      width: bounds?.width || 1, height: bounds?.height || 1,
      points,
      stroke: state.settings.penColor,
      strokeWidth: state.settings.penWidth,
      zIndex: maxZ() + 1
    });
    currentBoard().objects.push(drawing);
    ui.selection.clear();
    touchBoard();
    renderAll();
  }

  function finishWire(action, event) {
    els.wirePreview.hidden = true;
    els.wirePreview.setAttribute('d', '');
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-object-id]');
    const targetId = target?.dataset.objectId;
    if (targetId && targetId !== action.sourceId) createConnector(action.sourceId, targetId);
    else toast('Connector cancelled. Drop it on another note, label, or frame.');
    ui.connectorSourceId = null;
    setTool('select');
  }

  function handlePointerMove(event) {
    if (event.pointerType === 'touch' && ui.touchPoints.has(event.pointerId)) {
      ui.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (ui.longPressOrigin && Math.hypot(event.clientX - ui.longPressOrigin.x, event.clientY - ui.longPressOrigin.y) > 9) clearTimeout(ui.longPressTimer);
      if (ui.pinch) { updatePinch(); event.preventDefault(); return; }
    }
    const action = ui.action;
    if (!action || action.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (action.type === 'pan') {
      const dx = event.clientX - action.startClient.x;
      const dy = event.clientY - action.startClient.y;
      if (!action.moved && Math.hypot(dx, dy) < 3) return;
      action.moved = true;
      setViewport({ x: action.startViewport.x + dx, y: action.startViewport.y + dy }, { save: false });
    } else if (action.type === 'drag') updateDragAction(action, event);
    else if (action.type === 'resize') updateResizeAction(action, event);
    else if (action.type === 'marquee') updateMarqueeAction(action, event);
    else if (action.type === 'frame-draw') updateFrameAction(action, event);
    else if (action.type === 'draw') updateDrawingAction(action, event);
    else if (action.type === 'wire') updateWireAction(action, event);
  }

  function handlePointerEnd(event) {
    if (event.pointerType === 'touch') {
      ui.touchPoints.delete(event.pointerId);
      clearTimeout(ui.longPressTimer);
      ui.longPressOrigin = null;
      if (ui.pinch) {
        if (ui.touchPoints.size < 2) {
          ui.pinch = null;
          els.viewport.classList.remove('panning');
          scheduleSave();
        }
        return;
      }
    }
    const action = ui.action;
    if (!action || action.pointerId !== event.pointerId) return;
    ui.action = null;
    hideGuides();
    els.viewport.classList.remove('panning');
    try { els.viewport.releasePointerCapture?.(event.pointerId); } catch {}
    if (action.type === 'pan') {
      if (action.clearSelectionOnTap && !action.moved) {
        ui.selection.clear();
        renderAll();
      } else if (action.moved) scheduleSave();
    }
    else if (action.type === 'drag' || action.type === 'resize') {
      if (action.historyPushed) {
        action.ids?.forEach(id => { const obj = getObject(id); if (obj) obj.modifiedAt = nowISO(); });
        if (action.id) { const obj = getObject(action.id); if (obj) obj.modifiedAt = nowISO(); }
        touchBoard();
      }
      renderAll();
    } else if (action.type === 'marquee') finishMarquee(action);
    else if (action.type === 'frame-draw') finishFrameDraw(action);
    else if (action.type === 'draw') finishDrawing(action);
    else if (action.type === 'wire') finishWire(action, event);
  }

  function cancelCurrentAction({ restore = true, render = true } = {}) {
    const action = ui.action;
    if (!action) return;
    if (restore && action.type === 'pan') setViewport(action.startViewport, { save: false });
    if (restore && action.type === 'drag') {
      for (const [id, initial] of action.initial.entries()) {
        const obj = getObject(id);
        if (!obj) continue;
        if (obj.objectType === 'drawing') obj.points = deepClone(initial.points);
        else { obj.x = initial.x; obj.y = initial.y; }
      }
    }
    if (restore && action.type === 'resize') {
      const obj = getObject(action.id);
      if (obj) Object.assign(obj, action.initial);
    }
    if (action.historyPushed) {
      ui.history.undo.pop();
      updateHistoryButtons();
    }
    $('#temporaryDrawing', els.drawingGroup)?.remove();
    els.marquee.style.display = 'none';
    els.viewport.classList.remove('marquee-selecting');
    els.framePreview.style.display = 'none';
    els.wirePreview.hidden = true;
    els.wirePreview.setAttribute('d', '');
    hideGuides();
    els.viewport.classList.remove('panning');
    ui.action = null;
    ui.connectorSourceId = null;
    if (render) renderAll();
  }

  function handleViewportPointerDown(event) {
    if (event.button !== 0 && event.button !== 1) return;
    if (event.target.closest?.('#emptyState [data-empty-action]')) return;
    ui.pointerWorld = screenToWorld(event.clientX, event.clientY);
    closePopover();

    if (event.pointerType === 'touch') {
      ui.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (beginPinchIfReady()) { event.preventDefault(); return; }
    }

    if (ui.spaceDown || event.button === 1 || (ui.tool === 'pan' && event.button === 0)) {
      startPan(event);
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
        selectId(id, { additive: event.shiftKey, toggle: event.shiftKey, bypassGroup: event.altKey });
        startDrag(event, id);
        event.preventDefault();
      }
      return;
    }

    if (connectorPath) {
      const id = connectorPath.dataset.connectorId;
      if (ui.tool === 'eraser') eraseId(id);
      else if (ui.tool === 'select') selectId(id, { additive: event.shiftKey, toggle: event.shiftKey, bypassGroup: true });
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
        const alreadySelected = ui.selection.has(id);
        if (!alreadySelected || event.shiftKey) selectId(id, { additive: event.shiftKey, toggle: event.shiftKey, bypassGroup: event.altKey });
        if (event.target.closest?.('[data-drag-handle]')) startDrag(event, id);
        event.preventDefault();
      }
      return;
    }

    if (ui.editingId) finishEditing({ render: true });
    if (event.pointerType === 'touch') {
      ui.longPressOrigin = { x: event.clientX, y: event.clientY };
      clearTimeout(ui.longPressTimer);
      ui.longPressTimer = setTimeout(() => {
        cancelCurrentAction({ restore: true, render: true });
        openNotePicker({ clientX: event.clientX, clientY: event.clientY }, ui.pointerWorld);
      }, 560);
      startPan(event);
      event.preventDefault();
      return;
    }
    if (ui.tool === 'select') {
      startMarquee(event, { additive: event.shiftKey || event.ctrlKey || event.metaKey });
    }
    else if (ui.tool === 'sticky') createDefaultSticky(ui.pointerWorld);
    else if (ui.tool === 'text') { addText(ui.pointerWorld); setTool('select'); }
    else if (ui.tool === 'pen') startDrawing(event);
    else if (ui.tool === 'frame') startFrameDraw(event);
    else if (ui.tool === 'connector') { ui.connectorSourceId = null; toast('Choose an object to start a connector.'); }
    event.preventDefault();
  }

  function handleViewportDoubleClick(event) {
    if (event.target.closest?.('#emptyState [data-empty-action]')) return;
    if (ui.tool === 'pan') {
      event.preventDefault();
      return;
    }
    if (isFormControl(event.target)) return;
    const objectEl = event.target.closest?.('[data-object-id]');
    if (objectEl) {
      const obj = getObject(objectEl.dataset.objectId);
      if (obj?.objectType === 'sticker') openStickerPicker({ clientX: event.clientX, clientY: event.clientY }, null, { replaceId: obj.id });
      else if (obj?.objectType === 'frame') renameFrame();
      else if (obj && ['blank-note', 'template-note', 'text'].includes(obj.objectType)) enterEdit(obj.id);
      event.preventDefault();
      return;
    }
    if (!event.target.closest?.('[data-drawing-id],[data-connector-id]')) {
      ui.pointerWorld = screenToWorld(event.clientX, event.clientY);
      addBlankNote(ui.pointerWorld, { edit: true });
      setTool('select');
      event.preventDefault();
    }
  }

  function handleViewportContextMenu(event) {
    event.preventDefault();
    const objectEl = event.target.closest?.('[data-object-id],[data-drawing-id],[data-connector-id]');
    if (objectEl) {
      const id = objectEl.dataset.objectId || objectEl.dataset.drawingId || objectEl.dataset.connectorId;
      if (!ui.selection.has(id)) selectId(id, { bypassGroup: event.altKey });
      openSelectionMore({ clientX: event.clientX, clientY: event.clientY });
    } else {
      ui.pointerWorld = screenToWorld(event.clientX, event.clientY);
      openNotePicker({ clientX: event.clientX, clientY: event.clientY }, ui.pointerWorld);
    }
  }

  function handleWheel(event) {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const factor = Math.exp(-event.deltaY * .0022);
      zoomBy(factor, event.clientX, event.clientY);
    } else {
      const v = currentBoard().viewport;
      const dx = event.shiftKey ? event.deltaY : event.deltaX;
      const dy = event.shiftKey ? 0 : event.deltaY;
      setViewport({ x: v.x - dx, y: v.y - dy });
    }
  }

  function handleObjectInput(event) {
    const root = event.target.closest('[data-object-id]');
    const obj = root ? getObject(root.dataset.objectId) : null;
    if (!obj) return;
    if (event.target.matches('[data-blank-field]')) {
      const key = event.target.dataset.blankField;
      obj[key] = event.target.value;
      obj.modifiedAt = nowISO();
      root.querySelector('.object-heading')?.replaceChildren(document.createTextNode(obj.title.trim() || 'Blank Note'));
      touchBoard();
    } else if (event.target.matches('[data-kanban-field]')) {
      const key = event.target.dataset.kanbanField;
      obj.fields[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      obj.modifiedAt = nowISO();
      if (event.target.matches('textarea')) {
        event.target.style.height = 'auto';
        event.target.style.height = `${Math.min(event.target.scrollHeight, 190)}px`;
      }
      touchBoard();
    } else if (event.target.matches('[data-text-field]')) {
      obj.text = event.target.value;
      obj.modifiedAt = nowISO();
      touchBoard();
    }
  }

  function handleObjectChange(event) {
    const root = event.target.closest('[data-object-id]');
    const obj = root ? getObject(root.dataset.objectId) : null;
    if (!obj) return;
    if (event.target.matches('[data-check-index]') && obj.objectType === 'blank-note') {
      pushHistory('Update checklist');
      const index = Number(event.target.dataset.checkIndex);
      obj.checkedItems[index] = event.target.checked;
      obj.modifiedAt = nowISO();
      touchBoard();
      renderAll();
    }
  }

  function handleObjectClick(event) {
    const root = event.target.closest('[data-object-id]');
    const obj = root ? getObject(root.dataset.objectId) : null;
    if (!obj) return;
    if (event.target.closest('[data-toggle-compact]')) {
      event.stopPropagation();
      toggleKanbanCompact(obj);
    }
  }

  function openSearch() {
    els.searchStrip.classList.add('open');
    els.searchButton.classList.add('hidden');
    requestAnimationFrame(() => {
      els.searchInput.focus();
      els.searchInput.select();
    });
  }

  function closeSearch({ clear = true } = {}) {
    els.searchStrip.classList.remove('open');
    els.searchButton.classList.remove('hidden');
    if (clear) {
      ui.searchQuery = '';
      els.searchInput.value = '';
      ui.searchResults = [];
      ui.searchIndex = -1;
      renderAll();
    }
    els.viewport.focus({ preventScroll: true });
  }

  function applySelectedObjectColor(color) {
    const objects = selectedObjects().filter(obj => ['blank-note', 'template-note', 'frame'].includes(obj.objectType));
    if (!objects.length) return;
    pushHistory('Change color');
    objects.forEach(obj => { obj.color = color; obj.modifiedAt = nowISO(); });
    closePopover();
    touchBoard();
    renderAll();
  }

  function applySelectedLineColor(color) {
    const drawings = selectedObjects().filter(obj => obj.objectType === 'drawing');
    const connectors = selectedConnectors();
    if (!drawings.length && !connectors.length) return;
    pushHistory('Change line color');
    drawings.forEach(obj => { obj.stroke = color; obj.modifiedAt = nowISO(); });
    connectors.forEach(obj => { obj.stroke = color; obj.modifiedAt = nowISO(); });
    closePopover();
    touchBoard();
    renderAll();
  }

  async function handleContextAction(action, anchor) {
    if (action === 'edit') enterEdit(selectedIds()[0]);
    else if (action === 'toggle-compact') toggleKanbanCompact();
    else if (action === 'change-sticker') openStickerPicker(anchor, null, { replaceId: selectedObjects()[0]?.id });
    else if (action === 'rename-frame') renameFrame();
    else if (action === 'edit-connector') editConnector();
    else if (action === 'align-menu') openAlignMenu(anchor);
    else if (action === 'group-menu') openGroupMenu(anchor);
    else if (action === 'color') openColorPalette(anchor);
    else if (action === 'duplicate') duplicateSelection();
    else if (action === 'connect') {
      const obj = selectedObjects()[0];
      if (obj) {
        ui.connectorSourceId = obj.id;
        ui.selection.clear();
        setTool('connector');
        renderAll();
        toast('Choose another object to finish the connector.');
      }
    } else if (action === 'more') openSelectionMore(anchor);
  }

  async function handlePopoverAction(action, source) {
    if (!action) return;
    if (action === 'new-blank') { closePopover(); addBlankNote(ui.pointerWorld, { edit: true }); setTool('select'); }
    else if (action === 'new-kanban') { closePopover(); addKanbanNote(ui.pointerWorld, { edit: true }); setTool('select'); }
    else if (action === 'open-stickers') { const anchor = ui.menuAnchor || source; openStickerPicker(anchor, ui.pointerWorld); }
    else if (action === 'new-board') createBoard();
    else if (action === 'rename-board') renameCurrentBoard();
    else if (action === 'duplicate-board') duplicateCurrentBoard();
    else if (action === 'delete-board') deleteCurrentBoard();
    else if (action === 'load-example') loadExampleBoard();
    else if (action === 'export-board-json') { closePopover(); exportBoardJSON(); }
    else if (action === 'export-selection-json') { closePopover(); exportSelectionJSON(); }
    else if (action === 'export-backup-json') { closePopover(); exportBackupJSON(); }
    else if (action === 'export-png-board') exportPNG('board');
    else if (action === 'export-png-view') exportPNG('viewport');
    else if (action === 'export-png-selection') exportPNG('selection');
    else if (action === 'export-pdf-board') exportPDF('board', { tiled: false });
    else if (action === 'export-pdf-tiled') exportPDF('board', { tiled: true });
    else if (action === 'export-pdf-view') exportPDF('viewport', { tiled: false });
    else if (action === 'export-pdf-selection') exportPDF('selection', { tiled: false });
    else if (action === 'import-json') { closePopover(); els.importInput.click(); }
    else if (action === 'reset-filters') {
      ui.filters = { template: '', ticketType: '', team: '', status: '', onHold: '', needsVP: '', due: '', from: '', to: '' };
      closePopover();
      renderAll();
    }
    else if (action.startsWith('align-')) { closePopover(); alignSelection(action.replace('align-', '')); }
    else if (action === 'distribute-h') { closePopover(); alignSelection('distribute-h'); }
    else if (action === 'distribute-v') { closePopover(); alignSelection('distribute-v'); }
    else if (action === 'group') { closePopover(); groupSelection(); }
    else if (action === 'ungroup') { closePopover(); ungroupSelection(); }
    else if (action === 'toggle-checklist') { closePopover(); toggleChecklist(); }
    else if (action === 'clear-kanban') { closePopover(); clearKanbanValues(); }
    else if (action === 'convert-kanban') { closePopover(); convertKanbanToBlank(); }
    else if (action === 'text-options') openTextOptions();
    else if (action === 'change-sticker') { const anchor = ui.menuAnchor || source; openStickerPicker(anchor, null, { replaceId: selectedObjects()[0]?.id }); }
    else if (action === 'edit-connector') { closePopover(); editConnector(); }
    else if (action === 'bring-forward') { closePopover(); layerSelection('forward'); }
    else if (action === 'send-backward') { closePopover(); layerSelection('backward'); }
    else if (action === 'bring-front') { closePopover(); layerSelection('front'); }
    else if (action === 'send-back') { closePopover(); layerSelection('back'); }
    else if (action === 'copy') { closePopover(); copySelection(); }
    else if (action === 'delete') { closePopover(); deleteSelection(); }
  }

  function handlePopoverClick(event) {
    const switchButton = event.target.closest('[data-switch-board]');
    if (switchButton) { switchBoard(switchButton.dataset.switchBoard); return; }
    const stickerChoice = event.target.closest('[data-sticker-choice]');
    if (stickerChoice) { chooseSticker(stickerChoice.dataset.stickerChoice); return; }
    const objectColor = event.target.closest('[data-object-color]');
    if (objectColor) { applySelectedObjectColor(objectColor.dataset.objectColor); return; }
    const lineColor = event.target.closest('[data-line-color]');
    if (lineColor) { applySelectedLineColor(lineColor.dataset.lineColor); return; }
    const penColor = event.target.closest('[data-pen-color]');
    if (penColor) {
      state.settings.penColor = penColor.dataset.penColor;
      scheduleSave();
      $$('.swatch', els.popover).forEach(node => node.classList.toggle('selected', node === penColor));
      return;
    }
    const actionButton = event.target.closest('[data-pop-action]');
    if (actionButton) handlePopoverAction(actionButton.dataset.popAction, actionButton);
  }

  function handlePopoverInput(event) {
    if (event.target.id === 'boardMenuSearch') {
      const value = event.target.value;
      openBoardMenu(els.boardButton, value);
      const input = $('#boardMenuSearch', els.popover);
      if (input) { input.focus(); input.setSelectionRange(value.length, value.length); }
      return;
    }
    if (event.target.matches('[data-setting-live]')) {
      const key = event.target.dataset.settingLive;
      state.settings[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.type === 'range' ? Number(event.target.value) : event.target.value;
      if (key === 'penWidth') event.target.nextElementSibling.textContent = `${event.target.value}px`;
      scheduleSave();
    }
    if (event.target.name === 'due') {
      $('[data-custom-dates]', els.popover)?.classList.toggle('hidden', event.target.value !== 'custom');
    }
  }

  function handleFilterSubmit(event) {
    if (event.target.id !== 'filterForm') return;
    event.preventDefault();
    const form = new FormData(event.target);
    ui.filters = {
      template: form.get('template') || '',
      ticketType: form.get('ticketType') || '',
      team: form.get('team') || '',
      status: form.get('status') || '',
      onHold: form.get('onHold') || '',
      needsVP: form.get('needsVP') || '',
      due: form.get('due') || '',
      from: form.get('from') || '',
      to: form.get('to') || ''
    };
    closePopover();
    renderAll();
    const count = ui.searchResults.length;
    toast(`${count} object${count === 1 ? '' : 's'} match the active filters.`);
  }

  function handleMinimapPointer(event) {
    const rect = els.minimap.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * WORLD.width;
    const y = (event.clientY - rect.top) / rect.height * WORLD.height;
    const v = currentBoard().viewport;
    setViewport({ x: els.viewport.clientWidth / 2 - x * v.zoom, y: els.viewport.clientHeight / 2 - y * v.zoom });
  }

  function handleKeyboardDown(event) {
    const mod = event.ctrlKey || event.metaKey;
    const typing = isTypingTarget(event.target);

    if (event.key === ' ' && !typing) {
      ui.spaceDown = true;
      event.preventDefault();
    }

    if (els.dialog.open) return;

    if (typing) {
      if (event.key === 'Escape' && ui.editingId) {
        event.preventDefault();
        finishEditing();
      } else if (mod && event.key === 'Enter' && ui.editingId) {
        event.preventDefault();
        finishEditing();
      }
      return;
    }

    if (mod && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
      return;
    }
    if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return; }
    if (mod && event.key.toLowerCase() === 'c') { event.preventDefault(); copySelection(); return; }
    if (mod && event.key.toLowerCase() === 'v') { event.preventDefault(); pasteClipboard(ui.pointerWorld); return; }
    if (mod && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelection(); return; }
    if (mod && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      ui.selection = new Set([...currentBoard().objects.map(obj => obj.id), ...currentBoard().connectors.map(c => c.id)]);
      renderAll();
      return;
    }
    if (mod && event.key.toLowerCase() === 'f') { event.preventDefault(); openSearch(); return; }
    if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); saveNow(); toast('Local save requested.'); return; }

    if (event.key === 'Escape') {
      if (ui.action) cancelCurrentAction();
      else if (!els.popover.classList.contains('hidden')) closePopover();
      else if (ui.editingId) finishEditing();
      else if (ui.connectorSourceId) { ui.connectorSourceId = null; setTool('select'); renderAll(); }
      else if (els.searchStrip.classList.contains('open')) closeSearch();
      else clearSelection();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') { if (selectedIds().length) { event.preventDefault(); deleteSelection(); } return; }
    if (event.key === 'Enter' && selectedIds().length === 1) {
      event.preventDefault();
      const selected = getSelectable(selectedIds()[0]);
      if (selected?.objectType === 'sticker') openStickerPicker(els.stickerTool, null, { replaceId: selected.id });
      else enterEdit(selectedIds()[0]);
      return;
    }
    if (event.key === '0') { event.preventDefault(); resetView(); return; }
    if (event.key === '1') { event.preventDefault(); fitContent(); return; }

    const key = event.key.toLowerCase();
    if (key === 'v') setTool('select');
    else if (key === 'h') setTool('pan');
    else if (key === 'n' && event.shiftKey) { event.preventDefault(); openNotePicker(els.stickyTool, screenToWorld(els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2, els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2)); }
    else if (key === 'n') { event.preventDefault(); createDefaultSticky(screenToWorld(els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2, els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2)); }
    else if (key === 's' && event.shiftKey) { event.preventDefault(); openStickerPicker(els.stickerTool, screenToWorld(els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2, els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2)); }
    else if (key === 's') { event.preventDefault(); setTool('sticker'); }
    else if (key === 't') setTool('text');
    else if (key === 'p') setTool('pen');
    else if (key === 'c') setTool('connector');
    else if (key === 'f') setTool('frame');
  }

  function handleKeyboardUp(event) {
    if (event.key === ' ') ui.spaceDown = false;
  }

  function setupEvents() {
    els.viewport.addEventListener('pointerdown', handleViewportPointerDown);
    els.viewport.addEventListener('click', event => {
      if (event.target.closest?.('#emptyState [data-empty-action]')) return;
      if (ui.tool !== 'pan') return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    els.viewport.addEventListener('dblclick', handleViewportDoubleClick);
    els.viewport.addEventListener('contextmenu', handleViewportContextMenu);
    els.viewport.addEventListener('wheel', handleWheel, { passive: false });

    els.objectLayer.addEventListener('input', handleObjectInput);
    els.objectLayer.addEventListener('change', handleObjectChange);
    els.objectLayer.addEventListener('click', handleObjectClick);

    els.toolDock.addEventListener('click', event => {
      const button = event.target.closest('[data-tool]');
      if (!button) return;
      const tool = button.dataset.tool;
      if (tool === 'sticky' && (event.target.closest('.tiny-caret') || ui.tool === 'sticky')) {
        const center = screenToWorld(els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2, els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2);
        openNotePicker(button, center);
      } else if (tool === 'sticker') {
        const center = screenToWorld(els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2, els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2);
        openStickerPicker(button, center);
      } else setTool(tool);
    });
    els.dockMoreButton.addEventListener('click', () => openDrawingOptions(els.dockMoreButton));

    els.contextToolbar.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (button) handleContextAction(button.dataset.action, button);
    });

    els.boardButton.addEventListener('click', () => els.popover.classList.contains('hidden') ? openBoardMenu() : closePopover());
    els.undoButton.addEventListener('click', undo);
    els.redoButton.addEventListener('click', redo);
    els.searchButton.addEventListener('click', openSearch);
    els.searchClose.addEventListener('click', () => closeSearch());
    els.searchPrev.addEventListener('click', () => navigateSearch(-1));
    els.searchNext.addEventListener('click', () => navigateSearch(1));
    els.searchInput.addEventListener('input', event => {
      ui.searchQuery = event.target.value;
      ui.searchIndex = -1;
      renderAll({ preserveEditor: true });
    });
    els.searchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); navigateSearch(event.shiftKey ? -1 : 1); }
      if (event.key === 'Escape') { event.preventDefault(); closeSearch(); }
    });
    els.filterButton.addEventListener('click', () => openFilterMenu());
    els.exportButton.addEventListener('click', () => openExportMenu());
    els.settingsButton.addEventListener('click', openSettings);
    els.helpButton.addEventListener('click', openHelp);

    els.zoomOut.addEventListener('click', () => zoomBy(1 / 1.18));
    els.zoomIn.addEventListener('click', () => zoomBy(1.18));
    els.fitButton.addEventListener('click', () => fitContent());
    els.resetButton.addEventListener('click', resetView);
    els.minimapButton.addEventListener('click', () => {
      state.settings.minimap = !state.settings.minimap;
      renderAll();
      scheduleSave();
    });
    els.minimap.addEventListener('pointerdown', handleMinimapPointer);

    els.emptyState.addEventListener('click', event => {
      const button = event.target.closest('[data-empty-action]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const action = button.dataset.emptyAction;
      const center = screenToWorld(els.viewport.getBoundingClientRect().left + els.viewport.clientWidth / 2, els.viewport.getBoundingClientRect().top + els.viewport.clientHeight / 2);
      if (action === 'blank') addBlankNote(center, { edit: true });
      if (action === 'kanban') addKanbanNote(center, { edit: true });
      if (action === 'sticker') openStickerPicker(button, center);
      if (action === 'frame') addFrame(center);
      if (action === 'example') loadExampleBoard();
      if (action === 'import') els.importInput.click();
    });

    els.popover.addEventListener('click', handlePopoverClick);
    els.popover.addEventListener('dragstart', event => {
      const choice = event.target.closest('[data-sticker-choice]');
      if (!choice || !event.dataTransfer) return;
      const stickerId = choice.dataset.stickerChoice;
      state.settings.defaultStickerId = stickerId;
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-tackboard-sticker', stickerId);
      event.dataTransfer.setData('text/plain', stickerId);
      els.viewport.classList.add('sticker-drop-target');
    });
    els.popover.addEventListener('dragend', () => els.viewport.classList.remove('sticker-drop-target'));
    els.viewport.addEventListener('dragover', event => {
      if (!Array.from(event.dataTransfer?.types || []).includes('application/x-tackboard-sticker')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      els.viewport.classList.add('sticker-drop-target');
    });
    els.viewport.addEventListener('drop', event => {
      const stickerId = event.dataTransfer?.getData('application/x-tackboard-sticker');
      if (!STICKER_IDS.includes(stickerId)) return;
      event.preventDefault();
      event.stopPropagation();
      ui.pointerWorld = screenToWorld(event.clientX, event.clientY);
      state.settings.defaultStickerId = stickerId;
      addSticker(ui.pointerWorld, { stickerId });
      closePopover();
      setTool('select');
      els.viewport.classList.remove('sticker-drop-target');
    });
    els.popover.addEventListener('input', handlePopoverInput);
    els.popover.addEventListener('change', handlePopoverInput);
    els.popover.addEventListener('submit', handleFilterSubmit);

    document.addEventListener('pointerdown', event => {
      if (!els.popover.classList.contains('hidden') && !event.target.closest('#popover') && !event.target.closest('#boardButton,#filterButton,#exportButton,#settingsButton,#stickyTool,#stickerTool,#dockMoreButton,#contextToolbar,#mobileMenuButton,#saveStatus')) closePopover();
    }, true);

    els.dialogFooter.addEventListener('click', event => {
      const button = event.target.closest('[data-dialog-value]');
      if (!button || !ui.dialogResolver) return;
      const action = ui.dialogResolver.actions[Number(button.dataset.dialogValue)];
      resolveDialog(action?.value ?? null);
    });
    els.dialogClose.addEventListener('click', () => resolveDialog(null));
    els.dialog.addEventListener('cancel', event => { event.preventDefault(); resolveDialog(null); });
    els.dialog.addEventListener('submit', event => {
      event.preventDefault();
      const primary = els.dialogFooter.querySelector('.button.primary') || els.dialogFooter.querySelector('[data-dialog-value]:last-child');
      primary?.click();
    });
    els.dialogBody.addEventListener('click', event => {
      if (event.target.closest('[data-clear-local-data]')) {
        resolveDialog(null);
        setTimeout(clearAllLocalData, 0);
      }
    });

    els.importInput.addEventListener('change', event => handleImportFile(event.target.files?.[0]));
    window.addEventListener('keydown', handleKeyboardDown);
    window.addEventListener('keyup', handleKeyboardUp);
    window.addEventListener('resize', () => { applyViewport(); drawMinimap(); updateContextToolbar(); closePopover(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
    window.addEventListener('beforeunload', () => { try { localStorage.setItem(`${STATE_KEY}-emergency`, JSON.stringify(state)); } catch {} });
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (state.settings.theme === 'system') renderAll(); });
  }


