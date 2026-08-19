# TACKBOARD source layout

The deployed application remains a single, self-contained `index.html`. Development source is split into ordered fragments so interaction, persistence, export, and accessibility work can be reviewed independently without changing the simple deployment model.

- `index.template.html` — application shell with CSS and JavaScript build markers
- `css/000-base.css` — established visual system and object styles
- `css/010-v1.2.css` — v1.2 interaction, mobile, accessibility, and reliability refinements
- `js/000-core.js` — established whiteboard core
- `js/010…130-*.js` — ordered v1.2 modules for data migration, history, persistence, rendering, selection, touch, navigation, popovers, export, settings, keyboard routing, and boot events

Fragment filenames begin with numeric prefixes because `build.py` concatenates them in lexical order.

Rebuild the release file:

```bash
python3 build.py
```

Verify that the checked-in `index.html` exactly matches the source:

```bash
python3 build.py --check
```
