import { useEffect, useRef, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import type { TileBrush, MapToolState } from '../types/cart'

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
  mapTool?: MapToolState
  onToolChange?: (patch: Partial<MapToolState>) => void
  onStrokeStart?: () => void
  onMapChange?: (newMap: Uint8Array) => void
  onHoverTile?: (tile: { tx: number; ty: number; tileIdx: number } | null) => void
}

export default function MapView({
  gfx, map, drawPalette, tileRows, showZeroTile,
  mapWidth = 128, storedMapWidth = 128, onMapWidthChange,
  mode, onModeChange,
  brush, mapTool = { tool: 'brush', eraserSize: 1, fillRandom: false }, onToolChange,
  onStrokeStart, onMapChange, onHoverTile,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(2)
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
  const mapToolRef = useRef(mapTool)
  mapToolRef.current = mapTool
  const onHoverTileRef = useRef(onHoverTile)
  onHoverTileRef.current = onHoverTile

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

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas || !onMapChangeRef.current) return
    const rect = canvas.getBoundingClientRect()
    const rawTx = Math.floor((clientX - rect.left) / (8 * zoomRef.current))
    const rawTy = Math.floor((clientY - rect.top) / (8 * zoomRef.current))
    const w = mapWidthRef.current
    const total = totalTilesRef.current

    if (mapToolRef.current.tool === 'eraser') {
      const eSize = mapToolRef.current.eraserSize
      const tx = rawTx
      const ty = rawTy
      if (lastStampTile.current?.tx === tx && lastStampTile.current?.ty === ty) return
      lastStampTile.current = { tx, ty }
      const newMap = new Uint8Array(mapRef.current)
      for (let by = 0; by < eSize; by++) {
        for (let bx = 0; bx < eSize; bx++) {
          const mx = tx + bx
          const my = ty + by
          const offset = my * w + mx
          if (mx >= 0 && mx < w && offset >= 0 && offset < total) newMap[offset] = 0
        }
      }
      onMapChangeRef.current(newMap)
      return
    }

    // brush (default)
    const b = brushRef.current
    if (!b) return
    const tx = Math.floor(rawTx / b.w) * b.w
    const ty = Math.floor(rawTy / b.h) * b.h
    if (lastStampTile.current?.tx === tx && lastStampTile.current?.ty === ty) return
    lastStampTile.current = { tx, ty }
    const newMap = new Uint8Array(mapRef.current)
    for (let by = 0; by < b.h; by++) {
      for (let bx = 0; bx < b.w; bx++) {
        const mx = tx + bx
        const my = ty + by
        const offset = my * w + mx
        if (mx >= 0 && mx < w && offset >= 0 && offset < total) {
          newMap[offset] = (b.tileY + by) * 16 + (b.tileX + bx)
        }
      }
    }
    onMapChangeRef.current(newMap)
  }

  function updateHover(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas || !onHoverTileRef.current) return
    const rect = canvas.getBoundingClientRect()
    const tx = Math.floor((clientX - rect.left) / (8 * zoomRef.current))
    const ty = Math.floor((clientY - rect.top) / (8 * zoomRef.current))
    const w = mapWidthRef.current
    const offset = ty * w + tx
    if (tx < 0 || tx >= w || ty < 0 || offset < 0 || offset >= totalTilesRef.current) {
      onHoverTileRef.current(null)
    } else {
      onHoverTileRef.current({ tx, ty, tileIdx: mapRef.current[offset] ?? 0 })
    }
  }

  // Global mouse handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      updateHover(e.clientX, e.clientY)
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
      if (mapTool.tool === 'fill') {
        const canvas = canvasRef.current
        if (!canvas || !onMapChange) return
        const rect = canvas.getBoundingClientRect()
        const tx = Math.floor((e.clientX - rect.left) / (8 * zoom))
        const ty = Math.floor((e.clientY - rect.top) / (8 * zoom))
        const b = brush ?? { tileX: 0, tileY: 0, w: 1, h: 1 }
        let getTile: (tx: number, ty: number) => number
        if (mapTool.fillRandom && (b.w > 1 || b.h > 1)) {
          const tiles: number[] = []
          for (let by = 0; by < b.h; by++)
            for (let bx = 0; bx < b.w; bx++)
              tiles.push((b.tileY + by) * 16 + (b.tileX + bx))
          getTile = () => tiles[Math.floor(Math.random() * tiles.length)]
        } else {
          getTile = (mx, my) => (b.tileY + my % b.h) * 16 + (b.tileX + mx % b.w)
        }
        onStrokeStart?.()
        onMapChange(floodFill(map, mapWidth, totalTiles, tx, ty, getTile))
        return
      }
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
    <div className="flex flex-col gap-2 min-w-0" style={{ width: 'fit-content', maxWidth: 'calc(100vw - 280px)' }}>
      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 1))}
          disabled={zoom === MIN_ZOOM}
          className="w-6 h-6 text-center text-[var(--p8-white)] disabled:text-[var(--p8-lavender)]"
        >-</button>
        <span className="text-[var(--p8-light-grey)] w-6 text-center">{zoom}×</span>
        <button
          onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 1))}
          disabled={zoom === MAX_ZOOM}
          className="w-6 h-6 text-center text-[var(--p8-white)] disabled:text-[var(--p8-lavender)]"
        >+</button>

        <span className="text-[var(--p8-lavender)]">·</span>

        <button
          onClick={() => onModeChange(mode === 'view' ? 'edit' : 'view')}
          className={`px-2 py-0.5 border-2 ${
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
            className={`px-2 py-0.5 border-2 ${
              showGrid
                ? 'border-[var(--p8-light-grey)] text-[var(--p8-light-grey)]'
                : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)] hover:border-[var(--p8-white)] hover:text-[var(--p8-white)]'
            }`}
          >grid</button>
        )}

        {mode === 'edit' && (
          <>
            <span className="text-[var(--p8-lavender)]">·</span>
            {(['brush', 'eraser', 'fill'] as const).map(tool => (
              <button
                key={tool}
                onClick={() => onToolChange?.({ tool })}
                className={`px-2 py-0.5 border-2 ${
                  mapTool.tool === tool
                    ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
                    : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)] hover:border-[var(--p8-white)] hover:text-[var(--p8-white)]'
                }`}
              >{tool}</button>
            ))}
            {mapTool.tool === 'eraser' && (
              <>
                <span className="text-[var(--p8-lavender)]">·</span>
                {[1, 2, 3, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => onToolChange?.({ eraserSize: s })}
                    className={`w-6 h-6 border-2 text-center text-sm ${
                      mapTool.eraserSize === s
                        ? 'border-[var(--p8-light-grey)] text-[var(--p8-white)]'
                        : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)] hover:border-[var(--p8-white)] hover:text-[var(--p8-white)]'
                    }`}
                  >{s}</button>
                ))}
              </>
            )}
            {mapTool.tool === 'fill' && (
              <>
                <span className="text-[var(--p8-lavender)]">·</span>
                <button
                  onClick={() => onToolChange?.({ fillRandom: !mapTool.fillRandom })}
                  className={`px-2 py-0.5 border-2 ${
                    mapTool.fillRandom
                      ? 'border-[var(--p8-light-grey)] text-[var(--p8-white)]'
                      : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)] hover:border-[var(--p8-white)] hover:text-[var(--p8-white)]'
                  }`}
                >random</button>
              </>
            )}
          </>
        )}

        <button
          onClick={handleExport}
          className="ml-auto px-2 py-0.5 text-[var(--p8-white)] border-2 border-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)]"
        >export png</button>
      </div>

      {/* Config / status row */}
      <div className="flex items-center gap-2 text-[var(--p8-light-grey)]">
        <span>Width</span>
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
          className="w-14 bg-[var(--p8-black)] border-2 border-[var(--p8-dark-grey)] text-[var(--p8-white)] px-1 text-center"
        />
        <span>· {displayRows} rows</span>

        {mapWidth !== storedMapWidth && (
          <button
            onClick={() => onMapWidthChange?.(storedMapWidth)}
            className="hover:text-[var(--p8-light-grey)]"
          >· reset</button>
        )}
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => onHoverTile?.(null)}
        className="overflow-auto select-none border-2 border-[var(--p8-dark-grey)]"
        style={{
          maxWidth: '100%',
        width: 'fit-content',
          maxHeight: '75vh',
          cursor: mode === 'edit' ? 'crosshair' : 'grab',
        }}
      >
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="block"
            style={{
              imageRendering: 'pixelated',
              width: canvasW * zoom,
              height: canvasH * zoom,
            }}
          />
          {showGrid && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasW * zoom} height={canvasH * zoom}
              style={{ overflow: 'visible' }}
            >
              {Array.from({ length: mapWidth - 1 }, (_, i) => (
                <line key={`v${i}`} x1={(i + 1) * 8 * zoom} y1={0} x2={(i + 1) * 8 * zoom} y2={canvasH * zoom} stroke="rgba(255,255,255,0.75)" strokeWidth={1} shapeRendering="crispEdges" />
              ))}
              {Array.from({ length: displayRows - 1 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={(i + 1) * 8 * zoom} x2={canvasW * zoom} y2={(i + 1) * 8 * zoom} stroke="rgba(255,255,255,0.75)" strokeWidth={1} shapeRendering="crispEdges" />
              ))}
            </svg>
          )}
        </div>
      </div>

      {mode === 'view' && (
        <span className="text-[var(--p8-lavender)]">drag to pan · shift+scroll →</span>
      )}
    </div>
  )
}

function floodFill(
  map: Uint8Array,
  mapWidth: number,
  totalTiles: number,
  startTx: number,
  startTy: number,
  getTile: (tx: number, ty: number) => number,
): Uint8Array {
  const idx0 = startTy * mapWidth + startTx
  if (idx0 < 0 || idx0 >= totalTiles) return map
  const targetTile = map[idx0]

  const newMap = new Uint8Array(map)
  const mapHeight = Math.ceil(totalTiles / mapWidth)
  const stack = [idx0]
  const seen = new Uint8Array(totalTiles)

  while (stack.length > 0) {
    const i = stack.pop()!
    if (i < 0 || i >= totalTiles || seen[i] || newMap[i] !== targetTile) continue
    seen[i] = 1
    const x = i % mapWidth
    const y = Math.floor(i / mapWidth)
    newMap[i] = getTile(x, y)
    if (x + 1 < mapWidth) stack.push(i + 1)
    if (x - 1 >= 0) stack.push(i - 1)
    if (y + 1 < mapHeight) stack.push(i + mapWidth)
    if (y - 1 >= 0) stack.push(i - mapWidth)
  }

  return newMap
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
