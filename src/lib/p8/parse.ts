import type { Cart, PaletteToolData } from '../../types/cart'

const TOOL_SECTION = '__pico8_palette_tool__'

export function parseP8(text: string): Cart {
  const sections = splitSections(text)

  const versionMatch = text.match(/^pico-8 cartridge.*\nversion (\d+)/m)
  const version = versionMatch ? parseInt(versionMatch[1], 10) : 0

  const gfx = parseGfx(sections['__gfx__'] ?? '')
  const map = parseMap(sections['__map__'] ?? '', gfx)

  let paletteToolData: PaletteToolData | undefined
  const toolSection = sections[TOOL_SECTION]
  if (toolSection) {
    try {
      paletteToolData = JSON.parse(toolSection.trim())
    } catch {
      // malformed — ignore
    }
  }

  return {
    version,
    lua: sections['__lua__'] ?? '',
    gfx,
    map,
    sfx: sections['__sfx__'] ?? '',
    music: sections['__music__'] ?? '',
    label: sections['__label__'] ? parseLabel(sections['__label__']) : undefined,
    paletteToolData,
  }
}

function splitSections(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const sectionRe = /^(__\w+__)\s*$/gm
  let match: RegExpExecArray | null
  let lastKey: string | null = null
  let lastIndex = 0

  while ((match = sectionRe.exec(text)) !== null) {
    if (lastKey) {
      result[lastKey] = text.slice(lastIndex, match.index)
    }
    lastKey = match[1]
    lastIndex = match.index + match[0].length + 1
  }

  if (lastKey) {
    result[lastKey] = text.slice(lastIndex)
  }

  return result
}

function parseGfx(raw: string): Uint8Array {
  const pixels = new Uint8Array(128 * 128)
  const lines = raw.split('\n').filter(Boolean)
  for (let row = 0; row < Math.min(lines.length, 128); row++) {
    const line = lines[row]
    for (let col = 0; col < Math.min(line.length, 128); col++) {
      pixels[row * 128 + col] = parseInt(line[col], 16)
    }
  }
  return pixels
}

function parseLabel(raw: string): Uint8Array {
  const pixels = new Uint8Array(128 * 128)
  const lines = raw.split('\n').filter(Boolean)
  for (let row = 0; row < Math.min(lines.length, 128); row++) {
    const line = lines[row]
    for (let col = 0; col < Math.min(line.length, 128); col++) {
      pixels[row * 128 + col] = labelCharToIndex(line[col])
    }
  }
  return pixels
}

function labelCharToIndex(char: string): number {
  const code = char.charCodeAt(0)
  if (code >= 48 && code <= 57) return code - 48   // '0'-'9' → 0-9
  if (code >= 97 && code <= 118) return code - 87  // 'a'-'v' → 10-31
  return 0
}

function parseMap(raw: string, gfx: Uint8Array): Uint8Array {
  const tiles = new Uint8Array(128 * 64)

  // Top 32 rows from __map__ section
  const lines = raw.split('\n').filter(Boolean)
  for (let row = 0; row < Math.min(lines.length, 32); row++) {
    const line = lines[row]
    for (let col = 0; col < 128; col++) {
      const byteStr = line.slice(col * 2, col * 2 + 2)
      tiles[row * 128 + col] = parseInt(byteStr, 16) || 0
    }
  }

  // Bottom 32 rows shared with bottom half of gfx (rows 64–127).
  // Each map row is 128 bytes but each gfx row is only 64 bytes (128 pixels packed
  // 2-per-byte), so two gfx rows feed one map row. gfxRow = 64 + 2*row + floor(col/64).
  for (let row = 0; row < 32; row++) {
    for (let col = 0; col < 128; col++) {
      const gfxRow = 64 + 2 * row + Math.floor(col / 64)
      const colPair = col % 64
      const lo = gfx[gfxRow * 128 + colPair * 2]
      const hi = gfx[gfxRow * 128 + colPair * 2 + 1]
      tiles[(32 + row) * 128 + col] = lo | (hi << 4)
    }
  }

  return tiles
}
