import * as React from 'react';
import {useEffect, useState} from 'react';
import ZoomablePixView from './PixView';
import { hot } from 'react-hot-loader';
import { default_pallete_hex } from './Palettes';
import { ipcRenderer } from 'electron';

const App = () => {
  const [initialized, setInitialized] = useState(false)

  const [palette, setPalette]  = React.useState(default_pallete_hex)
  const [spriteSheet, setSpriteSheet] = React.useState(new Uint8Array())

  useEffect(() => {
    if (!initialized) {
      new P8FileReader(null, spiteCallBack).read()
      setInitialized(true)
    }
  })


  function spiteCallBack(data: Uint8Array) {
    console.log("recieved data", data)
    setSpriteSheet(data)
  }
  
  return (
    <div>
        <div>No file currently loaded using example data.</div>
        <div>
          <div>Current Palette</div>
          <div id="paletteBox">
            <div className="palletePreview palette0">0</div>
            <div className="palletePreview palette1">1</div>
            <div className="palletePreview palette2">2</div>
            <div className="palletePreview palette3">3</div>
            <div className="palletePreview palette4">4</div>
            <div className="palletePreview palette5">5</div>
            <div className="palletePreview palette6">6</div>
            <div className="palletePreview palette7">7</div>
            <div className="palletePreview palette8">8</div>
            <div className="palletePreview palette9">9</div>
            <div className="palletePreview palette10">10</div>
            <div className="palletePreview palette11">11</div>
            <div className="palletePreview palette12">12</div>
            <div className="palletePreview palette13">13</div>
            <div className="palletePreview palette14">14</div>
            <div className="palletePreview palette15">15</div>
          </div>
        </div>
        <ZoomablePixView width={128} height={128} palette={palette} data={spriteSheet}></ZoomablePixView>
    </div>
  )}

  class P8FileReader{
    private fileName:string
    private spriteCallBack:(data:Uint8Array) => void

    constructor(fileName:string, spriteCallBack:(data:Uint8Array) => void) {
      this.fileName = fileName
      this.spriteCallBack = spriteCallBack
      ipcRenderer.on("loadP8Reply", (e, data) => { console.log(data); spriteCallBack(data.sprites)})
    }

    read() {
      ipcRenderer.send("loadP8")

    }

  }


export default hot(module)(App);
