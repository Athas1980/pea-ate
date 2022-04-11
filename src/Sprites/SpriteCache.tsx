import { Component } from "react";

interface SpriteSheetData {
  width: number;
  height: number;
  data: Uint8Array;
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
