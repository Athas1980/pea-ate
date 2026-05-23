# Technical Findings

## Bugs

### 1. Shared map edits not persisted on export
**File:** `src/App.tsx`, `src/lib/p8/export.ts`

When `useSharedMap: true`, the map editor writes edits to `mapData[4096..8191]` (bottom 32 rows). On export, `serialiseMap` writes only the top 32 rows to `__map__`. The bottom rows live in shared gfx memory, so they need to be packed back into `cart.gfx` before `serialiseGfx` runs. Currently `serialiseGfx(cart.gfx)` uses the original unmodified gfx — any edits to the shared region via the map editor are silently lost.

### 2. Eraser size resets on cart load
**File:** `src/App.tsx:68`

`handleLoad` calls `setMapTool({ tool: 'brush', eraserSize: 1, fillRandom: false })`, resetting the eraser size to 1. `CLAUDE.md` documents that eraser size persists across carts. Either the code or the docs are wrong.

---

## Dead Code

### 3. `generatePalSnippet` is never used
**File:** `src/lib/p8/export.ts:35`

Exported but not imported anywhere in the codebase. Lua snippet generation is handled entirely inside `PaletteEditor.tsx`. Can be deleted.

---

## Font Size Violations

### 4. SpriteInspector uses `fontSize: '6px'`
**File:** `src/components/SpriteInspector.tsx:122, 160, 190`

Three inline `style={{ fontSize: '6px' }}` usages on hint text and thumbnail labels. This is below the 10px minimum documented in `CLAUDE.md` for Press Start 2P. At 6px the glyphs are rendering at sub-pixel sizes and are essentially unreadable.

---

## Performance

### 5. TilePicker hover fires setState on every mousemove pixel
**File:** `src/components/TilePicker.tsx`

`handleMouseMove` calls `setHoverTile({ tx, ty })` unconditionally. Since tile coordinates change only when crossing an 8px boundary, this triggers unnecessary React re-renders on every pixel of movement across the canvas. Should compare against the current hover state before calling setState.

---

## Accessibility

### 6. CartOptions toggle is not keyboard accessible
**File:** `src/components/CartOptions.tsx`

The toggle uses a `<label>` wrapper with a custom `<div onClick>` but no `<input>` element. The label's implicit focus forwarding has nothing to attach to. The toggle cannot be reached or activated by keyboard.

---

## Validation Gap

### 7. `decodePngCart` does not validate PNG dimensions
**File:** `src/lib/p8/stego.ts`

A `.p8.png` is 160×205 pixels. If a user drops any other PNG, `extractBytes` reads garbage silently and produces a corrupt-looking cart with no error. A dimension check at the top of `decodePngCart` would surface the problem immediately.

---

## Correctness Uncertainty

### 8. `rotate()` usage in `generateLuaCompact` needs verification
**File:** `src/components/PaletteEditor.tsx:255-273`

`pal(split"a,b,c...")` in Pico-8 creates a 1-indexed Lua table. It is unclear whether the rotation of the palette array before joining is correct for the intended slot mapping. If Pico-8 treats index 1 as colour 1 (not colour 0), the rotation is wrong and produces off-by-one remaps. Worth testing against a real cart.
