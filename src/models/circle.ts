import {Bounds, Point, toRadians} from "josh_js_util"
import {
    CenterPositionDef,
    DrawableClass,
    FillDef,
    Handle,
    NameDef,
    ObjectDef,
    ObjectManager,
    ScaledSurface,
    StrokeFillDef,
    StrokeWidthDef
} from "./om"

export const CircleDef: ObjectDef = {
    name: 'circle',
    props: {
        name: NameDef,
        center: CenterPositionDef,
        radius: {
            name: 'radius',
            base: "number",
            readonly: false,
            defaultValue: 20,
            canProxy:true,
        },
        fill: FillDef,
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
    }
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

export class CircleClass extends DrawableClass<typeof CircleDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof CircleDef.props, any>) {
        super(om, CircleDef, opts)
    }

    drawSelf(ctx: ScaledSurface): void {
        ctx.fillArc(this.props.center,this.getPropValue('radius'),0,toRadians(360),this.props.fill)
    }

    contains(pt: Point): boolean {
        return pt.subtract(this.props.center).magnitude() < this.getPropValue('radius')
    }

    drawSelected(ctx: ScaledSurface): void {
        ctx.outlineArc(this.props.center,this.getPropValue('radius'),0,toRadians(360),this.props.fill)
    }

    getHandle() {
        if(this.isPropProxySource('radius')) return null
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
