import { useEffect, useRef } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'

export interface SpriteRegion { x: number; y: number; w: number; h: number }
interface NamedPalette { name: string; drawPalette: number[]; transparentColours: number[] }
type Rgb = [number, number, number]

interface Props {
  gfx: Uint8Array
  drawPalette: number[]
  namedPalettes: NamedPalette[]
  transparentColours: number[]
  selection: SpriteRegion
  onSelectionChange: (r: SpriteRegion) => void
  onApplyPalette: (palette: number[], transparentColours: number[]) => void
}

const SHEET_ZOOM = 2   // mini spritesheet display scale
const TILE = 8         // pixels per sprite tile

const checkerboard: React.CSSProperties = {
  backgroundImage: 'linear-gradient(45deg, #3a3a3a 25%, transparent 25%, transparent 75%, #3a3a3a 75%), linear-gradient(45deg, #3a3a3a 25%, transparent 25%, transparent 75%, #3a3a3a 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 4px 4px',
  backgroundColor: '#1a1a1a',
}

export default function SpriteInspector({ gfx, drawPalette, namedPalettes, transparentColours, selection, onSelectionChange, onApplyPalette }: Props) {
  const sheetRef = useRef<HTMLCanvasElement>(null)
  const zoomRef  = useRef<HTMLCanvasElement>(null)
  const dragging = useRef(false)
  const dragOrigin = useRef<{ tx: number; ty: number } | null>(null)

  // Draw mini spritesheet + selection highlight
  useEffect(() => {
    const canvas = sheetRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(128, 128)
    const rgb = resolveRgb(drawPalette)

    for (let py = 0; py < 128; py++) {
      for (let px = 0; px < 128; px++) {
        const idx = gfx[py * 128 + px] & 0xf
        const i = (py * 128 + px) * 4
        if (transparentColours.includes(idx)) {
          imageData.data[i] = 0; imageData.data[i+1] = 0; imageData.data[i+2] = 0; imageData.data[i+3] = 0
        } else {
          const [r, g, b] = rgb[idx]
          imageData.data[i] = r; imageData.data[i+1] = g; imageData.data[i+2] = b; imageData.data[i+3] = 255
        }
      }
    }
    ctx.clearRect(0, 0, 128, 128)
    ctx.putImageData(imageData, 0, 0)

    const { x, y, w, h } = selection
    ctx.strokeStyle = '#ffec27'
    ctx.lineWidth = 1
    ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, w * TILE - 1, h * TILE - 1)
  }, [gfx, drawPalette, transparentColours, selection])

  // Draw zoomed view of selection with current palette
  useEffect(() => {
    const canvas = zoomRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { x, y, w, h } = selection
    const pw = w * TILE, ph = h * TILE
    canvas.width = pw; canvas.height = ph
    renderRegion(ctx, gfx, drawPalette, transparentColours, x, y, pw, ph)
  }, [gfx, drawPalette, transparentColours, selection])

  function getTile(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const tx = Math.max(0, Math.min(15, Math.floor((e.clientX - rect.left) / (TILE * SHEET_ZOOM))))
    const ty = Math.max(0, Math.min(15, Math.floor((e.clientY - rect.top)  / (TILE * SHEET_ZOOM))))
    return { tx, ty }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const { tx, ty } = getTile(e)
    dragging.current = true
    dragOrigin.current = { tx, ty }
    onSelectionChange({ x: tx, y: ty, w: 1, h: 1 })
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging.current || !dragOrigin.current) return
    const { tx, ty } = getTile(e)
    const { tx: ox, ty: oy } = dragOrigin.current
    onSelectionChange({
      x: Math.min(ox, tx), y: Math.min(oy, ty),
      w: Math.abs(tx - ox) + 1, h: Math.abs(ty - oy) + 1,
    })
  }

  function handleMouseUp() { dragging.current = false }

  const { w, h } = selection
  const selPW = w * TILE, selPH = h * TILE
  const zoomLevel = Math.max(1, Math.min(8, Math.floor(256 / Math.max(selPW, selPH))))

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: mini spritesheet + zoomed view */}
      <div className="flex gap-6 items-start">
        {/* Mini spritesheet */}
        <div className="flex flex-col gap-2">
          <span className="text-[var(--p8-light-grey)]">spritesheet</span>
          <canvas
            ref={sheetRef}
            width={128} height={128}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair select-none"
            style={{ imageRendering: 'pixelated', width: 128 * SHEET_ZOOM, height: 128 * SHEET_ZOOM }}
          />
          <span className="text-[var(--p8-light-grey)]" style={{ fontSize: '6px' }}>
            {w === 1 && h === 1 ? 'click · drag to select region' : `${w}×${h} tiles`}
          </span>
        </div>

        {/* Zoomed view — fixed 256×256 container so layout never shifts */}
        <div className="flex flex-col gap-2">
          <span className="text-[var(--p8-light-grey)]">selection · {zoomLevel}×</span>
          <div style={{ width: 256, height: 256, display: 'flex', alignItems: 'flex-start', ...checkerboard }}>
            <canvas
              ref={zoomRef}
              width={selPW} height={selPH}
              style={{ imageRendering: 'pixelated', width: selPW * zoomLevel, height: selPH * zoomLevel }}
            />
          </div>
        </div>
      </div>

      {/* Thumbnails row — below the canvases, wraps freely */}
      {namedPalettes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[var(--p8-light-grey)]">named palettes</span>
          <div className="flex gap-4 flex-wrap">
            {namedPalettes.map((pal, i) => (
              <Thumbnail
                key={i}
                name={pal.name}
                palette={pal.drawPalette}
                transparentColours={pal.transparentColours}
                gfx={gfx}
                selection={selection}
                onApply={() => onApplyPalette(pal.drawPalette, pal.transparentColours)}
              />
            ))}
          </div>
        </div>
      )}
      {namedPalettes.length === 0 && (
        <span className="text-[var(--p8-light-grey)]" style={{ fontSize: '6px' }}>
          save palettes in the palette editor to compare here
        </span>
      )}
    </div>
  )
}

function Thumbnail({ name, palette, transparentColours, gfx, selection, onApply }: {
  name: string; palette: number[]; transparentColours: number[]; gfx: Uint8Array
  selection: SpriteRegion; onApply: () => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { x, y, w, h } = selection
  const pw = w * TILE, ph = h * TILE
  const zoom = Math.max(1, Math.min(8, Math.floor(64 / Math.max(pw, ph))))

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = pw; canvas.height = ph
    renderRegion(canvas.getContext('2d')!, gfx, palette, transparentColours, x, y, pw, ph)
  }, [gfx, palette, transparentColours, x, y, pw, ph])

  return (
    <button onClick={onApply} title={`Apply "${name}"`}
      className="flex flex-col items-center gap-1 hover:opacity-80">
      <canvas ref={ref} width={pw} height={ph}
        className="outline outline-2 outline-transparent hover:outline-[var(--p8-yellow)]"
        style={{ imageRendering: 'pixelated', width: pw * zoom, height: ph * zoom, ...checkerboard }} />
      <span className="text-[var(--p8-light-grey)]" style={{ fontSize: '6px' }}>{name}</span>
    </button>
  )
}

function renderRegion(
  ctx: CanvasRenderingContext2D,
  gfx: Uint8Array, palette: number[], transparentColours: number[],
  tx: number, ty: number, pw: number, ph: number
) {
  const imageData = ctx.createImageData(pw, ph)
  const rgb = resolveRgb(palette)
  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) {
      const idx = gfx[(ty * TILE + py) * 128 + (tx * TILE + px)] & 0xf
      const i = (py * pw + px) * 4
      if (transparentColours.includes(idx)) {
        imageData.data[i] = 0; imageData.data[i+1] = 0; imageData.data[i+2] = 0; imageData.data[i+3] = 0
      } else {
        const [r, g, b] = rgb[idx]
        imageData.data[i] = r; imageData.data[i+1] = g; imageData.data[i+2] = b; imageData.data[i+3] = 255
      }
    }
  }
  ctx.clearRect(0, 0, pw, ph)
  ctx.putImageData(imageData, 0, 0)
}

function resolveRgb(drawPalette: number[]): Rgb[] {
  return drawPalette.map(idx => hexToRgb(idx >= 128 ? SECRET_PALETTE[idx - 128] : STANDARD_PALETTE[idx]))
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
