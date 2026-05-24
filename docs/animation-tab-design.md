# Animation Tab — Design Notes

These notes were worked out by thinking through real use cases from the shootinator cart. The goal is to design the feature properly before writing any code.

---

## Why this tab exists

The animation tab replaces the Inspector tab. The Inspector's core value (select a sprite region, preview it with different palettes applied) is better served here, and the spritesheet tab covers the remaining use case (exploring colours in context). Removing the Inspector keeps tab count low.

---

## Tab structure changes

This work reorganises responsibilities across tabs:

- **Spritesheet tab** — reduced to setting the project palette only (pick up to 16 of the 32 available colours). No named palettes here.
- **Palette tab** — goes away. Its responsibilities split: project palette → spritesheet tab, named palettes → animation tab.
- **Animation tab** — named palettes live here, managed in context. Animations reference named palettes by index. This is where all runtime palette tricks are authored and previewed.

Named palettes only have meaning in the context of animation — moving them here makes that relationship explicit.

---

## Real use cases (from shootinator)

Three patterns came up that the tool should support, in priority order:

1. **Palette cycling** — a flame/shot sprite that flashes by alternating between named palettes at speed. The runtime swaps e.g. light blue → white, dark blue → light blue, then reverses.
2. **Sprite swap** — a face in an alien ship hatch is swapped at runtime with one of two face variants. Also covers banking (ship tilt angles played as a flipbook).
3. **Combined** — a frame where both the tile layout AND the palette change together.

Non-grid-aligned compositing (layered sprites with `palt()` transparency) is a valid future case but not at the cost of complicating the simpler cases. Keep the door open; don't block on it.

---

## Project palette — a prerequisite

Before this tab makes sense there's a missing concept in pea-ate: the **project palette**.

Pico-8's screen palette (`pal(c, n, 1)`) lets you redefine what colour each index (0–15) points to globally. In practice this means choosing up to 16 of the 32 available colours as the cart's colour budget, set once at the start.

- The sprite data and named palettes all operate on **indices** (0–15), not absolute colours.
- Changing the project palette (e.g. swapping index 8 from red to dark-red) is non-destructive — every sprite using index 8 now shows dark-red automatically. Named palettes that remap index 8 → 12 remain valid; only the visual result changes.
- This is intentional global colour substitution, not a breaking change.
- Multiple screen palette changes mid-game are valid but an advanced edge case — model project palette as set-once for simplicity.

**What this means for pea-ate:**
- Spritesheet view renders in project palette colours.
- Spritesheet tab UI reduced to: show 16 colour slots, click a slot to reassign it to any of the 32 available colours.
- Named palettes are reorderings within the project colour set, managed in the animation tab.
- Animation frames reference named palettes by index.

The animation tab is downstream of getting project palette right — don't build the tab without addressing this first.

---

## Layout

Named palettes sit at the top of the animation tab (exact placement TBD — above the main three-column area). The three-column layout is below:

```
┌─────────────────────────────────────────────────────┐
│  named palettes: [pal 1] [pal 2] [pal 3] [+ add]   │  ← TBD exact layout
├─────────────────┬─────────────────┬─────────────────┤
│  frame 2 of 4   │  spritesheet    │  frames         │
│                 │                 │                  │
│  [canvas]       │  [canvas]       │  ┌───────────┐  │
│                 │                 │  │ frame 1   │  │
│                 │                 │  │ [palette] │  │
│                 │                 │  └───────────┘  │
│                 │                 │  ┌───────────┐  │
│                 │                 │  │ frame 2 ◀ │  │
│                 │                 │  │ [palette] │  │
│                 │                 │  └───────────┘  │
│                 │                 │  + add frame    │
├─────────────────┴─────────────────┴─────────────────┤
│  ▶  speed: [────●────]                              │
└─────────────────────────────────────────────────────┘
```

- **Named palettes (top):** create and manage named palettes in context. Placement TBD.
- **Preview canvas (left):** shows the current frame when stopped; advances during playback. Label at top shows "frame N of M" or "playing".
- **Spritesheet (middle):** tile picker, same interaction as the map editor.
- **Frames list (right):** scrollable list of frame cards, grouped under a named animation. Selected frame highlighted. Clicking always jumps to it, even during playback.
- **Footer:** play/stop + constant speed control in game frames (e.g. 4 = updates ~15×/s at 60fps).

---

## Animations

Each animation has a **name** (e.g. "banking", "idle", "explosion") set at creation. Multiple animations can exist in one cart — the frames list is scoped to the currently selected animation. Naming helps when reviewing a project's runtime tricks at a glance.

Data model at the animation level:
```
{
  name: string,
  mode: 'grid' | 'free',
  speed: number,           // in game frames
  // ... grid or free fields below
}
```

---

## Frame card

```
┌──────────────────────────────────[x]┐
│ frame 2                         [≡] │
│ [palette ▾]    [↔] flip  [⊞] mirror │
└──────────────────────────────────────┘
```

- **[palette ▾]** — dropdown/picker to select a named palette by index. No colour editing here — that's done in the named palettes section above.
- **[↔] flip toggle** — render-only flag. Renders the whole frame reversed left-to-right (sprite faces the opposite direction). Does not modify tile data. Maps to `spr(n, x, y, w, h, true)` / `sspr()` flip_x in generated Lua snippets.
- **[⊞] mirror toggle** — render-only flag. Takes the left half of the canvas, flips it horizontally, and composites it onto the right half (left + left-flipped). Does not modify tile data. Design aid for authoring symmetric sprites (faces, shields, etc.); has no Lua equivalent.
- **[≡] hamburger** — occasional ops: copy tiles from previous frame, copy palette from previous frame.
- **[x] top right** — delete frame.

In **free mode**, both flip and mirror are per-layer flags rather than per-frame, since each layer is an independent sprite placement.

---

## Adding and managing frames

- **+ button** — always a full copy of the previous frame (tiles + palette). The common case.
- **Copy tiles / Copy palette** — available in the hamburger, for when you've already changed one and want to pull back just the other.
- **Copy/paste** — clipboard held in component state (no OS clipboard needed). Copy a frame, paste inserts a duplicate after the current frame.
- **Playback speed** — constant across all frames in game frames. No variable per-frame duration.

---

## Canvas size (grid mode)

- Set once at animation creation (W × H in tiles). Fixed for the lifetime of the animation — all frames share the same grid.
- **Grow** is always safe — new empty tiles added, anchored top-left.
- **Shrink** warns once, then trims anything outside the new boundary. Top-left anchor.
- Locked after creation except via an explicit resize action.

---

## Painting (grid mode)

Identical to the map editor: click a tile in the spritesheet, click/drag on the preview canvas to stamp. Keeps UX consistent — no new interaction model to learn.

---

## Two data models

Mode is chosen at animation creation and never mixed.

### Grid mode
```
{
  name: string,
  mode: 'grid',
  speed: number,
  w: number,
  h: number,
  frames: Array<{
    tiles: number[],        // flat W×H array of sprite indices
    palette?: number,       // index into namedPalettes
    flip?: boolean,         // render-only: whole frame reversed left-to-right
    mirror?: boolean        // render-only: left half mirrored onto right half
  }>
}
```

### Free mode
```
{
  name: string,
  mode: 'free',
  speed: number,
  frames: Array<{
    layers: Array<{
      spriteRegion: { x, y, w, h },  // in spritesheet pixels
      x: number,                      // pixel-precise placement
      y: number,
      palette?: number,               // index into namedPalettes
      flip?: boolean,                 // render-only: layer reversed left-to-right
      mirror?: boolean                // render-only: left half mirrored onto right half
    }>
  }>
}
```

- Layers drawn in order: first = back, last = front. Matches the order you'd write `sspr()` calls in Lua.
- Pixel-precise coordinates. Snap-to-grid is a placement aid only — not stored in the data.
- Free mode generates `sspr()` snippets (supports non-grid-aligned placement and future scaling).
- Grid mode generates `spr()` calls.

---

## Lua snippet generation

Deferred — wanted but better added once the tab is built and the exact snippet shapes are clear. Both modes will eventually generate copy-pasteable snippets (grid mode → `spr()`, free mode → `sspr()`), consistent with the existing `pal()` snippet generation.

- `flip=true` will likely map to the flip_x parameter: `spr(n, x, y, w, h, true)` / equivalent sspr() arg — exact snippet TBD, user may provide a reference snippet
- `mirror` is a render-only design aid with no Lua equivalent — not emitted in snippets
- **Contiguous sprite optimisation:** if all tiles in a frame form a contiguous rectangular region in the spritesheet, emit a single `spr(n, x, y, w, h)` call rather than iterating — avoids per-tile call overhead at runtime.

---

## What was ruled out

- **Variable per-frame duration** — constant speed is enough for palette preview use cases.
- **Mixed grid/free mode** — pick one at creation; technically possible to mix but not worth supporting.
- **Scaling in free mode** — valid future feature, data model can accommodate it, but don't build until asked.
- **Multiple screen palettes per cart** — valid advanced Pico-8 technique; out of scope for simplicity.
- **9-slice brush** — not needed.
