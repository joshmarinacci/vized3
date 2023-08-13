import {Bounds, Point, toRadians} from "josh_js_util";
import {
    CenterPositionDef,
    DrawableClass,
    FillDef,
    Handle,
    NameDef,
    ObjectDef,
    ObjectManager,
    StrokeFillDef,
    StrokeWidthDef
} from "./om";

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
        let center = this.obj.getPropValue("center")
        let radius = this.obj.getPropValue('radius')
        return center.add(new Point(radius, 0))
    }

    async setPosition(pos: Point) {
        let center = this.obj.getPropValue("center")
        let diff = pos.subtract(center)
        let radius = diff.x
        await this.obj.setPropValue('radius', radius)
    }

    contains(pt: Point) {
        let center = this.obj.getPropValue("center")
        let radius = this.obj.getPropValue('radius')
        let pos = center.add(new Point(radius, 0))
        let b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

export class CircleClass extends DrawableClass<typeof CircleDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof CircleDef.props, any>) {
        super(om, CircleDef, opts)
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.props.fill
        ctx.beginPath()
        ctx.arc(this.props.center.x, this.props.center.y, this.props.radius, 0, toRadians(360))
        ctx.fill()
        ctx.strokeStyle = this.props.strokeFill
        ctx.lineWidth = this.props.strokeWidth
        ctx.stroke()
    }

    contains(pt: Point): boolean {
        return pt.subtract(this.props.center).magnitude() < this.props.radius
    }

    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath()
        ctx.arc(this.props.center.x, this.props.center.y, this.props.radius, 0, toRadians(360))
        ctx.stroke()
    }

    getHandle(): Handle {
        return new CircleResizeHandle(this)
    }

    intersects(bounds: Bounds): boolean {
        let center = this.getPropValue('center') as Point
        let rad = this.getPropValue('radius') as number
        let bds = new Bounds(center.x - rad, center.y - rad, rad * 2, rad * 2)
        return bds.intersects(bounds)
    }

    getPosition(): Point {
        return this.getPropValue('center')
    }

    async setPosition(pos: Point): Promise<void> {
        await this.setPropValue('center', pos)
    }

    getAlignmentBounds() {
        let center = this.getPropValue('center') as Point
        let rad = this.getPropValue('radius') as number
        let bds = new Bounds(center.x-rad,center.y-rad,rad*2,rad*2)
        return bds
    }

    async translateBy(offset: Point): Promise<void> {
        let center = this.getPropValue('center') as Point
        await this.setPropValue('center', center.add(offset))
    }
}
