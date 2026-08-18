# TACKBOARD v1.0.0

**TACKBOARD — A Simple Visual Thinking Space**

TACKBOARD is a calm, local-first virtual whiteboard for arranging freeform sticky notes, structured Kanban notes, text labels, frames, connectors, and freehand annotations.

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
- Drag a note by its header; select it to reveal resize and connector handles.
- Double-click a note or press `Enter` while selected to edit.
- Use `Space + drag` to pan and `Ctrl/Cmd + wheel` to zoom.
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
