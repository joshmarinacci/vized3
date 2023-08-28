import {Bounds, Point} from "josh_js_util"
import {
    CenterPositionDef,
    DrawableClass,
    FillDef,
    NameDef,
    ObjectDef,
    ObjectManager,
    PropSchema,
    ScaledSurface
} from "./om"

export const SimpleTextDef: ObjectDef = {
    name: 'simple-text',
    props: {
        name: NameDef,
        center: CenterPositionDef,
        text: {
            name: 'text',
            readonly: false,
            base: 'string',
            defaultValue: 'hello'
        },
        fontSize: {
            name: 'fontSize',
            base: 'number',
            readonly: false,
            defaultValue: 26,
        },
        fill: FillDef,
    }
}

export class SimpleTextClass extends DrawableClass<typeof SimpleTextDef> {
    private metrics: TextMetrics
    private can: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D

    constructor(om: ObjectManager, opts: Record<keyof typeof SimpleTextDef.props, any>) {
        super(om, SimpleTextDef, opts)
        if (typeof document !== "undefined") {
            this.can = document.createElement('canvas')
            this.can.width = 100
            this.can.height = 100
            this.ctx = this.can.getContext('2d') as CanvasRenderingContext2D
            this.ctx.font = this.calcFont()
            this.metrics = this.ctx.measureText(this.props.text)
        }
    }

    private calcHeight() {
        return this.metrics.actualBoundingBoxAscent + this.metrics.actualBoundingBoxDescent
    }

    contains(pt: Point): boolean {
        const h = this.calcHeight()
        const bds = new Bounds(this.props.center.x, this.props.center.y - h, this.metrics.width, h)
        return bds.contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        const h = this.calcHeight()
        const bds = new Bounds(this.props.center.x, this.props.center.y-h,this.metrics.width,h)
        ctx.outlineRect(bds)
    }

    drawSelf(ctx: ScaledSurface): void {
        ctx.fillText(this.props.text,this.props.center,this.props.fill,this.props.fontSize)
    }

    refresh(prop: PropSchema) {
        if (prop.name === 'text' || prop.name === 'fontSize') {
            this.ctx.font = this.calcFont()
            this.metrics = this.ctx.measureText(this.props.text)
        }
    }

    private calcFont() {
        return `${this.props.fontSize}pt sans-serif`
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
        await this.setPropValue('center', pos)
    }
    getAlignmentBounds(): Bounds {
        const center = this.getPropValue('center') as Point
        return new Bounds(center.x, center.y - 50, 100, 50)
    }

    async translateBy(offset: Point): Promise<void> {
        const center = this.getPropValue('center') as Point
        await this.setPropValue('center', center.add(offset))
    }
}
