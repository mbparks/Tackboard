# TACKBOARD regression tests

The test suite uses Playwright with Chromium and deliberately exercises the interaction paths that have historically been easiest to regress.

`test_empty_state.py` covers:

- Blank Note, Kanban Note, Sticker, Add Frame, Load Example, and Import Board from the initial empty screen
- startup controls while Select or Pan is active
- prevention of canvas marquee/pan interception
- a complete schema-v2 import launched from the startup panel

`test_interactions.py` covers:

- independent Select and Pan tools
- frame-body marquee selection
- unified multi-selection movement and resizing
- object locking and frame collapse
- keyboard movement, resizing, focus selection, and explicit edit completion
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
- schema-v2 board import
- malformed import handling

The tests inject a small in-memory localStorage implementation because `page.set_content()` uses an opaque browser origin. Production persistence still uses IndexedDB first and localStorage only as a fallback.
