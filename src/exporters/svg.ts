import {forceDownloadBlob} from "josh_web_util"

import {CircleClass} from "../models/circle"
import {NGonClass} from "../models/ngon"
import {OO} from "../models/om"
import {RectClass} from "../models/rect"
import {GlobalState} from "../models/state"
import {traverse} from "./common"

function splat_SVG(name: string, opts: Record<string,any>):string {
    const atts = Object.keys(opts).map(key => `${key}="${opts[key]}"`)
    return `<${name} ${atts.join(" ")}/>`
}
type SVGSerializer<T> = (item:T) => string;

const SERIALIZERS:Map<any,SVGSerializer<any>> = new Map()


const CircleToSVG:SVGSerializer<CircleClass> = (item:CircleClass) => {
    return splat_SVG('circle', {
        cx: item.props.center.x,
        cy: item.props.center.y,
        r: item.props.radius,
        fill: item.props.fill,
    })
}
SERIALIZERS.set(CircleClass, CircleToSVG)

const NGonToSVG:SVGSerializer<NGonClass> = (item) => {
    const points = item.drawPath()
    let path = ''
    const center = item.getPosition()
    for(let i=0; i<points.length; i++) {
        const pt = points[i]
        if(i === 0) {
            path += `M ${pt.x+center.x} ${pt.y+center.y}`
        } else {
            path += `L ${pt.x+center.x} ${pt.y+center.y}`
        }
    }
    return splat_SVG('path',{
        d:path,
        fill: item.getPropValue('fill')
    })
}
SERIALIZERS.set(NGonClass,NGonToSVG)

const RectToSVG:SVGSerializer<RectClass> = (item) => {
    return splat_SVG('rect', {
        x: item.props.bounds.x,
        y: item.props.bounds.y,
        width: item.props.bounds.w,
        height: item.props.bounds.h,
        fill: item.props.fill,
    })
}
SERIALIZERS.set(RectClass,RectToSVG)

export async function toSVG(state: GlobalState) {
    const before: string[] = []
    const after: string[] = []

    traverse(state.getCurrentDocument(), (item: OO) => {
        if (item.def.name === 'document') {
            const template = `<?xml version="1.0" standalone="no"?>
    <svg width="640" height="480" version="1.1" xmlns="http://www.w3.org/2000/svg">`
            before.push(template)
            after.push('</svg>')
        }
        if (item.def.name === 'page') {
        }
        const ser = SERIALIZERS.get(item.constructor)
        if(ser) before.push(ser(item))
    })

    const output = before.join("\n") + after.join("\n")
    console.log("generated", output)
    return output
}

export async function exportSVG(state: GlobalState) {
    const output = await toSVG(state)
    const blog = new Blob([output])
    forceDownloadBlob('demo.svg', blog)
}
