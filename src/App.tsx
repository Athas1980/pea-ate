import { useEffect, useRef, useState } from 'react'
import type { Cart, PaletteToolData, TileBrush, MapToolState, Animation, NamedPalette } from './types/cart'
import { STANDARD_PALETTE, SECRET_PALETTE } from './types/cart'
import { parseP8 } from './lib/p8/parse'
import { serialiseP8 } from './lib/p8/export'
import SpritesheetView from './components/SpritesheetView'
import MapView from './components/MapView'
import TilePicker from './components/TilePicker'
import CartOptions from './components/CartOptions'
import LabelView from './components/LabelView'
import LabelPaletteEditor from './components/LabelPaletteEditor'
import AnimationView from './components/AnimationView'
import HelpView from './components/HelpView'
import ProjectPaletteEditor from './components/ProjectPaletteEditor'
import CodeSnippet from './components/CodeSnippet'

type Tab = 'spritesheet' | 'map' | 'label' | 'animation' | 'options'

const IDENTITY_PALETTE = Array.from({ length: 16 }, (_, i) => i)
const DEFAULT_PROJECT_PALETTE = Array.from({ length: 16 }, (_, i) => i)

function makeDefaultPalette(): NamedPalette {
  return { id: 1, name: 'default', drawPalette: [...IDENTITY_PALETTE], transparentColours: [] }
}



interface CartOpts {
  useSharedMap: boolean
  showZeroTile: boolean
}

const DEFAULT_OPTS: CartOpts = { useSharedMap: false, showZeroTile: false }

export default function App() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [filename, setFilename] = useState<string>('cart.p8')
  const [tab, setTab] = useState<Tab>('spritesheet')
  const tabRef = useRef<Tab>('spritesheet')
  const [projectPalette, setProjectPalette] = useState<number[]>(DEFAULT_PROJECT_PALETTE)
  const [namedPalettes, setNamedPalettes] = useState<NamedPalette[]>(() => [makeDefaultPalette()])
  const [activePaletteId, setActivePaletteId] = useState<number>(1)
  const [labelPalette, setLabelPalette] = useState<Record<number, number>>({})
  const [cartOpts, setCartOpts] = useState<CartOpts>(DEFAULT_OPTS)
  const [animations, setAnimations] = useState<Animation[]>([])
  const [mapData, setMapData] = useState<Uint8Array | null>(null)
  const [mapWidth, setMapWidth] = useState<number>(128)
  const [storedMapWidth, setStoredMapWidth] = useState<number>(128)
  const [tileBrush, setTileBrush] = useState<TileBrush>({ tileX: 0, tileY: 0, w: 1, h: 1 })
  const [mapMode, setMapMode] = useState<'view' | 'edit'>('view')
  const [mapTool, setMapTool] = useState<MapToolState>({ tool: 'brush', eraserSize: 1, fillRandom: false })
  const [hoverMapTile, setHoverMapTile] = useState<{ tx: number; ty: number; tileIdx: number } | null>(null)
  const [mapBgSlot, setMapBgSlot] = useState(0)
  const [, setMapHistory] = useState<Uint8Array[]>([])
  tabRef.current = tab
  const [showHelp, setShowHelp] = useState(false)
  const [hoveredProjectSlot, setHoveredProjectSlot] = useState<number | null>(null)

  function handleLoad(loaded: Cart, name: string) {
    setCart(loaded)
    setFilename(name)
    setTab('spritesheet')
    const savedProjectPalette = loaded.paletteToolData?.projectPalette ?? DEFAULT_PROJECT_PALETTE
    setProjectPalette(savedProjectPalette)
    setLabelPalette(loaded.paletteToolData?.labelPalette ?? {})
    const savedPalettes = loaded.paletteToolData?.namedPalettes
    const palettes = savedPalettes && savedPalettes.length > 0 ? savedPalettes : [makeDefaultPalette()]
    setNamedPalettes(palettes)
    const savedActiveId = loaded.paletteToolData?.activePaletteId
    setActivePaletteId(savedActiveId && palettes.find(p => p.id === savedActiveId) ? savedActiveId : palettes[0].id)
    setCartOpts({
      useSharedMap: loaded.paletteToolData?.useSharedMap ?? DEFAULT_OPTS.useSharedMap,
      showZeroTile: loaded.paletteToolData?.showZeroTile ?? DEFAULT_OPTS.showZeroTile,
    })
    setMapData(new Uint8Array(loaded.map))
    const savedWidth = loaded.paletteToolData?.mapWidth ?? 128
    setMapWidth(savedWidth)
    setStoredMapWidth(savedWidth)
    setAnimations(loaded.paletteToolData?.animations ?? [])
    setTileBrush({ tileX: 0, tileY: 0, w: 1, h: 1 })
    setMapMode('view')
    setMapTool({ tool: 'brush', eraserSize: 1, fillRandom: false })
    setHoverMapTile(null)
    setMapHistory([])
  }

  function handleStrokeStart() {
    if (mapData) setMapHistory(h => [...h.slice(-49), mapData])
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === '?') {
        setShowHelp(v => !v)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && tabRef.current === 'map') {
        e.preventDefault()
        setMapHistory(h => {
          if (h.length === 0) return h
          setMapData(h[h.length - 1])
          return h.slice(0, -1)
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleExport() {
    if (!cart) return
    const toolData: PaletteToolData = {
      projectPalette,
      namedPalettes,
      activePaletteId,
      labelPalette,
      useSharedMap: cartOpts.useSharedMap,
      showZeroTile: cartOpts.showZeroTile,
      mapWidth,
      animations,
    }
    const exportCart: Cart = { ...cart, map: mapData ?? cart.map }
    const text = serialiseP8(exportCart, toolData)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = ['spritesheet', 'map', ...(cart?.label ? ['label'] : []), 'animation', 'options'] as Tab[]

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Top bar */}
      <header className="bg-[var(--p8-red)] flex items-stretch shrink-0">
        <div className="flex items-center px-4 py-2 gap-3 bg-black m-1 rounded-sm">
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="#008751"/>
            <text x="16" y="19" textAnchor="middle" dominantBaseline="middle" fill="#FFF1E8" fontFamily="'Press Start 2P', monospace" fontSize="16" fontWeight="normal">8</text>
          </svg>
          <div className="flex flex-col leading-tight text-xs">
            <span>Pea<span className="text-[var(--p8-pink)]">--</span></span>
            <span><span className="text-[var(--p8-pink)]">--</span>Ate</span>
          </div>
        </div>

        {cart ? (
          <>
            <nav className="flex items-stretch flex-1 animate-[fadeIn_0.2s_ease-out]">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setShowHelp(false) }}
                  className={`px-4 py-2 transition-colors ${
                    tab === t && !showHelp
                      ? 'bg-[rgba(0,0,0,0.3)] text-[var(--p8-white)]'
                      : 'text-[var(--p8-white)] hover:bg-[rgba(0,0,0,0.15)]'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-4 px-4 animate-[fadeIn_0.2s_ease-out]">
              <button
                onClick={handleExport}
                className="text-[var(--p8-white)] hover:bg-[rgba(0,0,0,0.15)] px-2 py-1"
              >
                Export .p8
              </button>
              <button
                onClick={() => setCart(null)}
                className="text-[var(--p8-white)] hover:bg-[rgba(0,0,0,0.15)] px-2 py-1"
              >
                Eject
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-3 px-3">
          <a
            href="https://github.com/Athas1980/pea-ate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--p8-white)] hover:bg-[rgba(0,0,0,0.15)] px-2 py-0.5"
          >
            GitHub
          </a>
          <button
            onClick={() => setShowHelp(v => !v)}
            aria-label="Help"
            className={`px-2 py-0.5 border-2 transition-colors ${
              showHelp
                ? 'border-[var(--p8-white)] bg-[rgba(0,0,0,0.3)] text-[var(--p8-white)]'
                : 'border-[var(--p8-white)] text-[var(--p8-white)] hover:bg-[rgba(0,0,0,0.15)]'
            }`}
          >
            ?
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 overflow-auto">
        {showHelp ? (
          <HelpView />
        ) : !cart ? (
          <DropZone onLoad={handleLoad} />
        ) : (
          <>
            {tab === 'spritesheet' && (
              <div className="flex gap-6 items-start max-w-5xl">
                <SpritesheetView
                  gfx={cart.gfx}
                  drawPalette={projectPalette}
                  pixelRows={cartOpts.useSharedMap ? 64 : 128}
                  highlightSlot={hoveredProjectSlot}
                />
                <ProjectPaletteEditor projectPalette={projectPalette} onChange={setProjectPalette} onHoverSlot={setHoveredProjectSlot} />
              </div>
            )}
            {tab === 'map' && (
              <div className="flex gap-6 items-start">
                <MapView
                  gfx={cart.gfx}
                  map={mapData ?? cart.map}
                  drawPalette={projectPalette}
                  tileRows={cartOpts.useSharedMap ? 64 : 32}
                  showZeroTile={cartOpts.showZeroTile}
                  mapWidth={mapWidth}
                  storedMapWidth={storedMapWidth}
                  onMapWidthChange={setMapWidth}
                  mode={mapMode}
                  onModeChange={setMapMode}
                  brush={tileBrush}
                  mapTool={mapTool}
                  onToolChange={patch => setMapTool(prev => ({ ...prev, ...patch }))}
                  onStrokeStart={handleStrokeStart}
                  onMapChange={setMapData}
                  onHoverTile={setHoverMapTile}
                  bgColourSlot={mapBgSlot}
                />
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[12px] text-[var(--p8-white)]">bg colour</h2>
                    <div className="flex flex-wrap" style={{ width: 8 * 20 }}>
                      {projectPalette.map((colourIdx, slot) => {
                        const hex = colourIdx >= 128 ? SECRET_PALETTE[colourIdx - 128] : STANDARD_PALETTE[colourIdx]
                        return (
                          <button
                            key={slot}
                            onClick={() => setMapBgSlot(slot)}
                            className="w-5 h-5"
                            style={{
                              background: hex,
                              outline: slot === mapBgSlot ? '2px solid var(--p8-yellow)' : '2px solid transparent',
                              outlineOffset: '-2px',
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                  {mapMode === 'edit' && (
                    <TilePicker
                      gfx={cart.gfx}
                      drawPalette={projectPalette}
                      brush={tileBrush}
                      onBrushChange={setTileBrush}
                    />
                  )}
                  {mapWidth !== 128 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[var(--p8-light-grey)]">map width</span>
                      <CodeSnippet code={`poke(0x5f57, ${mapWidth})`} onCopy={() => navigator.clipboard.writeText(`poke(0x5f57, ${mapWidth})`)} />
                    </div>
                  )}
                </div>
              </div>
            )}
            {tab === 'animation' && (
              <AnimationView
                key={filename}
                gfx={cart.gfx}
                projectPalette={projectPalette}
                palettes={namedPalettes}
                activePaletteId={activePaletteId}
                onPalettesChange={setNamedPalettes}
                onActivePaletteIdChange={setActivePaletteId}
                animations={animations}
                onAnimationsChange={setAnimations}
              />
            )}
            {tab === 'label' && cart.label && (
              <div className="flex gap-6 items-start max-w-5xl">
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
      </main>

      {/* Footer status bar */}
      <footer className="bg-[var(--p8-red)] px-4 py-1.5 flex items-center gap-6 shrink-0">
        {cart && <span className="text-[var(--p8-white)] opacity-75">{filename}</span>}
        {cart && tab === 'map' && hoverMapTile !== null && (
          <span className="text-[var(--p8-white)] text-xs font-mono">
            {hoverMapTile.tx},{hoverMapTile.ty} · sprite {hoverMapTile.tileIdx}
          </span>
        )}
        <span className="ml-auto text-[var(--p8-lavender)] text-[10px] leading-none">
          v{__APP_VERSION__}{import.meta.env.DEV ? '-dev' : ''}
        </span>
      </footer>

    </div>
  )
}

const SAMPLES: { file: string; label: string; author: string; url?: string }[] = [
  { file: 'adventure-tileset.p8', label: 'Adventure Tileset', author: 'kraizeg', url: 'https://www.lexaloffle.com/bbs/?pid=45481' },
  { file: 'shootinator.p8',       label: 'Shootinator',       author: 'squidlight' },
]

const SUGGEST_URL = 'https://github.com/Athas1980/pea-ate/issues/new?labels=sample-cart&title=Sample+cart+request%3A+%5Bcart+name%5D&body=**Cart+name%3A**+%0A**Author%3A**+%0A**Source+URL%3A**+%0A**License%2Fpermission%3A**+'

function DropZone({ onLoad }: { onLoad: (cart: Cart, filename: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file, onLoad)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file, onLoad)
    e.target.value = ''
  }

  async function loadSample(filename: string) {
    setLoadingFile(filename)
    try {
      const res = await fetch(`/carts/${filename}`)
      const text = await res.text()
      onLoad(parseP8(text), filename)
    } finally {
      setLoadingFile(null)
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center border-2 border-dashed p-16 min-h-full transition-colors ${
        dragging
          ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
          : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)]'
      }`}
    >
      <p className="mb-4">drop a .p8 file here</p>
      <button
        onClick={() => inputRef.current?.click()}
        className="text-[var(--p8-light-grey)] hover:text-[var(--p8-white)] mb-6"
      >
        or click to browse
      </button>
      <div className="flex flex-col items-center gap-2">
        {SAMPLES.map(s => (
          <div key={s.file} className="flex items-center gap-2">
            <button
              onClick={() => loadSample(s.file)}
              disabled={loadingFile !== null}
              className="text-[var(--p8-light-grey)] hover:text-[var(--p8-white)] disabled:text-[var(--p8-lavender)]"
            >
              {loadingFile === s.file ? 'loading...' : s.label}
            </button>
            <span className="text-[var(--p8-lavender)]">by {s.author}</span>
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]"
                title="View source"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 1h6v6M9 1L1 9" />
                </svg>
              </a>
            )}
          </div>
        ))}
        <a
          href={SUGGEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--p8-light-grey)] hover:text-[var(--p8-white)] mt-2"
        >
          + suggest a sample cart
        </a>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".p8"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  )
}

function readFile(file: File, onLoad: (cart: Cart, filename: string) => void) {
  const reader = new FileReader()
  reader.onload = e => {
    const text = e.target?.result
    if (typeof text === 'string') {
      onLoad(parseP8(text), file.name)
    }
  }
  reader.readAsText(file)
}
