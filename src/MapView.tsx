import React, { FC, useEffect } from 'react';
import { useRef } from 'react';

type SpriteSheetData = {
  width: number;
  height: number;
  spriteCache: Array<ImageData>;
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

  const ref = useRef<HTMLCanvasElement>(null)
  const style = {
    width: width * zoom * 8,
    height: height * zoom * 8

  }

  useEffect(() => {
    updateMap()
  })

  function updateMap() {
    if (ref && data) {

      const mapCtx = ref.current.getContext("2d")
      let perf =performance.now()

      for (let i = 0; i < data.length; i++) {
        const spriteNumber = data[i]
        if(spriteNumber == 0 ) continue

        const imageData  = spriteSheet.spriteCache[spriteNumber]
        if (!imageData) continue
        
        mapCtx.putImageData(imageData, (i % width) * 8, Math.floor(i / width) * 8)
      }

      console.log("rendering map took", performance.now() - perf)
    }
  }

  return (<canvas ref={ref} height={height*8} width={width*8} style={style} className="pixView"></canvas>)
}


export default MapView