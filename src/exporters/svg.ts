import {forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";
import {GlobalState} from "../models/state";
import {CircleClass, DocClass, ObjectDef, ObjectProxy, PageClass, RectClass} from "../models/om";

function splat_SVG(name: string, opts: Record<string,any>) {
    let atts = Object.keys(opts).map(key => `${key}="${opts[key]}"`)
    return `<${name} ${atts.join(" ")}/>`
}

export async function toSVG(state: GlobalState) {
    const before: string[] = []
    const after: string[] = []

    traverse(state.getCurrentDocument(), (item: ObjectProxy<ObjectDef>) => {
        if (item.def.name === 'document') {
            const doc = item as DocClass
            let template = `<?xml version="1.0" standalone="no"?>
    <svg width="400" height="400" version="1.1" xmlns="http://www.w3.org/2000/svg">`
            before.push(template)
            after.push('</svg>')
        }
        if (item.def.name === 'page') {
            const page = item as PageClass
        }
        if (item.def.name === 'rect') {
            const sq = item as RectClass
            before.push(splat_SVG('rect', {
                x: sq.props.bounds.x,
                y: sq.props.bounds.y,
                width: sq.props.bounds.w,
                height: sq.props.bounds.h,
                fill: sq.props.fill,
            }));
        }
        if (item.def.name === 'circle') {
            const circle = item as CircleClass
            before.push(splat_SVG('circle', {
                cx: circle.props.center.x,
                cy: circle.props.center.y,
                r: circle.props.radius,
                fill: circle.props.fill,
            }))
        }
    })

    let output = before.join("\n") + after.join("\n")
    console.log("generated", output)
    return output
}

export async function exportSVG(state: GlobalState) {
    let output = await toSVG(state)
    let blog = new Blob([output])
    forceDownloadBlob('demo.svg', blog)
}
