# TACKBOARD changelog

## v1.2.1 — Initial empty-state controls

- Fixed all six initial-load buttons: Blank Note, Kanban Note, Sticker, Add Frame, Load Example, and Import Board.
- Prevented empty-state button pointer and click events from being consumed by canvas marquee or Pan-mode capture handling.
- Preserved normal keyboard activation and made the startup actions independent of the active canvas tool.
- Corrected an undefined frame-object reference in the base pointer handler.
- Added an automated Chromium regression suite covering every startup action and the complete import path.

## v1.2.0 — Interaction, accessibility, reliability, and maintainability

- Completed a distinct desktop and touch interaction model for Select and Pan.
- Added phone Add Selection mode, mobile bottom sheets, simplified top bar, and explicit Done controls.
- Added unified multi-selection movement and proportional resizing with collision-aware controls.
- Added keyboard nudging/resizing, Zoom to Selection, Overview, and accessible focus selection.
- Added accessible connector and drawing representations and keyboard-operable popovers.
- Added text-label colors, object position locking, frame collapse, and active filter chips.
- Added content-aware minimap behavior and readable mobile Fit Content.
- Added persistent save-error recovery, emergency snapshot recovery, and deduplicated notifications.
- Added per-board session undo/redo histories.
- Added schema version 2 with separately persisted IndexedDB board records and legacy migration.
- Added selected-area PNG/PDF export, export previews, and default export format.
- Added modular source fragments, deterministic build tooling, and automated Playwright regression tests.
- Preserved the Red X and the complete v1.1 sticker library.

## v1.1.3 — Separate Select and Pan tools

- Added separate arrow and hand tools with `V` and `H` shortcuts.
- Preserved Space-drag and middle-button temporary panning.

## v1.1.2 — Multi-object marquee selection

- Restored ordinary left-drag marquee selection in Select mode.
- Preserved movement of the complete selection.

## v1.1.1 — Board panning and Red X

- Added ordinary left-drag board panning.
- Added the Red X sticker.

## v1.1.0 — Stickers and note contrast

- Added the sticker library and sticker object type.
- Darkened text on light sticky-note colors.

## v1.0.1 — Text-label selection alignment

- Corrected text-label content alignment inside the selected bounds.

## v1.0.0 — Initial release

- Introduced the local-first whiteboard, blank and Kanban notes, drawing, connectors, frames, search, filters, import/export, autosave, multiple boards, and themes.
