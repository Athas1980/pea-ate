import React, { Component, FC, useEffect } from "react";

interface SpriteSheetData {
  width: number;
  height: number;
  data: Uint8Array;
}

interface SpriteCacheData {
  spriteSheetData: SpriteSheetData
  defaultPalette: Array<string> 
}

export class Sprites {
  
  private sprites: Array<ImageData> = [];

  getOrElse(spriteNumber: number, func: (spriteNumber: Number) => ImageData) {
    const existing = this.sprites[spriteNumber];
    if (existing) {
      return existing;
    }
    const calculated = func(spriteNumber);
    this.sprites[spriteNumber] = calculated;
    return calculated;
  }
}

export const SpriteCache : FC<SpriteCacheData> = 
({defaultPalette, spriteSheetData}) =>{
  const spriteCanvas = new OffscreenCanvas(spriteSheetData.width, spriteSheetData.height)
  useEffect(
    () => updateSpriteSheet(spriteSheetData.data)
  )
  function updateSpriteSheet(data: Uint8Array) {
    if (spriteCanvas && data) {

      const ctx = spriteCanvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, spriteCanvas.width, spriteCanvas.height);
      const byteData = imageData.data;
      for (let i = 0; i < byteData.length; i += 4) {
        const colour = paletteLookup(data[i / 4]);
        byteData[i] = colour.r; // red
        byteData[i + 1] = colour.g; // green
        byteData[i + 2] = colour.b; // blue
        byteData[i + 3] = colour.a;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    function paletteLookup(index: number) {
      const rgbPallete = defaultPalette.map(toRgba)
      if (index && rgbPallete[index]) {
        return rgbPallete[index]
      }
      return toRgba("000000")
    }


  }
  return <span></span>
}

function toRgba(hex: string) {
  return {
    "r": parseInt(hex.substring(0, 2), 16),
    "g": parseInt(hex.substring(2, 4), 16),
    "b": parseInt(hex.substring(4, 6), 16),
    "a": 255
  }
}
