import { useEffect, useRef } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import type { TileBrush } from '../types/cart'

interface Props {
  gfx: Uint8Array
  drawPalette: number[]
  brush: TileBrush
  onBrushChange: (brush: TileBrush) => void
}

const ZOOM = 2
const CANVAS_W = 128
const CANVAS_H = 128

export default function TilePicker({ gfx, drawPalette, brush, onBrushChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStart = useRef<{ tx: number; ty: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(CANVAS_W, CANVAS_H)
    const rgb = resolveRgb(drawPalette)

    for (let py = 0; py < CANVAS_H; py++) {
      for (let px = 0; px < CANVAS_W; px++) {
        const [r, g, b] = rgb[gfx[py * 128 + px] & 0xf]
        const i = (py * CANVAS_W + px) * 4
        imageData.data[i]     = r
        imageData.data[i + 1] = g
        imageData.data[i + 2] = b
        imageData.data[i + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)

    ctx.strokeStyle = '#ffec27'
    ctx.lineWidth = 1
    ctx.strokeRect(
      brush.tileX * 8 + 0.5,
      brush.tileY * 8 + 0.5,
      brush.w * 8 - 1,
      brush.h * 8 - 1,
    )
  }, [gfx, drawPalette, brush])

  function tileAt(e: React.MouseEvent): { tx: number; ty: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      tx: Math.max(0, Math.min(15, Math.floor((e.clientX - rect.left) / (8 * ZOOM)))),
      ty: Math.max(0, Math.min(15, Math.floor((e.clientY - rect.top) / (8 * ZOOM)))),
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    const { tx, ty } = tileAt(e)
    dragStart.current = { tx, ty }
    onBrushChange({ tileX: tx, tileY: ty, w: 1, h: 1 })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!(e.buttons & 1) || !dragStart.current) return
    const { tx, ty } = tileAt(e)
    const { tx: sx, ty: sy } = dragStart.current
    onBrushChange({
      tileX: Math.min(sx, tx),
      tileY: Math.min(sy, ty),
      w: Math.abs(tx - sx) + 1,
      h: Math.abs(ty - sy) + 1,
    })
  }

  function handleMouseUp() {
    dragStart.current = null
  }

  const tileIdx = brush.tileY * 16 + brush.tileX

  return (
    <div>
      <p className="text-[var(--p8-light-grey)] mb-1">tile picker</p>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="block border border-[var(--p8-dark-grey)] cursor-crosshair select-none"
        style={{ imageRendering: 'pixelated', width: CANVAS_W * ZOOM, height: CANVAS_H * ZOOM }}
      />
      <p className="text-[var(--p8-dark-grey)] mt-1">
        {brush.w}×{brush.h} · tile {tileIdx}
        {brush.w > 1 || brush.h > 1 ? `–${tileIdx + (brush.h - 1) * 16 + brush.w - 1}` : ''}
      </p>
    </div>
  )
}

type Rgb = [number, number, number]

function resolveRgb(drawPalette: number[]): Rgb[] {
  return drawPalette.map(idx =>
    hexToRgb(idx >= 128 ? SECRET_PALETTE[idx - 128] : STANDARD_PALETTE[idx])
  )
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
