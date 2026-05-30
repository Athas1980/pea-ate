import { useMemo, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import CodeSnippet from './CodeSnippet'

interface NamedPalette { name: string; drawPalette: number[] }

interface Props {
  drawPalette: number[]
  onChange: (palette: number[]) => void
  projectPalette: number[]
  namedPalettes: NamedPalette[]
  onSavePalette: (name: string) => void
  onDeletePalette: (index: number) => void
  onApplyPalette: (index: number) => void
  transparentColours: number[]
  onTransparencyChange: (t: number[]) => void
}

export default function PaletteEditor({ drawPalette, onChange, projectPalette, namedPalettes, onSavePalette, onDeletePalette, onApplyPalette, transparentColours, onTransparencyChange }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  function handleSlotClick(slot: number) {
    setSelectedSlot(prev => prev === slot ? null : slot)
  }

  function handleTargetClick(targetSlot: number) {
    if (selectedSlot === null) return
    const next = [...drawPalette]
    next[selectedSlot] = targetSlot
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
  const [copied, setCopied] = useState<'verbose' | 'compact' | 'array' | 'keyed' | null>(null)

  function handleCopy(which: 'verbose' | 'compact' | 'array' | 'keyed') {
    let text = ''
    if (which === 'verbose') text = luaSnippet
    else if (which === 'compact') text = luaCompact
    else if (which === 'array') text = generateNamedPalettesArray(namedPalettes, projectPalette)
    else text = generateNamedPalettesKeyed(namedPalettes, projectPalette)
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Source slots + picker grouped so picker can centre under the grid */}
      <div className="flex flex-col gap-3 w-fit">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--p8-light-grey)] mb-1">draw palette</span>
          <div className="grid grid-cols-8 gap-px items-start">
            {drawPalette.map((targetSlot, slot) => {
              const remapped = targetSlot !== slot
              const selected = selectedSlot === slot
              return (
                <button
                  key={slot}
                  title={`slot ${slot} → slot ${targetSlot}`}
                  onClick={() => handleSlotClick(slot)}
                  onContextMenu={e => { e.preventDefault(); if (remapped) resetSlot(slot) }}
                  className="relative flex flex-col items-center gap-0.5 p-0"
                >
                  <div
                    className="relative w-6 h-6"
                    style={{
                      background: resolveHex(projectPalette[targetSlot]),
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

        {/* Colour picker — shows project palette slots as targets */}
        {selectedSlot !== null && (
          <div className="flex flex-col gap-1 border-2 border-[var(--p8-dark-grey)] p-2 w-fit self-center">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--p8-light-grey)]">
                slot {selectedSlot} → slot {drawPalette[selectedSlot]}
              </span>
              <button
                onClick={() => toggleTransparent(selectedSlot)}
                className={transparentColours.includes(selectedSlot) ? 'text-[var(--p8-yellow)]' : 'text-[var(--p8-dark-grey)] hover:text-[var(--p8-light-grey)]'}
                title="Toggle transparency"
              >
                {transparentColours.includes(selectedSlot) ? 'transparent' : 'opaque'}
              </button>
            </div>
            <div className="grid grid-cols-8 gap-px">
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
                  onClick={() => handleTargetClick(slotIdx)}
                />
              ))}
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
      <div className="flex flex-col gap-2 border-t-2 border-[var(--p8-dark-grey)] pt-3">
        <span className="text-[var(--p8-light-grey)]">named palettes</span>

        {namedPalettes.map((pal, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => onApplyPalette(i)}
              className="flex items-center gap-1 flex-1 text-left hover:opacity-80"
              title={`Apply "${pal.name}"`}
            >
              <div className="flex gap-px">
                {pal.drawPalette.slice(0, 8).map((slotIdx, s) => (
                  <div key={s} className="w-2 h-4" style={{ background: resolveHex(projectPalette[slotIdx]) }} />
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
              className="bg-transparent border-2 border-[var(--p8-dark-grey)] px-1 text-[var(--p8-white)] w-28 outline-none focus:border-[var(--p8-yellow)]"
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

      {/* Named palette export */}
      {namedPalettes.length > 0 && (
        <div className="flex flex-col gap-3 border-t-2 border-[var(--p8-dark-grey)] pt-3">
          <span className="text-[var(--p8-light-grey)]">export palettes</span>
          <CodeSnippet code={generateNamedPalettesArray(namedPalettes, projectPalette)} label="array" onCopy={() => handleCopy('array')} copied={copied === 'array'} />
          <CodeSnippet code={generateNamedPalettesKeyed(namedPalettes, projectPalette)} label="keyed" onCopy={() => handleCopy('keyed')} copied={copied === 'keyed'} />
        </div>
      )}

      {/* Lua snippet */}
      <div className="flex flex-col gap-3 border-t-2 border-[var(--p8-dark-grey)] pt-3">
        <span className="text-[var(--p8-light-grey)]">lua</span>
        {!luaSnippet && !luaCompact ? (
          <span className="text-[var(--p8-dark-grey)]">-- default palette</span>
        ) : (
          <>
            <CodeSnippet code={luaSnippet || '-- default palette'} label="verbose" onCopy={() => handleCopy('verbose')} copied={copied === 'verbose'} />
            <CodeSnippet code={luaCompact || '-- default palette'} label="compact" onCopy={() => handleCopy('compact')} copied={copied === 'compact'} />
          </>
        )}
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

function generateNamedPalettesArray(namedPalettes: { name: string; drawPalette: number[] }[], projectPalette: number[]): string {
  const lines = ['local pals = {']
  for (const p of namedPalettes) {
    const colours = p.drawPalette.map(slot => projectPalette[slot])
    lines.push(`  split"${rotate(colours).join(',')}",  -- ${p.name}`)
  }
  lines.push('}')
  const indices = namedPalettes.map((p, i) => `-- pal(pals[${i + 1}])  -- ${p.name}`).join('\n')
  lines.push(indices)
  return lines.join('\n')
}

function generateNamedPalettesKeyed(namedPalettes: { name: string; drawPalette: number[] }[], projectPalette: number[]): string {
  const lines = ['local pals = {}']
  for (const p of namedPalettes) {
    const colours = p.drawPalette.map(slot => projectPalette[slot])
    lines.push(`pals["${p.name}"] = split"${rotate(colours).join(',')}"`)
  }
  lines.push(`-- usage: pal(pals["name"])`)
  return lines.join('\n')
}

function generateLuaCompact(drawPalette: number[], transparentColours: number[]): string {
  const lines: string[] = []
  if (drawPalette.some((v, i) => v !== i)) {
    lines.push(`pal(split"${rotate(drawPalette).join(',')}")`)
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
      lines.push(`pal(${slot},${drawPalette[slot]})`)
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
