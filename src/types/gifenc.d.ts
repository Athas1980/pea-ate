declare module 'gifenc' {
  type RGBTuple = [number, number, number]
  interface FrameOptions {
    palette?: RGBTuple[]
    delay?: number
    repeat?: number
    transparent?: boolean
    transparentIndex?: number
    dispose?: number
  }
  interface GIFEncoder {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: FrameOptions): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
  }
  export function GIFEncoder(): GIFEncoder
  export function quantize(rgba: Uint8ClampedArray | Uint8Array, maxColors: number, opts?: object): RGBTuple[]
  export function applyPalette(rgba: Uint8ClampedArray | Uint8Array, palette: RGBTuple[], format?: string): Uint8Array
}
