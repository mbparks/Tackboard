  /* Per-board undo and redo */
  function historyForBoard(boardId = currentBoard().id) {
    if (!ui.histories.has(boardId)) ui.histories.set(boardId, { undo: [], redo: [] });
    return ui.histories.get(boardId);
  }

  function syncHistoryAlias() {
    ui.history = historyForBoard();
    return ui.history;
  }

  resetHistory = function(boardId = currentBoard().id) {
    ui.histories.set(boardId, { undo: [], redo: [] });
    syncHistoryAlias();
    updateHistoryButtons();
  };

  pushHistory = function(label = 'Change') {
    const history = syncHistoryAlias();
    history.undo.push({ label, board: deepClone(currentBoard()) });
    if (history.undo.length > 80) history.undo.shift();
    history.redo = [];
    ui.histories.set(currentBoard().id, history);
    ui.history = history;
    updateHistoryButtons();
  };

  updateHistoryButtons = function() {
    const history = syncHistoryAlias();
    els.undoButton.disabled = history.undo.length === 0;
    els.redoButton.disabled = history.redo.length === 0;
    els.undoButton.title = history.undo.length ? `Undo ${history.undo.at(-1).label} (Ctrl/Cmd+Z)` : 'Undo (Ctrl/Cmd+Z)';
    els.redoButton.title = history.redo.length ? `Redo ${history.redo.at(-1).label} (Ctrl/Cmd+Shift+Z)` : 'Redo (Ctrl/Cmd+Shift+Z)';
  };

  undo = function() {
    const history = syncHistoryAlias();
    if (!history.undo.length) return;
    const entry = history.undo.pop();
    history.redo.push({ label: entry.label, board: deepClone(currentBoard()) });
    replaceCurrentBoard(entry.board);
    ui.selection.clear();
    ui.editingId = null;
    ui.dirtyBoardIds.add(currentBoard().id);
    renderAll();
    touchBoard();
    updateHistoryButtons();
  };

  redo = function() {
    const history = syncHistoryAlias();
    if (!history.redo.length) return;
    const entry = history.redo.pop();
    history.undo.push({ label: entry.label, board: deepClone(currentBoard()) });
    replaceCurrentBoard(entry.board);
    ui.selection.clear();
    ui.editingId = null;
    ui.dirtyBoardIds.add(currentBoard().id);
    renderAll();
    touchBoard();
    updateHistoryButtons();
  };

  switchBoard = function(boardId) {
    if (!state.boards.some(board => board.id === boardId) || boardId === state.currentBoardId) { closePopover(); return; }
    finishEditing({ render: false });
    state.currentBoardId = boardId;
    ui.selection.clear();
    ui.searchQuery = '';
    ui.searchResults = [];
    ui.searchIndex = -1;
    ui.filters = { template: '', ticketType: '', team: '', status: '', onHold: '', needsVP: '', due: '', from: '', to: '' };
    ui.connectorSourceId = null;
    syncHistoryAlias();
    closePopover();
    renderAll();
    scheduleSave({ immediate: true });
    toast(`Opened “${currentBoard().name}”.`);
  };

  deleteCurrentBoard = async function() {
    const beforeIds = new Set(state.boards.map(board => board.id));
    await v12Original.deleteCurrentBoard();
    for (const id of beforeIds) if (!state.boards.some(board => board.id === id)) ui.histories.delete(id);
    syncHistoryAlias();
  };

