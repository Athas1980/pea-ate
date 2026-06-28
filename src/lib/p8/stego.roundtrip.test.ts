/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseP8 } from './parse'
import { decodeP8Png } from './stego'

// Data-fidelity guard: the same cart loaded as a .p8.png and as .p8 text must
// yield identical structural fields (spritesheet, map, code). decodeP8Png is the
// *exact* code the browser runs (canvas-free), so this exercises the real load
// path -- unlike the old canvas reader, whose alpha-premultiplied getImageData
// silently corrupted the 2 LSBs the payload lives in (invisible for sprites,
// fatal for compressed code). This test would have caught that.
//
// adventure-tileset by kraizeg (public domain), in both encodings:
//   - public/carts/adventure-tileset.p8       -- the .p8 text (already in repo)
//   - __fixtures__/adventure-tileset.p8.png    -- the steganographic PNG

const p8Path = join(__dirname, '../../../public/carts/adventure-tileset.p8')
const pngPath = join(__dirname, '__fixtures__/adventure-tileset.p8.png')

// The two load paths differ only at the code's newline edges (not the body):
// the .p8 text appends a trailing newline before the next section, and parseP8's
// section splitter drops a leading blank line (a pre-existing `\s*$` quirk),
// while the cart ROM keeps both. Compare the body with edges normalised.
const trimNewlines = (s: string) => s.replace(/^\n+/, '').replace(/\n+$/, '')

describe('.p8.png <-> .p8 structural round-trip', () => {
  const fromP8 = parseP8(readFileSync(p8Path, 'latin1'))

  it('decodes the PNG with bit-exact pixels (no canvas corruption)', async () => {
    const fromPng = await decodeP8Png(new Uint8Array(readFileSync(pngPath)))

    // exact byte equality -- proves the canvas-free PNG decode is bit-perfect
    expect(fromPng.gfx).toEqual(fromP8.gfx)
    expect(fromPng.map).toEqual(fromP8.map) // incl. shared bottom-half region

    expect(fromPng.lua.length).toBeGreaterThan(0) // guards against silent empty-Lua
    expect(trimNewlines(fromPng.lua)).toBe(trimNewlines(fromP8.lua))
  })
})
