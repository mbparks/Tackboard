# TACKBOARD v1.2.1

**TACKBOARD — A Simple Visual Thinking Space**

TACKBOARD is a calm, local-first virtual whiteboard for arranging freeform sticky notes, structured Kanban notes, stickers, text labels, frames, connectors, and freehand annotations. It has no account system, backend, telemetry, advertising, or third-party tracking.

## What changed in v1.2.1

Version 1.2.1 corrects the initial empty-board action panel. **Blank Note, Kanban Note, Sticker, Add Frame, Load Example, and Import Board** now bypass canvas marquee and panning handlers, so each control works with either Select or Pan active. The startup controls also stop their click from leaking into the canvas interaction layer.

An automated browser regression suite now exercises all six startup actions, including Kanban creation while Pan is selected and a complete JSON import launched from the empty state.

## Included from v1.2.0

Version 1.2.0 introduced the comprehensive interaction, accessibility, reliability, and maintainability improvements below.

### Select and Pan

- **Select — arrow icon (`V`)** uses ordinary left-clicks for object selection and ordinary left-drag on open canvas or a frame body for marquee selection.
- **Pan — hand icon (`H`)** uses ordinary left-drag anywhere, including directly over objects, to move the complete board view.
- `Space + drag` and middle-button drag remain temporary panning shortcuts from any tool.
- A unified multi-selection box replaces a crowd of individual resize handles.
- The selection label moves all movable objects together.
- A collision-aware group-resize handle remains usable even when the selection reaches the viewport controls or screen edge.
- Locked objects remain in place during dragging, resizing, alignment, and keyboard movement.

### Mobile and touch

- Select mode uses one-finger empty-space dragging for marquee selection.
- Pan mode uses one-finger dragging for board navigation.
- Two-finger gestures always pan and zoom.
- **Add Selection** provides a touch equivalent to Shift-click.
- Long-pressing a selected object opens its More menu.
- The phone top bar is reduced to the board switcher, application menu, and save indicator.
- Menus become bottom sheets on narrow screens.
- Blank notes, Kanban notes, and text labels include a visible **Done** control while editing.
- Fit Content uses a readable minimum zoom on phones; Overview remains available for seeing the complete board.

### Keyboard and accessibility

- Arrow keys nudge selected objects by one pixel.
- `Shift + Arrow` nudges by ten pixels.
- `Alt/Option + Arrow` resizes selected objects.
- `2` zooms to the current selection; `3` opens a complete board overview.
- Focusing a board object selects it and exposes `aria-selected` state.
- Drawings and connectors are keyboard-focusable and have accessible names.
- Popovers support Arrow, Home, End, Enter, and Escape behavior and return focus to their invoking control.
- Tool buttons use a consistent inline SVG icon family.
- Selection remains visible through outlines and text rather than relying only on color.

### Notes, labels, frames, and filters

- Text labels now expose the same restrained color palette used by board lines.
- Objects can be position-locked without preventing editing, search, export, or duplication.
- Frames can collapse to their header and temporarily dim content located inside their previous expanded bounds.
- Dragging empty-looking frame body space in Select mode starts marquee selection; the frame header remains the frame drag surface.
- Active filters appear as removable chips with a visible result count and one-click Reset action.

### Navigation

- **Zoom to Selection** centers the current selection at a readable scale.
- **Overview** shows all board content.
- The minimap is content-aware instead of always scaling the complete 12,000 × 8,000 world.
- The multi-selection resize handle automatically avoids the viewport controls, minimap, context toolbar, and tool dock.

### Local data and recovery

- Schema version 2 automatically migrates existing TACKBOARD data.
- IndexedDB stores a lightweight application index and individual board records, so unchanged boards do not need to be rewritten after every edit.
- localStorage remains a fallback when IndexedDB is unavailable.
- A newer emergency snapshot can recover work after an interrupted or failed save.
- Save failures produce a persistent warning with **Retry Save** and **Export Backup** actions.
- The save-status button shows the last successful save and active storage method.
- Duplicate toast messages are consolidated rather than stacked repeatedly.
- Undo and redo histories are maintained independently for each board during the current session and survive board switching.

### Import and export

- Export menus now include a freely dragged **Selected Area** for PNG and PDF.
- PNG and PDF actions present a preview with scope, board area, output pixel dimensions, render scale, background, and estimated page count.
- Settings include a default export format: JSON, PNG, or PDF.
- Quick Export uses that preferred format while the complete export menu remains available.
- Existing current-board, selection, complete-backup, viewport, one-page, and tiled export modes remain available.

### Development structure and tests

The deployed app remains a single self-contained `index.html`, while the package now includes modular development source, a deterministic build script, and automated Playwright regression tests.

## Core workflow

**CREATE → ARRANGE → CONNECT → REFINE → SAVE**

1. Use **Select** to choose, marquee-select, move, resize, align, group, or edit objects.
2. Use **Pan** to navigate with an ordinary left-drag.
3. Double-click empty board space in Select mode to create a blank sticky note.
4. Use the Sticky Note menu or `Shift + N` to choose Blank Note or Kanban.
5. Use the Sticker menu or `Shift + S` to choose reactions, markers, and arrows.
6. Drag notes by their headers. Stickers and text labels can be dragged from their surfaces.
7. Select an object to reveal its compact contextual toolbar.
8. Double-click a note or press Enter while selected to edit it.
9. Use the board switcher to create, rename, duplicate, delete, and search boards.
10. Use Quick Export for the preferred format or open the full Import & Export menu.

## Sticker library

The built-in sticker library contains:

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
- `Alt/Option + Arrow` — Resize selection
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
- `Enter` — Edit or open the primary action for a selected object
- `Escape` — Finish editing, close a menu, clear selection, or cancel an operation
- `Delete` or `Backspace` — Delete selection

Normal board shortcuts do not activate while the user is typing in an input, dropdown, date field, or text area.

## Kanban template

Kanban notes include these fields in order:

1. Ticket #
2. Ticket Type: Story, Bug, Subtask
3. Sprint #
4. Epic
5. Description
6. Team: SPA, PIC, PPD, CPPD, FES, R&A, P&BA, CMDSPT, HCM, SEC, EEO
7. Reporter
8. Assignee
9. Status: Backlog, VP Scheduled, VP Held, Ready, In Dev, UAT, Done
10. Needs VP?
11. Need By Date

Kanban notes support expanded and compact views, field-aware search and filters, clean exports, conversion to blank notes, duplication, color changes, connectors, grouping, locking, frames, local autosave, and undo/redo.

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

After replacing an older deployment, reload once so the `tackboard-v1.2.1` service-worker cache takes control.

## Data, migration, and privacy

- Existing compatible v1.x data is normalized into schema version 2 automatically.
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
