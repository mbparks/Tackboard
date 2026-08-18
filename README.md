# TACKBOARD v1.1.2

**TACKBOARD — A Simple Visual Thinking Space**

TACKBOARD is a calm, local-first virtual whiteboard for arranging freeform sticky notes, structured Kanban notes, stickers, text labels, frames, connectors, and freehand annotations.

## What changed in v1.1.2

- Left-click and drag across empty board space now draws a selection rectangle and selects every object the rectangle touches.
- Hold `Shift`, `Ctrl`, or `Cmd` while left-dragging to add the newly enclosed objects to the current selection.
- A normal click on empty board space still clears the current selection.
- After selecting several objects, drag any selected note header or selected movable object to move the complete selection together.
- Board panning remains available through `Space + drag`, middle-button drag, trackpad scrolling, the minimap, and touch gestures.
- Updated the Select-tool cursor, in-app shortcut guide, visible version, and offline cache.

This release intentionally supersedes the primary-button empty-canvas panning behavior introduced in v1.1.1 so the Select tool once again treats an ordinary left-drag as marquee selection.

## Included from v1.1.1

- A dedicated **Red X** sticker alongside the green check, red exclamation, thumbs up/down, arrows, and the rest of the sticker library.
- `Space + drag` and middle-button drag for panning from any starting point.
- The complete sticker system and higher-contrast sticky-note text introduced in v1.1.0.

## Run it

TACKBOARD has no backend and no build step.

### Simple local use

Open `index.html` in a modern browser. Core board features and local persistence work directly from the file.

### Recommended hosted or local-server use

Serve the folder from any normal static web host. This also enables the included service worker for offline reopening after the first visit.

For a local server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Core workflow

**CREATE → ARRANGE → CONNECT → REFINE → SAVE**

- Double-click empty board space to create a blank sticky note.
- Use the Sticky Note tool or `Shift + N` to choose Blank Note or Kanban.
- Use the Sticker tool or `Shift + S` to open the sticker picker. Plain `S` activates the most recently used sticker.
- Drag a note by its header; stickers and text labels can be dragged from anywhere inside their bounds.
- Left-drag empty board space to marquee-select multiple objects. Hold `Shift`, `Ctrl`, or `Cmd` to add to the existing selection.
- Drag one selected object to move the complete multi-object selection together.
- Hold `Space` while dragging, or use the middle mouse button, to pan from any starting point. Trackpad scrolling also pans; `Ctrl/Cmd + wheel` zooms at the pointer.
- Select an object to reveal contextual actions, resize handles, and—where applicable—a connector handle.
- Double-click a note or press `Enter` while selected to edit. Double-click a sticker or press `Enter` while it is selected to change it.
- Use the board switcher to create, rename, duplicate, delete, and search boards.
- Use Export for current-board JSON, selected-object JSON, complete backups, clean PNGs, and browser-generated PDF/print output. PDF/Print supports the entire board on one page, tiled multi-page output, the visible viewport, or the current selection.

## Kanban template

The Kanban structured note includes:

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

Kanban notes support expanded and compact views, field-aware search and filters, clean exports, conversion to blank notes, duplication, color changes, connectors, and local autosave.

## Data and privacy

- Data is stored locally in IndexedDB, with a localStorage fallback.
- No account, server, telemetry, analytics, ads, or third-party tracking is included.
- Use **Complete Backup JSON** regularly for portable backups.
- Imported JSON is validated before it changes the workspace.

## Files

- `index.html` — self-contained application with embedded CSS and JavaScript
- `sw.js` — small offline app-shell cache for static hosting
- `README.md` — usage and deployment notes

## Browser notes

TACKBOARD targets current versions of Chrome, Edge, Firefox, and Safari. PDF export opens a clean print view; choose **Save as PDF** in the browser print destination. For large boards, use **Entire Board — Tiled Pages** to preserve readability. Touch gestures include one-finger object movement, empty-canvas panning, long-press creation, and two-finger pinch/pan.
