import React, { FC } from 'react';
import { PaletteChooser } from "../PaletteChooser/PaletteChooser";


type OverviewProps = {
  palette: string[], availablePalette: string[], handlePaletteChange: (index: number, colour: string) => void
}
export const Overview: FC<OverviewProps> = (props: OverviewProps) => {
  return <div className="info">
    <div className="fileInfo">
      <h1>File Info</h1>
      <div>No file currently loaded using example data.</div>
      <hr></hr>
      <small>Top down tileset by krajeg</small>
      <br />
      <small><a href="https://www.lexaloffle.com/bbs/?pid=45481" target="_blank">https://www.lexaloffle.com/bbs/?pid=45481</a></small>
    </div>
    <PaletteChooser current={props.palette} available={props.availablePalette} handlePaletteChange={props.handlePaletteChange}></PaletteChooser>
  </div>
}