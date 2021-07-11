import React from "react";
import { Component } from "react";
import extractBlock from "./arrayBlock/extractBlock";


const rows = 16
const cols = 16
const w = 8
const h = 8

function toRgba(hex: string) {
    return {
      "r": parseInt(hex.substring(0, 2), 16),
      "g": parseInt(hex.substring(2, 4), 16),
      "b": parseInt(hex.substring(4, 6), 16),
      "a": 255
    }
  }

type rgb = {
    r:number,
    b:number,
    g:number,
    a:number
}

type rgbArray = Array<rgb>

type MapCacherProps = {
    palette: Array<string>
    data: Uint8Array
    spriteCacheSetter: (d:Array<ImageData>) => void
}


class MapCacher extends Component<MapCacherProps> {

    private oldPalette:Array<String> =[]
    private oldData:Uint8Array = new Uint8Array()

    constructor(props: MapCacherProps) {
        super(props)
    }

    spriteData(spriteNumber:number, rgbPallete:rgbArray):ImageData {
        const startx = (spriteNumber % cols) * w
        const starty = Math.floor(spriteNumber/cols)*h

        const id = new ImageData(w, h)
        const byteData = id.data;

        //Indexed
        let indexedPix =extractBlock(startx,starty, w, h, this.props.data, 128)

        for (let i=0; i< w*h; i++) {
            let idx = indexedPix[i]
            let rgb = rgbPallete[idx]
            let destIdx= i*4 
            byteData[destIdx] = rgb.r
            byteData[destIdx +1] = rgb.g
            byteData[destIdx +2] = rgb.b
            byteData[destIdx +3] = rgb.a
        }

        return id
    }

    componentWillReceiveProps(newProps:MapCacherProps){
        let perf =performance.now()
        const rgbPallete = newProps.palette.map(toRgba)
        const updatedSpriteCache= new Array(rows*cols)
        if (isEqualArr(newProps.palette, this.oldPalette) && isEqualArr(newProps.data, this.oldData)){
            console.log("Sprites and pallete unchanged doing nothing")
            return null as HTMLSpanElement
        }
        this.oldPalette = newProps.palette
        this.oldData = newProps.data
        for (let r=0; r<rows; r++) {
            for (let c=0; c<cols; c++){
                let spriteNumber = c+r*16
                console.log("sprite number", spriteNumber, r, c)
                updatedSpriteCache[spriteNumber] = this.spriteData(spriteNumber, rgbPallete)
            }
        }
        newProps.spriteCacheSetter(updatedSpriteCache)
        console.log("Rendering sprite cache took", performance.now() - perf)
    }

    render() {

        return null as HTMLSpanElement
    }


}

function isEqualArr<T>(a:Array<T>|Uint8Array, b:Array<T>|Uint8Array):boolean{
    if (a == null && b == null) return true
    if (a == null || b == null) return false
    if (a.length !== b.length) return false
    for (let i=0; i< a.length; i++) {
        if(a[i] !== b[i]) return false;
    }
    return true
}

export default MapCacher