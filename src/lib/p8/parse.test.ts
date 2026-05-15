import { describe, it, expect } from 'vitest'
import { parseP8 } from './parse'

// Minimal valid .p8 header
const HEADER = 'pico-8 cartridge // http://www.pico-8.com\nversion 43\n'

// Generate a gfx section: 128 rows of 128 chars, all set to `char`
function gfxSection(char = '0') {
  return Array(128).fill(char.repeat(128)).join('\n')
}

// Generate a map section: 32 rows of 256 chars (128 two-char hex bytes), all `byte`
function mapSection(byte = '00') {
  return Array(32).fill(byte.repeat(128)).join('\n')
}

function makeCart(overrides: Record<string, string> = {}) {
  const sections: Record<string, string> = {
    '__lua__': '',
    '__gfx__': gfxSection('0'),
    '__map__': mapSection('00'),
    '__sfx__': '',
    '__music__': '',
    ...overrides,
  }
  return HEADER + Object.entries(sections)
    .map(([k, v]) => `${k}\n${v}`)
    .join('\n') + '\n__end__\n'
}

// ─── Version ──────────────────────────────────────────────────────────────────

describe('version', () => {
  it('parses version number', () => {
    expect(parseP8(makeCart()).version).toBe(43)
  })

  it('defaults to 0 when missing', () => {
    expect(parseP8('no header here').version).toBe(0)
  })
})

// ─── GFX ──────────────────────────────────────────────────────────────────────

describe('gfx parsing', () => {
  it('produces 128×128 array', () => {
    expect(parseP8(makeCart()).gfx.length).toBe(128 * 128)
  })

  it('maps hex nibbles to numeric values', () => {
    // First row: 0123456789abcdef repeated 8 times
    const row0 = '0123456789abcdef'.repeat(8)
    const gfx = Array(128).fill('0'.repeat(128))
    gfx[0] = row0
    const cart = parseP8(makeCart({ '__gfx__': gfx.join('\n') }))
    expect(cart.gfx[0]).toBe(0)
    expect(cart.gfx[9]).toBe(9)
    expect(cart.gfx[10]).toBe(10)
    expect(cart.gfx[15]).toBe(15)
  })

  it('fills remainder with 0 for short gfx data', () => {
    const cart = parseP8(makeCart({ '__gfx__': '1'.repeat(128) }))
    expect(cart.gfx[0]).toBe(1)
    expect(cart.gfx[128]).toBe(0) // row 1 not provided
  })
})

// ─── Label ────────────────────────────────────────────────────────────────────

describe('label parsing', () => {
  it('returns undefined when no label section', () => {
    expect(parseP8(makeCart()).label).toBeUndefined()
  })

  it('produces 128×128 array when label present', () => {
    const label = Array(128).fill('0'.repeat(128)).join('\n')
    const cart = parseP8(makeCart({ '__label__': label }))
    expect(cart.label?.length).toBe(128 * 128)
  })

  it('maps 0-9 to indices 0-9', () => {
    const row = '0123456789' + '0'.repeat(118)
    const label = Array(128).fill('0'.repeat(128))
    label[0] = row
    const cart = parseP8(makeCart({ '__label__': label.join('\n') }))
    for (let i = 0; i <= 9; i++) {
      expect(cart.label![i]).toBe(i)
    }
  })

  it('maps a-v to indices 10-31', () => {
    const chars = 'abcdefghijklmnopqrstuv'
    const row = chars + '0'.repeat(128 - chars.length)
    const label = Array(128).fill('0'.repeat(128))
    label[0] = row
    const cart = parseP8(makeCart({ '__label__': label.join('\n') }))
    for (let i = 0; i < chars.length; i++) {
      expect(cart.label![i]).toBe(10 + i)
    }
  })

  it('falls back to 0 for unexpected characters', () => {
    const row = 'z'.repeat(128) // 'z' is beyond 'v'
    const label = Array(128).fill('0'.repeat(128))
    label[0] = row
    const cart = parseP8(makeCart({ '__label__': label.join('\n') }))
    expect(cart.label![0]).toBe(0)
  })
})

// ─── Map ──────────────────────────────────────────────────────────────────────

describe('map parsing', () => {
  it('produces 128×64 array', () => {
    expect(parseP8(makeCart()).map.length).toBe(128 * 64)
  })

  it('reads top 32 rows from __map__ section', () => {
    // Set row 0 col 0 to tile 0xab = 171
    const row = 'ab' + '00'.repeat(127)
    const map = Array(32).fill('00'.repeat(128))
    map[0] = row
    const cart = parseP8(makeCart({ '__map__': map.join('\n') }))
    expect(cart.map[0]).toBe(0xab)
    expect(cart.map[1]).toBe(0x00)
  })

  it('reads bottom 32 rows from shared gfx memory (rows 64-127)', () => {
    // gfx row 64 col 0 = nibble 'a' (10), col 1 = nibble 'b' (11)
    // → map tile (32, 0) = lo | (hi << 4) = 10 | (11 << 4) = 10 | 176 = 186 = 0xba
    const gfxRows = Array(128).fill('0'.repeat(128))
    gfxRows[64] = 'ab' + '0'.repeat(126)
    const cart = parseP8(makeCart({ '__gfx__': gfxRows.join('\n') }))
    expect(cart.map[32 * 128]).toBe(0xba)
  })
})

// ─── PaletteToolData ──────────────────────────────────────────────────────────

describe('paletteToolData', () => {
  it('returns undefined when no tool section', () => {
    expect(parseP8(makeCart()).paletteToolData).toBeUndefined()
  })

  it('restores stored tool data', () => {
    const toolData = {
      drawPalette: Array.from({ length: 16 }, (_, i) => i),
      useSharedMap: false,
      showZeroTile: true,
      labelPalette: { '3': 7 },
    }
    const cart = parseP8(makeCart({
      '__pico8_palette_tool__': JSON.stringify(toolData),
    }))
    expect(cart.paletteToolData?.drawPalette[0]).toBe(0)
    expect(cart.paletteToolData?.useSharedMap).toBe(false)
    expect(cart.paletteToolData?.showZeroTile).toBe(true)
  })

  it('ignores malformed JSON gracefully', () => {
    const cart = parseP8(makeCart({ '__pico8_palette_tool__': 'not json' }))
    expect(cart.paletteToolData).toBeUndefined()
  })
})
