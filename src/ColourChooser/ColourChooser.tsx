import * as React from 'react';
export interface ColourChooserProps {
  palette: string[],
  selected: number
  handleSelection: (colourIndex: number) => any
}
export const ColourChooser = (props: ColourChooserProps) => {

  const PaletteItem = (colour: string, index: number) => {
    const style = index == props.selected ? {
      backgroundColor: "#" + colour,
      border: "2px dashed white"
    } : { backgroundColor: "#" + colour }

    return <div className="palletePreview" key={index} style={style} onClick={() => props.handleSelection(index)}>{index}</div>
  }


  const colours = props.palette.map((e, i) => PaletteItem(e, i))

  return <div className="paletteBox" style={{ backgroundColor: 'black' }}>
    {colours}
  </div>
}