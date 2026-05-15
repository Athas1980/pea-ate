interface Options {
  useSharedMap: boolean
  showZeroTile: boolean
}

interface Props {
  options: Options
  onChange: (options: Options) => void
}

export default function CartOptions({ options, onChange }: Props) {
  function toggle(key: keyof Options) {
    onChange({ ...options, [key]: !options[key] })
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <Section title="map">
        <Toggle
          label="full map (128×64)"
          description="the bottom 32 rows of the map share memory with the bottom half of the sprite sheet. enable this if the cart uses that region for map tiles rather than sprites."
          checked={options.useSharedMap}
          onChange={() => toggle('useSharedMap')}
        />
        <Toggle
          label="render tile 0"
          description="tile index 0 is conventionally transparent in pico-8. disable to skip rendering it, which makes empty areas appear black."
          checked={options.showZeroTile}
          onChange={() => toggle('showZeroTile')}
        />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[var(--p8-yellow)]">{title}</span>
      {children}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex flex-col gap-2 cursor-pointer">
      <div className="flex items-center gap-3">
        <div
          onClick={onChange}
          className="w-8 h-4 flex items-center px-0.5 cursor-pointer"
          style={{
            background: checked ? 'var(--p8-green)' : 'var(--p8-dark-grey)',
          }}
        >
          <div
            className="w-3 h-3 bg-[var(--p8-white)] transition-transform"
            style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
          />
        </div>
        <span className="text-[var(--p8-white)]">{label}</span>
      </div>
      <p className="text-[var(--p8-light-grey)] leading-relaxed">{description}</p>
    </label>
  )
}
