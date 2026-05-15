# pea-ate

A browser-only SPA for loading Pico-8 carts, viewing the spritesheet and map, and swapping palette colours. No backend. Exports modified `.p8` files with palette metadata stored in a custom data block.

## Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS v4** for styling
- **Press Start 2P** (Google Fonts) for the pixel-font Pico-8 aesthetic
- No router needed — tab state (spritesheet / map) is local component state
- No state management library — React context or prop-drilling is fine at this scale

## Project structure

```
src/
  components/       # UI components (SpritesheetView, MapView, PaletteEditor, etc.)
  lib/
    p8/             # Pico-8 file format parsing, serialisation, and .p8.png decode
  hooks/            # Custom React hooks
  types/            # Shared TypeScript types
```

## Features (priority order)

### Core
1. **Drag & drop `.p8` files** onto the page to load a cart
2. **Spritesheet view** — render the 128×128 sprite sheet on a `<canvas>` using the current palette
3. **Map view** — render the 128×64 tile map on a `<canvas>` using sprites + current palette
4. **Palette editor** — show all 16 standard + 16 secret colours; click any slot to reassign it to another colour

### Export
5. **Export `.p8`** — `serialiseP8(cart, toolData)` takes the original cart and the current `PaletteToolData` assembled from live state. Writes `__pico8_palette_tool__` block + bakes label palette into `__label__` data. Also generates `pal()` Lua snippets.
6. **Round-trip load** — when a cart with a `__pico8_palette_tool__` block is loaded, restore the saved palette mapping and options automatically

**State architecture:** `drawPalette`, `labelPalette`, and `cartOpts` are separate React state in `App.tsx`, not stored on the `cart` object. When exporting, assemble them into a `PaletteToolData` and pass to `serialiseP8`.

### Planned
7. **Named palettes** — save multiple palette configurations per cart with user-defined names. When implemented, `PaletteToolData.drawPalette` becomes `namedPalettes: Array<{ name: string; drawPalette: number[] }>` plus an `activePalette` index. The current single `drawPalette` field will migrate to `namedPalettes[0]`.
8. **Sprite inspector** — the original Electron version had an unfinished SpriteEditor tab: select a grid of sprites from the sheet for closer inspection, with a per-sprite colour chooser. Useful for a palette tool as it lets you focus on the specific sprites affected by a remap. Implementation would involve click/drag selection on the spritesheet canvas to pick a region, then rendering that region at higher zoom alongside the palette editor.

### Implemented
7. **Drag & drop `.p8.png`** — implemented in `src/lib/p8/stego.ts`. See `.p8.png format` section below for the encoding spec. Lua code is not decompressed (not needed for palette tool). Label is recovered from visual pixels by nearest-colour matching.

## `.p8.png` format

Pico-8 carts can be saved as steganographic PNGs (160×205 pixels).

### Pixel encoding
Each cart byte is stored in the 2 LSBs of each RGBA channel of one pixel, **ARGB order** (A = 2 most-significant bits):
```
byte = ((A & 3) << 6) | ((R & 3) << 4) | ((G & 3) << 2) | (B & 3)
```
Total capacity: 160 × 205 = 32,800 bytes.

### Binary byte layout
| Range | Content |
|-------|---------|
| 0x0000–0x1FFF | Sprite sheet (8192 bytes, 4bpp, lo-nibble first) |
| 0x2000–0x2FFF | Map top 32 rows (4096 bytes, 1 byte per tile) |
| 0x1000–0x1FFF | Shared: also map bottom 32 rows (same bytes, different interpretation) |
| 0x3000–0x30FF | Sprite flags |
| 0x3100–0x31FF | Music |
| 0x3200–0x42FF | SFX |
| 0x4300–0x7FFF | Lua code (compressed, header `\x00pxa` = new format) |

Sprite sheet bytes: lo nibble = left pixel, hi nibble = right pixel (2 pixels per byte).

### Label
The visible 128×128 pixel region at **x=16, y=24** within the cartridge image IS the label. Recover label indices by nearest-colour matching each pixel against the 32-colour Pico-8 palette. No separate binary section.

## Pico-8 file format reference

### `.p8` sections
A `.p8` file is plain text with named sections:
```
pico-8 cartridge // http://www.pico-8.com
version <n>
__lua__
-- code here
__gfx__
-- 128×128 spritesheet, 4 bits per pixel, stored as 16384 hex nibbles (128 rows × 128 cols)
__map__
-- top 32 rows of the 128×64 map, stored as 256 hex bytes per row (128 cols × 32 rows)
-- bottom 32 rows of the map share memory with the bottom of __gfx__ (shared memory region)
__sfx__
__music__
__label__
-- optional 128×128 cart label — uses extended encoding (see Label section below)
```

User-defined sections use the same `__name__` pattern and are preserved by Pico-8. Use `__pico8_palette_tool__` as this tool's section name.

### Sprite sheet (`__gfx__`)
- 128×128 pixels, 4 bits per pixel
- Each row is 128 nibbles (64 bytes) of hex text
- Nibble value = palette index 0–15
- Stored left-to-right, top-to-bottom

### Map (`__map__`)
- 128 columns × 64 rows of tile indices (0–255)
- `__map__` section contains the top 32 rows (each row = 128 two-digit hex bytes)
- Bottom 32 rows occupy the same memory as the bottom half of `__gfx__` (rows 64–127 of the sprite sheet)

### Palette
Pico-8 has two palettes of 16 colours each:

**Standard palette (indices 0–15):**
| # | Name | Hex |
|---|------|-----|
| 0 | black | #000000 |
| 1 | dark-blue | #1D2B53 |
| 2 | dark-purple | #7E2553 |
| 3 | dark-green | #008751 |
| 4 | brown | #AB5236 |
| 5 | dark-grey | #5F574F |
| 6 | light-grey | #C2C3C7 |
| 7 | white | #FFF1E8 |
| 8 | red | #FF004D |
| 9 | orange | #FFA300 |
| 10 | yellow | #FFEC27 |
| 11 | green | #00E436 |
| 12 | blue | #29ADFF |
| 13 | lavender | #83769C |
| 14 | pink | #FF77A8 |
| 15 | light-peach | #FFCCAA |

**Secret palette (indices 128–143, accessed via `pal(c, n, 1)`):**
| # | Name | Hex |
|---|------|-----|
| 128 | brownish-black | #291814 |
| 129 | darker-blue | #111D35 |
| 130 | darker-purple | #422136 |
| 131 | blue-green | #125359 |
| 132 | dark-brown | #742F29 |
| 133 | darker-grey | #49333B |
| 134 | medium-grey | #A28879 |
| 135 | light-yellow | #F3EF7D |
| 136 | dark-red | #BE1250 |
| 137 | dark-orange | #FF6C24 |
| 138 | lime-green | #A8E72E |
| 139 | medium-green | #00B543 |
| 140 | true-blue | #065AB5 |
| 141 | mauve | #754665 |
| 142 | dark-peach | #FF6E59 |
| 143 | peach | #FF9D81 |

### Label (`__label__`)
- Optional 128×128 pixel image stored as one character per pixel
- **Extended encoding:** `'0'-'9'` → indices 0–9, `'a'-'v'` → indices 10–31
- Indices 0–15 map to the standard palette; indices 16–31 map to the secret palette
- **At most 16 unique values** per label — Pico-8 only renders 16. Characters beyond `'f'` allow choosing which 16 colors from the full 32 are used.
- Unlike the sprite draw palette (which uses 0–15 standard / 128–143 secret via `pal()`), label indices are always 0–31.
- On export, the label palette swap is **baked into the `__label__` data** and `labelPalette` is cleared in the stored tool block — so round-tripping won't double-apply.

### `pal()` snippet generation
When exporting, generate Lua snippets of the form:
```lua
-- draw palette remaps
pal(0, 7)   -- black -> white
pal(3, 11)  -- dark-green -> green
```
For secret palette access: `pal(c, 128+n)` remaps draw colour c to secret colour n.

## Palette swap UX

- Show both palettes (standard + secret) as clickable colour swatches
- Select a source colour, then select a target colour to remap
- Canvas views re-render immediately on any palette change
- Yellow dot indicator on remapped slots
- Right-click a remapped slot to reset just that slot
- "Reset all" button appears when any slot is remapped

## Canvas rendering

- Use `<canvas>` elements directly with `ImageData` for pixel-perfect rendering
- Scale up with CSS (`image-rendering: pixelated`) rather than canvas scaling — keeps the canvas at native Pico-8 resolution (128×128 for sprites, 128×64 for map in tiles)
- Map view: each tile is rendered by reading the sprite index from map data and stamping the sprite pixels

## Sample cart

`public/carts/adventure-tileset.p8` — by **kraizeg**, public domain. Source: https://www.lexaloffle.com/bbs/?pid=45481. Loaded via the "load sample cart" button on the drop zone.

## What not to do

- Do not add a backend or server-side processing of any kind
- Do not add audio playback (sfx/music) — out of scope
- Do not add a Lua code editor
- Do not add routing (React Router etc.) — tab switching is local state only
- Do not add a component library (shadcn, MUI, etc.) — Tailwind is sufficient
- Do not optimise for mobile — the tool's workflow (Pico-8 dev, exporting .p8 files) is desktop-only. Drag & drop doesn't exist on mobile, carts won't be on people's phones, and the canvas sizes are unsuitable for small screens. If mobile support becomes a genuine need the main gaps are: touch events for map pan, larger palette swatch touch targets (min 44px), and responsive canvas scaling.
