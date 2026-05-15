import type { Cart, PaletteToolData } from '../../types/cart'
import { STANDARD_PALETTE } from '../../types/cart'

const TOOL_SECTION = '__pico8_palette_tool__'

export function serialiseP8(cart: Cart, toolData: PaletteToolData): string {
  const sections = [
    `pico-8 cartridge // http://www.pico-8.com\nversion ${cart.version}`,
    `__lua__\n${cart.lua}`,
    `__gfx__\n${serialiseGfx(cart.gfx)}`,
    `__map__\n${serialiseMap(cart.map)}`,
    `__sfx__\n${cart.sfx}`,
    `__music__\n${cart.music}`,
  ]

  if (cart.label) {
    const bakedLabel = applyLabelPalette(cart.label, toolData.labelPalette ?? {})
    sections.push(`__label__\n${serialiseLabel(bakedLabel)}`)
  }

  // labelPalette is cleared in stored data — it has been baked into the label section above
  const storedToolData: PaletteToolData = { ...toolData, labelPalette: {} }
  sections.push(`${TOOL_SECTION}\n${JSON.stringify(storedToolData, null, 2)}`)

  sections.push('__end__\n')
  return sections.join('\n\n')
}

export function generatePalSnippet(drawPalette: number[]): string {
  const lines: string[] = []
  for (let i = 0; i < 16; i++) {
    const target = drawPalette[i]
    if (target === i) continue
    const fromName = STANDARD_PALETTE[i]
    if (target >= 128) {
      lines.push(`pal(${i}, ${target}, 1)  -- ${fromName} -> secret[${target - 128}]`)
    } else {
      const toName = STANDARD_PALETTE[target]
      lines.push(`pal(${i}, ${target})  -- ${fromName} -> ${toName}`)
    }
  }
  return lines.length ? lines.join('\n') : '-- no palette remaps'
}

function applyLabelPalette(label: Uint8Array, labelPalette: Record<number, number>): Uint8Array {
  const out = new Uint8Array(label.length)
  for (let i = 0; i < label.length; i++) {
    const v = label[i] & 0x1f
    out[i] = (labelPalette[v] ?? v) & 0x1f
  }
  return out
}

function serialiseLabel(pixels: Uint8Array): string {
  const rows: string[] = []
  for (let row = 0; row < 128; row++) {
    let line = ''
    for (let col = 0; col < 128; col++) {
      line += indexToLabelChar(pixels[row * 128 + col] & 0x1f)
    }
    rows.push(line)
  }
  return rows.join('\n')
}

function indexToLabelChar(idx: number): string {
  if (idx < 10) return String(idx)
  return String.fromCharCode(87 + idx)  // 10 → 'a', 31 → 'v'
}

function serialiseGfx(pixels: Uint8Array): string {
  const rows: string[] = []
  for (let row = 0; row < 128; row++) {
    let line = ''
    for (let col = 0; col < 128; col++) {
      line += (pixels[row * 128 + col] & 0xf).toString(16)
    }
    rows.push(line)
  }
  return rows.join('\n')
}

function serialiseMap(tiles: Uint8Array): string {
  const rows: string[] = []
  for (let row = 0; row < 32; row++) {
    let line = ''
    for (let col = 0; col < 128; col++) {
      line += tiles[row * 128 + col].toString(16).padStart(2, '0')
    }
    rows.push(line)
  }
  return rows.join('\n')
}
