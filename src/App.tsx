import { useState } from 'react'
import type { Cart, PaletteToolData } from './types/cart'
import { parseP8 } from './lib/p8/parse'
import { serialiseP8 } from './lib/p8/export'
import { decodePngCart } from './lib/p8/stego'
import SpritesheetView from './components/SpritesheetView'
import MapView from './components/MapView'
import PaletteEditor from './components/PaletteEditor'
import CartOptions from './components/CartOptions'
import LabelView from './components/LabelView'
import LabelPaletteEditor from './components/LabelPaletteEditor'

type Tab = 'spritesheet' | 'map' | 'label' | 'options'

const IDENTITY_PALETTE = Array.from({ length: 16 }, (_, i) => i)

interface CartOpts {
  useSharedMap: boolean
  showZeroTile: boolean
}

const DEFAULT_OPTS: CartOpts = { useSharedMap: true, showZeroTile: false }

export default function App() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [filename, setFilename] = useState<string>('cart.p8')
  const [tab, setTab] = useState<Tab>('spritesheet')
  const [drawPalette, setDrawPalette] = useState<number[]>(IDENTITY_PALETTE)
  const [labelPalette, setLabelPalette] = useState<Record<number, number>>({})
  const [cartOpts, setCartOpts] = useState<CartOpts>(DEFAULT_OPTS)

  function handleLoad(loaded: Cart, name: string) {
    setCart(loaded)
    setFilename(name)
    setDrawPalette(loaded.paletteToolData?.drawPalette ?? IDENTITY_PALETTE)
    setLabelPalette(loaded.paletteToolData?.labelPalette ?? {})
    setCartOpts({
      useSharedMap: loaded.paletteToolData?.useSharedMap ?? true,
      showZeroTile: loaded.paletteToolData?.showZeroTile ?? false,
    })
  }

  function handleExport() {
    if (!cart) return
    const toolData: PaletteToolData = {
      drawPalette,
      labelPalette,
      useSharedMap: cartOpts.useSharedMap,
      showZeroTile: cartOpts.showZeroTile,
    }
    const text = serialiseP8(cart, toolData)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-[var(--p8-yellow)] text-xs mb-1">pea-ate</h1>
        <p className="text-[var(--p8-light-grey)]">pico-8 palette tool</p>
      </header>

      {!cart ? (
        <DropZone onLoad={handleLoad} />
      ) : (
        <>
          <nav className="flex gap-2 mb-4 items-center">
            {(['spritesheet', 'map', ...(cart.label ? ['label'] : []), 'options'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-[8px] ${
                  tab === t
                    ? 'bg-[var(--p8-dark-blue)] text-[var(--p8-white)]'
                    : 'text-[var(--p8-light-grey)]'
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={handleExport}
              className="ml-auto text-[var(--p8-green)] hover:text-[var(--p8-white)]"
            >
              export .p8
            </button>
            <button
              onClick={() => setCart(null)}
              className="ml-4 text-[var(--p8-light-grey)]"
            >
              eject
            </button>
          </nav>

          {tab === 'spritesheet' && (
            <div className="flex gap-6 items-start">
              <SpritesheetView
                gfx={cart.gfx}
                drawPalette={drawPalette}
                pixelRows={cartOpts.useSharedMap ? 64 : 128}
              />
              <PaletteEditor drawPalette={drawPalette} onChange={setDrawPalette} />
            </div>
          )}
          {tab === 'map' && (
            <div className="flex gap-6 items-start">
              <MapView
                gfx={cart.gfx}
                map={cart.map}
                drawPalette={drawPalette}
                tileRows={cartOpts.useSharedMap ? 64 : 32}
                showZeroTile={cartOpts.showZeroTile}
              />
              <PaletteEditor drawPalette={drawPalette} onChange={setDrawPalette} />
            </div>
          )}
          {tab === 'label' && cart.label && (
            <div className="flex gap-6 items-start">
              <LabelView label={cart.label} labelPalette={labelPalette} />
              <LabelPaletteEditor
                label={cart.label}
                labelPalette={labelPalette}
                onChange={setLabelPalette}
              />
            </div>
          )}
          {tab === 'options' && (
            <CartOptions options={cartOpts} onChange={setCartOpts} />
          )}
        </>
      )}
    </div>
  )
}

function DropZone({ onLoad }: { onLoad: (cart: Cart, filename: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file, onLoad)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file, onLoad)
  }

  async function loadSample(e: React.MouseEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/carts/adventure-tileset.p8')
      const text = await res.text()
      onLoad(parseP8(text), 'adventure-tileset.p8')
    } finally {
      setLoading(false)
    }
  }

  return (
    <label
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center border-2 border-dashed p-16 cursor-pointer transition-colors ${
        dragging
          ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
          : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)]'
      }`}
    >
      <p className="mb-4">drop a .p8 file here</p>
      <p className="text-[var(--p8-light-grey)] mb-6">or click to browse</p>
      <button
        onClick={loadSample}
        disabled={loading}
        className="text-[var(--p8-blue)] hover:text-[var(--p8-white)] disabled:text-[var(--p8-dark-grey)]"
      >
        {loading ? 'loading...' : 'load sample cart'}
      </button>
      <input
        type="file"
        accept=".p8,.png"
        className="hidden"
        onChange={handleFileInput}
      />
    </label>
  )
}

function readFile(file: File, onLoad: (cart: Cart, filename: string) => void) {
  if (file.name.endsWith('.p8.png')) {
    decodePngCart(file).then(cart => onLoad(cart, file.name))
    return
  }
  const reader = new FileReader()
  reader.onload = e => {
    const text = e.target?.result
    if (typeof text === 'string') {
      onLoad(parseP8(text), file.name)
    }
  }
  reader.readAsText(file)
}
