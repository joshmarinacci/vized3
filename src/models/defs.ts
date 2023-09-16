import {symlink} from "fs"
import {Bounds, Point, Size} from "josh_js_util"

import {DefList, PropDef, PropsBase, PropValues} from "./base"
import {DrawableShape, Handle, ScaledSurface} from "./drawing"
import {Unit} from "./unit"
import Type = module
import {PageClass} from "./page"

export const CenterPositionDef:PropDef<Point> = {
    base: 'Point',
    readonly: false,
    // subProps: {
    //     x: {
    //         name: 'x',
    //         base: "number",
    //         readonly: false,
    //         defaultValue: 0,
    //     },
    //     y: {
    //         name: 'y',
    //         base: 'number',
    //         readonly: false,
    //         defaultValue: 0,
    //     },
    // },
    default: () => new Point(0, 0)
}
export const BoundsDef:PropDef<Bounds> = {
    base: 'Bounds',
    readonly: false,
    // setter: (obj, name, value) => {
    //     const old_bounds = obj as Bounds
    //     const new_bounds = old_bounds.copy()
    //     new_bounds[name] = value
    //     return new_bounds
    // },
    // subProps: {
    //     x: {
    //         name: 'x',
    //         base: 'number',
    //         readonly: false,
    //         defaultValue: 0
    //     },
    //     y: {
    //         name: 'y',
    //         base: 'number',
    //         readonly: false,
    //         defaultValue: 0,
    //     },
    //     w: {
    //         name: 'w',
    //         base: 'number',
    //         readonly: false,
    //         defaultValue: 1,
    //     },
    //     h: {
    //         name: 'h',
    //         base: "number",
    //         readonly: false,
    //         defaultValue: 1,
    //     },
    // },
    default: ()=> new Bounds(0, 0, 1, 1),
}
export const SizeDef:PropDef<Size> = {
    base:'Size',
    readonly:false,
    // subProps: {
    //     w: {
    //         name:'w',
    //         base:'number',
    //         readonly:false,
    //         defaultValue: 8.5,
    //     },
    //     h: {
    //         name:'h',
    //         base:"number",
    //         readonly:false,
    //         defaultValue: 11,
    //     }
    // },
    // setter: (obj, name, value) => {
    //     const s_old =obj as Size
    //     const snew = new Size(s_old.w,s_old.h)
    //     snew[name] = value
    //     return snew
    // },
    default: () => new Size(8.5,11)
}
export const FillDef:PropDef<string> = {
    base: 'string',
    readonly: false,
    // custom:'css-color',
    default:()=> '#cccccc',
    // canProxy:true
}
export const StrokeFillDef:PropDef<string> = {
    base: 'string',
    readonly: false,
    // custom:'css-color',
    default: () => 'black'
}
export const StrokeWidthDef:PropDef<number> = {
    base: 'number',
    readonly: false,
    default:()=>1,
    displayUnit:'pt'
}
export const NameDef:PropDef<string> = {
    base:'string',
    readonly:false,
    default:()=> 'unnamed',
}
export const UnitDef:PropDef<Unit> = {
    base:'string',
    readonly: false,
    // possibleValues: Object.keys(Unit),
    default: () => Unit.Inch,
    // renderer: (target, name, value:keyof typeof Unit) => {
    //     return Unit[value]
    // },
    // fromJSONValue: (o,n,v) => {
    //     return lookup_name(v)
    // }
}
export type BaseShapeType = {
    name:string
}
export abstract class BaseShape<Type extends BaseShapeType> extends PropsBase<Type> implements DrawableShape {
    parent:PageClass | null
    constructor(def:DefList<Type>, opts?:PropValues<Type>) {
        super(def, opts)
        this.parent = null
    }

    abstract contains(pt: Point): boolean

    abstract drawSelected(ctx: ScaledSurface): void

    abstract drawSelf(ctx: ScaledSurface): void

    abstract getAlignmentBounds(): Bounds

    abstract getHandle(): Handle | null

    abstract getPosition(): Point

    abstract intersects(bounds: Bounds): boolean

    abstract setPosition(pos: Point): Promise<void>

    abstract translateBy(offset: Point): Promise<void>
}

