import React, { createRef, FC, RefObject, useEffect } from 'react';
import { Component, useRef } from 'react';
import { ipcRenderer } from 'electron'

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

const PixView: FC<PixViewProps> = ({ width, height, zoom, data, palette }: PixViewProps) => {

  const ref = useRef<HTMLCanvasElement>(null)
  const style = {
    width: width * zoom,
    height: height * zoom

  }
  
  useEffect(() => {
    if (ref.current && data) {

      const ctx = ref.current.getContext("2d")
      const imageData = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
      const byteData = imageData.data;
      for (var i = 0; i < byteData.length; i += 4) {
        const colour = paletteLookup(data[i / 4])
        byteData[i] = colour.r   // red
        byteData[i + 1] = colour.g // green
        byteData[i + 2] = colour.b; // blue
        byteData[i + 3] = colour.a
      }
      ctx.putImageData(imageData, 0, 0);
    }
  })

  function paletteLookup(index: number) {
    const rgbPallete = palette.map(toRgba)
    if (index && rgbPallete[index]) {
      return rgbPallete[index]
    }
    return toRgba("000000")
  }

  return (<canvas ref={ref} height={height} width={width} style={style} className="pixView"></canvas>)
}

function toRgba(hex: string) {
  return {
    "r": parseInt(hex.substring(0, 2), 16),
    "g": parseInt(hex.substring(2, 4), 16),
    "b": parseInt(hex.substring(4, 6), 16),
    "a": 255
  }
}

type ZoomablePixViewState = {
  zoom: number
}

type ZoomablePixViewProperties = {
  width: number;
  height: number;
  palette: Array<string>;
  data: Uint8Array;
}

class ZoomablePixView extends Component<ZoomablePixViewProperties, ZoomablePixViewState> {

  constructor(props: ZoomablePixViewProperties) {
    super(props)
    this.state = { zoom: 2 }

    this.zoomIn = this.zoomIn.bind(this)
    this.zoomOut = this.zoomOut.bind(this)
  }

  zoomIn() {
    this.setState({ zoom: this.state.zoom + 1 })
  }

  zoomOut() {
    if (this.state.zoom > 1) {
      this.setState({ zoom: this.state.zoom - 1 })
    }
  }

  render() {
    return <div className="zoomablePixView">
      <div>
        <button className="btnZoomIn" onClick={this.zoomIn}>+</button>
        <button className="btnZoomOut" onClick={this.zoomOut} disabled={this.state.zoom <= 1}>-</button>
      </div>
      <PixView data={this.props.data} height={this.props.height} width={this.props.width} palette={this.props.palette} zoom={this.state.zoom}></PixView>

    </div>

  }

}

export default ZoomablePixView