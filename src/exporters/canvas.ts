import {canvas_to_blob, forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";
import {toRadians} from "josh_js_util";
import {GlobalState} from "../models/state";
import {CircleClass, DocClass, ObjectDef, ObjectProxy, PageClass, RectClass} from "../models/om";

export async function exportCanvasJS(state: GlobalState) {
    const before:string[] = []
    const after:string[] = []

    traverse(state.getCurrentDocument(), (item: ObjectProxy<ObjectDef>) => {
        if (item.def.name === 'document') {
            const doc = item.obj as DocClass
            before.push(`const canvas = document.createElement('canvas')`)
            before.push(`const ctx = canvas.getContext('2d')`)
        }
        if (item.def.name === 'page') {
            const page = item.obj as PageClass
            before.push(`ctx.fillStyle = 'white'`)
            before.push(`ctx.fillRect(0, 0, canvas.width, canvas.height)`)
        }
        if (item.def.name === 'rect') {
            const sq = item.obj as RectClass
            before.push(`ctx.fillStyle = '${sq.fill}'`)
            before.push(`ctx.fillRect(${sq.bounds.x}, ${sq.bounds.y}, ${sq.bounds.w}, ${sq.bounds.h})`)
        }
        if (item.def.name === 'circle') {
            const c = item.obj as CircleClass
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
