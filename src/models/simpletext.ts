import {Bounds, Point} from "josh_js_util"

import {DefList, PropDef, PropsBase, PropValues} from "./base"
import {BaseShape, CenterPositionDef, FillDef, NameDef} from "./defs"
import {DrawableShape, ScaledSurface} from "./drawing"

type SimpleTextType = {
    name:string,
    center:Point,
    text:string,
    fontSize:number,
    fill:string,
}

export const SimpleTextDef:DefList<SimpleTextType> = {
    name:NameDef,
    center: CenterPositionDef,
    text: {
        base:'string',
        readonly:false,
        default:() => 'hello',
    },
    fontSize: {
        base:'number',
        readonly:false,
        default:() => 26,
    },
    fill: FillDef,
}

export class SimpleTextClass extends BaseShape<SimpleTextType> implements DrawableShape {
    private metrics: TextMetrics
    private can: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D

    constructor(opts?:PropValues<SimpleTextType>) {
        super(SimpleTextDef, opts)
        if (typeof document !== "undefined") {
            this.can = document.createElement('canvas')
            this.can.width = 100
            this.can.height = 100
            this.ctx = this.can.getContext('2d') as CanvasRenderingContext2D
            this.ctx.font = this.calcFont()
            this.metrics = this.ctx.measureText(this.getPropValue('text'))
        }
    }

    private calcHeight() {
        return this.metrics.actualBoundingBoxAscent + this.metrics.actualBoundingBoxDescent
    }

    contains(pt: Point): boolean {
        const h = this.calcHeight()/72
        const center = this.getPropValue('center')
        const bds = new Bounds(center.x, center.y - h, this.metrics.width/72, h)
        return bds.contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        const h = this.calcHeight()/72
        const center = this.getPropValue('center')
        const bds = new Bounds(center.x, center.y-h,this.metrics.width/72,h)
        ctx.outlineRect(bds)
    }

    drawSelf(ctx: ScaledSurface): void {
        const center = this.getPropValue('center')
        const text = this.getPropValue('text')
        ctx.fillText(text,center,this.getPropValue('fill'),this.getPropValue('fontSize'))
    }

    refresh(prop: PropDef) {
        if (prop.name === 'text' || prop.name === 'fontSize') {
            this.ctx.font = this.calcFont()
            this.metrics = this.ctx.measureText(this.getPropValue('text'))
        }
    }

    private calcFont() {
        return `${this.getPropValue('fontSize')}pt sans-serif`
    }

    getHandle() {
        return null
    }

    intersects(bounds: Bounds): boolean {
        const center = this.getPropValue('center') as Point
        const bds = new Bounds(center.x, center.y - 50, 100, 50)
        return bds.intersects(bounds)
    }

    getPosition(): Point {
        return this.getPropValue('center')
    }

    async setPosition(pos: Point): Promise<void> {
        this.setPropValue('center', pos)
    }
    getAlignmentBounds(): Bounds {
        const center = this.getPropValue('center') as Point
        return new Bounds(center.x, center.y - 50, 100, 50)
    }

    async translateBy(offset: Point): Promise<void> {
        const center = this.getPropValue('center') as Point
        this.setPropValue('center', center.add(offset))
    }
}
