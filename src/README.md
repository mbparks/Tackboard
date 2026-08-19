# TACKBOARD source layout

The deployed application remains a single, self-contained `index.html`. Development source is split into ordered fragments so interaction, persistence, export, accessibility, and Kanban presentation work can be reviewed independently without changing the simple deployment model.

- `index.template.html` — application shell, including the detached Kanban editor sheet
- `css/000-base.css` — established visual system and object styles
- `css/010-v1.2.css` — v1.2 interaction, mobile, accessibility, and reliability refinements
- `css/020-v1.3-kanban.css` — stable Kanban summary cards, Read more behavior, desktop editor, and mobile bottom sheet
- `js/000-core.js` — established whiteboard core and current template schema
- `js/010…120-*.js` — ordered v1.2 modules for migration, history, persistence, rendering, selection, touch, navigation, popovers, export, settings, keyboard behavior, and routing
- `js/125-v13-kanban-presentation.js` — Kanban layout migration, summary rendering, canonical sizing, detached editing, width-only resizing, export rendering, and v1.3 tests/debug hooks
- `js/130-v12-events-boot.js` — final event registration and application boot

Fragment filenames begin with numeric prefixes because `build.py` concatenates them in lexical order.

Rebuild the release file:

```bash
python3 build.py
```

Verify that the checked-in `index.html` exactly matches the source:

```bash
python3 build.py --check
```
