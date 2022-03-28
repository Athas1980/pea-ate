import * as React from 'react';
import { useEffect, useState } from 'react';
import ZoomablePixView from './PixView';
import MapView from './MapView';
import { hot } from 'react-hot-loader';
import { default_pallete_hex, full_pallete_hex } from './Palettes';
import logo from './resources/pea.png';
import { P8FileReader } from './FileReader/FileReader';
import { Overview } from './Overview/Overview';
enum View {
  Overview,
  SpriteEditor,
  Label,
  Map
}

const App = () => {
  const [initialized, setInitialized] = useState(false)

  const [palette, setPalette] = React.useState(default_pallete_hex)
  const [spriteSheet, setSpriteSheet] = React.useState(new Uint8Array())
  const [mapData, setMapData] = React.useState(new Uint8Array)
  const [view, setView] = React.useState(View.Overview)
  const [labelData, setLabelData] = React.useState(new Uint8Array())

  useEffect(() => {
    if (!initialized) {
      new P8FileReader(null, spiteCallBack, labelCallBack, mapCallBack).read()
      setInitialized(true)
    }
  })

  function handlePaletteChange(index: number, colour: string) {
    const newPal = palette.slice()
    newPal[index] = colour
    setPalette(newPal)
  }


  function spiteCallBack(data: Uint8Array) {
    setSpriteSheet(data)
  }
  
  function mapCallBack(data: Uint8Array) {
    setMapData(data)
  }

  function labelCallBack(data:Uint8Array) {
    setLabelData(data)
  }


  const spriteSheetData = {
    width: 128,
    height: 128,
    data: spriteSheet
  }

  return (
    <div>
      <div className="toolbar"><img src={logo}></img><button>Map</button></div>
      <Overview palette={palette} availablePalette={full_pallete_hex} handlePaletteChange={handlePaletteChange}></Overview>
      <h1>Sprite Sheet</h1> 
      <ZoomablePixView width={128} height={128} palette={palette} data={spriteSheet}></ZoomablePixView>

      <h1>label</h1>
      <ZoomablePixView width={128} height={128} palette={palette} data={labelData}></ZoomablePixView>
      <h1>Map</h1>
      <MapView width={128} zoom={1} height={64} palette={palette} data={mapData} spriteSheet={spriteSheetData}></MapView>
    </div>
  )
}





export default hot(module)(App);
