import {Bounds, genId, Point, toRadians} from "josh_js_util";

export type PropSetter = (oldObj:any, propname:string, propvalue:any) => any

export type PropSchema = {
    name: string,
    base: 'number' | 'string' | 'object' | 'list',
    readonly:boolean,
    custom?:'css-color',
    subProps?:Record<string,PropSchema>,
    setter?:PropSetter,
}

const UUIDDef:PropSchema = {
    name: 'uuid',
    base: 'string',
    readonly: true,
}
const FillDef:PropSchema = {
    name:'fill',
    base: 'string',
    readonly: false,
    custom:'css-color',
}

export type ObjectDef = {
    name: string,
    props: Record<string, PropSchema>,
};

export const DocDef:ObjectDef = {
    name:'document',
    props: {
        pages: {
            name:'pages',
            base:'list',
            readonly: false,
        }
    }
}
export const PageDef: ObjectDef = {
    name: 'page',
    props: {
        children: {
            name: 'children',
            base: 'list',
            readonly: false,
        }
    }
}
export const RectDef: ObjectDef = {
    name: 'rect',
    props: {
        uuid: UUIDDef,
        bounds: {
            name: 'bounds',
            base: 'object',
            readonly: false,
            setter: (obj,name,value) => {
                let old_bounds = obj as Bounds;
                let new_bounds = old_bounds.copy()
                // @ts-ignore
                new_bounds[name] = value
                return new_bounds;
            },
            subProps:{
                x:{
                    name:'x',
                    base:'number',
                    readonly:false,
                },
                y:{
                    name:'y',
                    base:'number',
                    readonly:false,
                },
                w:{
                    name:'w',
                    base:'number',
                    readonly:false,
                },
                h:{
                    name:'h',
                    base:"number",
                    readonly:false,
                },
            }
        },
        fill: FillDef,
    }
}


export const CircleDef: ObjectDef = {
    name: 'circle',
    props: {
        uuid: UUIDDef,
        center: {
            name: 'center',
            base: 'object',
            readonly: false,
            setter: (obj,name,value) => {
                let pt = obj as Point;
                let pt2 = pt.clone()
                // @ts-ignore
                pt2[name] = value
                return pt2;
            },
            subProps:{
                x: {
                    name:'x',
                    base: "number",
                    readonly: false,
                },
                y: {
                    name:'y',
                    base: 'number',
                    readonly: false,
                },
            }
        },
        radius: {
            name: 'radius',
            base: "number",
            readonly: false,
        },
        fill: FillDef,
    }

}

export class DocClass {
    type:'document'
    uuid: string
    name: string
    pages: []
    private unit: string;
    constructor(opts: Record<keyof typeof DocDef.props, any>) {
        this.type = 'document'
        this.name = 'unnamed'
        this.pages = []
        this.unit = "mm"
        this.uuid = genId('document')
    }
}

export interface DrawableShape {
    drawSelf(ctx:CanvasRenderingContext2D):void
    contains(pt:Point):boolean
    drawSelected(ctx:CanvasRenderingContext2D):void
}
export class RectClass implements DrawableShape {
    type: 'square'
    bounds: Bounds
    uuid: string
    name: string
    fill: string

    constructor(opts: Record<keyof typeof RectDef.props, any>) {
        this.type = 'square'
        this.uuid = genId('square')
        this.name = 'unnamed'
        this.bounds = opts.bounds || new Bounds(0, 0, 1, 1)
        this.fill = opts.fill || "red"
    }
    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.fill
        ctx.fillRect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h)
    }
    contains(pt: Point): boolean {
        return this.bounds.contains(pt)
    }
    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.strokeRect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h)
    }
}
export class PageClass {
    type: 'page'
    children: any[]
    uuid: string

    constructor(opts: Record<keyof typeof PageDef.props, any>) {
        this.type = 'page'
        this.uuid = genId('page')
        this.children = []
    }

    hasChildren(): boolean {
        return this.children.length > 0
    }
}
export class CircleClass implements DrawableShape {
    private type: string;
    private uuid: string;
    private name: string;
    center: Point;
    radius: number;
    fill: string;
    constructor(opts: Record<keyof typeof CircleDef.props, any>) {
        this.type = 'circle'
        this.uuid = genId('circle')
        this.name = 'unnamed'
        this.center = opts.center || new Point(50,50)
        this.radius = 20
        this.fill = "red"

    }
    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.fill
        ctx.beginPath()
        ctx.arc(this.center.x,this.center.y,this.radius,0,toRadians(360))
        ctx.fill()
    }
    contains(pt: Point): boolean {
        return pt.subtract(this.center).magnitude() < this.radius
    }
    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath()
        ctx.arc(this.center.x,this.center.y,this.radius,0,toRadians(360))
        ctx.stroke()
    }
}




export const PropChanged = 'PropChanged'
export const FamilyPropChanged = 'FamilyPropChanged'
export type EventTypes = typeof PropChanged | typeof FamilyPropChanged

export class ObjectProxy<T extends ObjectDef> {
    obj: any;
    private listeners: Map<EventTypes, any[]>;
    private parent: ObjectProxy<ObjectDef> | null
    def: T;

    constructor(om: ObjectManager, def: T, props: Record<keyof T,any>) {
        let cons = om.lookupConstructor(def.name)
        this.obj = new cons(props)
        this.def = def
        Object.entries(props).forEach(([a, b], i) => {
            this.obj[a] = b
        })
        this.listeners = new Map<EventTypes, any[]>()
        this.parent = null
    }

    getPropValue(prop: PropSchema) {
        return this.obj[prop.name]
    }

    async setPropValue(prop: PropSchema, value: any) {
        this.obj[prop.name] = value
        this._fire(PropChanged, value)
        if (this.parent) this.parent._fire(FamilyPropChanged, value)
    }

    getListProp(prop: PropSchema):ObjectProxy<ObjectDef>[] {
        if(prop.base !== 'list') throw new Error(`prop not a list: ${prop.name}`)
        return this.obj[prop.name]
    }
    appendListProp(prop: PropSchema, obj: ObjectProxy<ObjectDef>) {
        this.obj[prop.name].push(obj)
        obj.setParent(this)
    }

    getListPropAt(prop: PropSchema, index: number) {
        return this.obj[prop.name][index]
    }

    addEventListener(type: EventTypes, cb: (evt: any) => void) {
        if (!this.listeners.get(type)) this.listeners.set(type, [])
        // @ts-ignore
        this.listeners.get(type).push(cb)
    }
    removeEventListener(type: EventTypes, cb: any) {
        if (!this.listeners.get(type)) this.listeners.set(type, [])
        // @ts-ignore
        this.listeners.set(type, this.listeners.get(type).filter(c => c !== cb))
    }

    private _fire(type: EventTypes, value: any) {
        if (!this.listeners.get(type)) this.listeners.set(type, [])
        // @ts-ignore
        this.listeners.get(type).forEach(cb => cb(value))
    }

    private setParent(parent: ObjectProxy<any>) {
        this.parent = parent
    }

    getPropSchemas() {
        return Object.values(this.def.props)
    }

    hasPropNamed(uuid: string) {
        return this.def.props.hasOwnProperty(uuid)
    }

    getPropNamed(name: string) {
        return this.obj[this.def.props[name].name]
    }

}

export type JSONObject = {
    name: string
    props: Record<string, any>
}
export type JSONDoc = {
    version: number
    root: JSONObject
}

function toJSON(obj: ObjectProxy<ObjectDef>): JSONObject {
    const json: JSONObject = {
        name: obj.def.name,
        props: {},
    }
    obj.getPropSchemas().forEach(prop => {
        // console.log("prop is",pop)
        if (prop.base === 'string') {
            json.props[prop.name] = obj.getPropValue(prop)
            return
        }
        if (prop.base === 'list') {
            let arr: JSONObject[] = []
            let list = obj.getPropValue(prop)
            list.forEach((val: ObjectProxy<ObjectDef>) => {
                arr.push(toJSON(val))
            })
            json.props[prop.name] = arr
            return
        }
        if (prop.base === 'object') {
            let val = obj.getPropValue(prop)
            if (val instanceof Bounds) {
                json.props[prop.name] = val.toJSON()
                return
            }
            if (val instanceof Point) {
                json.props[prop.name] = val.toJSON()
                return
            }
            throw new Error(`unhandled toJSON object type ${prop.name}`)
        }
        if(prop.base === 'number') {
            json.props[prop.name] = obj.getPropValue(prop)
            return
        }
        throw new Error(`unhandled toJSON type ${prop.base}`)
    })
    return json
}

async function fromJSON(om: ObjectManager, obj: JSONObject): Promise<ObjectProxy<ObjectDef>> {
    const def: ObjectDef = await om.lookupDef(obj.name) as ObjectDef
    const props: Record<string, any> = {}
    for (let key of Object.keys(def.props)) {
        const propSchema = def.props[key]
        if (propSchema.base === 'string') {
            props[key] = obj.props[key]
            continue
        }
        if (propSchema.base === 'list') {
            props[key] = []
            const vals = obj.props[key] as JSONObject[]
            for (let val of vals) {
                let obj_val = await fromJSON(om, val)
                props[key].push(obj_val)
            }
            continue
        }
        if (propSchema.base === 'object') {
            if (key === 'bounds') {
                props[key] = Bounds.fromJSON(obj.props[key])
                continue
            }
        }
        throw new Error(`cant restore property ${key}`)
    }
    return await om.make(def, props)
}

export class ObjectManager {
    private defs: Map<string, ObjectDef>
    private classes: Map<string, any>
    private global_prop_change_handler: (e:any) => void;

    constructor() {
        this.defs = new Map()
        this.classes = new Map()
        this.global_prop_change_handler = (e) => {
            console.log("prop has changed")
        }
    }

    make(def: ObjectDef, props: Record<string, any>) {
        let op = new ObjectProxy(this,def, props)
        op.addEventListener(PropChanged, this.global_prop_change_handler)
        return op
    }

    async lookupDef(name: string) {
        if (!this.defs.has(name)) throw new Error(`cannot restore without def for ${name}`)
        return this.defs.get(name)
    }
    lookupConstructor(name: string) {
        if (!this.classes.has(name)) throw new Error(`cannot restore without class for ${name}`)
        return this.classes.get(name)
    }

    async toJSON(root: ObjectProxy<ObjectDef>) {
        const doc: JSONDoc = {
            version: 1,
            root: toJSON(root),
        }
        return Promise.resolve(doc)
    }

    async fromJSON(json_obj: JSONDoc): Promise<ObjectProxy<ObjectDef>> {
        const root: ObjectProxy<ObjectDef> = await fromJSON(this, json_obj.root)
        return root
    }

    registerDef(def: ObjectDef, clazz:any) {
        this.defs.set(def.name, def)
        this.classes.set(def.name, clazz)
    }
}
