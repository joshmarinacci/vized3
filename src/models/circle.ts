import {Bounds, Point, toRadians} from "josh_js_util"

import {DefList, PropValues} from "./base"
import {BaseShape, CenterPositionDef, FillDef, NameDef, StrokeFillDef, StrokeWidthDef} from "./defs"
import {Handle, ScaledSurface} from "./drawing"


type CircleType = {
    name:string,
    center:Point,
    radius:number,
    fill:string,
    strokeFill:string,
    strokeWidth:number,
}

const CircleDef:DefList<CircleType> = {
    name: NameDef,
    center: CenterPositionDef,
    radius: {
        base:"number",
        default: () => 20,
        readonly: false,
        canProxy: true,
    },
    fill: FillDef,
    strokeFill: StrokeFillDef,
    strokeWidth: StrokeWidthDef,
}

class CircleResizeHandle implements Handle {
    private obj: CircleClass

    constructor(obj: CircleClass) {
        this.obj = obj
    }

    getPosition(): Point {
        const center = this.obj.getPropValue("center")
        const radius = this.obj.getPropValue('radius')
        return center.add(new Point(radius, 0))
    }

    async setPosition(pos: Point) {
        const center = this.obj.getPropValue("center")
        const diff = pos.subtract(center)
        const radius = diff.x
        await this.obj.setPropValue('radius', radius)
    }

    contains(pt: Point) {
        const center = this.obj.getPropValue("center")
        const radius = this.obj.getPropValue('radius')
        const pos = center.add(new Point(radius, 0))
        const b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

export class CircleClass extends BaseShape<CircleType> {
    constructor(opts?:PropValues<CircleType>) {
        super(CircleDef, opts)
    }

    drawSelf(ctx: ScaledSurface): void {
        const center = this.getPropValue('center')
        const radius = this.getPropValue('radius')
        ctx.fillArc(center,radius,0,toRadians(360),this.getPropValue('fill'))
        ctx.strokeArc(center,radius,0,toRadians(360),this.getPropValue('strokeFill'), this.getPropValue('strokeWidth'))
    }

    contains(pt: Point): boolean {
        return pt.subtract(this.getPropValue('center')).magnitude() < this.getPropValue('radius')
    }

    drawSelected(ctx: ScaledSurface): void {
        ctx.outlineArc(this.getPropValue('center'),this.getPropValue('radius'),0,toRadians(360))
    }

    getHandle() {
        // if(this.isPropProxySource('radius')) return null
        return new CircleResizeHandle(this)
    }

    intersects(bounds: Bounds): boolean {
        const center = this.getPropValue('center') as Point
        const rad = this.getPropValue('radius') as number
        const bds = new Bounds(center.x - rad, center.y - rad, rad * 2, rad * 2)
        return bds.intersects(bounds)
    }

    getPosition(): Point {
        return this.getPropValue('center')
    }

    async setPosition(pos: Point): Promise<void> {
        await this.setPropValue('center', pos)
    }

    getAlignmentBounds() {
        const center = this.getPropValue('center') as Point
        const rad = this.getPropValue('radius') as number
        return new Bounds(center.x - rad, center.y - rad, rad * 2, rad * 2)
    }

    async translateBy(offset: Point): Promise<void> {
        const center = this.getPropValue('center') as Point
        await this.setPropValue('center', center.add(offset))
    }
}
