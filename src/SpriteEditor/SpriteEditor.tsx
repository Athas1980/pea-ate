import React, { useState} from 'react';
import { FC } from "react";
import { ColourChooser } from '../ColourChooser/ColourChooser';
import { ZoomablePixViewProperties } from "../PixView";
import { ZoomablePixView } from "../PixView"

interface SpriteEditorProps {
    spriteSheet: ZoomablePixViewProperties
}

const editorCellStyle: React.CSSProperties = {
    border: "1px dotted white",
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
    borderCollapse: 'collapse',
    aspectRatio: "1"
}


export const SpriteEditor: FC<SpriteEditorProps> = (props: SpriteEditorProps) => {
    const [palette, setPalette] = useState(props.spriteSheet.palette)
    const [selectedColour, setSelectedColour] = useState(0)
    const [rows, setRows] = useState(3)
    const [cols, setCols] = useState(4)
    const editableSpriteArea: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr '.repeat(cols),
        gap: 0,
        width: "40%",
        backgroundColor: "black"
    }
    const cells:JSX.Element[] = []
    for (var i=0; i< rows*cols; i++) {
        cells.push(<div style={editorCellStyle} key={i}>{i}</div>)
    }
    
    return <div>
        <div style={{ backgroundColor: '#5F574F', boxSizing: 'border-box', padding: "10px" }}>
            <div style={editableSpriteArea}>
                {cells}
            </div>
            <ColourChooser palette={palette} handleSelection={setSelectedColour} selected={selectedColour} ></ColourChooser>

        </div>
        <div style={{ maxWidth: "100%", overflow: "auto" }}>
            <div style={{position: "relative"}}>
                <ZoomablePixView
                    width={props.spriteSheet.width}
                    height={props.spriteSheet.height}
                    palette={props.spriteSheet.palette}
                    data={props.spriteSheet.data}>
                </ZoomablePixView>
                <div style={{
                    position:"absolute", top:"0", left:"0",
                    width:props.spriteSheet.width * 2,// FIXME 
                    height:props.spriteSheet.height * 2, //FIXME
                    pointerEvents: 'none',
                    backgroundColor:"#55000055"}}></div>
            </div>
            
        </div>
    </div>
}