import {Bounds, Point} from "josh_js_util"

import {DefList, PropValues} from "./base"
import {BaseShape, BoundsDef, FillDef, NameDef, StrokeFillDef, StrokeWidthDef} from "./defs"
import {Handle, ScaledSurface} from "./drawing"

export type RectType = {
    name:string,
    bounds:Bounds,
    fill:string,
    strokeFill:string,
    strokeWidth:number,
    roundedCornersEnabled:boolean,
    roundedCornersRadius:number,
}
export const RectDef:DefList<RectType> = {
    name: NameDef,
    bounds: BoundsDef,
    fill: FillDef,
    roundedCornersEnabled: {
        base:'boolean',
        default: () => false,
    },
    roundedCornersRadius: {
        base:'number',
        default: () => 1,
    },
    strokeFill: StrokeFillDef,
    strokeWidth: StrokeWidthDef,
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

export class RectClass extends BaseShape<RectType> {
    constructor(opts?: PropValues<RectType>) {
        super(RectDef,opts)
    }

    drawSelf(ctx: ScaledSurface): void {
        if (this.getPropValue('roundedCornersEnabled')) {
            ctx.fillRoundRect(this.getPropValue('bounds'),this.getPropValue('roundedCornersRadius'), this.getPropValue('fill'))
            ctx.strokeRoundRect(this.getPropValue('bounds'),this.getPropValue('roundedCornersRadius'), this.getPropValue('strokeFill'), this.getPropValue('strokeWidth'))
        } else {
            ctx.fillRect(this.getPropValue('bounds'), this.getPropValue('fill'))
            ctx.strokeRect(this.getPropValue('bounds'), this.getPropValue('strokeFill'), this.getPropValue('strokeWidth'))
        }
    }

    contains(pt: Point): boolean {
        return this.getPropValue('bounds').contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        ctx.outlineRect(this.getPropValue('bounds'))
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
