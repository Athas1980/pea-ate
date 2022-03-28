import { ipcRenderer } from "electron"
import fs from 'fs'
import readline from 'readline'

export class P8FileReader {
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
        ipcRenderer.on("loadP8Reply", (_, data) => {
            console.dir(data);
            spriteCallBack(data.sprites)
            mapCallBack(data.map)
            labelCallBack(data.label)
        })
    }

    read() {
        ipcRenderer.send("loadP8")

    }

}

export async function loadData(path: string) {

  const stream = fs.createReadStream(path)
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  const spritesArr = []
  const mapArr = []
  const labelArr = []
  enum Block { unknown, sprite, map, label }
  let dataType: Block = Block.unknown
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.

    if (dataType == Block.sprite && !line.startsWith("__") && line.length > 0) {
      for (let i = 0; i < line.length; i++) {
        spritesArr.push(parseInt(line[i], 16))
      }
    }

    if (dataType == Block.label && !line.startsWith("__") && line.length > 0) {
      for (let i = 0; i < line.length; i++) {
        labelArr.push(parseInt(line[i], 16))
      }
    }

    if (dataType == Block.map && !line.startsWith("__") && line.length > 0) {
      for (let i = 0; i < line.length; i+=2) {
        mapArr.push(parseInt(line[i]+line[i+1], 16))
      }
    }

    if (line.startsWith("__")) {
      dataType = Block.unknown
    }

    if (line.startsWith("__gfx__")) {
      console.log("reading sprite data")
      dataType = Block.sprite
    }

    if (line.startsWith("__label__")) {
      console.log("reading label data")
      dataType = Block.label
    } 

    if (line.startsWith("__map__")) {
      console.log("reading map data")
      dataType = Block.map
    }
  }

  return {
    sprites: new Uint8Array(spritesArr),
    label : new Uint8Array(labelArr),
    map : new Uint8Array(mapArr)
  }

}