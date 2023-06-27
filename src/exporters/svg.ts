import {GlobalState, VCircle, VDocument, VPage, VSquare} from "../models/model";
import {forceDownloadBlob} from "josh_web_util";
import {traverse} from "./common";

function splat_SVG(name: string, opts: Record<string,any>) {
    let atts = Object.keys(opts).map(key => `${key}="${opts[key]}"`)
    return `<${name} ${atts.join(" ")}/>`
}

export async function exportSVG(state: GlobalState) {
    const before:string[] = []
    const after:string[] = []

    traverse(state.getCurrentDocument(), (item:any) => {
        if (item.type === 'document') {
            const doc = item as VDocument
            let template = `<?xml version="1.0" standalone="no"?>
    <svg width="400" height="400" version="1.1" xmlns="http://www.w3.org/2000/svg">`
            before.push(template)
            after.push('</svg>')
        }
        if (item.type === 'page') {
            const page = item as VPage
        }
        if (item.type === 'square') {
            const sq = item as VSquare
            before.push(splat_SVG('rect',{
                x:sq.bounds.x,
                y:sq.bounds.y,
                width: sq.bounds.w,
                height: sq.bounds.h,
                fill:sq.fill,
            }));
        }
        if (item.type === 'circle') {
            const circle = item as VCircle
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
