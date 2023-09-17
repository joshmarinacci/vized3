import {Bounds, Point} from "josh_js_util"
import {forceDownloadBlob} from "josh_web_util"

import {PropsBase} from "../models/base"
import {CircleClass} from "../models/circle"
import {DocClass} from "../models/doc"
import {NGonClass} from "../models/ngon"
import {PageClass} from "../models/page"
import {PathShapeClass} from "../models/pathshape"
import {RectClass} from "../models/rect"
import {SimpleImageClass} from "../models/simpleimage"
import {GlobalState} from "../models/state"
import {lookup_dpi} from "../models/unit"
import {traverse} from "./common"

function splat_SVG(name: string, opts: Record<string,any>):string {
    const atts = Object.keys(opts).map(key => `${key}="${opts[key]}"`)
    return `<${name} ${atts.join(" ")}/>`
}
type SVGSerializer<T> = (item:T, state:GlobalState) => string;

type Cons<T> = new () => T
const SERIALIZERS:Map<Cons,SVGSerializer<any>> = new Map()

const CircleToSVG:SVGSerializer<CircleClass> = (item:CircleClass, state) => {
    const doc = state.getCurrentDocument()
    const unit = doc.getPropValue('unit')
    const dpi = lookup_dpi(unit)
    const center = (item.getPropValue('center') as Point).scale(dpi)
    const radius = (item.getPropValue('radius') as number) * dpi
    const fill = item.getPropValue('fill')
    return splat_SVG('circle', {
        cx: center.x,
        cy: center.y,
        r: radius,
        fill: fill,
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

const RectToSVG:SVGSerializer<RectClass> = (item,state) => {
    const doc = state.getCurrentDocument()
    const unit = doc.getPropValue('unit')
    const dpi = lookup_dpi(unit)
    let bounds = item.getPropValue('bounds') as Bounds
    bounds = bounds.scale(dpi)
    return splat_SVG('rect', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.w,
        height: bounds.h,
        fill: item.getPropValue('fill'),
    })
}
SERIALIZERS.set(RectClass,RectToSVG)

const SimpleImageToSVG:SVGSerializer<SimpleImageClass> = (item, state) => {
    let bounds = item.getPropValue('bounds') as Bounds
    const value = item.getPropValue('image')
    let href = "#"
    if(value instanceof HTMLCanvasElement) {
        href = value.toDataURL('png')
    }
    const doc = state.getCurrentDocument()
    const unit = doc.getPropValue('unit')
    const dpi = lookup_dpi(unit)
    bounds = bounds.scale(dpi)
    return splat_SVG('image',{
        x: bounds.x,
        y: bounds.y,
        width: bounds.w,
        height: bounds.h,
        href: href
    })
}
SERIALIZERS.set(SimpleImageClass,SimpleImageToSVG)

const PathToSVG:SVGSerializer<PathShapeClass> = (item, state) => {
    const doc = state.getCurrentDocument()
    const unit = doc.getPropValue('unit')
    const dpi = lookup_dpi(unit)
    const center = item.getPosition()
    const points = item.getPropValue('points')
    const fill = item.getPropValue('fill')
    let path = ''
    for(let i=0; i<points.length; i++) {
        const pt = points[i].add(center).scale(dpi)
        if(i === 0) {
            path += `M ${pt.x} ${pt.y}`
        } else {
            path += `L ${pt.x} ${pt.y}`
        }
    }
    return splat_SVG('path',{
        d:path,
        fill:fill,
    })
}
SERIALIZERS.set(PathShapeClass,PathToSVG)

export async function toSVG(state: GlobalState) {
    const before: string[] = []
    const after: string[] = []

    traverse(state.getCurrentDocument(), (item: PropsBase<any>) => {
        if (item instanceof DocClass) {
            const template = `<?xml version="1.0" standalone="no"?>
    <svg width="640" height="480" version="1.1" xmlns="http://www.w3.org/2000/svg">`
            before.push(template)
            after.push('</svg>')
        }
        if (item instanceof PageClass) {
        }
        const ser = SERIALIZERS.get(item.constructor)
        if(ser) before.push(ser(item,state))
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
