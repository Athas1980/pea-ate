# Animation Tab — Design Notes

These notes were worked out by thinking through real use cases from the shootinator cart. The goal is to design the feature properly before writing any code.

---

## Why this tab exists

The animation tab replaces the Inspector tab. The Inspector's core value (select a sprite region, preview it with different palettes applied) is better served here, and the spritesheet tab covers the remaining use case (exploring colours in context). Removing the Inspector keeps tab count low.

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
- Spritesheet view should render in project palette colours.
- Palette editor shifts from "remap any of 32" to "first pick your 16, then remap within them."
- Named palettes become reorderings of a known colour set.
- Animation frames reference named palettes, which are already constrained to the project colour set.

The animation tab is downstream of getting project palette right — don't build the tab without addressing this first.

---

## Layout

```
┌─────────────────┬─────────────────┬─────────────────┐
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

- **Preview canvas (left):** shows the current frame when stopped; advances during playback. Label at top shows "frame N of M" or "playing".
- **Spritesheet (middle):** tile picker, same interaction as the map editor.
- **Frames list (right):** scrollable list of frame cards. Selected frame is highlighted. Clicking a frame always jumps to it, even during playback.
- **Footer:** play/stop + constant speed control in game frames (e.g. 4 = updates ~15×/s at 60fps).

---

## Frame card

```
┌─────────────────────────────[x]┐
│ frame 2                    [≡] │
│ [palette]                      │
└────────────────────────────────┘
```

- **[palette]** — opens palette picker (constrained to project palette). Quick actions inside: copy from previous frame's palette, reset to project default.
- **[≡] hamburger** — occasional ops: copy tiles from previous frame, copy palette from previous frame, flip.
- **[x] top right** — delete frame.
- **Flip** — mirrors tile layout left-to-right and flips each individual tile. Useful for deriving banked sprite directions from a single drawn direction.

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
  w: number,
  h: number,
  frames: Array<{
    tiles: number[],        // flat W×H array of sprite indices
    palette?: number        // index into namedPalettes
  }>
}
```

### Free mode
```
{
  frames: Array<{
    layers: Array<{
      spriteRegion: { x, y, w, h },  // in sprite-sheet pixels
      x: number,                      // pixel-precise placement
      y: number,
      palette?: number                // index into namedPalettes
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

---

## What was ruled out

- **Variable per-frame duration** — constant speed is enough for palette preview use cases.
- **Mixed grid/free mode** — pick one at creation; technically possible to mix but not worth supporting.
- **Scaling in free mode** — valid future feature, data model can accommodate it, but don't build until asked.
- **Multiple screen palettes per cart** — valid advanced Pico-8 technique; out of scope for simplicity.
- **9-slice brush** — not needed.
