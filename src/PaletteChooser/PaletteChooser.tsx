import * as React from 'react';
import { useState } from 'react';
export const PaletteChooser = (props: { current: Array<string>, available: Array<string>, handlePaletteChange: (index: number, colour: string) => void }) => {

  const [selectedIndex, setSelectedIndex] = useState(null)

  const PaletteItem = (colour: string, index: number) => {
    const style = {
      backgroundColor: "#" + colour
    }
    return <div className="palletePreview" key={index} style={style} onClick={() => setSelectedIndex(index)}>{index}</div>
  }

  const colourSelected = (index: number, colour: string) => {
    props.handlePaletteChange(index, colour)
    setSelectedIndex(null)
  }

  const ChooserItem = (colour: string, srcIdx: number, idx:number) => {
    const style = {
      backgroundColor: "#" + colour
    }
    return <div className="palletePreview" key={idx} style={style} onClick={() => colourSelected(srcIdx, colour)}>{idx}</div>
  }


  const colours = props.current.map((e, i) => PaletteItem(e, i))
  const available = props.available.map((e, i) => ChooserItem(e, selectedIndex, i))
  let chooserBoxStyle: any = { backgroundColour: "#222222" }
  if (selectedIndex) {
    chooserBoxStyle = {
      visibility: "visible",
      height: "16rem"
    }
  }

  return <div className="palleteBoxWrapper" key={selectedIndex}>
    <h1>Current Palette {selectedIndex}</h1>
    <div className="paletteBox">
      {colours}
    </div>
    <div className="chooserBoxWrapper">
      <div className="chooserBox" style={chooserBoxStyle}>
        {available}
      </div>
    </div>
  </div>
}