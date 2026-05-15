export interface Cart {
  version: number
  lua: string
  gfx: Uint8Array      // 128×128 pixels, 4bpp — index per pixel (0–15)
  map: Uint8Array      // 128×64 tile indices
  sfx: string
  music: string
  label?: Uint8Array   // 128×128 pixels, one color index per byte (0-15 standard, 16-31 secret)
  paletteToolData?: PaletteToolData
}

export interface PaletteToolData {
  /** drawPalette[i] = colour index that palette slot i is mapped to (0–15 standard, 128–143 secret) */
  drawPalette: number[]
  /** true = render all 128×64 map tiles (bottom 32 rows share memory with bottom half of gfx) */
  useSharedMap: boolean
  /** true = render tile index 0; false = render it as black (matches Pico-8 default transparency) */
  showZeroTile: boolean
  /** label colour remaps: maps original label index (0-31) to replacement index (0-31) */
  labelPalette?: Record<number, number>
  /** saved palette snapshots for comparison in the sprite inspector */
  namedPalettes?: Array<{ name: string; drawPalette: number[]; transparentColours?: number[] }>
  /** draw palette slot indices (0–15) that are treated as transparent (current working state) */
  transparentColours?: number[]
}

/** Standard Pico-8 palette, index 0–15 */
export const STANDARD_PALETTE: readonly string[] = [
  '#000000', // 0  black
  '#1D2B53', // 1  dark-blue
  '#7E2553', // 2  dark-purple
  '#008751', // 3  dark-green
  '#AB5236', // 4  brown
  '#5F574F', // 5  dark-grey
  '#C2C3C7', // 6  light-grey
  '#FFF1E8', // 7  white
  '#FF004D', // 8  red
  '#FFA300', // 9  orange
  '#FFEC27', // 10 yellow
  '#00E436', // 11 green
  '#29ADFF', // 12 blue
  '#83769C', // 13 lavender
  '#FF77A8', // 14 pink
  '#FFCCAA', // 15 light-peach
]

/** Secret palette, accessed via pal(c, n, 1) — indices 128–143. */
export const SECRET_PALETTE: readonly string[] = [
  '#291814', // 128 brownish-black
  '#111D35', // 129 darker-blue
  '#422136', // 130 darker-purple
  '#125359', // 131 blue-green
  '#742F29', // 132 dark-brown
  '#49333B', // 133 darker-grey
  '#A28879', // 134 medium-grey
  '#F3EF7D', // 135 light-yellow
  '#BE1250', // 136 dark-red
  '#FF6C24', // 137 dark-orange
  '#A8E72E', // 138 lime-green
  '#00B543', // 139 medium-green
  '#065AB5', // 140 true-blue
  '#754665', // 141 mauve
  '#FF6E59', // 142 dark-peach
  '#FF9D81', // 143 peach
]
