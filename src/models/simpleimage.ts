import {Bounds, Point} from "josh_js_util"

import {
    BoundsDef,
    CenterPositionDef,
    DrawableClass, Handle,
    NameDef,
    ObjectDef,
    ObjectManager,
    ScaledSurface
} from "./om"
import {RectResizeHandle} from "./rect"

export const SimpleImageDef: ObjectDef = {
    name: 'simple-image',
    props: {
        name: NameDef,
        bounds: BoundsDef,
        image: {
            name:'image',
            base:'string',
            custom:'image-asset',
            canProxy:true,
            defaultValue:null,
            readonly:false,
            hidden:false,
        },
    }
}

export class SimpleImageClass extends DrawableClass<typeof SimpleImageDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof SimpleImageDef.props, any>) {
        super(om, SimpleImageDef, opts)
    }

    contains(pt: Point): boolean {
        return this.props.bounds.contains(pt)
    }

    drawSelected(ctx: ScaledSurface): void {
        ctx.outlineRect(this.props.bounds)

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
        return new RectResizeHandle(this)
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

