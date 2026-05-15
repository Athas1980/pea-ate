import { useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'

interface Props {
  drawPalette: number[]
  onChange: (palette: number[]) => void
}

export default function PaletteEditor({ drawPalette, onChange }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  function handleSlotClick(slot: number) {
    setSelectedSlot(prev => prev === slot ? null : slot)
  }

  function handleTargetClick(targetIdx: number) {
    if (selectedSlot === null) return
    const next = [...drawPalette]
    next[selectedSlot] = targetIdx
    onChange(next)
    // keep slot selected so you can audition multiple colours quickly
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

  const anyRemapped = drawPalette.some((v, i) => v !== i)

  return (
    <div className="flex flex-col gap-3">
      {/* Source slots */}
      <div className="flex flex-col gap-1">
        <span className="text-[var(--p8-light-grey)] mb-1">palette</span>
        <div className="flex gap-1 flex-wrap">
          {drawPalette.map((targetIdx, slot) => {
            const remapped = targetIdx !== slot
            const selected = selectedSlot === slot
            const colour = resolveHex(targetIdx)
            return (
              <button
                key={slot}
                title={`slot ${slot} → ${targetIdx}`}
                onClick={() => handleSlotClick(slot)}
                onContextMenu={e => { e.preventDefault(); if (remapped) resetSlot(slot) }}
                className="relative flex flex-col items-center gap-0.5 p-0"
              >
                <div
                  className="w-6 h-6"
                  style={{
                    background: colour,
                    outline: selected ? '2px solid var(--p8-yellow)' : remapped ? '2px solid var(--p8-white)' : '2px solid transparent',
                    outlineOffset: '1px',
                  }}
                />
                {remapped && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--p8-yellow)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Colour picker — shown when a slot is selected */}
      {selectedSlot !== null && (
        <div className="flex flex-col gap-2 border border-[var(--p8-dark-grey)] p-2">
          <span className="text-[var(--p8-light-grey)]">
            slot {selectedSlot} → {drawPalette[selectedSlot] >= 128
              ? `secret[${drawPalette[selectedSlot] - 128}]`
              : String(drawPalette[selectedSlot])}
          </span>

          <div className="flex flex-col gap-2">
            <ColourRow
              label="standard"
              colours={STANDARD_PALETTE}
              startIdx={0}
              current={drawPalette[selectedSlot]}
              onSelect={handleTargetClick}
            />
            <ColourRow
              label="secret"
              colours={SECRET_PALETTE}
              startIdx={128}
              current={drawPalette[selectedSlot]}
              onSelect={handleTargetClick}
            />
          </div>
        </div>
      )}

      {anyRemapped && (
        <button
          onClick={resetAll}
          className="self-start text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]"
        >
          reset all
        </button>
      )}
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
      <div className="flex gap-1 flex-wrap">
        {colours.map((hex, i) => {
          const idx = startIdx + i
          const selected = current === idx
          return (
            <button
              key={idx}
              title={`${label}[${i}] #${idx}`}
              onClick={() => onSelect(idx)}
              className="w-6 h-6"
              style={{
                background: hex,
                outline: selected ? '2px solid var(--p8-yellow)' : '2px solid transparent',
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
