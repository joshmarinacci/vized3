import {GlobalState, VCircle, VDocument, VPage, VSquare} from "../models/model";
import {canvas_to_blob, forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";
import {toRadians} from "josh_js_util";

export async function exportCanvasJS(state: GlobalState) {
    const before:string[] = []
    const after:string[] = []

    traverse(state.getCurrentDocument(), (item: any) => {
        if (item.type === 'document') {
            const doc = item as VDocument
            before.push(`const canvas = document.createElement('canvas')`)
            before.push(`const ctx = canvas.getContext('2d')`)
        }
        if (item.type === 'page') {
            const page = item as VPage
            before.push(`ctx.fillStyle = 'white'`)
            before.push(`ctx.fillRect(0, 0, canvas.width, canvas.height)`)
        }
        if (item.type === 'square') {
            const sq = item as VSquare
            before.push(`ctx.fillStyle = '${sq.fill}'`)
            before.push(`ctx.fillRect(${sq.bounds.x}, ${sq.bounds.y}, ${sq.bounds.w}, ${sq.bounds.h})`)
        }
        if (item.type === 'circle') {
            const c = item as VCircle
            before.push(`
            ctx.fillStyle = '${c.fill}'
            ctx.beginPath()
            ctx.arc(${c.center.x},${c.center.y},${c.radius},0,360.0*Math.PI/180)
            ctx.fill()`)
        }
    })
    let output = before.join("\n")+after.join("\n")
    console.log("generated",output)

    let blog = new Blob([output])
    forceDownloadBlob('demo.js', blog)
}
