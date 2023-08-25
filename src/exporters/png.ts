import {canvas_to_blob, forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";
import {GlobalState} from "../models/state";
import {DocClass, PageClass} from "../models/om";
import {RectClass} from "../models/rect";
import {CircleClass} from "../models/circle";
import {lookup_dpi, size_to_pixels} from "../models/unit";
import {ScaledDrawingSurface} from "../editing/scaled_drawing";

export async function exportPNG(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    const canvas = await stateToCanvas(state)
    const blob = await canvas_to_blob(canvas)
    forceDownloadBlob('demo.png',blob)
}

export async function stateToCanvas(state:GlobalState) {
    const canvas = document.createElement('canvas')
    let doc = state.getCurrentDocument()
    let unit = doc.getPropValue('unit')
    let page = doc.getListPropAt('pages',0) as PageClass
    let size = size_to_pixels(page.getPropValue('size'),unit)
    console.log("pixel size is",size)
    canvas.width = size.w
    canvas.height = size.h
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    let surf = new ScaledDrawingSurface(ctx,lookup_dpi(unit),unit)
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
            sq.drawSelf(surf)
        }
        if (item.def.name === 'circle') {
            const circle = item as CircleClass
            circle.drawSelf(surf)
        }
    })
    return Promise.resolve(canvas)
}
