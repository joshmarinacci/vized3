import {Bounds, Point} from "josh_js_util";
import {
    CenterPositionDef,
    DrawableClass,
    FillDef,
    ObjectDef,
    ObjectManager,
    PropSchema
} from "./om";

export const SimpleTextDef: ObjectDef = {
    name: 'simple-text',
    props: {
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
    private metrics: TextMetrics;
    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

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
        let h = this.calcHeight()
        let bds = new Bounds(this.props.center.x, this.props.center.y - h, this.metrics.width, h)
        return bds.contains(pt)
    }

    drawSelected(ctx: CanvasRenderingContext2D): void {
        let h = this.calcHeight()
        ctx.strokeRect(this.props.center.x, this.props.center.y - h, this.metrics.width, h)
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.props.fill
        ctx.font = this.calcFont()
        ctx.fillText(this.props.text, this.props.center.x, this.props.center.y)
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
        return null;
    }

    intersects(bounds: Bounds): boolean {
        let center = this.getPropValue('center') as Point
        let bds = new Bounds(center.x, center.y - 50, 100, 50)
        return bds.intersects(bounds)
    }

    getPosition(): Point {
        return this.getPropValue('center')
    }

    async setPosition(pos: Point): Promise<void> {
        await this.setPropValue('center', pos)
    }
}
