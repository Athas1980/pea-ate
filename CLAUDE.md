# pea-ate

## Pending / deferred

- **Manual named-palette editing** — the `PaletteEditor` component (hand-editing the active named palette's draw remaps + per-slot transparency) was removed after the identity-palette refactor left it orphaned (rendered nowhere; its App.tsx handlers fed nothing). Named palettes are still created/applied via `SpriteInspector` and managed in `AnimationView`, and the project/screen palette is edited via `ProjectPaletteEditor` — but there is currently no dedicated UI to hand-edit a named palette's colours/transparency. Also note the active named palette does **not** feed canvas rendering (canvases use `projectPalette` directly), so reviving manual editing is a deliberate feature, not just re-rendering the old component. Old component recoverable from git history (pre-removal).
- **Custom element root tags** — change each component's root `<div>` to a kebab-case custom element matching the component name (e.g. `AnimationView` → `<animation-view>`). Purely for DevTools readability; no behaviour change. Requires a `src/custom-elements.d.ts` declaring each name in `JSX.IntrinsicElements`. Consider extracting top-level layout into `grid-template-areas` CSS at the same time, which would enable live layout tweaking in DevTools.

A browser-only SPA for loading Pico-8 carts, viewing and editing the spritesheet and map, swapping palette colours, and inspecting sprites. No backend. Exports modified `.p8` files with palette metadata stored in a custom data block.

**Design philosophy:** Not constrained to match Pico-8's built-in editor capabilities. Go beyond where it makes sense — features like random fill, custom map width, multi-tile brushes, and flood fill are valid even though the built-in editor doesn't have them.

## Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS v4** for styling
- **Press Start 2P** (Google Fonts) for the pixel-font Pico-8 aesthetic. Each glyph pixel should map to at least one screen pixel — **do not use below 10px**. The global body is set to 8px which is the absolute minimum; prefer 10–12px for any UI text that needs to be readable. Smaller sizes look correct only when screen pixels are physically large (e.g. actual Pico-8 hardware).
- **Accessibility font option** — planned: a toggle to switch from Press Start 2P to a system sans-serif for users who find pixel fonts hard to read. Scope it to UI chrome only (not canvas rendering).
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

**State architecture:** All working state lives in `App.tsx`, not on the `cart` object. Key pieces: `drawPalette`, `labelPalette`, `cartOpts`, `namedPalettes`, `transparentColours`, `mapData`, `mapWidth`, `storedMapWidth`, `tileBrush`, `mapMode`, `mapHistory`. When exporting, assemble into `PaletteToolData` and pass to `serialiseP8`. `mapData` shadows `cart.map` — edits go to `mapData`, export uses `mapData ?? cart.map`.

### Planned
9. **Help tab** — markdown-based, rendered at build time (preferred: `vite-plugin-markdown`; fallback: `react-markdown` at runtime). Deliberately breaks from the Press Start 2P / Pico-8 aesthetic — use a normal system font at readable size. Scope the font override to the help tab container only. The markdown source should be readable on GitHub directly.
10. **Composite sprite editor / animation tab** — a small canvas for composing and previewing multi-tile sprites, with animation playback. Each frame specifies a tile region and/or a named palette. Speed is user-defined in frames at 60 Hz (e.g. 4 = updates 4×/s). Motivated by multi-tile animated sprites in real carts. When implemented: frames stored as `Array<{ tileRegion, namedPaletteIndex? }>`, playback via `requestAnimationFrame`. Canvas rendering reuses the same pixel-stamping as MapView. **Note:** before implementing, evaluate whether this replaces the Inspector tab entirely rather than adding alongside it — the animation tab covers most of what the inspector does (region selection, palette preview/apply), and tab proliferation should be avoided.

### Implemented
7. **Named palettes** — `PaletteToolData.namedPalettes: Array<{ name: string; drawPalette: number[]; transparentColours: number[] }>`. The active working palette is `drawPalette` state in `App.tsx` (not indexed). Saving a palette appends to the list; applying one copies its values into `drawPalette` and `transparentColours`.
8. **Sprite inspector** — `SpriteInspector` component. Click/drag on the spritesheet canvas to select a rectangular region; renders it at 4× zoom. Compares against all named palettes to suggest a best match. `onApplyPalette` sets `drawPalette` + `transparentColours` in App.
9. **Map editor** — tile painting on the map canvas. Key design decisions:
   - `poke(0x5f57, n)` register controls map stride; changing `mapWidth` reflows tiles by walking bytes linearly with the new stride (not just masking columns)
   - `TileBrush { tileX, tileY, w, h }` — multi-tile rectangular brush; stamping snaps to brush-sized grid so drag places non-overlapping copies
   - **Eraser tool** — dedicated eraser mode in the toolbar (brush / eraser / fill), configurable size 1–4. Paints tile 0 with 1-tile drag precision (no grid snap). Size persists across carts.
   - **Fill tool** — flood fill from clicked tile. Pattern mode (default): tiles the brush pattern across the filled region using `(y % h, x % w)` offsets. Random mode: toggle in toolbar, picks randomly from all tiles in the brush selection (only active when brush is multi-tile). Both modes push to undo history.
   - **Hover status** — tile x,y coords and sprite index shown in footer status bar while hovering over the map canvas.
   - **TODO: copy/paste block** — select a rectangular region of the map, copy it, paste it elsewhere. Stamp the copied block over any target position.
   - Undo: 50-entry `mapHistory: Uint8Array[]` in App.tsx; push on `onStrokeStart` (mousedown), pop on Ctrl+Z
   - Default zoom is 2× (1× available for wide/dense maps)
   - Grid overlay: CSS `linear-gradient` div over the canvas — stays crisp at all zoom levels and doesn't affect PNG export
   - `mapWidth` is stored in `PaletteToolData` and round-trips via the `__pico8_palette_tool__` block
   - Poke snippet (`poke(0x5f57, n)`) shown in right panel as a `CodeSnippet` box when width ≠ 128 — click-to-copy, Prism-highlighted
   - **TODO: layout robustness** — map view has issues at half-screen width. Test and fix layout under different viewport sizes and zoom levels (known case: 4K display at 200% system scaling causes map view problems at reduced window width).
   - **TODO: copy/paste block** — select a rectangular region of the map, copy it, paste it elsewhere. Stamp the copied block over any target position.
   - **Code snippets** — `CodeSnippet` component with Prism.js Lua highlighting (including Pico-8 built-ins), navy background, click-to-copy. Used for poke snippet, palette Lua exports, and named palette exports. Project palette uses `pal(c, n, 1)` format; draw palette uses `pal(c, n)` format.
10. **Drag & drop `.p8.png`** — implemented in `src/lib/p8/stego.ts`. See `.p8.png format` section below for the encoding spec. Lua code is not decompressed (not needed for palette tool). Label is recovered from visual pixels by nearest-colour matching.

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

User-defined sections use the same `__name__` pattern. Pico-8 0.2.4c+ preserves sections matching `__meta:*__` — use `__meta:pea-ate__` as this tool's section name. Older-style arbitrary section names (e.g. `__pico8_palette_tool__`) are stripped by Pico-8 on save. The parser accepts both names for backward compatibility. **Verified:** loading a pea-ate-exported `.p8` into Pico-8 and saving preserves the `__meta:pea-ate__` block correctly. Metadata does **not** survive a `.p8.png` round-trip — the binary format has no slot for custom sections; this is expected.

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

## UI design language

### Colours (CSS variables)
- **`--p8-white`** — section headings, active/selected element labels
- **`--p8-light-grey`** — secondary text, inactive button labels, functional UI labels
- **`--p8-lavender`** — decorative/status text (fps readout, frame counter, drag hints)
- **`--p8-dark-grey`** — borders, dividers
- **`--p8-yellow`** — active state for toggles/selectors; selected outline on swatches
- **`--p8-green`** — confirm/apply actions (save, use palette on frame, apply resize)
- **`--p8-red`** — destructive hover state (delete, reset all, ×)

### Section headings
All section headers use `<h2 className="text-[12px] text-[var(--p8-white)]">`. No larger heading sizes in the UI chrome.

### Button hierarchy
**Bordered** — primary actions, mode toggles, and any action button that sits alongside other bordered controls:
```
px-2 py-0.5 border-2 border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)]
  hover:border-[var(--p8-white)] hover:text-[var(--p8-white)]
```
- Active/on state: `border-[var(--p8-yellow)] text-[var(--p8-yellow)]`
- Destructive hover: `hover:border-[var(--p8-red)] hover:text-[var(--p8-red)]`
- Confirm hover: `hover:border-[var(--p8-green)] hover:text-[var(--p8-green)]`

**Bare text** — secondary/housekeeping actions (+ add frame, + clone as new, ⧉, ×):
```
text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]
```
- Destructive bare: `hover:text-[var(--p8-red)]`

### Segmented controls
Binary named-state toggles (e.g. opaque/transparent) use a shared-border pair. Active: yellow border + text. Inactive: dark-grey border + light-grey text. The shared edge between the two buttons is always yellow — give the inactive left button `border-r-[var(--p8-yellow)]`.

### Transparency indicator
Transparent palette slots show a dual-tint checkerboard overlay (visible on both dark and bright colours):
```jsx
backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.3) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.3) 75%), linear-gradient(45deg, rgba(0,0,0,0.3) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.3) 75%)',
backgroundColor: 'rgba(255,255,255,0.2)',
backgroundSize: '6px 6px',
backgroundPosition: '0 0, 3px 3px',
```

### Palette boxes
Draw palette + slot picker share one `border-2 border-[var(--p8-dark-grey)]` container. The picker opens below with a `border-t-2` divider — it shares the outer border rather than nesting a second box.

### Layout
- Spritesheet, Label, and Animation tab wrappers use `max-w-5xl`. Map is unconstrained — dense data benefits from full width.
- Bordered component boxes (frame cards, Props panel) use `bg-black`.

### Press Start 2P in scrollable flex lists
In `flex flex-col` containers with `overflow-y-auto` + `max-h-*`, list items need two things:
- `shrink-0` — without it, flex compresses items to fit the container instead of scrolling
- `leading-none` — clamps line-height to font-size; the font's vertical metrics otherwise bleed into adjacent rows

## Canvas rendering

- Use `<canvas>` elements directly with `ImageData` for pixel-perfect rendering
- Scale up with CSS (`image-rendering: pixelated`) rather than canvas scaling — keeps the canvas at native Pico-8 resolution (128×128 for sprites, 128×64 for map in tiles)
- Map view: each tile is rendered by reading the sprite index from map data and stamping the sprite pixels

## Favicon

`public/favicon.svg` — inline SVG, 32×32, dark-green circle (`#008751`) with "8" in Press Start 2P at 16px. The circle represents the pea (pea → p, 8 → ate); the "p" is implicit. `index.html` already references it via `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`. Note: browser favicons render outside the page context so Press Start 2P falls back to system monospace — acceptable at favicon size.

## Release process

Releases are built locally and attached to GitHub releases as a zip. The `base: './'` in `vite.config.ts` ensures asset paths work when `index.html` is opened directly from the filesystem.

```bash
npm run build          # produces dist/
zip -r pea-ate.zip dist/
gh release create v<x.y.z> pea-ate.zip --title "v<x.y.z>" --notes "..."
git push
```

The zip is the offline distribution — users can unzip and open `index.html` in any modern browser without a server or internet connection.

## Sample cart

`public/carts/adventure-tileset.p8` — by **kraizeg**, public domain. Source: https://www.lexaloffle.com/bbs/?pid=45481. Loaded via the "load sample cart" button on the drop zone.

## What not to do

- Do not add a backend or server-side processing of any kind
- Do not add audio playback (sfx/music) — out of scope
- Do not add a Lua code editor
- Do not add routing (React Router etc.) — tab switching is local state only
- Do not add a component library (shadcn, MUI, etc.) — Tailwind is sufficient
- Do not optimise for mobile — the tool's workflow (Pico-8 dev, exporting .p8 files) is desktop-only. Drag & drop doesn't exist on mobile, carts won't be on people's phones, and the canvas sizes are unsuitable for small screens. If mobile support becomes a genuine need the main gaps are: touch events for map pan, larger palette swatch touch targets (min 44px), and responsive canvas scaling.
