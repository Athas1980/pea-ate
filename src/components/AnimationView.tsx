import { useEffect, useMemo, useRef, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import type { Animation, AnimationFrame, TileBrush } from '../types/cart'
import TilePicker from './TilePicker'

const ZOOM = 4
const TILE = 8
type Rgb = [number, number, number]

interface NamedPalette { name: string; drawPalette: number[]; transparentColours: number[] }

interface Props {
  gfx: Uint8Array
  projectPalette: number[]
  drawPalette: number[]
  transparentColours: number[]
  namedPalettes: NamedPalette[]
  onSaveNamedPalette: (name: string) => void
  onDeleteNamedPalette: (index: number) => void
  animations: Animation[]
  onAnimationsChange: (a: Animation[]) => void
}

export default function AnimationView({ gfx, projectPalette, drawPalette, transparentColours, namedPalettes, onSaveNamedPalette, onDeleteNamedPalette, animations, onAnimationsChange }: Props) {
  const [activeAnimIdx, setActiveAnimIdx] = useState<number | null>(animations.length > 0 ? 0 : null)
  const [activeFrameIdx, setActiveFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [brush, setBrush] = useState<TileBrush>({ tileX: 0, tileY: 0, w: 1, h: 1 })
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newW, setNewW] = useState(2)
  const [newH, setNewH] = useState(2)
  const [savingPalette, setSavingPalette] = useState(false)
  const [savePaletteName, setSavePaletteName] = useState('')
  const [editingConfig, setEditingConfig] = useState(false)
  const [editName, setEditName] = useState('')
  const [editW, setEditW] = useState(1)
  const [editH, setEditH] = useState(1)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paintingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const animRef = useRef<Animation | null>(null)

  const anim = activeAnimIdx !== null ? (animations[activeAnimIdx] ?? null) : null
  const safeFrameIdx = anim ? Math.min(activeFrameIdx, anim.frames.length - 1) : 0
  const frame = anim ? anim.frames[safeFrameIdx] ?? null : null
  animRef.current = anim

  const resolvedPalette = useMemo(() => {
    const base = (frame?.palette !== undefined && namedPalettes[frame.palette])
      ? namedPalettes[frame.palette].drawPalette
      : drawPalette
    return base.map(slot => projectPalette[slot])
  }, [frame?.palette, drawPalette, projectPalette, namedPalettes])

  // Render current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !anim || !frame) return
    const ctx = canvas.getContext('2d')!
    renderFrame(ctx, frame, anim.w, anim.h, gfx, resolvedPalette, anim.mirror ?? false)
  }, [frame, anim, gfx, resolvedPalette])

  // Playback loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      return
    }

    let lastTime = performance.now()
    let accumulated = 0

    function tick(now: number) {
      const current = animRef.current
      if (!current) return
      const delta = now - lastTime
      lastTime = now
      accumulated += delta
      const msPerAnimFrame = (1000 / 60) * current.speed
      if (accumulated >= msPerAnimFrame) {
        accumulated -= msPerAnimFrame
        setActiveFrameIdx(prev => (prev + 1) % current.frames.length)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [playing])

  // Stop + reset on animation switch
  useEffect(() => {
    setPlaying(false)
    setActiveFrameIdx(0)
  }, [activeAnimIdx])

  // Painting
  function getTilePos(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!anim) return null
    const rect = canvasRef.current!.getBoundingClientRect()
    const tx = Math.floor((e.clientX - rect.left) / (TILE * ZOOM))
    const ty = Math.floor((e.clientY - rect.top) / (TILE * ZOOM))
    if (tx < 0 || ty < 0 || tx >= anim.w || ty >= anim.h) return null
    return { tx, ty }
  }

  function paintAt(tx: number, ty: number) {
    if (activeAnimIdx === null || !anim || !frame) return
    const snappedTx = Math.floor(tx / brush.w) * brush.w
    const snappedTy = Math.floor(ty / brush.h) * brush.h
    const newTiles = [...frame.tiles]
    for (let dy = 0; dy < brush.h; dy++) {
      for (let dx = 0; dx < brush.w; dx++) {
        const destX = snappedTx + dx
        const destY = snappedTy + dy
        if (destX < anim.w && destY < anim.h) {
          newTiles[destY * anim.w + destX] = (brush.tileY + dy) * 16 + (brush.tileX + dx)
        }
      }
    }
    updateFrame(activeAnimIdx, safeFrameIdx, { tiles: newTiles })
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (playing) return
    e.preventDefault()
    paintingRef.current = true
    const pos = getTilePos(e)
    if (pos) paintAt(pos.tx, pos.ty)
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!paintingRef.current || playing) return
    const pos = getTilePos(e)
    if (pos) paintAt(pos.tx, pos.ty)
  }

  function handleCanvasMouseUp() { paintingRef.current = false }

  // Mutations — all produce a new animations array
  function updateFrame(animIdx: number, frameIdx: number, patch: Partial<AnimationFrame>) {
    onAnimationsChange(animations.map((a, ai) =>
      ai !== animIdx ? a : {
        ...a, frames: a.frames.map((f, fi) => fi !== frameIdx ? f : { ...f, ...patch })
      }
    ))
  }

  function addFrame() {
    if (activeAnimIdx === null || !anim) return
    const prev = anim.frames[anim.frames.length - 1]
    const newFrame: AnimationFrame = {
      tiles: prev ? [...prev.tiles] : Array(anim.w * anim.h).fill(0),
      palette: prev?.palette,
      flip: prev?.flip,
    }
    onAnimationsChange(animations.map((a, i) =>
      i !== activeAnimIdx ? a : { ...a, frames: [...a.frames, newFrame] }
    ))
    setActiveFrameIdx(anim.frames.length)
  }

  function deleteFrame(frameIdx: number) {
    if (activeAnimIdx === null || !anim || anim.frames.length <= 1) return
    onAnimationsChange(animations.map((a, i) =>
      i !== activeAnimIdx ? a : { ...a, frames: a.frames.filter((_, fi) => fi !== frameIdx) }
    ))
    setActiveFrameIdx(Math.min(safeFrameIdx, anim.frames.length - 2))
  }

  function updateAnim(patch: Partial<Animation>) {
    if (activeAnimIdx === null) return
    onAnimationsChange(animations.map((a, i) => i !== activeAnimIdx ? a : { ...a, ...patch }))
  }

  function createAnimation() {
    const name = newName.trim() || `anim ${animations.length + 1}`
    const newAnim: Animation = {
      name, mode: 'grid', speed: 12, w: newW, h: newH,
      frames: [{ tiles: Array(newW * newH).fill(0) }],
    }
    const next = [...animations, newAnim]
    onAnimationsChange(next)
    setActiveAnimIdx(next.length - 1)
    setActiveFrameIdx(0)
    setCreating(false)
    setNewName('')
  }

  function startEditConfig() {
    if (!anim) return
    setEditName(anim.name)
    setEditW(anim.w)
    setEditH(anim.h)
    setEditingConfig(true)
  }

  function saveConfig() {
    if (activeAnimIdx === null || !anim) return
    const name = editName.trim() || anim.name
    const needsResize = editW !== anim.w || editH !== anim.h
    if (needsResize && wouldLoseData(anim.frames, anim.w, anim.h, editW, editH)) {
      if (!window.confirm(`Resize to ${editW}×${editH} will trim non-empty tiles outside the new boundary. Continue?`)) return
    }
    const newFrames = needsResize ? applyResize(anim.w, anim.h, editW, editH, anim.frames) : anim.frames
    updateAnim({ name, w: editW, h: editH, frames: newFrames })
    setEditingConfig(false)
  }

  function handleSavePalette() {
    const name = savePaletteName.trim() || `palette ${namedPalettes.length + 1}`
    onSaveNamedPalette(name)
    setSavePaletteName('')
    setSavingPalette(false)
  }

  // ---- render ----

  const frameLabel = anim && frame ? (playing ? 'playing' : `frame ${safeFrameIdx + 1} of ${anim.frames.length}`) : ''
  const canvasW = anim ? anim.w * TILE : 0
  const canvasH = anim ? anim.h * TILE : 0

  return (
    <div className="flex flex-col gap-4">

      {/* Named palettes */}
      <div className="flex flex-col gap-2 border-b border-[var(--p8-dark-grey)] pb-4">
        <span className="text-[var(--p8-light-grey)]">named palettes</span>
        {namedPalettes.length > 0 && (
          <div className="flex gap-4 flex-wrap items-center">
            {namedPalettes.map((pal, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="flex gap-px">
                  {pal.drawPalette.slice(0, 8).map((slot, s) => (
                    <div key={s} className="w-2 h-4" style={{ background: resolveHex(projectPalette[slot]) }} />
                  ))}
                </div>
                <span className="text-[var(--p8-light-grey)]">{pal.name}</span>
                <button onClick={() => onDeleteNamedPalette(i)}
                  className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-red)]"
                >×</button>
              </div>
            ))}
          </div>
        )}
        {savingPalette ? (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={savePaletteName}
              onChange={e => setSavePaletteName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSavePalette(); if (e.key === 'Escape') setSavingPalette(false) }}
              placeholder={`palette ${namedPalettes.length + 1}`}
              autoFocus
              className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-28 outline-none focus:border-[var(--p8-yellow)]"
            />
            <button onClick={handleSavePalette} className="text-[var(--p8-green)]">save</button>
            <button onClick={() => setSavingPalette(false)} className="text-[var(--p8-dark-grey)]">cancel</button>
          </div>
        ) : (
          <button onClick={() => setSavingPalette(true)}
            className="self-start text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]"
          >+ save current</button>
        )}
      </div>

      {/* Animation area */}
      {animations.length === 0 && !creating ? (
        <div className="flex flex-col items-start gap-4">
          <span className="text-[var(--p8-light-grey)]">no animations yet</span>
          <button onClick={() => setCreating(true)} className="text-[var(--p8-white)] hover:opacity-80">
            + create animation
          </button>
        </div>
      ) : creating ? (
        <div className="flex flex-col gap-3 w-fit">
          <span className="text-[var(--p8-light-grey)]">new animation</span>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[var(--p8-dark-grey)] w-12">name</span>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createAnimation(); if (e.key === 'Escape') setCreating(false) }}
                placeholder={`anim ${animations.length + 1}`} autoFocus
                className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-32 outline-none focus:border-[var(--p8-yellow)]"
              />
            </div>
            {(['width', 'height'] as const).map(dim => (
              <div key={dim} className="flex items-center gap-3">
                <span className="text-[var(--p8-dark-grey)] w-12">{dim}</span>
                <input type="number" min={1} max={8}
                  value={dim === 'width' ? newW : newH}
                  onChange={e => {
                    const v = Math.max(1, Math.min(8, parseInt(e.target.value) || 1))
                    dim === 'width' ? setNewW(v) : setNewH(v)
                  }}
                  className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-12 outline-none focus:border-[var(--p8-yellow)]"
                />
                <span className="text-[var(--p8-dark-grey)]">tiles</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={createAnimation} className="text-[var(--p8-green)]">create</button>
            <button onClick={() => setCreating(false)} className="text-[var(--p8-dark-grey)]">cancel</button>
          </div>
        </div>
      ) : anim && frame ? (
        <>
          {/* Animation selector / edit config */}
          {editingConfig ? (
            <div className="flex flex-col gap-2 w-fit">
              <div className="flex items-center gap-3">
                <span className="text-[var(--p8-dark-grey)] w-12">name</span>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveConfig(); if (e.key === 'Escape') setEditingConfig(false) }}
                  autoFocus
                  className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-32 outline-none focus:border-[var(--p8-yellow)]"
                />
              </div>
              {(['width', 'height'] as const).map(dim => (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-[var(--p8-dark-grey)] w-12">{dim}</span>
                  <input type="number" min={1} max={8}
                    value={dim === 'width' ? editW : editH}
                    onChange={e => {
                      const v = Math.max(1, Math.min(8, parseInt(e.target.value) || 1))
                      dim === 'width' ? setEditW(v) : setEditH(v)
                    }}
                    className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-12 outline-none focus:border-[var(--p8-yellow)]"
                  />
                  <span className="text-[var(--p8-dark-grey)]">tiles</span>
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={saveConfig} className="text-[var(--p8-green)]">save</button>
                <button onClick={() => setEditingConfig(false)} className="text-[var(--p8-dark-grey)]">cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-center flex-wrap">
              {animations.map((a, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <button
                    onClick={() => { setActiveAnimIdx(i); setPlaying(false) }}
                    className={`px-2 py-0.5 ${activeAnimIdx === i
                      ? 'text-[var(--p8-white)] bg-[rgba(255,255,255,0.1)]'
                      : 'text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'
                    }`}
                  >{a.name}</button>
                  {activeAnimIdx === i && (
                    <>
                      <button onClick={startEditConfig}
                        className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)] px-1"
                        title="Edit name / dimensions"
                      >✎</button>
                      <button
                        onClick={() => {
                          const next = animations.filter((_, j) => j !== i)
                          onAnimationsChange(next)
                          setActiveAnimIdx(next.length > 0 ? Math.min(i, next.length - 1) : null)
                          setPlaying(false)
                        }}
                        className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-red)] px-1"
                        title="Delete animation"
                      >×</button>
                    </>
                  )}
                </div>
              ))}
              <button onClick={() => setCreating(true)} className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]">
                + new
              </button>
            </div>
          )}

          {/* Three columns */}
          <div className="flex gap-6 items-start">
            <div className="flex flex-col gap-2">
              <span className="text-[var(--p8-light-grey)]">{frameLabel}</span>
              <canvas
                ref={canvasRef}
                width={anim.mirror ? canvasW * 2 : canvasW} height={canvasH}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={`border border-[var(--p8-dark-grey)] ${playing ? 'cursor-default' : 'cursor-crosshair'}`}
                style={{ imageRendering: 'pixelated', width: (anim.mirror ? canvasW * 2 : canvasW) * ZOOM, height: canvasH * ZOOM }}
              />
            </div>
            <TilePicker
              gfx={gfx}
              drawPalette={drawPalette.map(slot => projectPalette[slot])}
              brush={brush}
              onBrushChange={setBrush}
            />
            <div className="flex flex-col gap-2 w-48">
              <span className="text-[var(--p8-light-grey)]">frames</span>
              <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 384 }}>
                {anim.frames.map((f, fi) => (
                  <FrameCard
                    key={fi}
                    frameIdx={fi}
                    frame={f}
                    active={fi === safeFrameIdx}
                    namedPalettes={namedPalettes}
                    onClick={() => { setActiveFrameIdx(fi); setPlaying(false) }}
                    onPaletteChange={idx => updateFrame(activeAnimIdx!, fi, { palette: idx })}
                    onFlipToggle={() => updateFrame(activeAnimIdx!, fi, { flip: !f.flip })}
                    onDelete={() => deleteFrame(fi)}
                    canDelete={anim.frames.length > 1}
                  />
                ))}
              </div>
              <button onClick={addFrame} className="text-[var(--p8-light-grey)] hover:text-[var(--p8-white)] self-start mt-1">
                + add frame
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-6 border-t border-[var(--p8-dark-grey)] pt-3">
            <button onClick={() => setPlaying(p => !p)} className="text-[var(--p8-white)] hover:opacity-80 w-4">
              {playing ? '■' : '▶'}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[var(--p8-dark-grey)]">speed</span>
              <input type="range" min={1} max={30} value={anim.speed}
                onChange={e => updateAnim({ speed: parseInt(e.target.value) })}
                className="w-32"
              />
              <span className="text-[var(--p8-light-grey)]">{anim.speed} frames</span>
              <span className="text-[var(--p8-dark-grey)]">({Math.round(60 / anim.speed)}fps)</span>
            </div>
            <button onClick={() => updateAnim({ mirror: !anim.mirror })} title="Mirror (left half mirrored onto right)"
              className={`text-xs px-1 border ${anim.mirror
                ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
                : 'border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'
              }`}
            >⊞ mirror</button>
          </div>
        </>
      ) : null}
    </div>
  )
}

interface FrameCardProps {
  frameIdx: number
  frame: AnimationFrame
  active: boolean
  namedPalettes: NamedPalette[]
  onClick: () => void
  onPaletteChange: (idx: number | undefined) => void
  onFlipToggle: () => void
  onDelete: () => void
  canDelete: boolean
}

function FrameCard({ frameIdx, frame, active, namedPalettes, onClick, onPaletteChange, onFlipToggle, onDelete, canDelete }: FrameCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col gap-1.5 p-1.5 border cursor-pointer ${active
        ? 'border-[var(--p8-yellow)]'
        : 'border-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[var(--p8-light-grey)]">frame {frameIdx + 1}</span>
        {canDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-red)]"
          >×</button>
        )}
      </div>
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <select
          value={frame.palette ?? ''}
          onChange={e => onPaletteChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
          className="bg-[#111] border border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)] text-xs px-1 flex-1 min-w-0"
        >
          <option value="">default</option>
          {namedPalettes.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
        <button onClick={onFlipToggle} title="Flip"
          className={`text-xs px-1 border ${frame.flip
            ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
            : 'border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'
          }`}
        >↔</button>
      </div>
    </div>
  )
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: AnimationFrame,
  w: number, h: number,
  gfx: Uint8Array,
  resolvedPalette: number[],
  mirror: boolean
) {
  const pw = w * TILE, ph = h * TILE
  const rgb = resolveRgb(resolvedPalette)

  // Render tiles into a pw×ph buffer
  const tileData = new ImageData(pw, ph)
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const sprIdx = frame.tiles[ty * w + tx] ?? 0
      const sprX = (sprIdx % 16) * TILE
      const sprY = Math.floor(sprIdx / 16) * TILE
      for (let py = 0; py < TILE; py++) {
        for (let px = 0; px < TILE; px++) {
          const pixelIdx = gfx[(sprY + py) * 128 + (sprX + px)] & 0xf
          const i = ((ty * TILE + py) * pw + (tx * TILE + px)) * 4
          const [r, g, b] = rgb[pixelIdx]
          tileData.data[i] = r; tileData.data[i+1] = g; tileData.data[i+2] = b; tileData.data[i+3] = 255
        }
      }
    }
  }
  if (frame.flip) flipH(tileData, pw, ph)

  if (!mirror) {
    ctx.putImageData(tileData, 0, 0)
    return
  }

  // Mirror: left half = tile content, right half = horizontal reflection
  const fullData = ctx.createImageData(pw * 2, ph)
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const src = (y * pw + x) * 4
      const dst = (y * pw * 2 + x) * 4
      fullData.data[dst]   = tileData.data[src]
      fullData.data[dst+1] = tileData.data[src+1]
      fullData.data[dst+2] = tileData.data[src+2]
      fullData.data[dst+3] = tileData.data[src+3]
    }
  }
  mirrorH(fullData, pw * 2, ph)
  ctx.putImageData(fullData, 0, 0)
}

function flipH(data: ImageData, w: number, h: number) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < Math.floor(w / 2); x++) {
      const a = (y * w + x) * 4, b = (y * w + (w - 1 - x)) * 4
      for (let c = 0; c < 4; c++) {
        const t = data.data[a + c]; data.data[a + c] = data.data[b + c]; data.data[b + c] = t
      }
    }
  }
}

function mirrorH(data: ImageData, w: number, h: number) {
  const half = Math.floor(w / 2)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < half; x++) {
      const src = (y * w + x) * 4, dst = (y * w + (w - 1 - x)) * 4
      for (let c = 0; c < 4; c++) data.data[dst + c] = data.data[src + c]
    }
  }
}

function applyResize(oldW: number, oldH: number, newW: number, newH: number, frames: AnimationFrame[]): AnimationFrame[] {
  return frames.map(f => {
    const newTiles = Array(newW * newH).fill(0)
    for (let y = 0; y < Math.min(oldH, newH); y++)
      for (let x = 0; x < Math.min(oldW, newW); x++)
        newTiles[y * newW + x] = f.tiles[y * oldW + x]
    return { ...f, tiles: newTiles }
  })
}

function wouldLoseData(frames: AnimationFrame[], oldW: number, oldH: number, newW: number, newH: number): boolean {
  if (newW >= oldW && newH >= oldH) return false
  return frames.some(f => f.tiles.some((t, i) => {
    const x = i % oldW, y = Math.floor(i / oldW)
    return (x >= newW || y >= newH) && t !== 0
  }))
}

function resolveHex(idx: number): string {
  return idx >= 128 ? SECRET_PALETTE[idx - 128] : STANDARD_PALETTE[idx]
}

function resolveRgb(palette: number[]): Rgb[] {
  return palette.map(idx => {
    const hex = idx >= 128 ? SECRET_PALETTE[idx - 128] : STANDARD_PALETTE[idx]
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  })
}
