# TACKBOARD v1.3.0

**TACKBOARD — A Simple Visual Thinking Space**

TACKBOARD is a calm, local-first virtual whiteboard for arranging freeform sticky notes, structured Kanban notes, stickers, text labels, frames, connectors, and freehand annotations. It has no account system, backend, telemetry, advertising, or third-party tracking.

## What changed in v1.3.0

Version 1.3.0 replaces the old variable-height Kanban form with a consistent **Summary Card + Edit Sheet** model.

### Stable Kanban cards

Kanban notes now have two predictable board presentations:

- **Compact View — 340 × 286 pixels by default:** Ticket #, Ticket Type, and Status remain in the header; Team, Assignee, Need By Date, On Hold, and Needs VP appear in the summary body.
- **Expanded View — 380 × 474 pixels by default:** every Kanban field is represented without requiring an internal vertical scrollbar. Description receives a prominent summary area, while Sprint, Epic, Team, Reporter, Assignee, Need By Date, On Hold, and Needs VP use a two-column metadata grid.

Long descriptions are clamped to a readable summary and expose **Read more** for the complete text. Switching between Compact and Expanded View always restores the corresponding canonical height.

### Detached Kanban editor

Double-clicking a Kanban card, pressing `Enter`, or choosing **Edit Fields** opens a separate paper-styled editor rather than converting the card itself into a tall form.

- On desktop, the editor appears beside the card when space permits and remains within the viewport.
- On phones, it becomes a full-width bottom sheet with large Cancel and Done controls.
- The editor is organized into Identity, Work, Ownership, and State sections.
- All twelve fields remain available, including On Hold and Needs VP.
- Changes autosave locally while the editor is open.
- **Done**, `Escape`, or `Ctrl/Cmd + Enter` keeps the changes.
- **Cancel** or the editor’s close button restores the values from when that editing session opened.
- The board card does not move or change dimensions before, during, or after editing.

### Consistent sizing

Kanban cards now resize horizontally only, from 340 to 520 pixels. Their height is controlled by Compact or Expanded View rather than by manual vertical scaling. Group resize and keyboard resize preserve the same rule.

Existing Kanban cards are migrated automatically:

- position, width, color, fields, connectors, grouping, and display mode are preserved
- width is constrained only when outside the supported range
- old manual heights are replaced with the correct Compact or Expanded height
- a `kanbanLayoutVersion` value records the new presentation model

### Exports and accessibility

PNG and PDF rendering now reproduce the new Summary Card layout. Kanban cards remain keyboard-selectable, the detached editor uses associated labels and normal form controls, mobile editing traps focus within the modal bottom sheet, and focus returns to the edited card when the editor closes.

A dedicated browser regression suite covers stable sizing, the desktop editor, the mobile bottom sheet, long-description reading, width-only resizing, Cancel, one-step Undo, migration of older cards, and export compatibility.

## Included from v1.2.2

- **On Hold** checkbox immediately after Status
- On Hold header badge, Compact View value, search behavior, Yes/No filtering, active-filter chips, JSON preservation, and clean export rendering
- automatic migration of older Kanban notes with On Hold defaulting to unchecked

## Included from v1.2.x

### Select, Pan, and arrangement

- **Select — arrow icon (`V`)** uses ordinary left-clicks for object selection and ordinary left-drag on open canvas or a frame body for marquee selection.
- **Pan — hand icon (`H`)** uses ordinary left-drag anywhere, including directly over objects, to move the complete board view.
- `Space + drag` and middle-button drag provide temporary panning from any tool.
- Unified multi-selection movement and proportional resizing replace a crowd of individual controls.
- Objects can be position-locked.
- Frames can collapse and temporarily dim content inside their previous expanded bounds.

### Mobile and touch

- Select mode uses one-finger empty-space dragging for marquee selection.
- Pan mode uses one-finger dragging for board navigation.
- Two-finger gestures always pan and zoom.
- **Add Selection** provides a touch equivalent to Shift-click.
- Long-pressing a selected object opens its More menu.
- Menus use bottom sheets on narrow screens.

### Keyboard and accessibility

- Arrow keys nudge selected objects by one pixel.
- `Shift + Arrow` nudges by ten pixels.
- `Alt/Option + Arrow` resizes selected objects; for Kanban cards, horizontal arrows change width while height remains canonical.
- Focusing a board object selects it and exposes `aria-selected` state.
- Drawings and connectors are keyboard-focusable and have accessible names.
- Popovers support Arrow, Home, End, Enter, and Escape navigation and return focus to their invoking control.

### Local data and recovery

- IndexedDB stores a lightweight application index and separate board records.
- localStorage remains a fallback when IndexedDB is unavailable.
- A newer emergency snapshot can recover interrupted work.
- Save failures provide persistent **Retry Save** and **Export Backup** actions.
- Undo and redo histories remain separate for each board during the current session.

### Import and export

- Current-board, selected-object, complete-backup, viewport, selected-area, one-page, and tiled export modes
- JSON, PNG, and PDF/print output
- export previews with scope, dimensions, scale, background, and estimated page count
- configurable default export format and Quick Export

## Core workflow

**CREATE → ARRANGE → CONNECT → REFINE → SAVE**

1. Use **Select** to choose, marquee-select, move, align, group, or edit objects.
2. Use **Pan** to navigate with an ordinary left-drag.
3. Double-click empty board space in Select mode to create a blank sticky note.
4. Use the Sticky Note menu or `Shift + N` to choose Blank Note or Kanban.
5. Use the Sticker menu or `Shift + S` to choose reactions, markers, and arrows.
6. Drag notes by their headers. Stickers and text labels can be dragged from their surfaces.
7. Select an object to reveal its compact contextual toolbar.
8. For a Kanban card, choose **Edit Fields**, double-click it, or press `Enter` to open the editor sheet.
9. Use the board switcher to create, rename, duplicate, delete, and search boards.
10. Use Quick Export for the preferred format or open the complete Import & Export menu.

## Kanban card behavior

### Compact and Expanded View

Use the arrow control in the card header or the contextual **Expand/Collapse** action. The mode is stored with the note and never changes field values.

Expanded View represents every field. Description may be summarized to keep the card readable; **Read more** opens the complete text without moving the card or its connectors.

### Editing

The editor sheet contains:

- **Identity:** Ticket #, Ticket Type, Sprint #, Epic
- **Work:** Description
- **Ownership:** Team, Reporter, Assignee
- **State:** Status, Need By Date, On Hold, Needs VP

The card remains visible as a live summary while values are edited. Moving the edited card is temporarily blocked until editing is finished.

### Resizing

A selected Kanban card exposes only an east-side width handle. Vertical and corner resize handles are intentionally omitted. Blank notes, labels, stickers, and frames retain their normal resizing behavior.

## Kanban template fields

1. Ticket #
2. Ticket Type: Story, Bug, Subtask
3. Sprint #
4. Epic
5. Description
6. Team: SPA, PIC, PPD, CPPD, FES, R&A, P&BA, CMDSPT, HCM, SEC, EEO
7. Reporter
8. Assignee
9. Status: Backlog, VP Scheduled, VP Held, Ready, In Dev, UAT, Done
10. On Hold
11. Needs VP?
12. Need By Date

Kanban fields participate in local autosave, search, filters, undo/redo, duplication, copy/paste, JSON import/export, PNG/PDF output, conversion to a blank note, and Clear Field Values.

## Sticker library

- Thumbs Up and Thumbs Down
- Green Check
- Red X
- Red Exclamation
- Yellow Question
- Blue Box
- Left, Right, Up, and Down arrows
- Star, Heart, Idea, Flag, Plus, and Minus

Stickers support placement, desktop drag-and-drop, movement, resizing, duplication, copy/paste, replacement, grouping, alignment, layering, connectors, search, persistence, and export.

## Keyboard shortcuts

- `V` — Select tool
- `H` — Pan tool
- `N` — Create the default sticky note
- `Shift + N` — Open the note-template picker
- `S` — Activate the most recently used sticker
- `Shift + S` — Open the sticker picker
- `T`, `P`, `C`, `F` — Text, Pen, Connector, Frame
- Arrow keys — Nudge selection by 1 pixel
- `Shift + Arrow` — Nudge selection by 10 pixels
- `Alt/Option + Arrow` — Resize selection; Kanban cards resize horizontally only
- `Space + drag` — Temporarily pan from any tool
- `Ctrl/Cmd + wheel` — Zoom at the pointer
- `Ctrl/Cmd + Z` — Undo on the current board
- `Ctrl/Cmd + Shift + Z` — Redo on the current board
- `Ctrl/Cmd + C`, `Ctrl/Cmd + V` — Copy and paste
- `Ctrl/Cmd + D` — Duplicate selection
- `Ctrl/Cmd + A` — Select all
- `Ctrl/Cmd + F` — Search
- `Ctrl/Cmd + S` — Force a local save
- `0` — Reset view
- `1` — Fit content readably
- `2` — Zoom to selection
- `3` — Overview all content
- `Enter` — Open the Kanban editor or the primary action for the selected object
- `Escape` — Finish Kanban editing, close a menu, clear selection, or cancel an operation
- `Ctrl/Cmd + Enter` — Finish Kanban editing
- `Delete` or `Backspace` — Delete selection

Normal board shortcuts do not activate while the user is typing in an input, dropdown, date field, or text area.

## Run the application

TACKBOARD has no backend and no build step for normal use.

### Direct local use

Open `index.html` in a current browser. Core features and browser-local persistence work directly from the file.

### Static hosting or local server

Serving the folder enables the included service worker and offline app-shell cache.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

After replacing an older deployment, reload once so the `tackboard-v1.3.0` service-worker cache takes control.

## Data, migration, and privacy

- Existing compatible v1.x data is normalized into schema version 2 automatically.
- Existing Kanban notes migrate to template version 2 and Kanban layout version 1.
- A missing On Hold field becomes unchecked.
- Old Kanban heights migrate to the canonical Compact or Expanded height without changing field values.
- IndexedDB is the primary storage system.
- localStorage is used only when IndexedDB is unavailable and for the emergency snapshot.
- Use **Complete Backup JSON** for portable backups and before clearing browser data.
- Imported JSON is validated before it changes the workspace.
- A file created by a newer unsupported schema is rejected with a clear error.
- No content leaves the browser unless the user explicitly exports it.

## Build from the modular source

The package contains ordered CSS and JavaScript fragments under `src/`. Rebuild the self-contained release file with:

```bash
python3 build.py
```

Verify that the checked-in release matches the source exactly:

```bash
python3 build.py --check
```

## Run the regression suite

Install the development dependency and a Playwright Chromium browser:

```bash
python3 -m pip install -r requirements-dev.txt
python3 -m playwright install chromium
```

Then run:

```bash
./run_tests.sh
```

Set `TACKBOARD_CHROMIUM=/path/to/chromium` to use a system Chromium executable.

## Package contents

- `index.html` — complete self-contained application
- `sw.js` — versioned offline app-shell cache
- `README.md` — usage, deployment, data, and development guide
- `CHANGELOG.md` — release history
- `TEST-REPORT.md` — validation performed for this release
- `build.py` — deterministic self-contained build
- `src/` — ordered modular source fragments
- `tests/` — Playwright interaction and import/export regression tests
- `requirements-dev.txt` — development test dependency
- `run_tests.sh` — build verification and test runner

## Browser notes

TACKBOARD targets current Chrome, Edge, Firefox, and Safari releases. The automated release suite runs in Chromium. PDF export opens a clean browser print view; choose **Save as PDF** as the print destination. Use tiled PDF output when a large board must remain readable across multiple pages.
