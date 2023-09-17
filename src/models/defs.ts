import {Bounds, Point, Size} from "josh_js_util"

import {JSONPropValue} from "../exporters/json"
import {DefList, PropDef, PropsBase, PropValues} from "./base"
import {DrawableShape, Handle, ScaledSurface} from "./drawing"
import {PageClass} from "./page"
import {Unit} from "./unit"

export const CenterPositionDef:PropDef<Point> = {
    base: 'Point',
    readonly: false,
    default: () => new Point(0, 0),
    toJSON: (v) => ({type:'value',value:v.toJSON()}),
    fromJSON: (json ) => Point.fromJSON(json.value),
}
export const BoundsDef:PropDef<Bounds> = {
    base: 'Bounds',
    readonly: false,
    default: ()=> new Bounds(0, 0, 1, 1),
    toJSON: (v) => ({type:'value',value:v.toJSON()}),
    fromJSON: (json ) => Bounds.fromJSON(json.value),
}
export const SizeDef:PropDef<Size> = {
    base:'Size',
    readonly:false,
    default: () => new Size(8.5,11),
    toJSON: (v) => ({type:'value',value:v.toJSON()}),
    fromJSON:(json) => Size.fromJSON(json.value)
}
export const FillDef:PropDef<string> = {
    base: 'string',
    readonly: false,
    custom:'css-color',
    default:()=> '#cccccc',
    canProxy:true
}
export const StrokeFillDef:PropDef<string> = {
    base: 'string',
    readonly: false,
    custom:'css-color',
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
    toJSON: (v) => {
        const ret:JSONPropValue = {
            type:'value',
            value: v
        }
        return ret
    }
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

