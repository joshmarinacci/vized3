import {GlobalState, VCircle, VDocument, VPage, VSquare} from "../models/model";
import {canvas_to_blob, forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";

export async function exportPNG(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    traverse(state.getCurrentDocument(), (item: any) => {
        if (item.type === 'document') {
            const doc = item as VDocument
        }
        if (item.type === 'page') {
            const page = item as VPage
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        if (item.type === 'square') {
            const sq = item as VSquare
            sq.drawSelf(ctx)
        }
        if (item.type === 'circle') {
            const circle = item as VCircle
            circle.drawSelf(ctx)
        }
    })
    const blob = await canvas_to_blob(canvas)
    forceDownloadBlob('demo.png',blob)
}
