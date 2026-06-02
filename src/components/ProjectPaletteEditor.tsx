import { useMemo, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import CodeSnippet from './CodeSnippet'

interface Props {
  projectPalette: number[]
  onChange: (p: number[]) => void
  onHoverSlot?: (slot: number | null) => void
}

export default function ProjectPaletteEditor({ projectPalette, onChange, onHoverSlot }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  function handleSlotClick(slot: number) {
    setSelectedSlot(prev => prev === slot ? null : slot)
  }

  function handleColourSelect(colourIdx: number) {
    if (selectedSlot === null) return
    const next = [...projectPalette]
    next[selectedSlot] = colourIdx
    onChange(next)
  }

  function resetSlot(slot: number) {
    const next = [...projectPalette]
    next[slot] = slot
    onChange(next)
    if (selectedSlot === slot) setSelectedSlot(null)
  }

  function resetAll() {
    onChange(Array.from({ length: 16 }, (_, i) => i))
    setSelectedSlot(null)
  }

  const anyChanged = projectPalette.some((v, i) => v !== i)

  const snippet = useMemo(() => generateProjectPaletteSnippet(projectPalette), [projectPalette])
  const compact = useMemo(() => generateProjectPaletteCompact(projectPalette), [projectPalette])
  const [copied, setCopied] = useState<'verbose' | 'compact' | null>(null)

  function handleCopy(which: 'verbose' | 'compact') {
    navigator.clipboard.writeText(which === 'verbose' ? snippet : compact)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 w-fit">
        <div className="flex flex-col gap-1">
          <h2 className="text-[12px] text-[var(--p8-white)]">Project Palette</h2>
          <div className="grid grid-cols-8 gap-px items-start">
            {projectPalette.map((colourIdx, slot) => {
              const changed = colourIdx !== slot
              const selected = selectedSlot === slot
              return (
                <button
                  key={slot}
                  title={`slot ${slot} → ${colourIdx}`}
                  onClick={() => handleSlotClick(slot)}
                  onContextMenu={e => { e.preventDefault(); if (changed) resetSlot(slot) }}
                  onMouseEnter={() => onHoverSlot?.(slot)}
                  onMouseLeave={() => onHoverSlot?.(null)}
                  className="relative flex flex-col items-center gap-0.5 p-0"
                >
                  <div
                    className="w-6 h-6"
                    style={{
                      background: resolveHex(colourIdx),
                      outline: selected ? '2px solid var(--p8-yellow)' : changed ? '2px solid var(--p8-white)' : '2px solid transparent',
                      outlineOffset: '1px',
                    }}
                  />
                  {changed && <div className="w-1.5 h-1.5 rounded-full bg-[var(--p8-yellow)]" />}
                </button>
              )
            })}
          </div>
        </div>

        {selectedSlot !== null && (
          <div className="flex flex-col gap-2 border-2 border-[var(--p8-dark-grey)] p-2 w-fit self-center">
            <span className="text-[var(--p8-light-grey)]">
              slot {selectedSlot} → {projectPalette[selectedSlot] >= 128
                ? `secret[${projectPalette[selectedSlot] - 128}]`
                : String(projectPalette[selectedSlot])}
            </span>
            <div className="flex flex-col gap-2">
              <ColourRow label="standard" colours={STANDARD_PALETTE} startIdx={0}   current={projectPalette[selectedSlot]} onSelect={handleColourSelect} />
              <ColourRow label="secret"   colours={SECRET_PALETTE}   startIdx={128} current={projectPalette[selectedSlot]} onSelect={handleColourSelect} />
            </div>
          </div>
        )}
      </div>

      {anyChanged && (
        <button onClick={resetAll} className="self-start text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]">
          reset all
        </button>
      )}

      <div className="flex flex-col gap-3 border-t-2 border-[var(--p8-dark-grey)] pt-3">
        <h2 className="text-[12px] text-[var(--p8-white)]">Lua (Screen Palette)</h2>
        {!anyChanged ? (
          <span className="text-[var(--p8-lavender)]">-- default project palette</span>
        ) : (
          <>
            <CodeSnippet code={snippet} label="verbose" onCopy={() => handleCopy('verbose')} copied={copied === 'verbose'} />
            <CodeSnippet code={compact} label="compact" onCopy={() => handleCopy('compact')} copied={copied === 'compact'} />
          </>
        )}
      </div>
    </div>
  )
}

interface ColourRowProps {
  label: string
  colours: readonly string[]
  startIdx: number
  current: number
  onSelect: (idx: number) => void
}

function ColourRow({ label, colours, startIdx, current, onSelect }: ColourRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[var(--p8-light-grey)]">{label}</span>
      <div className="grid grid-cols-4 gap-px w-fit">
        {colours.map((hex, i) => {
          const idx = startIdx + i
          return (
            <button
              key={idx}
              title={`${label}[${i}] #${idx}`}
              onClick={() => onSelect(idx)}
              className="w-6 h-6"
              style={{
                background: hex,
                outline: current === idx ? '2px solid var(--p8-yellow)' : '2px solid transparent',
                outlineOffset: '1px',
              }}
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

function generateProjectPaletteCompact(projectPalette: number[]): string {
  return `pal(split"${rotate(projectPalette).join(',')}", 1)`
}

function generateProjectPaletteSnippet(projectPalette: number[]): string {
  const lines: string[] = []
  for (let i = 0; i < 16; i++) {
    const target = projectPalette[i]
    if (target === i) continue
    const from = STANDARD_PALETTE[i]
    const to = target >= 128 ? SECRET_PALETTE[target - 128] : STANDARD_PALETTE[target]
    lines.push(`pal(${i}, ${target}, 1)  -- ${from} -> ${to}`)
  }
  return lines.length ? lines.join('\n') : '-- default project palette'
}
