import {Bounds, Point} from "josh_js_util"
import {forceDownloadBlob} from "josh_web_util"

import {CircleClass} from "../models/circle"
import {ObjectDef, ObjectProxy} from "../models/om"
import {RectClass} from "../models/rect"
import {GlobalState} from "../models/state"
import {traverse} from "./common"

export async function exportCanvasJS(state: GlobalState) {
    const before:string[] = []
    const after:string[] = []

    traverse(state.getCurrentDocument(), (item: ObjectProxy<ObjectDef>) => {
        if (item.def.name === 'document') {
            // const doc = item.obj as DocClass
            before.push(`const canvas = document.createElement('canvas')`)
            before.push(`const ctx = canvas.getContext('2d')`)
        }
        if (item.def.name === 'page') {
            // const page = item.obj as PageClass
            before.push(`ctx.fillStyle = 'white'`)
            before.push(`ctx.fillRect(0, 0, canvas.width, canvas.height)`)
        }
        if (item.def.name === 'rect') {
            const sq = item.obj as RectClass
            const bounds = sq.getPropValue('bounds') as Bounds
            before.push(`ctx.fillStyle = '${sq.getPropValue('fill')}'`)
            before.push(`ctx.fillRect(${bounds.x}, ${bounds.y}, ${bounds.w}, ${bounds.h})`)
        }
        if (item.def.name === 'circle') {
            const c = item.obj as CircleClass
            const center = c.getPropValue('center') as Point
            const radius = c.getPropValue('radius') as number
            before.push(`
            ctx.fillStyle = '${c.getPropValue('fill')}'
            ctx.beginPath()
            ctx.arc(${center.x},${center.y},${radius},0,360.0*Math.PI/180)
            ctx.fill()`)
        }
    })
    const output = before.join("\n")+after.join("\n")
    console.log("generated",output)

    const blog = new Blob([output])
    forceDownloadBlob('demo.js', blog)
}
