import { useEffect, useRef, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'

const MIN_ZOOM = 1
const MAX_ZOOM = 4

interface Props {
  gfx: Uint8Array
  map: Uint8Array
  drawPalette: number[]
  tileRows: 32 | 64
  showZeroTile: boolean
}

export default function MapView({ gfx, map, drawPalette, tileRows, showZeroTile }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasHeight = tileRows * 8
  const [zoom, setZoom] = useState(1)

  const isDragging = useRef(false)
  const dragStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(1024, canvasHeight)
    const rgb = resolveRgb(drawPalette)

    for (let ty = 0; ty < tileRows; ty++) {
      for (let tx = 0; tx < 128; tx++) {
        const tileIdx = map[ty * 128 + tx]

        if (tileIdx === 0 && !showZeroTile) continue

        const spriteCol = (tileIdx % 16) * 8
        const spriteRow = Math.floor(tileIdx / 16) * 8

        for (let py = 0; py < 8; py++) {
          for (let px = 0; px < 8; px++) {
            const gfxIdx = (spriteRow + py) * 128 + (spriteCol + px)
            const [r, g, b] = rgb[gfx[gfxIdx] & 0xf]
            const outIdx = ((ty * 8 + py) * 1024 + (tx * 8 + px)) * 4
            imageData.data[outIdx]     = r
            imageData.data[outIdx + 1] = g
            imageData.data[outIdx + 2] = b
            imageData.data[outIdx + 3] = 255
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [gfx, map, drawPalette, tileRows, canvasHeight, showZeroTile])

  // Global mouse handlers — attached to window so fast drags don't lose tracking
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current || !dragStart.current || !scrollRef.current) return
      scrollRef.current.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x)
      scrollRef.current.scrollTop  = dragStart.current.scrollTop  - (e.clientY - dragStart.current.y)
    }

    function onMouseUp() {
      if (isDragging.current) {
        isDragging.current = false
        if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Non-passive wheel listener so preventDefault works for shift+scroll
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    function onWheel(e: WheelEvent) {
      if (e.shiftKey) {
        e.preventDefault()
        container!.scrollLeft += e.deltaY
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [])

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    const container = scrollRef.current
    if (!container) return
    isDragging.current = true
    container.style.cursor = 'grabbing'
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    }
  }

  function handleExport() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'map.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 1))}
          disabled={zoom === MIN_ZOOM}
          className="w-6 h-6 text-center text-[var(--p8-white)] disabled:text-[var(--p8-dark-grey)]"
        >-</button>
        <span className="text-[var(--p8-light-grey)] w-6 text-center">{zoom}×</span>
        <button
          onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 1))}
          disabled={zoom === MAX_ZOOM}
          className="w-6 h-6 text-center text-[var(--p8-white)] disabled:text-[var(--p8-dark-grey)]"
        >+</button>
        <span className="text-[var(--p8-light-grey)] ml-2">drag to pan · shift+scroll horizontal</span>
        <button
          onClick={handleExport}
          className="ml-auto px-2 py-0.5 text-[var(--p8-white)] border border-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)]"
        >export png</button>
      </div>
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className="overflow-auto select-none"
        style={{ maxWidth: 'calc(100vw - 320px)', maxHeight: '75vh', cursor: 'grab' }}
      >
        <canvas
          ref={canvasRef}
          width={1024}
          height={canvasHeight}
          className="border border-[var(--p8-dark-grey)] block"
          style={{
            imageRendering: 'pixelated',
            width: 1024 * zoom,
            height: canvasHeight * zoom,
          }}
        />
      </div>
    </div>
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
