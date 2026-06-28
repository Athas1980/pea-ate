/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseP8 } from './parse'
import { decodeCartBytes } from './stego'

// Data-fidelity guard: the same cart loaded via the .p8.png path and the .p8
// path must yield identical structural fields (spritesheet, map, code). This is
// the check that would have caught the empty-Lua import bug, which a visual
// "sprites rendered" check did not.
//
// Fixtures are the two encodings of one real cart (adventure-tileset by kraizeg):
//   - public/carts/adventure-tileset.p8       -- the .p8 text (already in repo)
//   - __fixtures__/adventure-tileset.rom.bin  -- the 32 KB cart ROM as extracted
//     from adventure-tileset.p8.png (the ARGB-LSB bytes decodePngCart hands to
//     decodeCartBytes). PNG pixel decoding needs browser/canvas APIs, so that
//     one step runs offline and its byte output is captured here.

const p8Path = join(__dirname, '../../../public/carts/adventure-tileset.p8')
const romPath = join(__dirname, '__fixtures__/adventure-tileset.rom.bin')

// The two load paths differ only at the code's newline edges, for reasons that
// aren't data loss in the body:
//   - the .p8 text format appends a trailing newline before the next section,
//     which the cart ROM doesn't store; and
//   - parseP8's section splitter strips a leading blank line (a pre-existing
//     quirk of its `\s*$` regex), which the ROM keeps.
// Compare the code body with both newline edges normalised.
const trimNewlines = (s: string) => s.replace(/^\n+/, '').replace(/\n+$/, '')

describe('.p8.png <-> .p8 structural round-trip', () => {
  const fromP8 = parseP8(readFileSync(p8Path, 'latin1'))
  const fromPng = decodeCartBytes(new Uint8Array(readFileSync(romPath)))

  it('spritesheet (__gfx__) matches', () => {
    expect(fromPng.gfx).toEqual(fromP8.gfx)
  })

  it('map (incl. shared bottom-half region) matches', () => {
    expect(fromPng.map).toEqual(fromP8.map)
  })

  it('Lua code body matches (modulo newline-edge representation)', () => {
    expect(fromPng.lua.length).toBeGreaterThan(0) // guards against silent empty-Lua
    expect(trimNewlines(fromPng.lua)).toBe(trimNewlines(fromP8.lua))
  })
})
