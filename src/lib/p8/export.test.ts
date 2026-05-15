import { describe, it, expect } from 'vitest'
import { serialiseP8, generatePalSnippet } from './export'
import { parseP8 } from './parse'
import type { Cart, PaletteToolData } from '../../types/cart'

const HEADER = 'pico-8 cartridge // http://www.pico-8.com\nversion 43\n'

function gfxSection(char = '0') {
  return Array(128).fill(char.repeat(128)).join('\n')
}

function mapSection(byte = '00') {
  return Array(32).fill(byte.repeat(128)).join('\n')
}

function makeP8(overrides: Record<string, string> = {}) {
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

const IDENTITY_TOOL_DATA: PaletteToolData = {
  drawPalette: Array.from({ length: 16 }, (_, i) => i),
  useSharedMap: true,
  showZeroTile: false,
  labelPalette: {},
}

// ─── Label char encoding round-trip ───────────────────────────────────────────

describe('label char encoding', () => {
  // Test via round-trip: write a label with known values, parse it back
  it('indices 0-9 survive a parse→serialise→parse round-trip', () => {
    const labelRow = (idx: number) => String(idx).repeat(128)
    for (let i = 0; i <= 9; i++) {
      const label = Array(128).fill('0'.repeat(128))
      label[0] = labelRow(i)
      const original = makeP8({ '__label__': label.join('\n') })
      const cart = parseP8(original)
      const exported = serialiseP8(cart, IDENTITY_TOOL_DATA)
      const reparsed = parseP8(exported)
      expect(reparsed.label![0]).toBe(i)
    }
  })

  it('indices 10-31 (a-v) survive a parse→serialise→parse round-trip', () => {
    const chars = 'abcdefghijklmnopqrstuv'
    for (let i = 0; i < chars.length; i++) {
      const label = Array(128).fill('0'.repeat(128))
      label[0] = chars[i].repeat(128)
      const original = makeP8({ '__label__': label.join('\n') })
      const cart = parseP8(original)
      const exported = serialiseP8(cart, IDENTITY_TOOL_DATA)
      const reparsed = parseP8(exported)
      expect(reparsed.label![0]).toBe(10 + i)
    }
  })
})

// ─── Label palette baking ─────────────────────────────────────────────────────

describe('label palette baking', () => {
  function cartWithLabel(labelValue: number): Cart {
    const char = labelValue < 10 ? String(labelValue) : String.fromCharCode(87 + labelValue)
    const label = Array(128).fill(char.repeat(128)).join('\n')
    return parseP8(makeP8({ '__label__': label }))
  }

  it('identity labelPalette leaves label data unchanged', () => {
    const cart = cartWithLabel(5)
    const exported = serialiseP8(cart, { ...IDENTITY_TOOL_DATA, labelPalette: {} })
    const reparsed = parseP8(exported)
    expect(reparsed.label![0]).toBe(5)
  })

  it('bakes labelPalette swap into label data', () => {
    const cart = cartWithLabel(3)
    const exported = serialiseP8(cart, {
      ...IDENTITY_TOOL_DATA,
      labelPalette: { 3: 15 }, // remap index 3 → 15
    })
    const reparsed = parseP8(exported)
    expect(reparsed.label![0]).toBe(15)
  })

  it('clears labelPalette in stored tool data after baking', () => {
    const cart = cartWithLabel(3)
    const exported = serialiseP8(cart, {
      ...IDENTITY_TOOL_DATA,
      labelPalette: { 3: 15 },
    })
    const reparsed = parseP8(exported)
    expect(reparsed.paletteToolData?.labelPalette).toEqual({})
  })

  it('bakes secret palette index (16-31) correctly', () => {
    const cart = cartWithLabel(2)
    const exported = serialiseP8(cart, {
      ...IDENTITY_TOOL_DATA,
      labelPalette: { 2: 20 }, // remap to secret index 20
    })
    const reparsed = parseP8(exported)
    expect(reparsed.label![0]).toBe(20)
  })
})

// ─── Round-trip ───────────────────────────────────────────────────────────────

describe('parse → serialise → parse round-trip', () => {
  it('preserves gfx data', () => {
    const gfxRows = Array(128).fill('0'.repeat(128))
    gfxRows[0] = '123456789abcdef0'.repeat(8)
    const cart = parseP8(makeP8({ '__gfx__': gfxRows.join('\n') }))
    const reparsed = parseP8(serialiseP8(cart, IDENTITY_TOOL_DATA))
    expect(reparsed.gfx.slice(0, 16)).toEqual(cart.gfx.slice(0, 16))
  })

  it('preserves map top-32 rows', () => {
    const mapRows = Array(32).fill('00'.repeat(128))
    mapRows[0] = 'abcd' + '00'.repeat(126)
    const cart = parseP8(makeP8({ '__map__': mapRows.join('\n') }))
    const reparsed = parseP8(serialiseP8(cart, IDENTITY_TOOL_DATA))
    expect(reparsed.map[0]).toBe(cart.map[0])
    expect(reparsed.map[1]).toBe(cart.map[1])
  })

  it('stores tool data in __pico8_palette_tool__ section', () => {
    const cart = parseP8(makeP8())
    const toolData: PaletteToolData = {
      drawPalette: [7, 1, 2, 3, 4, 5, 6, 0, 8, 9, 10, 11, 12, 13, 14, 15],
      useSharedMap: false,
      showZeroTile: true,
      labelPalette: {},
    }
    const reparsed = parseP8(serialiseP8(cart, toolData))
    expect(reparsed.paletteToolData?.drawPalette[0]).toBe(7)
    expect(reparsed.paletteToolData?.useSharedMap).toBe(false)
    expect(reparsed.paletteToolData?.showZeroTile).toBe(true)
  })

  it('restores drawPalette on second load', () => {
    const cart = parseP8(makeP8())
    const toolData: PaletteToolData = {
      ...IDENTITY_TOOL_DATA,
      drawPalette: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    }
    const exported = serialiseP8(cart, toolData)
    const reparsed = parseP8(exported)
    expect(reparsed.paletteToolData?.drawPalette).toEqual(toolData.drawPalette)
  })
})

// ─── generatePalSnippet ───────────────────────────────────────────────────────

describe('generatePalSnippet', () => {
  it('returns no-op comment for identity palette', () => {
    const palette = Array.from({ length: 16 }, (_, i) => i)
    expect(generatePalSnippet(palette)).toBe('-- no palette remaps')
  })

  it('generates standard pal() call for standard remap', () => {
    const palette = Array.from({ length: 16 }, (_, i) => i)
    palette[0] = 7 // black → white
    const snippet = generatePalSnippet(palette)
    expect(snippet).toContain('pal(0, 7)')
  })

  it('generates pal() with secret flag for secret remap', () => {
    const palette = Array.from({ length: 16 }, (_, i) => i)
    palette[3] = 128 // dark-green → secret[0]
    const snippet = generatePalSnippet(palette)
    expect(snippet).toContain('pal(3, 128, 1)')
  })

  it('only emits lines for remapped slots', () => {
    const palette = Array.from({ length: 16 }, (_, i) => i)
    palette[5] = 10
    const lines = generatePalSnippet(palette).split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('pal(5, 10)')
  })
})
