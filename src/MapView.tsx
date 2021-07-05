import React, { FC, useEffect } from 'react';
import { useRef } from 'react';

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

      const id = new ImageData(8,8)
      const spriteCtx = spriteCanvas.getContext("2d");
      const mapCtx = ref.current.getContext("2d")
      let perf =performance.now()
      const sprites  = new ImageDataCache()

      for (let i = 0; i < data.length; i++) {
        const spriteNumber = data[i]
        if(spriteNumber == 0) continue

        const imageData  = sprites.getOrElse(spriteNumber, (spriteNumber:number) => {
          const spritesPerRow = spriteSheet.width / 8
          const x = (spriteNumber % spritesPerRow) * 8;
          const y = Math.floor(spriteNumber / spritesPerRow) * 8;
          return spriteCtx.getImageData(x, y, 8, 8)
        })
        
        
        mapCtx.putImageData(imageData, (i % width) * 8, Math.floor(i / width) * 8)
      }

      console.log("rendering map took", performance.now() - perf)
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

class ImageDataCache {
  private sprites :Array<ImageData> = []
  
  getOrElse(spriteNumber:number, func:(spriteNumber:Number) => ImageData) {
    const existing = this.sprites[spriteNumber]
    if (existing) {
      return existing;
    }
    const calculated = func(spriteNumber)
    this.sprites[spriteNumber] = calculated
    return calculated
  }
}


export default MapView