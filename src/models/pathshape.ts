import {
    CenterPositionDef,
    DrawableClass,
    FillDef, Handle, NameDef,
    ObjectDef, ObjectManager,
    StrokeFillDef,
    StrokeWidthDef
} from "./om";
import {Bounds, Point} from "josh_js_util";

export const PathShapeDef: ObjectDef = {
    name: 'path-shape',
    props: {
        name: NameDef,
        center: CenterPositionDef,
        fill: FillDef,
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
        points: {
            name:'points',
            base:'list',
            readonly: true,
            defaultValue:() => [
                new Point(50,50),
                new Point(100,80),
                new Point(80,100),
            ]
        }
    }
}

export class PathShapeClass extends DrawableClass<typeof PathShapeDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof PathShapeDef.props, any>) {
        super(om, PathShapeDef, opts)
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.props.fill
        this.drawPath(ctx)
        ctx.fill()
        ctx.strokeStyle = this.props.strokeFill
        ctx.lineWidth = this.props.strokeWidth
        ctx.stroke()
    }

    contains(pt: Point): boolean {
        return this.calcBounds().contains(pt)
    }

    drawSelected(ctx: CanvasRenderingContext2D): void {
        this.drawPath(ctx)
        ctx.stroke()
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
        for (let pt of this.props.points) {
            ctx.lineTo(pt.x,pt.y)
        }
        ctx.closePath()
        ctx.restore()
    }

    private calcBounds() {
        return calcBounds(this.getListProp('points')).add(this.getPosition())
    }
}

export function calcBounds(pts:Point[]) {
    let pt = pts[0]
    let bds = new Bounds(pt.x,pt.y,0,0)
    for(let pt of pts) {
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
