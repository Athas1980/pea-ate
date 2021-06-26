import React, { createRef, FC, RefObject, useEffect } from 'react';
import {Component, useRef} from 'react';

type PixViewProps = {
    // using `interface` is also ok
    width: number;
    height: number;
    zoom: number;
    palette: Array<string>;
    data: Uint8Array;
    
  };
  type MyState = {
    picData: Uint8Array;
  };

  const PixView : FC<PixViewProps> = ({width, height, zoom, data, palette} :PixViewProps) =>  {

    const ref = useRef<HTMLCanvasElement>(null)
    const style = {
      width: width*zoom,
      height: height*zoom

  }

    useEffect( () => {
      if (ref.current) {
        console.log("setting pixel data")
        
        const ctx = ref.current.getContext("2d")
        const imageData = ctx.getImageData(0,0,ref.current.width, ref.current.height)
        const byteData = imageData.data;
        for (var i = 0; i < byteData.length; i += 4) {
            
            const colour = paletteLookup(data[i/4])
            console.log(i)
            byteData[i]     = colour.r   // red
            byteData[i + 1] = colour.g // green
            byteData[i + 2] = colour.b; // blue
            byteData[i + 3] = colour.a
        }
        console.log(imageData)
        ctx.putImageData(imageData, 0,0);
      } 
    })

    function paletteLookup(index:number) {
      const rgbPallete = palette.map(toRgba)
      if (index && rgbPallete[index]) {
        return rgbPallete[index]
      }
      return toRgba("000000")
    }

    return (<canvas ref={ref} height={height} width={width} style={style}></canvas>)
  }

  function toRgba(hex:string) {
    return {
      "r": parseInt(hex.substring(0,2), 16),
      "g": parseInt(hex.substring(2,4), 16),
      "b": parseInt(hex.substring(4,6), 16),
      "a": 255
    }
  }

  export default PixView