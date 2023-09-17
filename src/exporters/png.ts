import {canvas_to_blob, forceDownloadBlob} from "josh_web_util"

import {ScaledDrawingSurface} from "../editing/scaled_drawing"
import {DocClass} from "../models/doc"
import {PageClass} from "../models/page"
import {GlobalState} from "../models/state"
import {size_to_pixels} from "../models/unit"
import {traverse} from "./common"

export async function exportPNG(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    const canvas = await stateToCanvas(state)
    const blob = await canvas_to_blob(canvas)
    forceDownloadBlob(`${state.getCurrentDocument().getPropValue('name')}.png`,blob)
}

export async function stateToCanvas(state:GlobalState) {
    const canvas = document.createElement('canvas')
    const doc = state.getCurrentDocument()
    const unit = doc.getPropValue('unit')
    const page = doc.getPropValue('pages')[0]
    const size = size_to_pixels(page.getPropValue('size'),unit)
    console.log("pixel size is",size)
    canvas.width = size.w
    canvas.height = size.h
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const surf = new ScaledDrawingSurface(ctx,0,unit)
    traverse(state.getCurrentDocument(), (item) => {
        if (item as DocClass) {
            // const doc = item.obj as DocClass
        }
        if (item as PageClass) {
            // const page = item as PageClass
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        if('drawSelf' in item ) {
            item.drawSelf(surf)
        }

    })
    return Promise.resolve(canvas)
}
