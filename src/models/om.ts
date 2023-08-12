import {Bounds, genId, Point, toRadians} from "josh_js_util";

export type PropSetter = (oldObj:any, propname:string, propvalue:any) => any

export type PropSchema = {
    name: string,
    base: 'number' | 'string' | 'object' | 'list' | 'boolean',
    defaultValue:any,
    readonly:boolean,
    custom?:'css-color',
    subProps?:Record<string,PropSchema>,
    setter?:PropSetter,
}

const FillDef:PropSchema = {
    name:'fill',
    base: 'string',
    readonly: false,
    custom:'css-color',
    defaultValue: '#cccccc'
}
const StrokeFillDef:PropSchema = {
    name:'strokeFill',
    base: 'string',
    readonly: false,
    custom:'css-color',
    defaultValue: 'black'
}
const StrokeWidthDef:PropSchema = {
    name:'strokeWidth',
    base: 'number',
    readonly: false,
    defaultValue:1,
}
const NameDef:PropSchema = {
    name:'name',
    base:'string',
    readonly:false,
    defaultValue: 'unnamed',
}
export type ObjectDef = {
    name: string,
    props: Record<string, PropSchema>,
};

export const DocDef:ObjectDef = {
    name:'document',
    props: {
        name: NameDef,
        pages: {
            name:'pages',
            base:'list',
            readonly: false,
            defaultValue:()=>[],
        }
    }
}
export const PageDef: ObjectDef = {
    name: 'page',
    props: {
        name: NameDef,
        children: {
            name: 'children',
            base: 'list',
            readonly: false,
            defaultValue:()=>[],
        }
    }
}
export interface Handle {
    getPosition(): Point;
    setPosition(pos: Point): Promise<void>;
    contains(pt: Point): boolean;
}
export interface DrawableShape {
    drawSelf(ctx:CanvasRenderingContext2D):void
    contains(pt:Point):boolean
    drawSelected(ctx:CanvasRenderingContext2D):void
    getHandle():Handle|null
    intersects(bounds:Bounds):boolean
    getPosition():Point
    setPosition(pos:Point):Promise<void>
}
export const RectDef: ObjectDef = {
    name: 'rect',
    props: {
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
                    defaultValue: 0
                },
                y:{
                    name:'y',
                    base:'number',
                    readonly:false,
                    defaultValue: 0,
                },
                w:{
                    name:'w',
                    base:'number',
                    readonly:false,
                    defaultValue: 100,
                },
                h:{
                    name:'h',
                    base:"number",
                    readonly:false,
                    defaultValue: 100,
                },
            },
            defaultValue: new Bounds(0,0,0,0),
        },
        fill: FillDef,
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
        roundedCornersEnabled: {
            name:'roundedCornersEnabled',
            base:'boolean',
            readonly:false,
            defaultValue: false,
        },
        roundedCornersRadius: {
            name:'roundedCornersRadius',
            base:'number',
            readonly:false,
            defaultValue: 10,
        }
    }
}
export const CircleDef: ObjectDef = {
    name: 'circle',
    props: {
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
                    defaultValue: 0,
                },
                y: {
                    name:'y',
                    base: 'number',
                    readonly: false,
                    defaultValue: 0,
                },
            },
            defaultValue: new Point(100,100)
        },
        radius: {
            name: 'radius',
            base: "number",
            readonly: false,
            defaultValue: 20,
        },
        fill: FillDef,
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef,
    }
}
export const SimpleTextDef: ObjectDef = {
    name:'simple-text',
    props: {
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
                    defaultValue: 0,
                },
                y: {
                    name:'y',
                    base: 'number',
                    readonly: false,
                    defaultValue: 0,
                },
            },
            defaultValue: new Point(100,100),
        },
        text: {
            name:'text',
            readonly: false,
            base: 'string',
            defaultValue: 'hello'
        },
        fontSize: {
            name:'fontSize',
            base: 'number',
            readonly: false,
            defaultValue: 26,
        },
        fill: FillDef,
    }
}

export const PropChanged = 'PropChanged'
export const FamilyPropChanged = 'FamilyPropChanged'
export type EventTypes = typeof PropChanged | typeof FamilyPropChanged
export type EventHandler = (evt:any) => void
export const HistoryChanged = 'HistoryChanged'
export type OMEventTypes = typeof HistoryChanged


export class ObjectProxy<T extends ObjectDef> {
    private listeners: Map<EventTypes, any[]>;
    parent: ObjectProxy<ObjectDef> | null
    def: ObjectDef;
    private uuid: string;
    props:Record<keyof T['props'], any>;

    constructor(om: ObjectManager, def: T, opts: Record<keyof T['props'],any>) {
        this.uuid = genId('object')
        this.def = def
        this.listeners = new Map<EventTypes, any[]>()
        this.parent = null
        this.props = {} as Record<keyof T['props'], any>
        Object.keys(def.props).forEach(name => {
            let prop = def.props[name]
            let val = prop.defaultValue
            if(prop.defaultValue instanceof Function) val = val()
            if(opts[prop.name]) val = opts[prop.name]
            // @ts-ignore
            this.props[prop.name] = val
        })
    }

    getPropValue<K extends keyof T['props']>(key: K) {
        return this.props[key]
    }

    async setPropValue<K extends keyof T['props']>(prop: K, value: any) {
        // @ts-ignore
        const evt = new PropChangeEvent<T>(this, this.def.props[prop], value)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }

    getListProp<K extends keyof T['props']>(prop: K):any[] {
        // @ts-ignore
        if(this.def.props[prop].base !== 'list') throw new Error(`prop not a list: ${prop.name}`)
        return this.props[prop]
    }
    appendListProp<K extends keyof T['props']>(prop: K, obj: any) {
        // @ts-ignore
        const evt:AppendListEvent<T> = new AppendListEvent<T>(this, this.def.props[prop], obj)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }
    async removeListPropByValue<K extends keyof T['props']>(prop: K, obj: any) {
        // @ts-ignore
        const evt:DeleteListEvent<T> = new DeleteListEvent<T>(this, this.def.props[prop], obj)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }
    getListPropAt<K extends keyof T['props']>(prop: K, index: number) {
        return this.props[prop][index]
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
        return this.props[this.def.props[name].name]
    }

    getUUID() {
        return this.uuid
    }
    refresh(prop:PropSchema){}
}


class RectResizeHandle implements Handle {
    private obj: RectClass;
    constructor(obj:RectClass) {
        this.obj = obj
    }
    getPosition():Point {
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

class CircleResizeHandle implements Handle{
    private obj: CircleClass
    constructor(obj:CircleClass) {
        this.obj = obj
    }

    getPosition(): Point {
        let center = this.obj.getPropValue("center")
        let radius = this.obj.getPropValue('radius')
        return center.add(new Point(radius, 0))
    }

    async setPosition(pos: Point) {
        let center = this.obj.getPropValue("center")
        let diff = pos.subtract(center)
        let radius = diff.x
        await this.obj.setPropValue('radius', radius)
    }

    contains(pt: Point) {
        let center = this.obj.getPropValue("center")
        let radius = this.obj.getPropValue('radius')
        let pos = center.add(new Point(radius, 0))
        let b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

export abstract class DrawableClass<T extends ObjectDef> extends ObjectProxy<T> implements DrawableShape {
    abstract contains(pt: Point): boolean;
    abstract drawSelected(ctx: CanvasRenderingContext2D): void;
    abstract drawSelf(ctx: CanvasRenderingContext2D): void;
    abstract getHandle(): Handle | null;
    abstract intersects(bounds: Bounds): boolean;
    abstract getPosition(): Point;
    abstract setPosition(pos: Point): Promise<void>;
}

export class RectClass extends DrawableClass<typeof RectDef> {
    constructor(om:ObjectManager, opts: Record<keyof typeof RectDef.props, any>) {
        super(om, RectDef, opts)
    }
    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.props.fill
        if(this.props.roundedCornersEnabled) {
            let b = this.props.bounds
            let r = this.props.roundedCornersRadius
            ctx.beginPath()
            ctx.roundRect(b.left(),b.top(),b.w,b.h,r)
            ctx.closePath()
            ctx.fill()
        } else {
            ctx.fillRect(this.props.bounds.x, this.props.bounds.y, this.props.bounds.w, this.props.bounds.h)
        }
        ctx.strokeStyle = this.props.strokeFill
        ctx.lineWidth = this.props.strokeWidth
        if(this.props.roundedCornersEnabled) {
            let b = this.props.bounds
            let r = this.props.roundedCornersRadius
            ctx.beginPath()
            ctx.roundRect(b.left(),b.top(),b.w,b.h,r)
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
        ctx.strokeRect(this.props.bounds.x,this.props.bounds.y,this.props.bounds.w,this.props.bounds.h)
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

export class PageClass extends ObjectProxy<typeof PageDef> {
    constructor(om:ObjectManager, opts: Record<keyof typeof PageDef.props, any>) {
        super(om, PageDef, opts)
    }
    hasChildren(): boolean {
        return this.props.children.length > 0
    }
}

export class DocClass extends ObjectProxy<typeof DocDef>{
    constructor(om:ObjectManager, opts: Record<keyof typeof DocDef.props, any>) {
        super(om, DocDef, opts)
    }
}

export class CircleClass extends DrawableClass<typeof CircleDef> {
    constructor(om:ObjectManager, opts: Record<keyof typeof CircleDef.props, any>) {
        super(om,CircleDef,opts)
    }
    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.props.fill
        ctx.beginPath()
        ctx.arc(this.props.center.x,this.props.center.y,this.props.radius,0,toRadians(360))
        ctx.fill()
        ctx.strokeStyle = this.props.strokeFill
        ctx.lineWidth = this.props.strokeWidth
        ctx.stroke()
    }
    contains(pt: Point): boolean {
        return pt.subtract(this.props.center).magnitude() < this.props.radius
    }
    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath()
        ctx.arc(this.props.center.x,this.props.center.y,this.props.radius,0,toRadians(360))
        ctx.stroke()
    }
    getHandle(): Handle {
        return new CircleResizeHandle(this)
    }
    intersects(bounds: Bounds): boolean {
        let center = this.getPropValue('center') as Point
        let rad = this.getPropValue('radius') as number
        let bds = new Bounds(center.x-rad,center.y-rad,rad*2,rad*2)
        return bds.intersects(bounds)
    }
    getPosition(): Point {
        return this.getPropValue('center')
    }
    async setPosition(pos: Point): Promise<void> {
        await this.setPropValue('center', pos)
    }
}

export class SimpleTextClass extends DrawableClass<typeof SimpleTextDef>{
    private metrics: TextMetrics;
    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    constructor(om:ObjectManager, opts: Record<keyof typeof SimpleTextDef.props, any>) {
        super(om,SimpleTextDef, opts)
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
        let bds = new Bounds(this.props.center.x,this.props.center.y-h,this.metrics.width,h)
        return bds.contains(pt)
    }

    drawSelected(ctx: CanvasRenderingContext2D): void {
        let h = this.calcHeight()
        ctx.strokeRect(this.props.center.x,this.props.center.y-h,this.metrics.width,h)
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.props.fill
        ctx.font = this.calcFont()
        ctx.fillText(this.props.text, this.props.center.x,this.props.center.y)
    }

    refresh(prop:PropSchema) {
        if(prop.name === 'text' || prop.name === 'fontSize') {
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
        let bds = new Bounds(center.x,center.y-50,100,50)
        return bds.intersects(bounds)
    }
    getPosition(): Point {
        return this.getPropValue('center')
    }
    async setPosition(pos: Point): Promise<void> {
        await this.setPropValue('center', pos)
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
        if(prop.base === 'boolean') {
            json.props[prop.name] = obj.getPropValue(prop.name)
            return
        }
        throw new Error(`unhandled toJSON type ${prop.base}`)
    })
    return json
}

async function fromJSON<T>(om: ObjectManager, obj: JSONObject):Promise<T> {
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
        if (propSchema.base === 'boolean') {
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
    return (await om.make(def, props)) as T
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

        const list = this.target.getPropValue(this.prop.name)
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
        const list = this.target.getListProp(this.prop.name)
        list.push(this.obj)
        this.obj.setParent(this.target)
    }

    async undo(): Promise<void> {
        const list = this.target.getListProp(this.prop.name)
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

        const list = target.getPropValue(prop.name)
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
        const list = this.target.getPropValue(this.prop.name)
        list.splice(this.index,1)
        this.obj.setParent(null)
    }

    async undo(): Promise<void> {
        const list = this.target.getPropValue(this.prop.name)
        list.splice(this.index,0,this.obj)
        this.obj.setParent(this.target)
    }
}
class CreateObjectEvent<T extends ObjectDef> implements HistoryEvent {
    desc: string;
    uuid: string;
    target: ObjectProxy<T>;
    private om: ObjectManager;
    compressable: boolean;

    constructor(om: ObjectManager, obj:ObjectProxy<any>) {
        this.om = om
        this.om.addObject(obj)
        this.uuid = genId('event:createobject')
        this.desc = 'not implemented'
        this.target = obj
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
class PropChangeEvent<T extends ObjectDef> implements HistoryEvent {
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
        this.oldValue = target.getPropValue(prop.name)
        this.newValue = value
        this.desc = `${prop.name} ${this.oldValue} => ${value}`
        // @ts-ignore
        this.target.props[prop.name] = value
        if(target.refresh) target.refresh(prop)
        this.compressable = true
    }

    async redo(): Promise<void> {
        await this.target.setPropValue(this.prop.name as keyof T['props'], this.newValue)
    }

    async undo(): Promise<void> {
        await this.target.setPropValue(this.prop.name as keyof T['props'], this.oldValue)
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
    make(def: ObjectDef, props: any) {
        let cons = this.lookupConstructor(def.name)
        let obj:ObjectProxy<any> = new cons(def,props)
        const evt = new CreateObjectEvent(this,obj)
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

    async fromJSON<T>(json_obj: JSONDoc): Promise<T> {
        const root = await fromJSON<T>(this, json_obj.root)
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
