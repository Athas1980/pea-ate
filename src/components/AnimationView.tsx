import { useEffect, useMemo, useRef, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import type { Animation, AnimationFrame, TileBrush } from '../types/cart'
import TilePicker from './TilePicker'

const MIN_ZOOM = 1
const MAX_ZOOM = 8
const TILE = 8
const IDENTITY = Array.from({ length: 16 }, (_, i) => i)
type Rgb = [number, number, number]

interface NamedPalette { name: string; drawPalette: number[]; transparentColours: number[] }

interface Props {
  gfx: Uint8Array
  projectPalette: number[]
  drawPalette: number[]
  onDrawPaletteChange: (p: number[]) => void
  transparentColours: number[]
  onTransparencyChange: (t: number[]) => void
  namedPalettes: NamedPalette[]
  onSaveNamedPalette: (name: string) => void
  onDeleteNamedPalette: (index: number) => void
  onDuplicateNamedPalette: (index: number) => void
  onApplyNamedPalette: (index: number) => void
  animations: Animation[]
  onAnimationsChange: (a: Animation[]) => void
}

export default function AnimationView({ gfx, projectPalette, drawPalette, onDrawPaletteChange, transparentColours, onTransparencyChange, namedPalettes, onSaveNamedPalette, onDeleteNamedPalette, onDuplicateNamedPalette, onApplyNamedPalette, animations, onAnimationsChange }: Props) {
  const [activeAnimIdx, setActiveAnimIdx] = useState<number | null>(animations.length > 0 ? 0 : null)
  const [activeFrameIdx, setActiveFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [brush, setBrush] = useState<TileBrush>({ tileX: 0, tileY: 0, w: 1, h: 1 })
  const [savingPalette, setSavingPalette] = useState(false)
  const [savePaletteName, setSavePaletteName] = useState('')
  const [editName, setEditName] = useState('')
  const [editWStr, setEditWStr] = useState('')
  const [editHStr, setEditHStr] = useState('')
  const [confirmingResize, setConfirmingResize] = useState(false)
  const [exportingGif, setExportingGif] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'single' | 'strip'>('single')
  const [zoom, setZoom] = useState(4)

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
      : IDENTITY
    return base.map(slot => projectPalette[slot])
  }, [frame?.palette, projectPalette, namedPalettes])

  // Render current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !anim || !frame) return
    const ctx = canvas.getContext('2d')!
    renderFrame(ctx, frame, anim.w, anim.h, gfx, resolvedPalette, anim.mirror ?? false)
  }, [frame, anim, gfx, resolvedPalette, viewMode])

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

  // Stop + reset on animation switch; sync config fields
  useEffect(() => {
    setPlaying(false)
    setActiveFrameIdx(0)
    setConfirmingResize(false)
    const a = activeAnimIdx !== null ? animations[activeAnimIdx] : null
    if (a) { setEditName(a.name); setEditWStr(String(a.w)); setEditHStr(String(a.h)) }
  }, [activeAnimIdx])

  // Painting
  function getTilePos(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!anim) return null
    const rect = canvasRef.current!.getBoundingClientRect()
    const tx = Math.floor((e.clientX - rect.left) / (TILE * zoom))
    const ty = Math.floor((e.clientY - rect.top) / (TILE * zoom))
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

  function duplicateFrame(frameIdx: number) {
    if (activeAnimIdx === null || !anim) return
    const src = anim.frames[frameIdx]
    const copy: AnimationFrame = { ...src, tiles: [...src.tiles] }
    const newFrames = [...anim.frames.slice(0, frameIdx + 1), copy, ...anim.frames.slice(frameIdx + 1)]
    onAnimationsChange(animations.map((a, i) => i !== activeAnimIdx ? a : { ...a, frames: newFrames }))
    setActiveFrameIdx(frameIdx + 1)
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
    const name = `anim ${animations.length + 1}`
    const newAnim: Animation = {
      name, mode: 'grid', speed: 12, w: 1, h: 1,
      frames: [{ tiles: [0] }],
    }
    const next = [...animations, newAnim]
    onAnimationsChange(next)
    setActiveAnimIdx(next.length - 1)
    setActiveFrameIdx(0)
  }

  function saveName() {
    if (!anim) return
    const name = editName.trim()
    if (name && name !== anim.name) updateAnim({ name })
    else if (!name) setEditName(anim.name)
  }

  function tryApplyResize() {
    if (!anim || activeAnimIdx === null) return
    const newW = Math.max(1, Math.min(8, parseInt(editWStr) || anim.w))
    const newH = Math.max(1, Math.min(8, parseInt(editHStr) || anim.h))
    if (wouldLoseData(anim.frames, anim.w, anim.h, newW, newH)) {
      setConfirmingResize(true)
    } else {
      doApplyResize(newW, newH)
    }
  }

  function doApplyResize(newW: number, newH: number) {
    if (!anim || activeAnimIdx === null) return
    const frames = applyResize(anim.w, anim.h, newW, newH, anim.frames)
    updateAnim({ w: newW, h: newH, frames })
    setEditWStr(String(newW))
    setEditHStr(String(newH))
    setConfirmingResize(false)
  }

  function deleteAnim() {
    if (activeAnimIdx === null) return
    const next = animations.filter((_, j) => j !== activeAnimIdx)
    onAnimationsChange(next)
    setActiveAnimIdx(next.length > 0 ? Math.min(activeAnimIdx, next.length - 1) : null)
    setPlaying(false)
  }

  function handleSavePalette() {
    const name = savePaletteName.trim() || `palette ${namedPalettes.length + 1}`
    onSaveNamedPalette(name)
    setSavePaletteName('')
    setSavingPalette(false)
  }

  async function exportGif() {
    if (!anim || anim.frames.length === 0 || exportingGif) return
    setExportingGif(true)
    try {
      const { GIFEncoder } = await import('gifenc')
      const scale = 3
      const baseW = anim.w * TILE
      const baseH = anim.h * TILE
      const frameW = anim.mirror ? baseW * 2 : baseW
      const scaledW = frameW * scale
      const scaledH = baseH * scale
      const delay = Math.max(20, Math.round(anim.speed / 60 * 1000))
      const encoder = GIFEncoder()

      for (let fi = 0; fi < anim.frames.length; fi++) {
        const f = anim.frames[fi]
        const base = (f.palette !== undefined && namedPalettes[f.palette])
          ? namedPalettes[f.palette].drawPalette
          : IDENTITY

        // GIF palette: index p → colour that slot p draws as in this frame
        const gifPalette: [number, number, number][] = Array.from({ length: 16 }, (_, p) => {
          const absIdx = projectPalette[base[p]]
          const hex = absIdx >= 128 ? SECRET_PALETTE[absIdx - 128] : STANDARD_PALETTE[absIdx]
          const n = parseInt(hex.slice(1), 16)
          return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
        })

        // Render sprite colour indices at native res (GIF index = sprite pixel value)
        const native = new Uint8Array(baseW * baseH)
        for (let ty = 0; ty < anim.h; ty++) {
          for (let tx = 0; tx < anim.w; tx++) {
            const sprIdx = f.tiles[ty * anim.w + tx] ?? 0
            const sprX = (sprIdx % 16) * TILE
            const sprY = Math.floor(sprIdx / 16) * TILE
            for (let py = 0; py < TILE; py++) {
              for (let px = 0; px < TILE; px++) {
                native[(ty * TILE + py) * baseW + (tx * TILE + px)] =
                  gfx[(sprY + py) * 128 + (sprX + px)] & 0xf
              }
            }
          }
        }

        if (f.flip) {
          for (let y = 0; y < baseH; y++) {
            for (let x = 0; x < Math.floor(baseW / 2); x++) {
              const a = y * baseW + x, b = y * baseW + (baseW - 1 - x)
              const t = native[a]; native[a] = native[b]; native[b] = t
            }
          }
        }

        // Expand for mirror mode
        let frameData: Uint8Array
        if (anim.mirror) {
          frameData = new Uint8Array(frameW * baseH)
          for (let y = 0; y < baseH; y++) {
            for (let x = 0; x < baseW; x++) {
              const v = native[y * baseW + x]
              frameData[y * frameW + x] = v
              frameData[y * frameW + (frameW - 1 - x)] = v
            }
          }
        } else {
          frameData = native
        }

        // Upscale
        const out = new Uint8Array(scaledW * scaledH)
        for (let y = 0; y < baseH; y++) {
          for (let x = 0; x < frameW; x++) {
            const v = frameData[y * frameW + x]
            for (let sy = 0; sy < scale; sy++)
              for (let sx = 0; sx < scale; sx++)
                out[(y * scale + sy) * scaledW + (x * scale + sx)] = v
          }
        }

        encoder.writeFrame(out, scaledW, scaledH, { palette: gifPalette, delay, repeat: 0 })
      }

      encoder.finish()
      const blob = new Blob([encoder.bytes()], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${anim.name}.gif`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportingGif(false)
    }
  }

  // ---- render ----

  const frameLabel = anim && frame ? (playing ? 'playing' : `frame ${safeFrameIdx + 1} of ${anim.frames.length}`) : ''
  const canvasW = anim ? anim.w * TILE : 0
  const canvasH = anim ? anim.h * TILE : 0
  const parsedW = Math.max(1, Math.min(8, parseInt(editWStr) || 0))
  const parsedH = Math.max(1, Math.min(8, parseInt(editHStr) || 0))
  const sizeChanged = anim !== null && parsedW > 0 && parsedH > 0 && (parsedW !== anim.w || parsedH !== anim.h)

  return (
    <div className="flex flex-col gap-4">

      {/* Palette editor */}
      <div className="flex flex-col gap-2 border-b border-[var(--p8-dark-grey)] pb-4">
        <span className="text-[var(--p8-light-grey)]">draw palette</span>

        {/* Source slot grid */}
        {/* FIXME use common editor*/}
        <div className="grid grid-cols-16 gap-px w-fit">
          {drawPalette.map((targetSlot, slot) => {
            const remapped = targetSlot !== slot
            const selected = selectedSlot === slot
            return (
              <button
                key={slot}
                title={`slot ${slot} → slot ${targetSlot}`}
                onClick={() => setSelectedSlot(prev => prev === slot ? null : slot)}
                onContextMenu={e => {
                  e.preventDefault()
                  if (remapped) {
                    const next = [...drawPalette]; next[slot] = slot; onDrawPaletteChange(next)
                    if (selectedSlot === slot) setSelectedSlot(null)
                  }
                }}
                className="relative flex flex-col items-center gap-0.5 p-0"
              >
                <div className="relative w-6 h-6" style={{
                  background: resolveHex(projectPalette[targetSlot]),
                  outline: selected ? '2px solid var(--p8-yellow)' : remapped ? '2px solid var(--p8-white)' : '2px solid transparent',
                  outlineOffset: '1px',
                }}>
                  {transparentColours.includes(slot) && (
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(45deg, #fff2 25%, transparent 25%, transparent 75%, #fff2 75%), linear-gradient(45deg, #fff2 25%, transparent 25%, transparent 75%, #fff2 75%)',
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 3px 3px',
                    }} />
                  )}
                </div>
                {remapped && <div className="w-1.5 h-1.5 rounded-full bg-[var(--p8-yellow)]" />}
              </button>
            )
          })}
        </div>

        {/* Colour picker */}
        {selectedSlot !== null && (
          <div className="flex flex-col gap-1 border border-[var(--p8-dark-grey)] p-2 w-fit">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--p8-light-grey)]">slot {selectedSlot} → {drawPalette[selectedSlot]}</span>
              <button
                onClick={() => {
                  if (transparentColours.includes(selectedSlot)) {
                    onTransparencyChange(transparentColours.filter(s => s !== selectedSlot))
                  } else {
                    onTransparencyChange([...transparentColours, selectedSlot])
                  }
                }}
                className={transparentColours.includes(selectedSlot) ? 'text-[var(--p8-yellow)]' : 'text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'}
              >
                {transparentColours.includes(selectedSlot) ? 'transparent' : 'opaque'}
              </button>
            </div>
            <div className="grid grid-cols-16 gap-px">
              {projectPalette.map((colourIdx, slotIdx) => (
                <button
                  key={slotIdx}
                  title={`slot ${slotIdx}`}
                  className="w-6 h-6"
                  style={{
                    background: resolveHex(colourIdx),
                    outline: drawPalette[selectedSlot] === slotIdx ? '2px solid var(--p8-yellow)' : '2px solid transparent',
                    outlineOffset: '1px',
                  }}
                  onClick={() => { const next = [...drawPalette]; next[selectedSlot] = slotIdx; onDrawPaletteChange(next) }}
                />
              ))}
            </div>
          </div>
        )}

        {drawPalette.some((v, i) => v !== i) && (
          <button
            onClick={() => { onDrawPaletteChange(Array.from({ length: 16 }, (_, i) => i)); setSelectedSlot(null) }}
            className="self-start text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]"
          >reset all</button>
        )}

        {/* Named palettes list */}
        {namedPalettes.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[var(--p8-light-grey)]">named palettes</span>
            {namedPalettes.map((pal, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <button
                  onClick={() => onApplyNamedPalette(i)}
                  className="flex items-center gap-1 text-left hover:opacity-80"
                  title={`Apply "${pal.name}" to draw palette`}
                >
                  <div className="flex gap-px">
                    {pal.drawPalette.map((slot, s) => (
                      <div key={s} className="w-2 h-4" style={{ background: resolveHex(projectPalette[slot]) }} />
                    ))}
                  </div>
                  <span className="text-[var(--p8-light-grey)] ml-1">{pal.name}</span>
                </button>
                {anim && (
                  <button
                    onClick={() => updateFrame(activeAnimIdx!, safeFrameIdx, { palette: i })}
                    className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-green)]"
                    title={`Set on frame ${safeFrameIdx + 1}`}
                  >use</button>
                )}
                <button onClick={() => onDuplicateNamedPalette(i)} className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]" title="Duplicate palette">⧉</button>
                <button onClick={() => onDeleteNamedPalette(i)} className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-red)]">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Save current */}
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

      {/* Animation selector — only when animations exist */}
      {animations.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          {animations.map((a, i) => (
            <button key={i}
              onClick={() => { setActiveAnimIdx(i); setPlaying(false) }}
              className={`px-2 py-0.5 ${activeAnimIdx === i
                ? 'text-[var(--p8-white)] bg-[rgba(255,255,255,0.1)]'
                : 'text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'
              }`}
            >{a.name}</button>
          ))}
          <button onClick={createAnimation} className="px-2 py-0.5 border border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)] hover:text-[var(--p8-light-grey)]">
            + new
          </button>
        </div>
      )}

      {/* Main layout — tile picker always visible */}
      <div className="flex gap-6 items-start">
        {/* Preview canvas — only when animation active */}
        {anim && frame && (
          <div className="flex flex-col gap-2 min-w-32">
            <span className="text-[var(--p8-light-grey)]">{frameLabel}</span>
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
              {anim.frames.length > 1 && (
                <button
                  onClick={() => setViewMode(v => v === 'single' ? 'strip' : 'single')}
                  className={`px-2 py-0.5 border ${viewMode === 'strip'
                    ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
                    : 'border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)] hover:text-[var(--p8-light-grey)]'
                  }`}
                >strip</button>
              )}
            </div>
            {viewMode === 'single' ? (
              <canvas
                ref={canvasRef}
                width={anim.mirror ? canvasW * 2 : canvasW} height={canvasH}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={`border border-[var(--p8-dark-grey)] ${playing ? 'cursor-default' : 'cursor-crosshair'}`}
                style={{ imageRendering: 'pixelated', width: (anim.mirror ? canvasW * 2 : canvasW) * zoom, height: canvasH * zoom }}
              />
            ) : (
              <div className="flex flex-col gap-1">
                {anim.frames.map((f, fi) => {
                  const base = (f.palette !== undefined && namedPalettes[f.palette])
                    ? namedPalettes[f.palette].drawPalette
                    : IDENTITY
                  const palette = base.map(slot => projectPalette[slot])
                  return (
                    <FilmstripFrame
                      key={fi}
                      frame={f}
                      w={anim.w} h={anim.h}
                      gfx={gfx}
                      resolvedPalette={palette}
                      mirror={anim.mirror ?? false}
                      active={fi === safeFrameIdx}
                      zoom={zoom}
                      onClick={() => { setActiveFrameIdx(fi); setViewMode('single'); setPlaying(false) }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tile picker */}
        <TilePicker
          gfx={gfx}
          drawPalette={projectPalette}
          brush={brush}
          onBrushChange={setBrush}
        />

        {/* Right column */}
        <div className="flex flex-col gap-2 w-52">
          {anim ? (
            <>
              <div className="border border-[var(--p8-dark-grey)] p-2 flex flex-col gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={e => { if (e.key === 'Enter') { saveName(); (e.target as HTMLInputElement).blur() } }}
                  className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-full outline-none focus:border-[var(--p8-yellow)]"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--p8-dark-grey)]">w</span>
                  <input type="number" min={1} max={8} value={editWStr}
                    onFocus={e => e.currentTarget.select()}
                    onChange={e => { setEditWStr(e.target.value); setConfirmingResize(false) }}
                    className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-8 outline-none focus:border-[var(--p8-yellow)]"
                  />
                  <span className="text-[var(--p8-dark-grey)]">h</span>
                  <input type="number" min={1} max={8} value={editHStr}
                    onFocus={e => e.currentTarget.select()}
                    onChange={e => { setEditHStr(e.target.value); setConfirmingResize(false) }}
                    className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-8 outline-none focus:border-[var(--p8-yellow)]"
                  />
                  <span className="text-[var(--p8-dark-grey)]">tiles</span>
                </div>
                {sizeChanged && !confirmingResize && (
                  <button onClick={tryApplyResize} className="text-[var(--p8-green)] self-start">apply resize</button>
                )}
                {confirmingResize && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--p8-red)]" style={{ fontSize: '10px' }}>tiles outside new boundary will be lost</span>
                    <div className="flex gap-3">
                      <button onClick={() => doApplyResize(parsedW, parsedH)} className="text-[var(--p8-red)]">apply</button>
                      <button onClick={() => { setConfirmingResize(false); setEditWStr(String(anim.w)); setEditHStr(String(anim.h)) }} className="text-[var(--p8-dark-grey)]">cancel</button>
                    </div>
                  </div>
                )}
                <button onClick={deleteAnim} className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-red)] self-start mt-1">
                  delete
                </button>
              </div>
              <span className="text-[var(--p8-light-grey)]">frames</span>
              <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 320 }}>
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
                    onDuplicate={() => duplicateFrame(fi)}
                    onDelete={() => deleteFrame(fi)}
                    canDelete={anim.frames.length > 1}
                  />
                ))}
              </div>
              <button onClick={addFrame} className="text-[var(--p8-light-grey)] hover:text-[var(--p8-white)] self-start">
                + add frame
              </button>
            </>
          ) : (
            <button onClick={createAnimation} className="px-2 py-0.5 border border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)] hover:text-[var(--p8-light-grey)]">
              + new animation
            </button>
          )}
        </div>
      </div>

      {/* Footer — only when animation active */}
      {anim && (
        <div className="flex items-center gap-6 border-t border-[var(--p8-dark-grey)] pt-3">
          <button onClick={() => setPlaying(p => !p)}
            className={`px-2 py-0.5 border ${playing
              ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
              : 'border-[var(--p8-white)] text-[var(--p8-white)] hover:border-[var(--p8-light-grey)] hover:text-[var(--p8-light-grey)]'
            }`}
          >{playing ? 'stop' : 'play'}</button>
          <div className="flex items-center gap-3">
            <span className="text-[var(--p8-dark-grey)]">speed</span>
            <input type="range" min={1} max={30} value={anim.speed}
              onChange={e => updateAnim({ speed: parseInt(e.target.value) })}
              className="w-32"
            />
            <span className="text-[var(--p8-light-grey)]">{anim.speed} frames</span>
            <span className="text-[var(--p8-dark-grey)]">({Math.round(60 / anim.speed)}fps)</span>
          </div>
          <button onClick={() => updateAnim({ mirror: !anim.mirror })}
            className={`px-2 py-0.5 border ${anim.mirror
              ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
              : 'border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)] hover:text-[var(--p8-light-grey)]'
            }`}
          >mirror</button>
          <button onClick={exportGif} disabled={exportingGif}
            className="text-[var(--p8-light-grey)] hover:text-[var(--p8-white)] disabled:text-[var(--p8-dark-grey)]"
          >{exportingGif ? 'exporting…' : '↓ gif'}</button>
        </div>
      )}
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
  onDuplicate: () => void
  onDelete: () => void
  canDelete: boolean
}

function FrameCard({ frameIdx, frame, active, namedPalettes, onClick, onPaletteChange, onFlipToggle, onDuplicate, onDelete, canDelete }: FrameCardProps) {
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
        <div className="flex items-center gap-1.5">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }}
            className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]"
            title="Duplicate frame"
          >⧉</button>
          {canDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete() }}
              className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-red)]"
            >×</button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <span className="text-[var(--p8-dark-grey)]">pal</span>
        <select
          value={frame.palette ?? ''}
          onChange={e => onPaletteChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
          className="bg-[#111] border border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)] px-1 w-24"
        >
          <option value="">default</option>
          {namedPalettes.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
        <button onClick={onFlipToggle} title="Flip"
          className={`px-1 border ${frame.flip
            ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
            : 'border-[var(--p8-dark-grey)] text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'
          }`}
        >↔</button>
      </div>
    </div>
  )
}

interface FilmstripFrameProps {
  frame: AnimationFrame
  w: number
  h: number
  gfx: Uint8Array
  resolvedPalette: number[]
  mirror: boolean
  active: boolean
  zoom: number
  onClick: () => void
}

function FilmstripFrame({ frame, w, h, gfx, resolvedPalette, mirror, active, zoom, onClick }: FilmstripFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pw = w * TILE, ph = h * TILE
  const displayW = mirror ? pw * 2 : pw

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    renderFrame(ctx, frame, w, h, gfx, resolvedPalette, mirror)
  }, [frame, w, h, gfx, resolvedPalette, mirror])

  return (
    <canvas
      ref={canvasRef}
      width={displayW} height={ph}
      onClick={onClick}
      className={`border cursor-pointer ${active
        ? 'border-[var(--p8-yellow)]'
        : 'border-[var(--p8-dark-grey)] hover:border-[var(--p8-light-grey)]'
      }`}
      style={{ imageRendering: 'pixelated', width: displayW * zoom, height: ph * zoom }}
    />
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
