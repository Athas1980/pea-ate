import type { Cart } from '../../types/cart'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../../types/cart'

const LABEL_X = 16
const LABEL_Y = 24

type Rgb = [number, number, number]

const COLOR_TABLE: Rgb[] = [
  ...STANDARD_PALETTE.map(hexToRgb),
  ...SECRET_PALETTE.map(hexToRgb),
]

export async function decodePngCart(file: File): Promise<Cart> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const bytes = extractBytes(imageData)
  const gfx = extractGfx(bytes)
  const map = extractMap(bytes, gfx)
  const label = extractLabel(imageData)

  return { version: 0, lua: '', gfx, map, sfx: '', music: '', label, paletteToolData: undefined }
}

function extractBytes({ data, width, height }: ImageData): Uint8Array {
  const bytes = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
    bytes[i] = ((a & 3) << 6) | ((r & 3) << 4) | ((g & 3) << 2) | (b & 3)
  }
  return bytes
}

function extractGfx(bytes: Uint8Array): Uint8Array {
  const gfx = new Uint8Array(128 * 128)
  for (let y = 0; y < 128; y++) {
    for (let xb = 0; xb < 64; xb++) {
      const byte = bytes[y * 64 + xb]
      gfx[y * 128 + xb * 2]     = byte & 0xf
      gfx[y * 128 + xb * 2 + 1] = (byte >> 4) & 0xf
    }
  }
  return gfx
}

function extractMap(bytes: Uint8Array, gfx: Uint8Array): Uint8Array {
  const map = new Uint8Array(128 * 64)

  for (let r = 0; r < 32; r++)
    for (let c = 0; c < 128; c++)
      map[r * 128 + c] = bytes[0x2000 + r * 128 + c]

  // Bottom 32 rows from shared gfx region.
  // Two gfx rows per map row: gfxRow = 64 + 2*row + floor(col/64), colPair = col%64.
  for (let row = 0; row < 32; row++)
    for (let col = 0; col < 128; col++) {
      const gfxRow = 64 + 2 * row + Math.floor(col / 64)
      const colPair = col % 64
      const lo = gfx[gfxRow * 128 + colPair * 2]
      const hi = gfx[gfxRow * 128 + colPair * 2 + 1]
      map[(32 + row) * 128 + col] = lo | (hi << 4)
    }

  return map
}

function extractLabel({ data, width }: ImageData): Uint8Array {
  const label = new Uint8Array(128 * 128)
  for (let row = 0; row < 128; row++) {
    for (let col = 0; col < 128; col++) {
      const i = ((LABEL_Y + row) * width + (LABEL_X + col)) * 4
      label[row * 128 + col] = nearestColor(data[i], data[i + 1], data[i + 2])
    }
  }
  return label
}

function nearestColor(r: number, g: number, b: number): number {
  let best = 0, bestDist = Infinity
  for (let i = 0; i < 32; i++) {
    const [cr, cg, cb] = COLOR_TABLE[i]
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
