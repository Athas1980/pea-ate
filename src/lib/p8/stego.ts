import type { Cart } from '../../types/cart'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../../types/cart'

const LABEL_X = 16
const LABEL_Y = 24

const CODE_START = 0x4300
const CODE_END = 0x8000

// Old-format literal table: byte values 0x01-0x3b decode to these characters
// (index 0 is the "raw byte follows" escape and is never looked up here).
const OLD_CODE_TABLE =
  '\0\n 0123456789abcdefghijklmnopqrstuvwxyz!#%(){}[]<>+=/*:;.,~_'

type Rgb = [number, number, number]

const COLOR_TABLE: Rgb[] = [
  ...STANDARD_PALETTE.map(hexToRgb),
  ...SECRET_PALETTE.map(hexToRgb),
]

export interface RgbaImage {
  width: number
  height: number
  data: Uint8Array
}

/** Browser entry point: read a `.p8.png` File and decode it to a Cart. */
export async function decodePngCart(file: File): Promise<Cart> {
  return decodeP8Png(new Uint8Array(await file.arrayBuffer()))
}

/**
 * Decodes the raw bytes of a `.p8.png` to a Cart. Pure (no DOM/canvas), so the
 * whole load pipeline is testable in node against a real `.p8.png`.
 *
 * We decode the PNG ourselves rather than via `createImageBitmap` + canvas
 * `getImageData`: the payload lives in the 2 LSBs of every channel, and a canvas
 * round-trip premultiplies/un-premultiplies alpha (most cart pixels have alpha
 * < 255), silently corrupting those bits -- invisibly for sprites, fatally for
 * the bit-exact compressed code.
 */
export async function decodeP8Png(pngBytes: Uint8Array): Promise<Cart> {
  const image = await decodePng(pngBytes)
  const bytes = extractBytes(image)
  const { gfx, map, lua } = decodeCartBytes(bytes)
  const label = extractLabel(image)
  return { version: 0, lua, gfx, map, sfx: '', music: '', label, paletteToolData: undefined }
}

/**
 * Minimal PNG decoder for the one format Pico-8 writes: 8-bit RGBA, non-
 * interlaced. Parses chunks, inflates the IDAT stream (zlib, via the platform
 * `DecompressionStream`), and reverses the per-scanline filters. Returns exact
 * pixel bytes -- no canvas, no colour management, no alpha premultiplication.
 */
async function decodePng(bytes: Uint8Array): Promise<RgbaImage> {
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== SIG[i]) throw new Error('not a PNG file')
  }

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let pos = 8
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idat: Uint8Array[] = []
  while (pos + 8 <= bytes.length) {
    const len = dv.getUint32(pos); pos += 4
    const type = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3])
    pos += 4
    if (type === 'IHDR') {
      width = dv.getUint32(pos)
      height = dv.getUint32(pos + 4)
      bitDepth = bytes[pos + 8]
      colorType = bytes[pos + 9]
      interlace = bytes[pos + 12]
    } else if (type === 'IDAT') {
      idat.push(bytes.subarray(pos, pos + len))
    } else if (type === 'IEND') {
      break
    }
    pos += len + 4 // chunk data + CRC
  }

  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(
      `unsupported PNG (bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}); expected 8-bit RGBA, non-interlaced`,
    )
  }

  let total = 0
  for (const chunk of idat) total += chunk.length
  const compressed = new Uint8Array(total)
  let off = 0
  for (const chunk of idat) { compressed.set(chunk, off); off += chunk.length }

  const raw = await inflate(compressed)
  return { width, height, data: unfilter(raw, width, height) }
}

async function inflate(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const stream = new Response(data).body!.pipeThrough(new DecompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Reverses PNG per-scanline filtering for 8-bit RGBA (4 bytes/pixel). */
function unfilter(raw: Uint8Array, width: number, height: number): Uint8Array {
  const bpp = 4
  const stride = width * bpp
  const out = new Uint8Array(width * height * bpp)
  let ip = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[ip++]
    const rowStart = y * stride
    const prevStart = rowStart - stride
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[ip++]
      const left = x >= bpp ? out[rowStart + x - bpp] : 0
      const up = y > 0 ? out[prevStart + x] : 0
      const upLeft = y > 0 && x >= bpp ? out[prevStart + x - bpp] : 0
      let value: number
      switch (filter) {
        case 0: value = rawByte; break
        case 1: value = rawByte + left; break
        case 2: value = rawByte + up; break
        case 3: value = rawByte + ((left + up) >> 1); break
        case 4: value = rawByte + paeth(left, up, upLeft); break
        default: throw new Error(`unsupported PNG filter ${filter}`)
      }
      out[rowStart + x] = value & 0xff
    }
  }
  return out
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

/**
 * Decodes the structural fields that live in the cart ROM byte array (the
 * spritesheet, map, and Lua code). Split out from `decodePngCart` -- which also
 * needs the raw pixels for the label -- so the ROM->cart pipeline is testable
 * without browser canvas APIs. Exported for the round-trip fidelity test.
 */
export function decodeCartBytes(bytes: Uint8Array): Pick<Cart, 'gfx' | 'map' | 'lua'> {
  const gfx = extractGfx(bytes)
  const map = extractMap(bytes, gfx)
  const lua = decodeCode(bytes)
  return { gfx, map, lua }
}

/**
 * Reads bits from a byte array LSB-first within each byte. Within a multi-bit
 * field the first bit read is the least significant. Matches Pico-8's PXA
 * bitstream layout.
 */
class BitReader {
  private readonly data: Uint8Array
  private pos: number
  private cur = 0
  private mask = 0x100 // > 0x80 forces a byte load on the first read

  constructor(data: Uint8Array, startByte: number) {
    this.data = data
    this.pos = startByte
  }

  bit(): number {
    if (this.mask > 0x80) {
      this.cur = this.pos < this.data.length ? this.data[this.pos] : 0
      this.pos++
      this.mask = 1
    }
    const b = this.cur & this.mask ? 1 : 0
    this.mask <<= 1
    return b
  }

  bits(n: number): number {
    let v = 0
    for (let i = 0; i < n; i++) v |= this.bit() << i
    return v
  }
}

/**
 * Decodes the Lua code section of a cart binary (starting at 0x4300). Handles
 * the three encodings Pico-8 uses: the new PXA bitstream (header `\0pxa`), the
 * legacy byte format (header `:c:\0`), and uncompressed null-terminated text.
 * Exported for unit testing against the raw byte array.
 */
export function decodeCode(bytes: Uint8Array): string {
  const h0 = bytes[CODE_START], h1 = bytes[CODE_START + 1]
  const h2 = bytes[CODE_START + 2], h3 = bytes[CODE_START + 3]

  // new PXA format: \0 p x a
  if (h0 === 0x00 && h1 === 0x70 && h2 === 0x78 && h3 === 0x61) {
    return decodePxa(bytes)
  }
  // legacy format: : c : \0
  if (h0 === 0x3a && h1 === 0x63 && h2 === 0x3a && h3 === 0x00) {
    return decodeOld(bytes)
  }
  return decodeRaw(bytes)
}

function decodePxa(bytes: Uint8Array): string {
  // size fields are big-endian (MSB first)
  const uncSize = (bytes[CODE_START + 4] << 8) | bytes[CODE_START + 5]
  const br = new BitReader(bytes, CODE_START + 8)
  const mtf = new Uint8Array(256)
  for (let i = 0; i < 256; i++) mtf[i] = i

  const out: number[] = []
  while (out.length < uncSize) {
    if (br.bit()) {
      // move-to-front literal: unary-prefixed index
      let extra = 0
      while (br.bit()) extra++
      const idx = br.bits(4 + extra) + (((1 << extra) - 1) << 4)
      const ch = mtf[idx]
      out.push(ch)
      for (let i = idx; i > 0; i--) mtf[i] = mtf[i - 1]
      mtf[0] = ch
    } else {
      const offLen = br.bit() ? (br.bit() ? 5 : 10) : 15
      const offset = br.bits(offLen) + 1
      if (offset === 1 && offLen !== 5) {
        // uncompressed run of raw bytes, null-terminated
        for (;;) {
          const ch = br.bits(8)
          if (ch === 0) break
          out.push(ch)
        }
      } else {
        // back-reference: copy `count` bytes from `offset` back
        let count = 3
        for (;;) {
          const part = br.bits(3)
          count += part
          if (part !== 7) break
        }
        for (let i = 0; i < count; i++) out.push(out[out.length - offset])
      }
    }
  }
  return bytesToString(out)
}

function decodeOld(bytes: Uint8Array): string {
  let i = CODE_START + 8
  const out: number[] = []
  for (;;) {
    const ch = bytes[i++]
    if (ch === 0x00) {
      const ch2 = bytes[i++]
      if (ch2 === 0x00) break // end marker
      out.push(ch2) // raw byte
    } else if (ch <= 0x3b) {
      out.push(OLD_CODE_TABLE.charCodeAt(ch))
    } else {
      const ch2 = bytes[i++]
      const count = (ch2 >> 4) + 2
      const offset = ((ch - 0x3c) << 4) + (ch2 & 0xf)
      for (let k = 0; k < count; k++) out.push(out[out.length - offset])
    }
    if (i >= CODE_END) break
  }
  return bytesToString(out)
}

function decodeRaw(bytes: Uint8Array): string {
  let s = ''
  for (let i = CODE_START; i < CODE_END; i++) {
    const b = bytes[i]
    if (b === 0) break
    s += String.fromCharCode(b)
  }
  return s
}

function bytesToString(codes: number[]): string {
  // chunked to stay under the argument-count limit of String.fromCharCode
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < codes.length; i += CHUNK) {
    s += String.fromCharCode(...codes.slice(i, i + CHUNK))
  }
  return s
}

function extractBytes({ data, width, height }: RgbaImage): Uint8Array {
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

function extractLabel({ data, width }: RgbaImage): Uint8Array {
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
