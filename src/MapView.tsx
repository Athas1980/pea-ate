import React, { createRef, FC, RefObject, useEffect } from 'react';
import { Component, useRef } from 'react';
import { ipcRenderer } from 'electron'

type SpriteSheetData = {
  width: number;
  height: number;
  data: Uint8Array;
}

type MapViewProps = {
  spriteSheet: SpriteSheetData;
  width: number;
  height: number;
  zoom: number;
  data: Uint8Array;
  palette: Array<string>;
};

const MapView: FC<MapViewProps> = ({ width, height, zoom, data, spriteSheet, palette }: MapViewProps) => {

  const spriteCanvas = new OffscreenCanvas(spriteSheet.width, spriteSheet.height)
  const ref = useRef<HTMLCanvasElement>(null)
  const style = {
    width: width * zoom * 8,
    height: height * zoom * 8

  }

  useEffect(() => {
    updateSpriteSheet(spriteSheet.data)
    updateMap()
  })

  function updateMap() {
    if (ref && data && spriteCanvas) {

      for (let i = 0; i < data.length; i++) {
        const spriteNumber = data[i]
        if(spriteNumber == 0) continue
        const spriteCtx = spriteCanvas.getContext("2d");
        const spritesPerRow = spriteSheet.width / 8
        const x = (spriteNumber % spritesPerRow) * 8;
        const y = Math.floor(spriteNumber / spritesPerRow) * 8;
        console.log("source x", x, "source y",y)
        const spritePix = spriteCtx.getImageData(x, y, 8, 8)

        const mapCtx = ref.current.getContext("2d")
        mapCtx.putImageData(spritePix, (i % width) * 8, Math.floor(i / width) * 8)
      }
    }
  }



  function updateSpriteSheet(data: Uint8Array) {
    if (spriteCanvas && data) {

      const ctx = spriteCanvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, spriteCanvas.width, spriteCanvas.height);
      const byteData = imageData.data;
      for (var i = 0; i < byteData.length; i += 4) {
        const colour = paletteLookup(data[i / 4]);
        byteData[i] = colour.r; // red
        byteData[i + 1] = colour.g; // green
        byteData[i + 2] = colour.b; // blue
        byteData[i + 3] = colour.a;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }
  function paletteLookup(index: number) {
    const rgbPallete = palette.map(toRgba)
    if (index && rgbPallete[index]) {
      return rgbPallete[index]
    }
    return toRgba("000000")
  }

  return (<canvas ref={ref} height={height*8} width={width*8} style={style} className="pixView"></canvas>)
}

function toRgba(hex: string) {
  return {
    "r": parseInt(hex.substring(0, 2), 16),
    "g": parseInt(hex.substring(2, 4), 16),
    "b": parseInt(hex.substring(4, 6), 16),
    "a": 255
  }
}


export default MapView