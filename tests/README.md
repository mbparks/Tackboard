# TACKBOARD regression tests

The test suite uses Playwright with Chromium and exercises the interaction paths that have historically been easiest to regress.

`test_empty_state.py` covers:

- Blank Note, Kanban Note, Sticker, Add Frame, Load Example, and Import Board from the initial empty screen
- startup controls while Select or Pan is active
- prevention of canvas marquee/pan interception
- a complete schema-v2 import launched from the startup panel

`test_kanban_on_hold.py` covers:

- On Hold placement immediately after Status in the Kanban schema
- unchecked defaults and template-version-2 normalization
- label-wide checkbox activation, autosave, undo, and Compact View
- the header badge, search behavior, and Yes/No filtering
- conversion to blank-note text and compatibility with existing notes

`test_kanban_presentation.py` covers:

- canonical Expanded and Compact dimensions
- complete no-scroll Expanded and Compact summary rendering
- detached desktop editor opening through the supported interaction path
- all twelve fields and section organization
- stable card dimensions during and after editing
- long Description clamping and Read more
- width-only Kanban resizing
- deterministic Compact/Expanded transitions
- Cancel restoration and one-step Undo
- migration of older manually sized Kanban cards
- full-width mobile bottom-sheet editing and modal semantics

`test_interactions.py` covers:

- independent Select and Pan tools
- frame-body marquee selection
- unified multi-selection movement and resizing
- object locking and frame collapse
- keyboard movement, resizing, focus selection, and edit completion
- active filter chips
- keyboard-operable popovers and focus return
- selected-area export preview
- default export behavior
- per-board undo history
- save-error recovery and localStorage fallback restoration
- phone layout, one-finger Pan/Select behavior, long press, and pinch zoom

`test_io.py` covers:

- current-board JSON download
- PNG rendering
- PDF/print page generation
- schema-v2 board import and structured-note migration
- malformed import handling

The tests inject a small in-memory localStorage implementation because `page.set_content()` uses an opaque browser origin. Production persistence still uses IndexedDB first and localStorage only as a fallback.
