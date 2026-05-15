import { useEffect, useRef } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'

interface Props {
  label: Uint8Array
  labelPalette: Record<number, number>
}

// Flat lookup: indices 0-15 → standard palette, 16-31 → secret palette
export const COLOR_TABLE: readonly [number, number, number][] = [
  ...STANDARD_PALETTE.map(hexToRgb),
  ...SECRET_PALETTE.map(hexToRgb),
]

export const COLOR_TABLE_HEX: readonly string[] = [
  ...STANDARD_PALETTE,
  ...SECRET_PALETTE,
]

export default function LabelView({ label, labelPalette }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(128, 128)

    for (let i = 0; i < 128 * 128; i++) {
      const raw = label[i] & 0x1f
      const mapped = (labelPalette[raw] ?? raw) & 0x1f
      const [r, g, b] = COLOR_TABLE[mapped]
      const out = i * 4
      imageData.data[out]     = r
      imageData.data[out + 1] = g
      imageData.data[out + 2] = b
      imageData.data[out + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
  }, [label, labelPalette])

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      className="border border-[var(--p8-dark-grey)]"
      style={{ imageRendering: 'pixelated', width: 512, height: 512 }}
    />
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
