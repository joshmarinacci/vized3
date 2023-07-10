import {forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";
import {GlobalState} from "../models/state";
import {CircleClass, DocClass, ObjectDef, ObjectProxy, PageClass, RectClass} from "../models/om";

function splat_SVG(name: string, opts: Record<string,any>) {
    let atts = Object.keys(opts).map(key => `${key}="${opts[key]}"`)
    return `<${name} ${atts.join(" ")}/>`
}

export async function exportSVG(state: GlobalState) {
    const before:string[] = []
    const after:string[] = []

    traverse(state.getCurrentDocument(), (item:ObjectProxy<ObjectDef>) => {
        if (item.def.name === 'document') {
            const doc = item.obj as DocClass
            let template = `<?xml version="1.0" standalone="no"?>
    <svg width="400" height="400" version="1.1" xmlns="http://www.w3.org/2000/svg">`
            before.push(template)
            after.push('</svg>')
        }
        if (item.def.name === 'page') {
            const page = item.obj as PageClass
        }
        if (item.def.name === 'rect') {
            const sq = item.obj as RectClass
            before.push(splat_SVG('rect',{
                x:sq.bounds.x,
                y:sq.bounds.y,
                width: sq.bounds.w,
                height: sq.bounds.h,
                fill:sq.fill,
            }));
        }
        if (item.def.name === 'circle') {
            const circle = item.obj as CircleClass
            before.push(splat_SVG('circle',{
                cx:circle.center.x,
                cy:circle.center.y,
                r:circle.radius,
                fill:circle.fill,
            }))
        }
    })

    let output = before.join("\n")+after.join("\n")
    console.log("generated",output)

    let blog = new Blob([output])
    forceDownloadBlob('demo.svg', blog)

}
