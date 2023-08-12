import {Bounds, Point} from "josh_js_util";
import {
    DrawableClass,
    FillDef,
    Handle,
    ObjectDef,
    ObjectManager,
    StrokeFillDef,
    StrokeWidthDef
} from "./om";

export const RectDef: ObjectDef = {
    name: 'rect',
    props: {
        bounds: {
            name: 'bounds',
            base: 'object',
            readonly: false,
            setter: (obj, name, value) => {
                let old_bounds = obj as Bounds;
                let new_bounds = old_bounds.copy()
                // @ts-ignore
                new_bounds[name] = value
                return new_bounds;
            },
            subProps: {
                x: {
                    name: 'x',
                    base: 'number',
                    readonly: false,
                    defaultValue: 0
                },
                y: {
                    name: 'y',
                    base: 'number',
                    readonly: false,
                    defaultValue: 0,
                },
                w: {
                    name: 'w',
                    base: 'number',
                    readonly: false,
                    defaultValue: 100,
                },
                h: {
                    name: 'h',
                    base: "number",
                    readonly: false,
                    defaultValue: 100,
                },
            },
            defaultValue: new Bounds(0, 0, 0, 0),
        },
        fill: FillDef,
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
        roundedCornersEnabled: {
            name: 'roundedCornersEnabled',
            base: 'boolean',
            readonly: false,
            defaultValue: false,
        },
        roundedCornersRadius: {
            name: 'roundedCornersRadius',
            base: 'number',
            readonly: false,
            defaultValue: 10,
        }
    }
}

class RectResizeHandle implements Handle {
    private obj: RectClass;

    constructor(obj: RectClass) {
        this.obj = obj
    }

    getPosition(): Point {
        return this.obj.getPropValue("bounds").bottom_right()
    }

    async setPosition(pos: Point) {
        let old_bounds = this.obj.getPropValue('bounds')
        const new_bounds: Bounds = new Bounds(old_bounds.x, old_bounds.y, pos.x - old_bounds.x, pos.y - old_bounds.y)
        await this.obj.setPropValue("bounds", new_bounds)
    }

    contains(pt: Point) {
        let pos = this.obj.getPropValue('bounds').bottom_right()
        let b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

export class RectClass extends DrawableClass<typeof RectDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof RectDef.props, any>) {
        super(om, RectDef, opts)
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.props.fill
        if (this.props.roundedCornersEnabled) {
            let b = this.props.bounds
            let r = this.props.roundedCornersRadius
            ctx.beginPath()
            ctx.roundRect(b.left(), b.top(), b.w, b.h, r)
            ctx.closePath()
            ctx.fill()
        } else {
            ctx.fillRect(this.props.bounds.x, this.props.bounds.y, this.props.bounds.w, this.props.bounds.h)
        }
        ctx.strokeStyle = this.props.strokeFill
        ctx.lineWidth = this.props.strokeWidth
        if (this.props.roundedCornersEnabled) {
            let b = this.props.bounds
            let r = this.props.roundedCornersRadius
            ctx.beginPath()
            ctx.roundRect(b.left(), b.top(), b.w, b.h, r)
            ctx.closePath()
            ctx.stroke()
        } else {
            ctx.strokeRect(this.props.bounds.x, this.props.bounds.y, this.props.bounds.w, this.props.bounds.h)
        }
    }

    contains(pt: Point): boolean {
        return this.props.bounds.contains(pt)
    }

    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.strokeRect(this.props.bounds.x, this.props.bounds.y, this.props.bounds.w, this.props.bounds.h)
    }

    getHandle(): Handle {
        return new RectResizeHandle(this)
    }

    intersects(bounds: Bounds): boolean {
        return this.getPropValue('bounds').intersects(bounds)
    }

    getPosition(): Point {
        return (this.getPropValue('bounds') as Bounds).position()
    }

    async setPosition(pos: Point): Promise<void> {
        let bounds = this.getPropValue('bounds') as Bounds
        await this.setPropValue('bounds', new Bounds(pos.x, pos.y, bounds.w, bounds.h))
    }
}
