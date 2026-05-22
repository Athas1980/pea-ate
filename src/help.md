# pea-ate help

A browser-based palette editor for Pico-8 carts. Load a `.p8` or `.p8.png` file, remap colours, edit the map, and export a modified `.p8` with your changes preserved.

## Loading a cart

Drag and drop a `.p8` or `.p8.png` file onto the drop zone, or click **browse** to open a file picker. Sample carts are available if you want to explore the tool first.

Click **eject** in the header to unload the current cart and return to the drop zone.

## Tabs

### Spritesheet

Renders the 128×128 sprite sheet using the current draw palette. The palette editor is shown alongside.

When **use shared map** is enabled in Options, only the top 64 rows of the sprite sheet are shown — the bottom 64 rows share memory with the map and are not independent sprites.

### Map

Renders the full tile map. Switch between **view** and **edit** modes using the toolbar button.

In **edit** mode:
- Click or drag on the map to paint tiles.
- Select a brush in the tile picker (right side). Click a single tile to set a 1×1 brush; click and drag to select a rectangular multi-tile brush. The brush stamps in a non-overlapping grid as you drag.
- **Ctrl+Z** undoes the last stroke (up to 50 levels).
- The **map width** control (`poke(0x5f57, n)`) lets you reflow the tile layout for non-standard strides. A Lua snippet appears in the footer when width ≠ 128.

### Label

Appears only when the cart has a `__label__` section. Shows the 128×128 label image with optional palette remapping baked in on export.

### Inspector

Click or drag on the sprite sheet to select a rectangular region. The inspector renders it at 4× zoom and compares it against all saved named palettes, suggesting the closest match. Click **apply** to copy that palette into the draw palette.

### Options

- **Use shared map** — whether the bottom 64 sprite rows are also map rows (mirrors Pico-8's memory layout).
- **Show zero tile** — whether tile index 0 is rendered on the map or left transparent.

## Palette editor

Shows all 16 standard Pico-8 colours plus 16 secret colours.

- Click a **source** colour (top row), then click a **target** colour to remap it.
- A yellow dot marks remapped slots.
- **Right-click** a remapped slot to reset just that slot.
- **Reset all** clears every remap.

### Named palettes

Save the current draw palette and transparency settings under a name. Apply a saved palette to restore its colours instantly. The Inspector tab compares sprites against saved palettes to suggest the best match.

### Transparent colours

Check colours that should be treated as transparent when rendering sprites and map tiles.

## Export

Click **export .p8** to download the modified cart. The exported file includes:

- Your palette remaps applied to the label (baked into `__label__` data).
- A `__meta:pea-ate__` block preserving all tool state for round-trip editing.
- Generated `pal()` Lua snippets in the tool block for reference.

Loading an exported cart restores all saved palette mappings and settings automatically.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Ctrl+Z | Undo last map stroke (map edit mode) |
| ? | Toggle this help screen |
