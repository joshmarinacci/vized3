import {canvas_to_blob, forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";
import {GlobalState} from "../models/state";
import {CircleClass, DocClass, PageClass, RectClass} from "../models/om";

export async function exportPNG(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    const canvas = await stateToCanvas(state)
    const blob = await canvas_to_blob(canvas)
    forceDownloadBlob('demo.png',blob)
}

export async function stateToCanvas(state:GlobalState) {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    traverse(state.getCurrentDocument(), (item: any) => {
        if (item.def.name === 'document') {
            const doc = item.obj as DocClass
        }
        if (item.def.name === 'page') {
            const page = item as PageClass
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        if (item.def.name === 'rect') {
            const sq = item as RectClass
            sq.drawSelf(ctx)
        }
        if (item.def.name === 'circle') {
            const circle = item as CircleClass
            circle.drawSelf(ctx)
        }
    })
    return Promise.resolve(canvas)
}
