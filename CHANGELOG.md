# TACKBOARD changelog

## v1.3.0 — Stable Kanban summary cards and detached editing

- Replaced inline, variable-height Kanban editing with a detached paper-styled editor sheet.
- Added stable Compact and Expanded summary-card heights so entering or leaving Edit Mode no longer changes the board layout.
- Redesigned Expanded View with a prominent Description summary and a two-column metadata grid representing every field.
- Added a Read more action for complete long descriptions without stretching the board card.
- Added a desktop side editor and a mobile full-width bottom-sheet editor.
- Organized editing into Identity, Work, Ownership, and State sections.
- Limited Kanban manual resizing to width only, from 340 to 520 pixels, while preserving canonical Compact and Expanded heights.
- Updated group resizing and keyboard resizing to follow the same Kanban sizing rules.
- Migrated older manually sized Kanban cards while preserving position, supported width, field values, display mode, grouping, and connectors.
- Added `kanbanLayoutVersion` metadata for future presentation migrations.
- Updated PNG and PDF rendering to match the new Summary Card layout.
- Added browser regression coverage for stable sizing, editor behavior, long descriptions, width-only resizing, Cancel, Undo, migration, and mobile editing.

## v1.2.2 — Kanban On Hold field

- Added an **On Hold** checkbox immediately after Status in the Kanban template.
- Added an On Hold header badge and Compact View field.
- Added On Hold search semantics, Yes/No filtering, active filter chips, and reset handling.
- Preserved On Hold through autosave, undo/redo, duplication, JSON import/export, PNG/PDF export, and conversion to a blank note.
- Updated Clear Field Values so On Hold resets to unchecked.
- Advanced the Kanban template to version 2 and automatically migrated older notes with the field defaulting to unchecked.
- Added automated browser coverage for editing, rendering, search, filtering, export, and migration.

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
