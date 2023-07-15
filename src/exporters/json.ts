import {GlobalState} from "../models/state";
import {stateToCanvas} from "./png";
import {canvas_to_blob} from "josh_web_util";
import {readMetadata, writeMetadata} from "./vendor";

export async function saveJSON(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    let json_obj = await state.om.toJSON(state.getCurrentDocument())
    console.log("json obj is",json_obj)
    console.log(JSON.stringify(json_obj,null,'   '))
}
export async function savePNGJSON(state: GlobalState) {
    const canvas = await stateToCanvas(state)
    const json_obj = await state.om.toJSON(state.getCurrentDocument())
    console.log('canvas is',canvas)
    console.log('json is',json_obj)
    const json_string = JSON.stringify(json_obj)

    const blob = await canvas_to_blob(canvas)
    let array_buffer = await blob.arrayBuffer()
    let uint8buffer = new Uint8Array(array_buffer)

    console.log("json string is",json_string)
    // @ts-ignore
    let out_buffer = writeMetadata(uint8buffer as Buffer,{ tEXt: { SOURCE:json_string,  } })
    console.log("out buffer is",out_buffer)
    // let url = buffer_to_dataurl(out_buffer,"image/png")
    // force_download(url,filename)
}
