import React, { CSSProperties, FC, MouseEvent, useEffect } from 'react';
import { Component, useRef } from 'react';

export type PixViewProps = {
  // using `interface` is also ok
  width: number;
  height: number;
  palette: Array<string>;
  data: Uint8Array;
  style?: React.CSSProperties
  className?: string;
};

export const PixView: FC<PixViewProps> = ({ width, height, data, palette, style, className }: PixViewProps) => {

  const ref = useRef<HTMLCanvasElement>(null)

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
    return toRgba("00000000")
  }

  function handleMouseMove(event: MouseEvent) {
    console.log({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })
    let zoom = ref.current.offsetWidth / ref.current.width
    console.log({zoom,  x: Math.floor(event.nativeEvent.offsetX / zoom), y: Math.floor(event.nativeEvent.offsetY / zoom) })
  }

  const cssClass = className ? className : 'pixView'
  return (
      <canvas className={cssClass} ref={ref}
        height={height} width={width}
        style={style} 
        onMouseMove={handleMouseMove}></canvas>
        )
}

function toRgba(hex: string) {
  let a = 255
  if(hex.length > 6) {
    const a = parseInt(hex.substring(6, 8), 16)
  }
  return {
    "r": parseInt(hex.substring(0, 2), 16),
    "g": parseInt(hex.substring(2, 4), 16),
    "b": parseInt(hex.substring(4, 6), 16),
    "a": a
  }
}

type ZoomablePixViewState = {
  zoom: number
}

export interface ZoomablePixViewProperties {
  width: number;
  height: number;
  palette: Array<string>;
  data: Uint8Array;
}

export class ZoomablePixView extends Component<ZoomablePixViewProperties, ZoomablePixViewState> {

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
      <PixView data={this.props.data} height={this.props.height} width={this.props.width} palette={this.props.palette}
        style={{width: this.props.width*this.state.zoom, height: this.props.height*this.state.zoom }}
      ></PixView>

    </div>

  }

}

export default ZoomablePixView