import { useMemo, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'

interface NamedPalette { name: string; drawPalette: number[] }

interface Props {
  drawPalette: number[]
  onChange: (palette: number[]) => void
  namedPalettes: NamedPalette[]
  onSavePalette: (name: string) => void
  onDeletePalette: (index: number) => void
  onApplyPalette: (index: number) => void
  transparentColours: number[]
  onTransparencyChange: (t: number[]) => void
}

export default function PaletteEditor({ drawPalette, onChange, namedPalettes, onSavePalette, onDeletePalette, onApplyPalette, transparentColours, onTransparencyChange }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  function handleSlotClick(slot: number) {
    setSelectedSlot(prev => prev === slot ? null : slot)
  }

  function handleTargetClick(targetIdx: number) {
    if (selectedSlot === null) return
    const next = [...drawPalette]
    next[selectedSlot] = targetIdx
    onChange(next)
  }

  function resetSlot(slot: number) {
    const next = [...drawPalette]
    next[slot] = slot
    onChange(next)
    if (selectedSlot === slot) setSelectedSlot(null)
  }

  function resetAll() {
    onChange(Array.from({ length: 16 }, (_, i) => i))
    setSelectedSlot(null)
  }

  function toggleTransparent(slot: number) {
    if (transparentColours.includes(slot)) {
      onTransparencyChange(transparentColours.filter(s => s !== slot))
    } else {
      onTransparencyChange([...transparentColours, slot])
    }
  }

  function handleSave() {
    const name = saveName.trim() || `palette ${namedPalettes.length + 1}`
    onSavePalette(name)
    setSaveName('')
    setSaving(false)
  }

  const anyRemapped = drawPalette.some((v, i) => v !== i)

  const luaSnippet = useMemo(() => generateLua(drawPalette, transparentColours), [drawPalette, transparentColours])
  const luaCompact  = useMemo(() => generateLuaCompact(drawPalette, transparentColours), [drawPalette, transparentColours])
  const [copied, setCopied] = useState<'verbose' | 'compact' | null>(null)

  function handleCopy(which: 'verbose' | 'compact') {
    navigator.clipboard.writeText(which === 'verbose' ? luaSnippet : luaCompact)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Source slots + picker grouped so picker can centre under the grid */}
      <div className="flex flex-col gap-3 w-fit">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--p8-light-grey)] mb-1">palette</span>
          <div className="grid grid-cols-8 gap-px items-start">
            {drawPalette.map((targetIdx, slot) => {
              const remapped = targetIdx !== slot
              const selected = selectedSlot === slot
              return (
                <button
                  key={slot}
                  title={`slot ${slot} → ${targetIdx}`}
                  onClick={() => handleSlotClick(slot)}
                  onContextMenu={e => { e.preventDefault(); if (remapped) resetSlot(slot) }}
                  className="relative flex flex-col items-center gap-0.5 p-0"
                >
                  <div
                    className="relative w-6 h-6"
                    style={{
                      background: resolveHex(targetIdx),
                      outline: selected ? '2px solid var(--p8-yellow)' : remapped ? '2px solid var(--p8-white)' : '2px solid transparent',
                      outlineOffset: '1px',
                    }}
                  >
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
        </div>

        {/* Colour picker */}
        {selectedSlot !== null && (
          <div className="flex flex-col gap-1 border border-[var(--p8-dark-grey)] p-2 w-fit self-center">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--p8-light-grey)]">
              slot {selectedSlot} → {drawPalette[selectedSlot] >= 128
                ? `secret[${drawPalette[selectedSlot] - 128}]`
                : String(drawPalette[selectedSlot])}
            </span>
            <button
              onClick={() => toggleTransparent(selectedSlot)}
              className={transparentColours.includes(selectedSlot) ? 'text-[var(--p8-yellow)]' : 'text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'}
              title="Toggle transparency"
            >
              {transparentColours.includes(selectedSlot) ? 'transparent' : 'opaque'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <ColourRow label="standard" colours={STANDARD_PALETTE} startIdx={0}   current={drawPalette[selectedSlot]} onSelect={handleTargetClick} />
            <ColourRow label="secret"   colours={SECRET_PALETTE}   startIdx={128} current={drawPalette[selectedSlot]} onSelect={handleTargetClick} />
          </div>
          </div>
        )}
      </div>

      {anyRemapped && (
        <button onClick={resetAll} className="self-start text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]">
          reset all
        </button>
      )}

      {/* Named palettes */}
      <div className="flex flex-col gap-2 border-t border-[var(--p8-dark-grey)] pt-3">
        <span className="text-[var(--p8-light-grey)]">named palettes</span>

        {namedPalettes.map((pal, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => onApplyPalette(i)}
              className="flex items-center gap-1 flex-1 text-left hover:opacity-80"
              title={`Apply "${pal.name}"`}
            >
              <div className="flex gap-px">
                {pal.drawPalette.slice(0, 8).map((idx, s) => (
                  <div key={s} className="w-2 h-4" style={{ background: resolveHex(idx) }} />
                ))}
              </div>
              <span className="text-[var(--p8-light-grey)] ml-1">{pal.name}</span>
            </button>
            <button
              onClick={() => onDeletePalette(i)}
              className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-red)]"
              title="Delete"
            >×</button>
          </div>
        ))}

        {saving ? (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaving(false) }}
              placeholder={`palette ${namedPalettes.length + 1}`}
              autoFocus
              className="bg-transparent border border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-28 outline-none focus:border-[var(--p8-yellow)]"
            />
            <button onClick={handleSave} className="text-[var(--p8-green)]">save</button>
            <button onClick={() => setSaving(false)} className="text-[var(--p8-dark-grey)]">cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setSaving(true)}
            className="self-start text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]"
          >
            + save current
          </button>
        )}
      </div>

      {/* Lua snippet */}
      <div className="flex flex-col gap-3 border-t border-[var(--p8-dark-grey)] pt-3">
        <span className="text-[var(--p8-light-grey)]">lua</span>
        {!luaSnippet && !luaCompact ? (
          <span className="text-[var(--p8-dark-grey)]">-- default palette</span>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--p8-dark-grey)]">verbose</span>
                <button
                  onClick={() => handleCopy('verbose')}
                  className={copied === 'verbose' ? 'text-[var(--p8-green)]' : 'text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]'}
                >{copied === 'verbose' ? 'copied!' : 'copy'}</button>
              </div>
              <pre className="text-[var(--p8-light-grey)] leading-relaxed whitespace-pre-wrap">{luaSnippet || '-- default palette'}</pre>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--p8-dark-grey)]">compact</span>
                <button
                  onClick={() => handleCopy('compact')}
                  className={copied === 'compact' ? 'text-[var(--p8-green)]' : 'text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]'}
                >{copied === 'compact' ? 'copied!' : 'copy'}</button>
              </div>
              <pre className="text-[var(--p8-light-grey)] leading-relaxed whitespace-pre-wrap">{luaCompact || '-- default palette'}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface ColourRowProps {
  label: string; colours: readonly string[]; startIdx: number; current: number; onSelect: (idx: number) => void
}

function ColourRow({ label, colours, startIdx, current, onSelect }: ColourRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[var(--p8-light-grey)]">{label}</span>
      <div className="grid grid-cols-4 gap-px w-fit">
        {colours.map((hex, i) => {
          const idx = startIdx + i
          return (
            <button key={idx} title={`${label}[${i}] #${idx}`} onClick={() => onSelect(idx)}
              className="w-6 h-6"
              style={{ background: hex, outline: current === idx ? '2px solid var(--p8-yellow)' : '2px solid transparent', outlineOffset: '1px' }}
            />
          )
        })}
      </div>
    </div>
  )
}

function resolveHex(idx: number): string {
  return idx >= 128 ? SECRET_PALETTE[idx - 128] : STANDARD_PALETTE[idx]
}

function rotate(palette: number[]): number[] {
  return [...palette.slice(1), palette[0]]
}

function generateLuaCompact(drawPalette: number[], transparentColours: number[]): string {
  const lines: string[] = []

  const hasStandard = drawPalette.some((v, i) => v !== i && v < 128)
  const hasSecret   = drawPalette.some(v => v >= 128)

  if (hasStandard && !hasSecret) {
    lines.push(`pal(split"${rotate(drawPalette).join(',')}")`)
  } else if (!hasStandard && hasSecret) {
    lines.push(`pal(split"${rotate(drawPalette).join(',')}",1)`)
  } else if (hasStandard && hasSecret) {
    const drawPart   = drawPalette.map((v, i) => v >= 128 ? i : v)
    const screenPart = drawPalette.map((v, i) => v < 128  ? i : v)
    lines.push(`pal(split"${rotate(drawPart).join(',')}")`)
    lines.push(`pal(split"${rotate(screenPart).join(',')}",1)`)
  }

  let bitmask = 0
  for (const c of transparentColours) bitmask |= (1 << c)
  if (bitmask !== 1) lines.push(`palt(${bitmask})`)

  return lines.join('\n')
}

function generateLua(drawPalette: number[], transparentColours: number[]): string {
  const lines: string[] = []

  for (let slot = 0; slot < 16; slot++) {
    if (drawPalette[slot] !== slot) {
      const secret = drawPalette[slot] >= 128
      lines.push(`pal(${slot},${drawPalette[slot]}${secret ? ',1' : ''})`)
    }
  }

  // Pico-8 default: only colour 0 is transparent
  const isDefaultTransparency = transparentColours.length === 1 && transparentColours[0] === 0
  if (!isDefaultTransparency && !(transparentColours.length === 0 && lines.length === 0)) {
    if (transparentColours.length === 0) {
      lines.push('palt(0,false)')
    } else {
      lines.push('palt()')
      if (!transparentColours.includes(0)) lines.push('palt(0,false)')
      for (const c of [...transparentColours].sort((a, b) => a - b)) {
        if (c !== 0) lines.push(`palt(${c},true)`)
      }
    }
  }

  return lines.join('\n')
}
