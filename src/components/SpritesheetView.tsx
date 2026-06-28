import { useEffect, useRef, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'

interface Props {
  gfx: Uint8Array
  drawPalette: number[]
  /** 64 = top half only (bottom half is shared map memory); 128 = full sheet */
  pixelRows: 64 | 128
  highlightSlot?: number | null
}

export default function SpritesheetView({ gfx, drawPalette, pixelRows, highlightSlot }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasHeight = pixelRows
  const displayHeight = pixelRows === 128 ? 512 : 256
  const [blinkOn, setBlinkOn] = useState(false)

  useEffect(() => {
    if (highlightSlot == null) { setBlinkOn(false); return }
    let id: ReturnType<typeof setTimeout>
    function schedule(on: boolean) {
      id = setTimeout(() => { setBlinkOn(on); schedule(!on) }, on ? 650 : 150)
    }
    setBlinkOn(true)
    schedule(false)
    return () => clearTimeout(id)
  }, [highlightSlot == null]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(128, canvasHeight)
    const rgb = resolveRgb(drawPalette)

    for (let i = 0; i < 128 * canvasHeight; i++) {
      const slot = gfx[i] & 0xf
      const [r, g, b] = rgb[slot]
      const out = i * 4
      if (highlightSlot != null && blinkOn && slot === highlightSlot) {
        imageData.data[out] = 255 - r; imageData.data[out+1] = 255 - g; imageData.data[out+2] = 255 - b
      } else {
        imageData.data[out] = r; imageData.data[out+1] = g; imageData.data[out+2] = b
      }
      imageData.data[out + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
  }, [gfx, drawPalette, canvasHeight, highlightSlot, blinkOn])

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={canvasHeight}
      className="border-2 border-[var(--p8-dark-grey)]"
      style={{ imageRendering: 'pixelated', width: 512, height: displayHeight }}
    />
  )
}

type Rgb = [number, number, number]

function resolveRgb(drawPalette: number[]): Rgb[] {
  return drawPalette.map(idx => hexToRgb(
    idx >= 128 ? SECRET_PALETTE[idx - 128] : STANDARD_PALETTE[idx]
  ))
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
