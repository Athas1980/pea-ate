import * as React from 'react';
import PixView from './PixView';
import {Component, createRef, useRef} from 'react';
// import PixView from './PixView';
import { hot } from 'react-hot-loader';
import { default_pallete_hex } from './Palettes';
import fs from 'fs'

const App = () => {

  const fs = require('fs')

  const [palette, setPalette]  = React.useState(default_pallete_hex)
  const [spriteSheet, setSpriteSheet] = React.useState(new Uint8Array())
  function spiteCallBack(data: Uint8Array) {
    setSpriteSheet(data)
  }
  new P8FileReader("carts/demo.p8", spiteCallBack).read(){

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
        <PixView width={2} height={2} zoom={16} palette={palette} data={spriteSheet}></PixView>
    </div>
  )}

  class P8FileReader{
    private fileName:string
    private spriteCallBack:(data:Uint8Array) => void
    constructor(fileName:string, spriteCallBack:(data:Uint8Array) => void) {
      this.fileName = fileName
      this.spriteCallBack = spriteCallBack
    }

    read() {
      fs.createReadStream(this.fileName)
    }

  }


export default hot(module)(App);
