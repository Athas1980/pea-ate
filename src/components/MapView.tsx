import { useEffect, useRef, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import type { TileBrush } from '../types/cart'

const MIN_ZOOM = 1
const MAX_ZOOM = 4

interface Props {
  gfx: Uint8Array
  map: Uint8Array
  drawPalette: number[]
  tileRows: 32 | 64
  showZeroTile: boolean
  mapWidth?: number
  storedMapWidth?: number
  onMapWidthChange?: (w: number) => void
  mode: 'view' | 'edit'
  onModeChange: (mode: 'view' | 'edit') => void
  brush?: TileBrush
  onStrokeStart?: () => void
  onMapChange?: (newMap: Uint8Array) => void
}

export default function MapView({
  gfx, map, drawPalette, tileRows, showZeroTile,
  mapWidth = 128, storedMapWidth = 128, onMapWidthChange,
  mode, onModeChange,
  brush, onStrokeStart, onMapChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(false)
  const [widthInput, setWidthInput] = useState(String(mapWidth))
  const isTypingRef = useRef(false)

  useEffect(() => { setWidthInput(String(mapWidth)) }, [mapWidth])

  function commitWidth(raw: string) {
    const v = Math.max(1, Math.min(128, Number(raw) || 1))
    onMapWidthChange?.(v)
    setWidthInput(String(v))
  }

  const totalTiles = tileRows * 128
  const displayRows = Math.min(Math.ceil(totalTiles / mapWidth), 4096)
  const canvasW = mapWidth * 8
  const canvasH = displayRows * 8

  const isDragging = useRef(false)
  const isPainting = useRef(false)
  const dragStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)
  const lastStampTile = useRef<{ tx: number; ty: number } | null>(null)

  const brushRef = useRef(brush)
  brushRef.current = brush
  const mapRef = useRef(map)
  mapRef.current = map
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const mapWidthRef = useRef(mapWidth)
  mapWidthRef.current = mapWidth
  const totalTilesRef = useRef(totalTiles)
  totalTilesRef.current = totalTiles
  const onMapChangeRef = useRef(onMapChange)
  onMapChangeRef.current = onMapChange
  const showGridRef = useRef(showGrid)
  showGridRef.current = showGrid

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(canvasW, canvasH)
    const rgb = resolveRgb(drawPalette)

    for (let i = 0; i < totalTiles && i < map.length; i++) {
      const tileIdx = map[i]
      if (tileIdx === 0 && !showZeroTile) continue

      const tx = i % mapWidth
      const ty = Math.floor(i / mapWidth)
      const spriteCol = (tileIdx % 16) * 8
      const spriteRow = Math.floor(tileIdx / 16) * 8

      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          const gfxIdx = (spriteRow + py) * 128 + (spriteCol + px)
          const [r, g, b] = rgb[gfx[gfxIdx] & 0xf]
          const outIdx = ((ty * 8 + py) * canvasW + (tx * 8 + px)) * 4
          imageData.data[outIdx]     = r
          imageData.data[outIdx + 1] = g
          imageData.data[outIdx + 2] = b
          imageData.data[outIdx + 3] = 255
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)

  }, [gfx, map, drawPalette, tileRows, showZeroTile, mapWidth, totalTiles, canvasW, canvasH])

  // Stamp the brush at a brush-snapped grid position
  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas || !brushRef.current || !onMapChangeRef.current) return
    const rect = canvas.getBoundingClientRect()
    const rawTx = Math.floor((clientX - rect.left) / (8 * zoomRef.current))
    const rawTy = Math.floor((clientY - rect.top) / (8 * zoomRef.current))

    const b = brushRef.current
    // Snap to brush-sized grid so dragging places non-overlapping copies
    const tx = Math.floor(rawTx / b.w) * b.w
    const ty = Math.floor(rawTy / b.h) * b.h

    if (lastStampTile.current?.tx === tx && lastStampTile.current?.ty === ty) return
    lastStampTile.current = { tx, ty }

    const w = mapWidthRef.current
    const newMap = new Uint8Array(mapRef.current)
    for (let by = 0; by < b.h; by++) {
      for (let bx = 0; bx < b.w; bx++) {
        const mx = tx + bx
        const my = ty + by
        const offset = my * w + mx
        if (mx >= 0 && mx < w && offset >= 0 && offset < totalTilesRef.current) {
          newMap[offset] = (b.tileY + by) * 16 + (b.tileX + bx)
        }
      }
    }
    onMapChangeRef.current(newMap)
  }

  // Global mouse handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (isPainting.current) {
        paintAt(e.clientX, e.clientY)
        return
      }
      if (!isDragging.current || !dragStart.current || !scrollRef.current) return
      scrollRef.current.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x)
      scrollRef.current.scrollTop  = dragStart.current.scrollTop  - (e.clientY - dragStart.current.y)
    }

    function onMouseUp() {
      isPainting.current = false
      lastStampTile.current = null
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
    if (mode === 'edit') {
      onStrokeStart?.()
      isPainting.current = true
      lastStampTile.current = null
      paintAt(e.clientX, e.clientY)
      return
    }
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
    <div className="flex flex-col gap-2" style={{ minWidth: 'calc(100vw - 320px)' }}>
      {/* Controls row */}
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

        <span className="text-[var(--p8-dark-grey)]">·</span>

        <button
          onClick={() => onModeChange(mode === 'view' ? 'edit' : 'view')}
          className={`px-2 py-0.5 border ${
            mode === 'edit'
              ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
              : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)] hover:border-[var(--p8-light-grey)]'
          }`}
        >
          {mode === 'edit' ? 'editing' : 'edit'}
        </button>

        {mode === 'edit' && (
          <button
            onClick={() => setShowGrid(g => !g)}
            className={`px-2 py-0.5 border ${
              showGrid
                ? 'border-[var(--p8-light-grey)] text-[var(--p8-light-grey)]'
                : 'border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)] hover:text-[var(--p8-light-grey)]'
            }`}
          >grid</button>
        )}

        <button
          onClick={handleExport}
          className="ml-auto px-2 py-0.5 text-[var(--p8-white)] border border-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)]"
        >export png</button>
      </div>

      {/* Config / status row */}
      <div className="flex items-center gap-2 text-[var(--p8-dark-grey)]">
        <span>w</span>
        <input
          type="number"
          min={1}
          max={128}
          value={widthInput}
          onFocus={() => { isTypingRef.current = false }}
          onKeyDown={e => {
            isTypingRef.current = true
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          onChange={e => {
            setWidthInput(e.target.value)
            if (!isTypingRef.current) commitWidth(e.target.value)
          }}
          onBlur={e => {
            isTypingRef.current = false
            commitWidth(e.target.value)
          }}
          className="w-14 bg-[var(--p8-black)] border border-[var(--p8-dark-grey)] text-[var(--p8-white)] px-1 text-center"
        />
        <span>· {displayRows} rows</span>

        {mapWidth !== storedMapWidth && (
          <button
            onClick={() => onMapWidthChange?.(storedMapWidth)}
            className="hover:text-[var(--p8-light-grey)]"
          >· reset</button>
        )}

        {mode === 'view' && (
          <span className="ml-auto">drag to pan · shift+scroll →</span>
        )}
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className="overflow-auto select-none"
        style={{
          maxWidth: 'calc(100vw - 320px)',
          maxHeight: '75vh',
          cursor: mode === 'edit' ? 'crosshair' : 'grab',
        }}
      >
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="border border-[var(--p8-dark-grey)] block"
            style={{
              imageRendering: 'pixelated',
              width: canvasW * zoom,
              height: canvasH * zoom,
            }}
          />
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: [
                  'linear-gradient(to right, rgba(0,0,0,0.4) 1px, transparent 1px)',
                  'linear-gradient(to bottom, rgba(0,0,0,0.4) 1px, transparent 1px)',
                ].join(', '),
                backgroundSize: `${8 * zoom}px ${8 * zoom}px`,
              }}
            />
          )}
        </div>
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
