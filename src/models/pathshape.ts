import {Bounds, Point} from "josh_js_util"

import {
    CenterPositionDef,
    DrawableClass,
    FillDef, Handle, NameDef,
    ObjectDef, ObjectManager,
    ScaledSurface,
    StrokeFillDef,
    StrokeWidthDef
} from "./om"

export const PathShapeDef: ObjectDef = {
    name: 'path-shape',
    props: {
        name: NameDef,
        center: CenterPositionDef,
        filled: {
            name:"filled",
            base: 'boolean',
            readonly: false,
            defaultValue: false
        },
        fill: FillDef,
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
        points: {
            name:'points',
            base:'list',
            readonly: true,
            defaultValue:() => [
                new Point(0,0),
                new Point(3,2),
                new Point(1,4),
            ],
            hidden:true
        },
        closed: {
            name:"closed",
            base: 'boolean',
            readonly: false,
            defaultValue: false
        },
    }
}

export class PathShapeClass extends DrawableClass<typeof PathShapeDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof PathShapeDef.props, any>) {
        super(om, PathShapeDef, opts)
    }

    drawSelf(ctx: ScaledSurface): void {
        if(this.props.points.length < 2) return
        ctx.fillLinePath(this.getPosition(),this.props.points,this.props.closed,this.getPropValue('fill'))
        ctx.strokeLinePath(this.getPosition(),this.props.points,this.props.closed,this.props.strokeFill)
    }

    contains(pt: Point): boolean {
        return this.calcBounds().contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        if(this.props.points.length < 2) return
        ctx.outlineLinePath(this.getPosition(),this.props.points,this.props.closed)
    }

    getHandle(): Handle | null {
        return null
    }

    intersects(bounds: Bounds): boolean {
        return this.calcBounds().intersects(bounds)
    }

    getPosition(): Point {
        return this.getPropValue('center')
    }

    async setPosition(pos: Point): Promise<void> {
        await this.setPropValue('center', pos)
    }

    private drawPath(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.translate(this.getPosition().x,this.getPosition().y)
        ctx.beginPath()
        ctx.moveTo(this.props.points[0].x,this.props.points[0].y)
        for (const pt of this.props.points) ctx.lineTo(pt.x, pt.y)
        if(this.props.closed) ctx.closePath()
        ctx.restore()
    }

    private calcBounds() {
        return calcBounds(this.getListProp('points')).add(this.getPosition())
    }

    getAlignmentBounds(): Bounds {
        return this.calcBounds()
    }

    async translateBy(offset: Point): Promise<void> {
        const center = this.getPropValue('center') as Point
        await this.setPropValue('center', center.add(offset))
    }
}

export function calcBounds(pts:Point[]) {
    const pt = pts[0]
    let bds = new Bounds(pt.x,pt.y,0,0)
    for(const pt of pts) {
        if(pt.x < bds.left()) {
            bds = new Bounds(pt.x,bds.top(),bds.right()-pt.x,bds.h)
        }
        if(pt.x > bds.right()) {
            bds = new Bounds(bds.left(),bds.top(),pt.x-bds.left(), bds.h)
        }
        if(pt.y > bds.bottom()) {
            bds = new Bounds(bds.left(),bds.top(),bds.w,pt.y - bds.top())
        }
        if(pt.y < bds.top()) {
            bds = new Bounds(bds.left(),pt.y,bds.w,bds.bottom()-pt.y)
        }
    }
    return bds
}
