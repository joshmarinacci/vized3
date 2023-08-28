import {Bounds, Point} from "josh_js_util"
import {
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

export const RectDef: ObjectDef = {
    name: 'rect',
    props: {
        name: NameDef,
        bounds: {
            name: 'bounds',
            base: 'object',
            readonly: false,
            setter: (obj, name, value) => {
                const old_bounds = obj as Bounds
                const new_bounds = old_bounds.copy()
                // @ts-ignore
                new_bounds[name] = value
                return new_bounds
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
    private obj: RectClass

    constructor(obj: RectClass) {
        this.obj = obj
    }

    getPosition(): Point {
        return this.obj.getPropValue("bounds").bottom_right()
    }

    async setPosition(pos: Point) {
        const old_bounds = this.obj.getPropValue('bounds')
        const new_bounds: Bounds = new Bounds(old_bounds.x, old_bounds.y, pos.x - old_bounds.x, pos.y - old_bounds.y)
        await this.obj.setPropValue("bounds", new_bounds)
    }

    contains(pt: Point) {
        const pos = this.obj.getPropValue('bounds').bottom_right()
        const b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

export class RectClass extends DrawableClass<typeof RectDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof RectDef.props, any>) {
        super(om, RectDef, opts)
    }

    drawSelf(ctx: ScaledSurface): void {
        if (this.props.roundedCornersEnabled) {
            ctx.fillRoundRect(this.props.bounds,this.props.roundedCornersRadius, this.getPropValue('fill'))
            ctx.strokeRoundRect(this.props.bounds,this.props.roundedCornersRadius, this.props.strokeFill, this.props.strokeWidth)
        } else {
            ctx.fillRect(this.props.bounds, this.getPropValue('fill'))
            ctx.strokeRect(this.props.bounds, this.props.strokeFill, this.props.strokeWidth)
        }
    }

    contains(pt: Point): boolean {
        return this.props.bounds.contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        ctx.outlineRect(this.props.bounds)
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
        const bounds = this.getPropValue('bounds') as Bounds
        await this.setPropValue('bounds', new Bounds(pos.x, pos.y, bounds.w, bounds.h))
    }

    getAlignmentBounds():Bounds {
        return this.getPropValue('bounds') as Bounds
    }

    async translateBy(offset: Point): Promise<void> {
        const bds = this.getPropValue('bounds') as Bounds
        await this.setPropValue('bounds', bds.add(offset))
    }
}
