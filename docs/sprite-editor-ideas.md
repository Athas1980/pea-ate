# Sprite editor ideas

Pain points encountered regularly when drawing sprites for Pico-8 carts.
These are recurring workflow problems, not one-offs.

## The gap no existing tool fills

- **Pico-8 editor** — tile-native, but palette-blind and grid-constrained
- **Aseprite** — great drawing tools, but mapping the result back into sprite slots
  is a manual, error-prone translation step
- **pea-ate** — already tile-native, already renders with the draw palette applied;
  a pixel editor here sits exactly in the middle and is the only tool that solves
  all three at once

The Aseprite workaround doesn't fully work: you can draw freely, but you lose the
tile boundary awareness and have to manually figure out which pixels map to which
sprite slot. pea-ate already speaks both languages.

## Synergy with a native app (Tauri)

In the browser a sprite editor still has friction — export, drag into Pico-8, reload.
In a native app that writes directly to the .p8 file on disk the loop becomes:
edit in pea-ate → save → Ctrl+R in Pico-8. Neither feature is as compelling alone
as they are together.

The workflow only fully clicks when all the pieces are in lockstep:
native app + filesystem watcher + sprite editor. That's what makes pea-ate feel
like a proper companion tool running alongside Pico-8, rather than a separate
export step. The browser version will always have save/drag/reload friction
breaking the loop.

## Pain points

**1. No custom palette preview**
Can't see `pal()` remaps applied while drawing. Wanted to swap in an alternative
red/blue for trouser shading but had to work blind. pea-ate already renders with
the draw palette applied — a pixel editor here would solve this for free.

**2. Only power-of-2 block sizes (1×1, 2×2, 4×4)**
No support for e.g. 3-wide sprites. Workaround: fill right/bottom boundary tiles
with a sentinel colour you're not using, as a visual fence.

**3. Sprites must be contiguous**
Large sprites need a single rectangular block of slots. Rearranging later requires
manual cut/paste. Two design approaches:
- Pre-select and arrange slots upfront; editor lays them out as a logical grid.
  Indices are real from the start, no translation needed.
- Virtual scratch canvas; draw freely, then remap/assign to sprite slots as a
  separate export step. More flexible, more complex to keep in sync.

**4. No animation frame preview**
Frames are just numbered sprites — no playback to check if poses read well
in sequence. (Partially solved by the existing animation tab.)

## Design notes for if/when a sprite editor gets built

**Null tile slots**
Non-rectangular sprites (e.g. walk cycle with empty corner tiles) need a way to
express "this slot is intentionally empty." Use a sentinel (index -1) that the
renderer skips. Shown as a hatched/dimmed cell in the UI. Click to assign; click
assigned slot to clear back to null.

**Layers (future, not now)**
A 1×2 walk cycle where only the feet change reveals the need for layers: a static
torso layer + a per-frame feet layer, rather than duplicating torso pixels across
every frame. Null slots on a layer mean it doesn't render on that frame (useful
for conditional elements like weapons). Not in scope yet — note for when the
animation editor matures.
