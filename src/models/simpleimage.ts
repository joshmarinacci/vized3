import {Bounds, Point} from "josh_js_util"

import {DefList, PropsBase, PropValues} from "./base"
import {BaseShape, BoundsDef, NameDef} from "./defs"
import {DrawableShape, Handle, ScaledSurface} from "./drawing"


type SimpleImageType = {
    name: string
    bounds: Bounds,
    image: string,
}
export const SimpleImageDef: DefList<SimpleImageType> = {
    name: NameDef,
    bounds: BoundsDef,
    image: {
        base: 'string',
        custom: 'image-asset',
        canProxy: true,
        default: ()=> "",
        readonly: false,
        hidden: false,
    },
}

class ImageResizeHandle implements Handle {
    private obj: SimpleImageClass

    constructor(obj: SimpleImageClass) {
        this.obj = obj
    }

    getPosition(): Point {
        return this.obj.getPropValue("bounds").bottom_right()
    }

    async setPosition(pos: Point) {
        const img = this.obj.getPropValue('image')
        const ratio = img.height / img.width
        const old_bounds = this.obj.getPropValue('bounds')
        const new_width = pos.x-old_bounds.x
        const new_height = new_width*ratio
        const new_bounds: Bounds = new Bounds(old_bounds.x, old_bounds.y, new_width, new_height)
        await this.obj.setPropValue("bounds", new_bounds)
    }

    contains(pt: Point) {
        const pos = this.obj.getPropValue('bounds').bottom_right()
        const b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}


export class SimpleImageClass extends BaseShape<SimpleImageType> implements DrawableShape {
    constructor(opts?: PropValues<SimpleImageType>){
        super(SimpleImageDef, opts)
    }

    contains(pt: Point): boolean {
        return this.getPropValue('bounds').contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        ctx.outlineRect(this.getPropValue('bounds'))
    }

    drawSelf(ctx: ScaledSurface): void {
        const bounds = this.getPropValue('bounds') as Bounds
        const img = this.getPropValue('image')
        ctx.fillImage(bounds, img)
    }

    getAlignmentBounds(): Bounds {
        return this.getPropValue('bounds') as Bounds
    }

    getHandle(): Handle {
        return new ImageResizeHandle(this)
    }

    getPosition(): Point {
        return (this.getPropValue('bounds') as Bounds).position()
    }

    intersects(bounds: Bounds): boolean {
        return this.getPropValue('bounds').intersects(bounds)
    }

    async setPosition(pos: Point): Promise<void> {
        const bounds = this.getPropValue('bounds') as Bounds
        await this.setPropValue('bounds', new Bounds(pos.x, pos.y, bounds.w, bounds.h))
    }

    async translateBy(offset: Point): Promise<void> {
        const bds = this.getPropValue('bounds') as Bounds
        await this.setPropValue('bounds', bds.add(offset))
    }
}

