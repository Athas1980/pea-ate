import React from "react";
import { Component } from "react";


type MapCacherProps = {
    palette: Array<string>
    data: Uint8Array
    spriteCacheSetter: (index:number, data:ImageData) => void
}
class MapCacher extends Component<MapCacherProps> {
    constructor(props: MapCacherProps) {
        super(props)
    }

    render() {        
        return null as HTMLSpanElement
    }

    


}