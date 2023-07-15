import {GlobalState} from "../models/state";
import {stateToCanvas} from "./png";
import {canvas_to_blob, forceDownloadBlob} from "josh_web_util";
import {readMetadata, writeMetadata} from "./vendor";
import {JSONDoc, ObjectDef, ObjectProxy} from "../models/om";

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
    const json_string = JSON.stringify(json_obj,null,'    ')

    const blob = await canvas_to_blob(canvas)
    let array_buffer = await blob.arrayBuffer()
    let uint8buffer = new Uint8Array(array_buffer)
    console.log("json string is",json_string)

    // @ts-ignore
    let out_buffer = writeMetadata(uint8buffer as Buffer,{ tEXt: { SOURCE:json_string,  } })
    console.log("out buffer is",out_buffer)
    let final_blob = new Blob([out_buffer as BlobPart], {type:'image/png'})
    // let url = buffer_to_dataurl(out_buffer,"image/png")
    forceDownloadBlob('final_blob.json.png',final_blob)
    // let url = buffer_to_dataurl(out_buffer,"image/png")
    // force_download(url,filename)
}

type Metadata = {tEXt: {keyword: any, SOURCE:any}}

export async function loadPNGJSON(state:GlobalState, file:File):Promise<ObjectProxy<ObjectDef>> {
    return new Promise((res,rej) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            let buffer = new Uint8Array(reader.result as ArrayBufferLike)
            let metadata = readMetadata(buffer as Buffer) as unknown as Metadata
            console.log("metadata is",metadata)
            if(metadata && metadata.tEXt && metadata.tEXt.SOURCE) {
                let json = JSON.parse(metadata.tEXt.SOURCE)
                let obj = state.om.fromJSON(json as JSONDoc)
                obj.then(ob => {
                    res(ob)
                })
            }
        })
        reader.readAsArrayBuffer(file)
    })
}
