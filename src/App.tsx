import * as React from 'react';
import { useEffect, useState } from 'react';
import ZoomablePixView from './PixView';
import MapView from './MapView';
import { hot } from 'react-hot-loader';
import { default_pallete_hex, full_pallete_hex } from './Palettes';
import { ipcRenderer } from 'electron';
import logo from './resources/pea.png';

enum View {
  Overview,
  SpriteEditor,
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
      <div className="info">
        <div className="fileInfo">
          <h1>File Info</h1>
          <div>No file currently loaded using example data.</div>
          <hr></hr>
          <small>Top down tileset by krajeg</small>
          <br />
          <small><a href="https://www.lexaloffle.com/bbs/?pid=45481" target="_blank">https://www.lexaloffle.com/bbs/?pid=45481</a></small>
        </div>
        <PaletteChooser current={palette} available={full_pallete_hex} handlePaletteChange={handlePaletteChange}></PaletteChooser>
      </div>
      <h1>Sprite Sheet</h1> 
      <ZoomablePixView width={128} height={128} palette={palette} data={spriteSheet}></ZoomablePixView>

      <h1>label</h1>
      <ZoomablePixView width={128} height={128} palette={palette} data={labelData}></ZoomablePixView>
      <h1>Map</h1>
      <MapView width={128} zoom={1} height={64} palette={palette} data={mapData} spriteSheet={spriteSheetData}></MapView>
    </div>
  )
}

const PaletteChooser = (props: { current: Array<string>, available: Array<string>, handlePaletteChange: (index: number, colour: string) => void }) => {

  const [selectedIndex, setSelectedIndex] = useState(null)

  const PaletteItem = (colour: string, index: number) => {
    const style = {
      backgroundColor: "#" + colour
    }
    return <div className="palletePreview" style={style} onClick={() => setSelectedIndex(index)}>{index}</div>
  }

  const colourSelected = (index: number, colour: string) => {
    props.handlePaletteChange(index, colour)
    setSelectedIndex(null)
  }

  const ChooserItem = (colour: string, index: number) => {
    const style = {
      backgroundColor: "#" + colour
    }
    return <div className="palletePreview" style={style} onClick={() => colourSelected(index, colour)}></div>
  }


  const colours = props.current.map((e, i) => PaletteItem(e, i))
  const available = props.available.map((e) => ChooserItem(e, selectedIndex))
  let chooserBoxStyle: any = { backgroundColour: "#222222" }
  if (selectedIndex) {
    chooserBoxStyle = {
      visibility: "visible",
      height: "16rem"
    }
  }

  return <div className="palleteBoxWrapper">
    <h1>Current Palette {selectedIndex}</h1>
    <div className="paletteBox">
      {colours}
    </div>
    <div className="chooserBoxWrapper">
      <div className="chooserBox" style={chooserBoxStyle}>
        {available}
      </div>
    </div>
  </div>
}

class P8FileReader {
  private fileName: string
  private spriteCallBack: (data: Uint8Array) => void

  constructor(
    fileName: string,
    spriteCallBack: (data: Uint8Array) => void,
    labelCallBack: (data: Uint8Array) => void,
    mapCallBack: (data: Uint8Array) => void,
    ) {
    this.fileName = fileName
    this.spriteCallBack = spriteCallBack
    ipcRenderer.on("loadP8Reply", (e, data) => { console.dir(data); 
      spriteCallBack(data.sprites)
      mapCallBack(data.map)
      labelCallBack(data.label)
    })
  }

  read() {
    ipcRenderer.send("loadP8")

  }

}


export default hot(module)(App);
