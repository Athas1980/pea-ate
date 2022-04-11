import * as React from 'react';
import { useEffect, useState } from 'react';
import ZoomablePixView from './PixView';
import { SpriteEditor } from "./SpriteEditor/SpriteEditor"
import MapView from './MapView';
import { hot } from 'react-hot-loader';
import { default_pallete_hex, full_pallete_hex } from './Palettes';
import logo from './resources/pea.png';
import { P8FileReader } from './FileReader/FileReader';
import { Overview } from './Overview/Overview';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
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

  function labelCallBack(data: Uint8Array) {
    setLabelData(data)
  }


  const spriteSheetData = {
    width: 128,
    height: 128,
    data: spriteSheet,
    palette: palette
  }


  return (
    <Router>
      <div>
        <div className="toolbar"><img src={logo}></img>
          <Link to="/sprites-sheet">sprite sheet</Link>
          <Link to="/map">map</Link>
          <Link to="/label">Label</Link>
          <Link to="/">Overview</Link>
        </div>
        <Routes>
          <Route path='/' element={
            <Overview palette={palette} availablePalette={full_pallete_hex} handlePaletteChange={handlePaletteChange}></Overview>
          }>
          </Route>

          <Route path="/sprites-sheet" element={
            <SpriteEditor spriteSheet={spriteSheetData}></SpriteEditor>
          }>
          </Route>
          <Route path="/label" element={
            <ZoomablePixView width={128} height={128} palette={palette} data={labelData}></ZoomablePixView>
          }>
          </Route>
          <Route path="map" element={
            <MapView width={128} zoom={1} height={64} palette={palette} data={mapData} spriteSheet={spriteSheetData}></MapView>
          }>
          </Route>
        </Routes>
      </div>
    </Router>
  )
}





export default hot(module)(App);
