import { useMemo, useState } from 'react'
import { STANDARD_PALETTE, SECRET_PALETTE } from '../types/cart'
import { COLOR_TABLE_HEX } from './LabelView'

interface Props {
  label: Uint8Array
  labelPalette: Record<number, number>
  onChange: (palette: Record<number, number>) => void
}

export default function LabelPaletteEditor({ label, labelPalette, onChange }: Props) {
  const uniqueValues = useMemo(() => firstUniqueValues(label), [label])
  const [selectedValue, setSelectedValue] = useState<number | null>(null)

  const tooMany = uniqueValues.length > 16

  function handleValueClick(value: number) {
    if (tooMany) return
    setSelectedValue(prev => prev === value ? null : value)
  }

  function handleTargetClick(targetIdx: number) {
    if (selectedValue === null) return
    onChange({ ...labelPalette, [selectedValue]: targetIdx })
  }

  function resetValue(value: number) {
    const next = { ...labelPalette }
    delete next[value]
    onChange(next)
    if (selectedValue === value) setSelectedValue(null)
  }

  function resetAll() {
    onChange({})
    setSelectedValue(null)
  }

  const displayValues = tooMany ? uniqueValues.slice(0, 16) : uniqueValues
  const anyRemapped = Object.keys(labelPalette).length > 0

  return (
    <div className="flex flex-col gap-3">
      {tooMany && (
        <div className="border border-[var(--p8-red)] p-2 text-[var(--p8-red)] leading-relaxed">
          label has {uniqueValues.length} unique colour values (max 16).
          palette cannot be altered.
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-[var(--p8-light-grey)] mb-1">label colours</span>
        <div className="flex gap-1 flex-wrap">
          {displayValues.map(value => {
            const mapped = (labelPalette[value] ?? value) & 0x1f
            const remapped = labelPalette[value] !== undefined
            const selected = selectedValue === value
            return (
              <button
                key={value}
                title={`index ${value} → ${mapped}`}
                onClick={() => handleValueClick(value)}
                onContextMenu={e => { e.preventDefault(); if (remapped) resetValue(value) }}
                disabled={tooMany}
                className="flex flex-col items-center gap-0.5 p-0"
              >
                <div
                  className="w-6 h-6"
                  style={{
                    background: COLOR_TABLE_HEX[mapped],
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

      {selectedValue !== null && (
        <div className="flex flex-col gap-2 border border-[var(--p8-dark-grey)] p-2">
          <span className="text-[var(--p8-light-grey)]">
            index {selectedValue} → {(labelPalette[selectedValue] ?? selectedValue)}
          </span>
          <ColourRow
            label="standard"
            colours={STANDARD_PALETTE}
            startIdx={0}
            current={(labelPalette[selectedValue] ?? selectedValue)}
            onSelect={handleTargetClick}
          />
          <ColourRow
            label="secret"
            colours={SECRET_PALETTE}
            startIdx={16}
            current={(labelPalette[selectedValue] ?? selectedValue)}
            onSelect={handleTargetClick}
          />
        </div>
      )}

      {anyRemapped && !tooMany && (
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

function ColourRow({ label, colours, startIdx, current, onSelect }: {
  label: string
  colours: readonly string[]
  startIdx: number
  current: number
  onSelect: (idx: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[var(--p8-light-grey)]">{label}</span>
      <div className="flex gap-1 flex-wrap">
        {colours.map((hex, i) => {
          const idx = startIdx + i
          return (
            <button
              key={idx}
              title={`${label}[${i}] index ${idx}`}
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

function firstUniqueValues(label: Uint8Array): number[] {
  const seen = new Set<number>()
  const result: number[] = []
  for (const v of label) {
    const masked = v & 0x1f
    if (!seen.has(masked)) {
      seen.add(masked)
      result.push(masked)
    }
  }
  return result
}
