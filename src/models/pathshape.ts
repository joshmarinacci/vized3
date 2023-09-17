import {Bounds, Point} from "josh_js_util"

import {DefList, PropValues} from "./base"
import {BaseShape, CenterPositionDef, FillDef, NameDef, StrokeFillDef, StrokeWidthDef} from "./defs"
import {DrawableShape, Handle, ScaledSurface} from "./drawing"


export type PathShapeType = {
    name: string,
    center: Point,
    filled: boolean,
    fill: string,
    strokeFill: string,
    strokeWidth: number,
    points: Point[],
    closed: false,
}
type FlatPoint = { x: number, y: number}
export const PathShapeDef: DefList<PathShapeType> = {
    name: NameDef,
    center: CenterPositionDef,
    filled: {
        base: 'boolean',
        readonly: false,
        default: () => false,
    },
    fill: FillDef,
    strokeFill: StrokeFillDef,
    strokeWidth: StrokeWidthDef,
    points: {
        base: 'list',
        readonly: true,
        custom: 'points',
        default: () => [
            new Point(0, 0),
            new Point(3, 2),
            new Point(1, 4),
        ],
        hidden: true,
        fromJSON:(json) => (json.value as FlatPoint[])
            .map(pt => Point.fromJSON(pt))
    },
    closed: {
        base: 'boolean',
        readonly: false,
        default: () => false,
    },
}

export class PathShapeClass extends BaseShape<PathShapeType> implements DrawableShape {
    constructor(opts?: PropValues<PathShapeType>) {
        super(PathShapeDef, opts)
    }

    drawSelf(ctx: ScaledSurface): void {
        const points = this.getPropValue('points')
        if (points.length < 2) return
        ctx.fillLinePath(this.getPosition(), points, this.getPropValue('closed'), this.getPropValue('fill'))
        ctx.strokeLinePath(this.getPosition(), points, this.getPropValue('closed'), this.getPropValue('strokeFill'), this.getPropValue('strokeWidth'))
    }

    contains(pt: Point): boolean {
        return this.calcBounds().contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        const points = this.getPropValue('points')
        if (points.length < 2) return
        ctx.outlineLinePath(this.getPosition(), points, this.getPropValue('closed'))
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

    getAlignmentBounds(): Bounds {
        return this.calcBounds()
    }

    async translateBy(offset: Point): Promise<void> {
        const center = this.getPropValue('center') as Point
        await this.setPropValue('center', center.add(offset))
    }

    private drawPath(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.translate(this.getPosition().x, this.getPosition().y)
        ctx.beginPath()
        const points = this.getPropValue('points')
        ctx.moveTo(points[0].x, points[0].y)
        for (const pt of points) ctx.lineTo(pt.x, pt.y)
        if (this.getPropValue('closed')) ctx.closePath()
        ctx.restore()
    }

    private calcBounds() {
        const points = this.getPropValue('points')
        return calcBounds(points).add(this.getPosition())
    }
}

export function calcBounds(pts: Point[]) {
    const pt = pts[0]
    let bds = new Bounds(pt.x, pt.y, 0, 0)
    for (const pt of pts) {
        if (pt.x < bds.left()) {
            bds = new Bounds(pt.x, bds.top(), bds.right() - pt.x, bds.h)
        }
        if (pt.x > bds.right()) {
            bds = new Bounds(bds.left(), bds.top(), pt.x - bds.left(), bds.h)
        }
        if (pt.y > bds.bottom()) {
            bds = new Bounds(bds.left(), bds.top(), bds.w, pt.y - bds.top())
        }
        if (pt.y < bds.top()) {
            bds = new Bounds(bds.left(), pt.y, bds.w, bds.bottom() - pt.y)
        }
    }
    return bds
}
