import {Bounds, genId, Point, toRadians} from "josh_js_util";

export type PropSetter = (oldObj:any, propname:string, propvalue:any) => any

export type PropSchema = {
    name: string,
    base: 'number' | 'string' | 'object' | 'list' | 'boolean',
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
const StrokeFillDef:PropSchema = {
    name:'strokeFill',
    base: 'string',
    readonly: false,
    custom:'css-color',
}
const StrokeWidthDef:PropSchema = {
    name:'strokeWidth',
    base: 'number',
    readonly: false,
}

export type ObjectDef = {
    name: string,
    props: Record<string, PropSchema>,
};

export const DocDef:ObjectDef = {
    name:'document',
    props: {
        uuid: UUIDDef,
        name: {
            name:'name',
            base:"string",
            readonly: false,
        },
        pages: {
            name:'pages',
            base:'list',
            readonly: false,
        }
    }
}
export type DocType = {
    pages:[]
    name:string,
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

export const PageDef: ObjectDef = {
    name: 'page',
    props: {
        uuid: UUIDDef,
        name: {
            name:'name',
            base:"string",
            readonly: false,
        },
        children: {
            name: 'children',
            base: 'list',
            readonly: false,
        }
    }
}
export type  PageType = {
    name:string,
    children:any[]
}
export class PageClass {
    type: 'page'
    children: any[]
    uuid: string
    name: string

    constructor(opts: Record<keyof typeof PageDef.props, any>) {
        this.type = 'page'
        this.name = 'unnamed'
        this.uuid = genId('page')
        this.children = []
    }

    hasChildren(): boolean {
        return this.children.length > 0
    }
}

export interface DrawableShape {
    drawSelf(ctx:CanvasRenderingContext2D):void
    contains(pt:Point):boolean
    drawSelected(ctx:CanvasRenderingContext2D):void
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
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
        roundedCornersEnabled: {
            name:'roundedCornersEnabled',
            base:'boolean',
            readonly:false,
        },
        roundedCornersRadius: {
            name:'roundedCornersRadius',
            base:'number',
            readonly:false,
        }
    }
}
export type RectType = {
    bounds:Bounds,
    fill:string,
    strokeFill:string,
    strokeWidth:number,
    roundedCornersEnabled:boolean,
    roundedCornersRadius:0,
}
export class RectClass implements DrawableShape {
    type: 'square'
    bounds: Bounds
    uuid: string
    name: string
    fill: string
    strokeWidth: number;
    strokeFill: string;
    private roundedCornersEnabled: boolean;
    private roundedCornersRadius: number;
    constructor(opts: Record<keyof typeof RectDef.props, any>) {
        this.type = 'square'
        this.uuid = genId('square')
        this.name = 'unnamed'
        this.bounds = opts.bounds || new Bounds(0, 0, 1, 1)
        this.fill = opts.fill || "#888"
        this.strokeWidth = 1
        this.strokeFill = 'black'
        this.roundedCornersEnabled = false
        this.roundedCornersRadius = 0
    }
    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.fill
        if(this.roundedCornersEnabled) {
            let b = this.bounds
            let r = this.roundedCornersRadius
            ctx.beginPath()
            ctx.roundRect(b.left(),b.top(),b.w,b.h,r)
            ctx.closePath()
            ctx.fill()
        } else {
            ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h)
        }
        ctx.strokeStyle = this.strokeFill
        ctx.lineWidth = this.strokeWidth
        if(this.roundedCornersEnabled) {
            let b = this.bounds
            let r = this.roundedCornersRadius
            ctx.beginPath()
            ctx.roundRect(b.left(),b.top(),b.w,b.h,r)
            ctx.closePath()
            ctx.stroke()
        } else {
            ctx.strokeRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h)
        }
    }
    contains(pt: Point): boolean {
        return this.bounds.contains(pt)
    }
    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.strokeRect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h)
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
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
    }
}
export type CircleType = {
    center: Point,
    radius:number,
    fill:string,
}
export class CircleClass implements DrawableShape {
    private type: string;
    private uuid: string;
    private name: string;
    center: Point;
    radius: number;
    fill: string;
    strokeWidth: number;
    strokeFill: string;
    constructor(opts: Record<keyof typeof CircleDef.props, any>) {
        this.type = 'circle'
        this.uuid = genId('circle')
        this.name = 'unnamed'
        this.center = opts.center || new Point(50,50)
        this.radius = 20
        this.fill = "#ccc"
        this.strokeWidth = 1
        this.strokeFill = 'black'
    }
    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.fill
        ctx.beginPath()
        ctx.arc(this.center.x,this.center.y,this.radius,0,toRadians(360))
        ctx.fill()
        ctx.strokeStyle = this.strokeFill
        ctx.lineWidth = this.strokeWidth
        ctx.stroke()
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

export const SimpleTextDef: ObjectDef = {
    name:'simple-text',
    props: {
        uuid:UUIDDef,
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
        text: {
            name:'text',
            readonly: false,
            base: 'string',
        },
        fontSize: {
            name:'fontSize',
            base: 'number',
            readonly: false
        },
        fill: FillDef,
    }
}
export type SimpleTextType = {
    center: Point,
    text: string,
    fill:string,
    fontSize:number
}
export class SimpleTextClass implements DrawableShape {
    private type: string;
    private uuid: string;
    private name: string;
    private text: string;
    private center: any;
    private fill: string;
    private metrics: TextMetrics;
    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private fontSize: number;
    constructor(opts: Record<keyof typeof SimpleTextDef.props, any>) {
        this.fill = opts.fill || "#888"
        this.type = 'simple-text'
        this.uuid = genId('simple-text')
        this.text = opts.text || "no text"
        this.name = 'unnamed'
        this.fontSize = opts.fontSize || 24
        this.center = opts.center || new Point(50,50)
        this.can = document.createElement('canvas')
        this.can.width = 100
        this.can.height = 100
        this.ctx = this.can.getContext('2d') as CanvasRenderingContext2D
        this.ctx.font = this.calcFont()
        this.metrics = this.ctx.measureText(this.text)
    }
    private calcHeight() {
        return this.metrics.actualBoundingBoxAscent + this.metrics.actualBoundingBoxDescent
    }
    contains(pt: Point): boolean {
        let h = this.calcHeight()
        let bds = new Bounds(this.center.x,this.center.y-h,this.metrics.width,h)
        return bds.contains(pt)
    }

    drawSelected(ctx: CanvasRenderingContext2D): void {
        let h = this.calcHeight()
        ctx.strokeRect(this.center.x,this.center.y-h,this.metrics.width,h)
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.fill
        ctx.font = this.calcFont()
        ctx.fillText(this.text, this.center.x,this.center.y)
    }

    refresh(prop:PropSchema) {
        if(prop.name === 'text' || prop.name === 'fontSize') {
            this.ctx.font = this.calcFont()
            this.metrics = this.ctx.measureText(this.text)
        }
    }

    private calcFont() {
        return `${this.fontSize}pt sans-serif`
    }
}


export const PropChanged = 'PropChanged'
export const FamilyPropChanged = 'FamilyPropChanged'
export type EventTypes = typeof PropChanged | typeof FamilyPropChanged
export type EventHandler = (evt:any) => void
export const HistoryChanged = 'HistoryChanged'
export type OMEventTypes = typeof HistoryChanged


export class ObjectProxy<T> {
    obj: any;
    private listeners: Map<EventTypes, any[]>;
    parent: ObjectProxy<ObjectDef> | null
    def: ObjectDef;
    private uuid: string;

    constructor(om: ObjectManager, def: ObjectDef, props: Partial<T>) {
        this.uuid = genId('proxy')
        let cons = om.lookupConstructor(def.name)
        this.obj = new cons(props)
        this.def = def
        Object.entries(props).forEach(([a, b], i) => {
            this.obj[a] = b
        })
        this.listeners = new Map<EventTypes, any[]>()
        this.parent = null
    }

    getPropValue<K extends keyof T>(key: K):T[K] {
        return this.obj[key]
    }

    async setPropValue<K extends keyof T>(prop: K, value: T[K]) {
        // @ts-ignore
        const evt = new PropChangeEvent<T>(this, this.def.props[prop], value)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }

    getListProp<K extends keyof T>(prop: K):any[] {
        // @ts-ignore
        if(this.def.props[prop].base !== 'list') throw new Error(`prop not a list: ${prop.name}`)
        return this.obj[prop]
    }
    appendListProp<K extends keyof T>(prop: K, obj: any) {
        // @ts-ignore
        const evt:AppendListEvent<T> = new AppendListEvent<T>(this, this.def.props[prop], obj)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }
    async removeListPropByValue<K extends keyof T>(prop: K, obj: any) {
        // @ts-ignore
        const evt:DeleteListEvent<T> = new DeleteListEvent<T>(this, this.def.props[prop], obj)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }
    getListPropAt<K extends keyof T>(prop: K, index: number) {
        return this.obj[prop][index]
    }

    private _get_listeners(type: EventTypes):EventHandler[] {
        if(!this.listeners.has(type)) this.listeners.set(type,[])
        return this.listeners.get(type) as EventHandler[]
    }

    addEventListener(type: EventTypes, handler: EventHandler) {
        this._get_listeners(type).push(handler)
    }
    removeEventListener(type: EventTypes, handler: EventHandler) {
        this.listeners.set(type, this._get_listeners(type).filter(h => h !== handler))
    }

    private _fire(type: EventTypes, value: any) {
        if (!this.listeners.get(type)) this.listeners.set(type, [])
        // @ts-ignore
        this.listeners.get(type).forEach(cb => cb(value))
    }

    setParent(parent: ObjectProxy<any>|null) {
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

    getUUID() {
        return this.uuid
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

function toJSON(obj: ObjectProxy<any>): JSONObject {
    const json: JSONObject = {
        name: obj.def.name,
        props: {},
    }
    obj.getPropSchemas().forEach(prop => {
        // console.log("prop is",pop)
        if (prop.base === 'string') {
            json.props[prop.name] = obj.getPropValue(prop.name)
            return
        }
        if (prop.base === 'list') {
            let arr: JSONObject[] = []
            let list = obj.getPropValue(prop.name)
            list.forEach((val: ObjectProxy<ObjectDef>) => {
                arr.push(toJSON(val))
            })
            json.props[prop.name] = arr
            return
        }
        if (prop.base === 'object') {
            let val = obj.getPropValue(prop.name)
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
            json.props[prop.name] = obj.getPropValue(prop.name)
            return
        }
        throw new Error(`unhandled toJSON type ${prop.base}`)
    })
    return json
}

async function fromJSON<T>(om: ObjectManager, obj: JSONObject): Promise<ObjectProxy<T>> {
    const def: ObjectDef = await om.lookupDef(obj.name) as ObjectDef
    const props: Record<string, any> = {}
    for (let key of Object.keys(def.props)) {
        const propSchema = def.props[key]
        if (propSchema.base === 'string') {
            props[key] = obj.props[key]
            continue
        }
        if (propSchema.base === 'number') {
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
            if (key === 'center') {
                props[key] = Point.fromJSON(obj.props[key])
                continue
            }
        }
        throw new Error(`cant restore property ${key}`)
    }
    return await om.make<T>(def, props as Partial<T>)
}


/// history log events
interface HistoryEvent {
    uuid:string
    desc: string
    compressable: boolean
    undo():Promise<void>
    redo():Promise<void>
}
class AppendListEvent<T> implements HistoryEvent {
    target: ObjectProxy<ObjectDef>
    def: ObjectDef
    prop: PropSchema
    oldValue:any
    newValue:any
    obj: ObjectProxy<ObjectDef>
    desc: string;
    uuid: string;
    compressable: boolean;
    constructor(target:ObjectProxy<ObjectDef>, prop: PropSchema, obj: ObjectProxy<ObjectDef>) {
        this.uuid = genId('event:appendlist')
        this.target = target
        this.def = target.def
        this.prop = prop
        this.obj = obj

        const list = this.target.obj[this.prop.name]
        const oldList = list.slice()
        list.push(this.obj)
        this.obj.setParent(this.target)
        const newList = list.slice()
        this.oldValue = oldList
        this.newValue = newList
        this.desc = `added element`
        this.compressable = false
    }


    async redo(): Promise<void> {
        const list = this.target.obj[this.prop.name]
        list.push(this.obj)
        this.obj.setParent(this.target)
    }

    async undo(): Promise<void> {
        const list = this.target.obj[this.prop.name]
        list.splice(list.length-1,1)
        this.obj.setParent(null)
    }
}
class DeleteListEvent<T> implements HistoryEvent {
    target: ObjectProxy<any>
    def: ObjectDef
    prop: PropSchema
    oldValue:any
    newValue:any
    desc: string;
    uuid: string;
    index: number
    obj: ObjectProxy<any>
    compressable: boolean;
    constructor(target:ObjectProxy<any>, prop:PropSchema, obj:ObjectProxy<any>) {
        this.uuid = genId('event:deletelist')
        this.target = target
        this.def = target.def
        this.prop = prop
        this.desc = `deleted element`

        const list = target.obj[prop.name]
        const oldList = list.slice()
        this.obj = obj
        this.index = list.indexOf(this.obj)
        if(this.index >= 0) {
            list.splice(this.index,1)
        }
        const newList = list.slice()
        this.oldValue = oldList
        this.newValue = newList
        this.obj.setParent(null)
        this.compressable = false
    }

    async redo(): Promise<void> {
        const list = this.target.obj[this.prop.name]
        list.splice(this.index,1)
        this.obj.setParent(null)
    }

    async undo(): Promise<void> {
        const list = this.target.obj[this.prop.name]
        list.splice(this.index,0,this.obj)
        this.obj.setParent(this.target)
    }
}
class CreateObjectEvent<T> implements HistoryEvent {
    desc: string;
    uuid: string;
    target: ObjectProxy<T>;
    private om: ObjectManager;
    compressable: boolean;

    constructor(om: ObjectManager, def: ObjectDef, props: Partial<T>) {
        this.om = om
        let proxy:ObjectProxy<T> = new ObjectProxy<T>(om,def, props)
        this.om.addObject(proxy)
        this.uuid = genId('event:createobject')
        this.desc = 'not implemented'
        this.target = proxy
        this.desc = `created object from def ${this.target.def.name}`
        this.compressable = false
    }

    async redo(): Promise<void> {
        await this.om.addObject(this.target)
    }
    async undo(): Promise<void> {
        await this.om.removeObject(this.target)
    }
}

class DeleteObjectEvent<T> implements HistoryEvent {
    desc: string;
    uuid: string;
    compressable: boolean
    constructor() {
        this.uuid = genId('event:deleteobject')
        this.desc = 'not implemented'
        this.compressable = false
    }

    redo(): Promise<void> {
        throw new Error("not implemented")
    }

    undo(): Promise<void> {
        throw new Error("not implemented")
    }

}
class PropChangeEvent<T> implements HistoryEvent {
    target: ObjectProxy<T>
    def: ObjectDef
    prop: PropSchema
    oldValue:any
    newValue:any
    desc: string;
    uuid: string;
    compressable: boolean;
    constructor(target:ObjectProxy<T>, prop:PropSchema, value:any) {
        this.uuid = genId('event:propchange')
        this.target = target
        this.def = target.def
        this.prop = prop
        this.oldValue = target.obj[prop.name]
        this.newValue = value
        this.desc = `${prop.name} ${target.obj[prop.name]} => ${value}`
        this.target.obj[prop.name] = value
        if(target.obj.refresh) target.obj.refresh(prop)
        this.compressable = true
    }

    async redo(): Promise<void> {
        await this.target.setPropValue(this.prop.name as keyof T, this.newValue)
    }

    async undo(): Promise<void> {
        await this.target.setPropValue(this.prop.name as keyof T, this.oldValue)
    }

    compressWithSelf(recent: PropChangeEvent<T>) {
        this.newValue = recent.newValue
    }
}

export class ObjectManager {
    private defs: Map<string, ObjectDef>
    private classes: Map<string, any>
    private _proxies: Map<string, ObjectProxy<ObjectDef>>
    private global_prop_change_handler: (e:any) => void;
    private changes: HistoryEvent[]
    private _undoing: boolean;
    private current_change_index: number;
    private listeners:Map<OMEventTypes,[]>
    private compressing: boolean;

    constructor() {
        this.listeners = new Map()
        this.defs = new Map()
        this.classes = new Map()
        this._proxies = new Map()
        this.changes = []
        this._undoing = false
        this.current_change_index = -1
        this.compressing = false
        this.global_prop_change_handler = (evt:PropChangeEvent<any>) => {
            if(this._undoing) return
            if(this.changes.length > this.current_change_index+1) {
                this.changes = this.changes.slice(0,this.current_change_index+1)
            }
            this.changes.push(evt)
            this.current_change_index++
            this._fire(HistoryChanged, {})
        }
    }
    addEventListener(type: OMEventTypes, cb: (evt: any) => void) {
        if (!this.listeners.get(type)) this.listeners.set(type, [])
        // @ts-ignore
        this.listeners.get(type).push(cb)
    }
    removeEventListener(type: OMEventTypes, cb: any) {
        if (!this.listeners.get(type)) this.listeners.set(type, [])
        // @ts-ignore
        this.listeners.set(type, this.listeners.get(type).filter(c => c !== cb))
    }
    private _fire(type: OMEventTypes, value: any) {
        if (!this.listeners.get(type)) this.listeners.set(type, [])
        // @ts-ignore
        this.listeners.get(type).forEach(cb => cb(value))
    }
    make<T>(def: ObjectDef, props: Partial<T>):ObjectProxy<T> {
        const evt = new CreateObjectEvent<T>(this,def,props)
        this.changes.push(evt)
        this.current_change_index++
        evt.target.addEventListener(PropChanged, this.global_prop_change_handler)
        return evt.target
    }

    async lookupDef(name: string) {
        if (!this.defs.has(name)) throw new Error(`cannot restore without def for ${name}`)
        return this.defs.get(name)
    }
    lookupConstructor(name: string) {
        if (!this.classes.has(name)) throw new Error(`cannot restore without class for ${name}`)
        return this.classes.get(name)
    }

    async toJSON(root: ObjectProxy<any>) {
        const doc: JSONDoc = {
            version: 1,
            root: toJSON(root),
        }
        return Promise.resolve(doc)
    }

    async fromJSON<T>(json_obj: JSONDoc): Promise<ObjectProxy<T>> {
        const root: ObjectProxy<T> = await fromJSON<T>(this, json_obj.root)
        return root
    }

    registerDef(def: ObjectDef, clazz:any) {
        this.defs.set(def.name, def)
        this.classes.set(def.name, clazz)
    }

    canUndo() {
        if(this.current_change_index >= 0) return true
        return false
    }

    canRedo() {
        if(this.current_change_index < this.changes.length-1) return true
        return false
    }

    async performUndo() {
        if(!this.canUndo()) return
        let recent = this.changes[this.current_change_index]
        this._undoing = true
        await recent.undo()
        this._undoing = false
        this.current_change_index--
        this._fire(HistoryChanged, {})
    }

    async performRedo() {
        if(!this.canRedo()) return
        this.current_change_index++
        let recent = this.changes[this.current_change_index]
        this._undoing = true
        await recent.redo()
        this._undoing = false
        this._fire(HistoryChanged, {})
    }

    dumpHistory() {
        console.log("len",this.changes.length, "current",this.current_change_index)
        let changes = this.changes.map((ch,i) => {
            const active = (i === this.current_change_index)
            return `${active?'*':' '} ${ch.uuid}: ${ch.desc} ${ch.compressable?'!':'_'}`
        }).join("\n")

        console.log(`history
${changes}`)
        // console.log('can undo',this.canUndo(), 'can redo', this.canRedo())
    }

    history() {
        return this.changes
    }

    hasObject(uuid: string) {
        return this._proxies.has(uuid)
    }

    async removeObject(target: ObjectProxy<any>) {
        this._proxies.delete(target.getUUID())
    }

    addObject(proxy: ObjectProxy<any>) {
        this._proxies.set(proxy.getUUID(),proxy)
    }

    setCompressingHistory(compressing: boolean) {
        this.compressing = compressing
        if(!compressing) {
            while(this.compressHistory()) { }
            // console.log("compressing")
            let last = this.changes[this.current_change_index]
            if(last instanceof PropChangeEvent) {
                last.compressable = false
            }
            // this.dumpHistory()
        }
    }

    private compressHistory() {
        let recent = this.changes[this.current_change_index]
        if(recent instanceof PropChangeEvent) {
            if(this.current_change_index-1 > 0) {
                let prev = this.changes[this.current_change_index - 1]
                if(prev instanceof PropChangeEvent && (prev as PropChangeEvent<any>).compressable) {
                    if(prev.prop.name === recent.prop.name) {
                        prev.compressWithSelf(recent)
                        this.changes.splice(this.current_change_index, 1)
                        this.current_change_index -= 1
                        return true
                    }
                }
            }
        }
        return false
    }
}
