import { useEffect, useMemo, useRef, useState } from 'react'
import type { Cart, PaletteToolData, TileBrush, MapToolState, Animation } from './types/cart'
import { parseP8 } from './lib/p8/parse'
import { serialiseP8 } from './lib/p8/export'
import { decodePngCart } from './lib/p8/stego'
import SpritesheetView from './components/SpritesheetView'
import MapView from './components/MapView'
import TilePicker from './components/TilePicker'
import PaletteEditor from './components/PaletteEditor'
import CartOptions from './components/CartOptions'
import LabelView from './components/LabelView'
import LabelPaletteEditor from './components/LabelPaletteEditor'
import AnimationView from './components/AnimationView'
import HelpView from './components/HelpView'
import ProjectPaletteEditor from './components/ProjectPaletteEditor'
import CodeSnippet from './components/CodeSnippet'

type Tab = 'spritesheet' | 'map' | 'label' | 'animation' | 'options'

interface NamedPalette { name: string; drawPalette: number[]; transparentColours: number[] }

const IDENTITY_PALETTE = Array.from({ length: 16 }, (_, i) => i)
const DEFAULT_PROJECT_PALETTE = Array.from({ length: 16 }, (_, i) => i)

function migrateSlotPalette(pal: number[], projectPalette: number[]): number[] {
  return pal.map((v, i) => {
    if (v < 16) return v
    const slot = projectPalette.indexOf(v)
    return slot >= 0 ? slot : i
  })
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
  const [projectPalette, setProjectPalette] = useState<number[]>(DEFAULT_PROJECT_PALETTE)
  const [drawPalette, setDrawPalette] = useState<number[]>(IDENTITY_PALETTE)
  const [labelPalette, setLabelPalette] = useState<Record<number, number>>({})
  const [cartOpts, setCartOpts] = useState<CartOpts>(DEFAULT_OPTS)
  const [namedPalettes, setNamedPalettes] = useState<NamedPalette[]>([])
  const [transparentColours, setTransparentColours] = useState<number[]>([])
  const [animations, setAnimations] = useState<Animation[]>([])
  const [mapData, setMapData] = useState<Uint8Array | null>(null)
  const [mapWidth, setMapWidth] = useState<number>(128)
  const [storedMapWidth, setStoredMapWidth] = useState<number>(128)
  const [tileBrush, setTileBrush] = useState<TileBrush>({ tileX: 0, tileY: 0, w: 1, h: 1 })
  const [mapMode, setMapMode] = useState<'view' | 'edit'>('view')
  const [mapTool, setMapTool] = useState<MapToolState>({ tool: 'brush', eraserSize: 1, fillRandom: false })
  const [hoverMapTile, setHoverMapTile] = useState<{ tx: number; ty: number; tileIdx: number } | null>(null)
  const [, setMapHistory] = useState<Uint8Array[]>([])
  const [showHelp, setShowHelp] = useState(false)

  function handleLoad(loaded: Cart, name: string) {
    setCart(loaded)
    setFilename(name)
    setTab('spritesheet')
    const savedProjectPalette = loaded.paletteToolData?.projectPalette ?? DEFAULT_PROJECT_PALETTE
    setProjectPalette(savedProjectPalette)
    setDrawPalette(migrateSlotPalette(loaded.paletteToolData?.drawPalette ?? IDENTITY_PALETTE, savedProjectPalette))
    setLabelPalette(loaded.paletteToolData?.labelPalette ?? {})
    setNamedPalettes(
      (loaded.paletteToolData?.namedPalettes ?? []).map(p => ({
        ...p,
        drawPalette: migrateSlotPalette(p.drawPalette, savedProjectPalette),
        transparentColours: p.transparentColours ?? [],
      }))
    )
    setTransparentColours(loaded.paletteToolData?.transparentColours ?? [])
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
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

  function applyNamedPalette(i: number) {
    setDrawPalette([...namedPalettes[i].drawPalette])
    setTransparentColours([...namedPalettes[i].transparentColours])
  }

  function handleExport() {
    if (!cart) return
    const toolData: PaletteToolData = {
      projectPalette,
      drawPalette,
      labelPalette,
      useSharedMap: cartOpts.useSharedMap,
      showZeroTile: cartOpts.showZeroTile,
      namedPalettes,
      transparentColours,
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

  const resolvedPalette = useMemo(
    () => drawPalette.map(slot => projectPalette[slot]),
    [drawPalette, projectPalette]
  )

  const tabs = ['spritesheet', 'map', ...(cart?.label ? ['label'] : []), 'animation', 'options'] as Tab[]

  const paletteEditorProps = {
    drawPalette,
    onChange: setDrawPalette,
    projectPalette,
    namedPalettes,
    onSavePalette: (name: string) => setNamedPalettes(prev => [...prev, { name, drawPalette: [...drawPalette], transparentColours: [...transparentColours] }]),
    onDeletePalette: (i: number) => setNamedPalettes(prev => prev.filter((_, j) => j !== i)),
    onApplyPalette: applyNamedPalette,
    transparentColours,
    onTransparencyChange: setTransparentColours,
  }

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
              <div className="flex gap-6 items-start">
                <SpritesheetView
                  gfx={cart.gfx}
                  drawPalette={projectPalette}
                  pixelRows={cartOpts.useSharedMap ? 64 : 128}
                />
                <ProjectPaletteEditor projectPalette={projectPalette} onChange={setProjectPalette} />
              </div>
            )}
            {tab === 'map' && (
              <div className="flex gap-6 items-start">
                <MapView
                  gfx={cart.gfx}
                  map={mapData ?? cart.map}
                  drawPalette={resolvedPalette}
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
                />
                <div className="flex flex-col gap-4">
                  {mapMode === 'edit' && (
                    <TilePicker
                      gfx={cart.gfx}
                      drawPalette={resolvedPalette}
                      brush={tileBrush}
                      onBrushChange={setTileBrush}
                    />
                  )}
                  <PaletteEditor {...paletteEditorProps} />
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
                drawPalette={drawPalette}
                onDrawPaletteChange={setDrawPalette}
                transparentColours={transparentColours}
                onTransparencyChange={setTransparentColours}
                namedPalettes={namedPalettes}
                onSaveNamedPalette={name => setNamedPalettes(prev => [...prev, { name, drawPalette: [...drawPalette], transparentColours: [...transparentColours] }])}
                onDeleteNamedPalette={i => setNamedPalettes(prev => prev.filter((_, j) => j !== i))}
                onDuplicateNamedPalette={i => setNamedPalettes(prev => {
                  const copy = { ...prev[i], name: prev[i].name + ' copy', drawPalette: [...prev[i].drawPalette], transparentColours: [...prev[i].transparentColours] }
                  return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)]
                })}
                onApplyNamedPalette={applyNamedPalette}
                animations={animations}
                onAnimationsChange={setAnimations}
              />
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
      </main>

      {/* Footer status bar */}
      {cart && (
        <footer className="bg-[var(--p8-red)] px-4 py-1.5 flex items-center gap-6 shrink-0">
          <span className="text-[var(--p8-white)] opacity-75">{filename}</span>
          {tab === 'map' && hoverMapTile !== null && (
            <span className="text-[var(--p8-white)] text-xs font-mono">
              {hoverMapTile.tx},{hoverMapTile.ty} · sprite {hoverMapTile.tileIdx}
            </span>
          )}
        </footer>
      )}

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
      className={`flex flex-col items-center justify-center border-2 border-dashed p-16 transition-colors ${
        dragging
          ? 'border-[var(--p8-yellow)] text-[var(--p8-yellow)]'
          : 'border-[var(--p8-dark-grey)] text-[var(--p8-light-grey)]'
      }`}
    >
      <p className="mb-4">drop a .p8 or .p8.png file here</p>
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
              className="text-[var(--p8-blue)] hover:text-[var(--p8-white)] disabled:text-[var(--p8-dark-grey)]"
            >
              {loadingFile === s.file ? 'loading...' : s.label}
            </button>
            <span className="text-[var(--p8-dark-grey)]">by {s.author}</span>
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-white)]"
                title="View source"
              >↗</a>
            )}
          </div>
        ))}
        <a
          href={SUGGEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--p8-dark-grey)] hover:text-[var(--p8-white)] mt-2"
        >
          + suggest a sample cart
        </a>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".p8,.png"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
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
