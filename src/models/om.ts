import {Bounds, genId, Point, Size} from "josh_js_util"

import {JSONObject} from "../exporters/json"
import {lookup_name, Unit} from "./unit"

export type PropSetter = (oldObj:any, propname:string, propvalue:any) => any
export type PropRenderer = (oldObj:ObjectProxy<ObjectDef>, propname:string, propvalue:any) => any
export type PropLoader = (obj:JSONObject, propname:string, propvalue:any) => any

export type PropSchema = {
    name: string,
    base: 'number' | 'string' | 'object' | 'list' | 'boolean' | 'enum',
    defaultValue:any,
    readonly:boolean,
    custom?:'css-color'|'css-gradient' | 'points' | 'image-asset',
    subProps?:Record<string,PropSchema>
    setter?:PropSetter
    hidden?:boolean
    canProxy?:boolean
    displayUnit?:'pt'
}

export type EnumSchema = PropSchema & {
    base:'enum'
    possibleValues:any[]
    renderer:PropRenderer,
    fromJSONValue:PropLoader,
}

export const CenterPositionDef:PropSchema = {
    name:'center',
    base: 'object',
    readonly: false,
    setter: (obj, name, value) => {
        const pt = obj as Point
        const pt2 = pt.copy()
        // @ts-ignore
        pt2[name] = value
        return pt2
    },
    subProps: {
        x: {
            name: 'x',
            base: "number",
            readonly: false,
            defaultValue: 0,
        },
        y: {
            name: 'y',
            base: 'number',
            readonly: false,
            defaultValue: 0,
        },
    },
    defaultValue: new Point(0, 0)
}

export const BoundsDef:PropSchema = {
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
                defaultValue: 1,
            },
            h: {
                name: 'h',
                base: "number",
                readonly: false,
                defaultValue: 1,
            },
        },
        defaultValue: new Bounds(0, 0, 1, 1),
}

export const SizeDef:PropSchema = {
    name:'size',
    base:'object',
    readonly:false,
    subProps: {
        w: {
            name:'w',
            base:'number',
            readonly:false,
            defaultValue: 8.5,
        },
        h: {
            name:'h',
            base:"number",
            readonly:false,
            defaultValue: 11,
        }
    },
    setter: (obj, name, value) => {
        const s_old =obj as Size
        const snew = new Size(s_old.w,s_old.h)
        // @ts-ignore
        snew[name] = value
        return snew
    },
    defaultValue: new Size(8.5,11)
}

export const FillDef:PropSchema = {
    name:'fill',
    base: 'string',
    readonly: false,
    custom:'css-color',
    defaultValue: '#cccccc',
    canProxy:true
}
export const StrokeFillDef:PropSchema = {
    name:'strokeFill',
    base: 'string',
    readonly: false,
    custom:'css-color',
    defaultValue: 'black'
}
export const StrokeWidthDef:PropSchema = {
    name:'strokeWidth',
    base: 'number',
    readonly: false,
    defaultValue:1,
    displayUnit:'pt'
}
export const NameDef:PropSchema = {
    name:'name',
    base:'string',
    readonly:false,
    defaultValue: 'unnamed',
}
export const UnitDef:EnumSchema = {
    name:'unit',
    base:'enum',
    readonly: false,
    possibleValues: Object.keys(Unit),
    defaultValue: Unit.Inch,
    renderer: (target, name, value:keyof typeof Unit) => {
        return Unit[value]
    },
    fromJSONValue: (o,n,v) => {
        return lookup_name(v)
    }
}

export type ObjectDef = {
    name: string,
    props: Record<string, PropSchema>,
};

export const DocDef:ObjectDef = {
    name:'document',
    props: {
        name: NameDef,
        unit: UnitDef,
        pages: {
            name:'pages',
            base:'list',
            readonly: false,
            hidden:true,
            defaultValue:()=>[],
        },
        assets: {
            name:'assets',
            base:'list',
            hidden:true,
            readonly:false,
            defaultValue:()=>[],
        }
    }
}
export const PageDef: ObjectDef = {
    name: 'page',
    props: {
        name: NameDef,
        size: SizeDef,
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

export interface ScaledSurface {
    fillRect(bounds: Bounds, fill: "string"): void;
    strokeRect(bounds: Bounds, strokeFill: string, strokeWidth: number): void;
    outlineRect(bounds: Bounds): void;

    fillRoundRect(bounds: Bounds, roundedCornersRadius: number, fill: string): void;
    strokeRoundRect(bounds: Bounds, roundedCornersRadius: number, strokeFill: string, strokeWidth: number): void;

    fillArc(center: Point, radius: number, startAngle: number, endAngle: number, fill: string): void;
    strokeArc(center: Point, radius: number, startAngle: number, endAngle: number, strokeFill: string, strokeWidth: number): void;
    outlineArc(center: Point, radius: number, startAngle: number, endAngle: number, fill: string): void;

    fillText(text: string, center: Point, fill: string, fontSize: number): void;

    fillLinePath(position: Point, points: Point[], closed: boolean, fill: string): void;
    strokeLinePath(position: Point, points: Point[], closed: boolean, strokeFill: string, strokeWidth: number): void;
    outlineLinePath(position: Point, points: Point[], closed: boolean): void;

    dragRect(dragRect: Bounds): void;

    overlayFillText(s: string, point: Point): void;

    overlayHandle(hand: Handle, color:string): void;

    overlayPoint(point: Point, green: string): void;

    overlayLine(startPoint: Point, endPoint: Point, color: string): void;

    fillImage(bounds: Bounds, img: any): void
}

export interface DrawableShape {
    drawSelf(ctx:ScaledSurface):void
    contains(pt:Point):boolean
    drawSelected(ctx:ScaledSurface):void
    getHandle():Handle|null
    intersects(bounds:Bounds):boolean
    getPosition():Point
    setPosition(pos:Point):Promise<void>
}

export const PropChanged = 'PropChanged'
export const FamilyPropChanged = 'FamilyPropChanged'
export type EventTypes = typeof PropChanged | typeof FamilyPropChanged
export type EventHandler = (evt:any) => void
export const HistoryChanged = 'HistoryChanged'
export type OMEventTypes = typeof HistoryChanged

export class ObjectProxy<T extends ObjectDef> {
    private listeners: Map<EventTypes, any[]>
    parent: ObjectProxy<ObjectDef> | null
    def: ObjectDef
    private uuid: string
    props:Record<keyof T['props'], any>
    private proxies: Map<keyof T['props'], ObjectProxy<any>>
    private om: ObjectManager

    constructor(om: ObjectManager, def: T, opts: Record<keyof T['props'],any>) {
        this.om = om
        this.uuid = genId('object')
        this.def = def
        this.listeners = new Map<EventTypes, any[]>()
        this.parent = null
        this.props = {} as Record<keyof T['props'], any>
        Object.keys(def.props).forEach(name => {
            const prop = def.props[name]
            let val = prop.defaultValue
            if(prop.defaultValue instanceof Function) val = val()
            if(opts[prop.name]) val = opts[prop.name]
            // @ts-ignore
            this.props[prop.name] = val
        })
        this.proxies = new Map()
    }

    getPropValue<K extends keyof T['props']>(key: K):any {
        if(this.proxies.has(key)) {
            // @ts-ignore
            return this.proxies.get(key).getPropValue('value')
        }
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
    async setListPropAt<K extends keyof T['props']>(prop: K, index: number, value:any) {
        const evt:SetListItemEvent<T> = new SetListItemEvent<T>(this, this.def.props[prop], index, value)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }
    async insertListPropAt<K extends keyof T['props']>(prop: K, index: number, value: any) {
        const evt:InsertListItemEvent<T> = new InsertListItemEvent<T>(this, this.def.props[prop], index, value)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
    }
    async removeListPropAt<K extends keyof T['props']>(prop: K, index: number) {
        const evt:RemoveListItemEvent<T> = new RemoveListItemEvent<T>(this, this.def.props[prop], index)
        this._fire(PropChanged, evt)
        if (this.parent) this.parent._fire(FamilyPropChanged, evt)
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
    getPropSchemaNamed(name:string) {
        return this.def.props[name]
    }
    hasPropNamed(uuid: string) {
        return this.def.props.hasOwnProperty(uuid)
    }
    setPropProxySource(name:string, source:ObjectProxy<any>) {
        this.proxies.set(name,source)
    }
    getPropProxySource(name: string):ObjectProxy<any> {
        return this.proxies.get(name)
    }
    removePropProxySource<K extends keyof T['props']>(key:K) {
        if(this.proxies.has(key)) {
            // @ts-ignore
            const value =  this.proxies.get(key).getPropValue('value')
            this.props[key] = value
            this.proxies.delete(key)
        }
    }
    isPropProxySource<K extends keyof T['props']>(key:K) {
        return this.proxies.has(key)
    }
    getUUID() {
        return this.uuid
    }
    refresh(prop:PropSchema){}

    _setUUID(uuid: string) {
        this.uuid = uuid
    }
}


export abstract class DrawableClass<T extends ObjectDef> extends ObjectProxy<T> implements DrawableShape {
    abstract contains(pt: Point): boolean;
    abstract drawSelected(ctx: ScaledSurface): void;
    abstract drawSelf(ctx: ScaledSurface): void;
    abstract getHandle(): Handle | null;
    abstract intersects(bounds: Bounds): boolean;
    abstract getPosition(): Point;
    abstract setPosition(pos: Point): Promise<void>;
    abstract getAlignmentBounds():Bounds;
    abstract translateBy(offset: Point): Promise<void>
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
    desc: string
    uuid: string
    compressable: boolean
    constructor(target:ObjectProxy<ObjectDef>, prop: PropSchema, obj: ObjectProxy<ObjectDef>) {
        this.uuid = genId('event:appendlist')
        this.target = target
        this.def = target.def
        this.prop = prop
        this.obj = obj

        const list = this.target.getPropValue(this.prop.name)
        const oldList = list.slice()
        list.push(this.obj)
        if(this.obj.setParent) this.obj.setParent(this.target)
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
class SetListItemEvent<T> implements HistoryEvent {
    uuid: string
    private target: ObjectProxy<ObjectDef>
    private prop: PropSchema
    compressable: boolean
    desc: string
    constructor(target:ObjectProxy<ObjectDef>, prop: PropSchema, index:number, value:ObjectProxy<ObjectDef>) {
        this.uuid = genId('event:setlistelement')
        this.target = target
        this.prop = prop
        const list = this.target.getPropValue(this.prop.name)
        const oldList = list.slice()
        const newList = list.slice()
        list[index] = value
        this.desc = `set element`
        this.compressable = false
    }

    redo(): Promise<void> {
        return Promise.resolve(undefined)
    }

    undo(): Promise<void> {
        return Promise.resolve(undefined)
    }
}
class InsertListItemEvent<T> implements HistoryEvent {
    uuid: string
    private target: ObjectProxy<ObjectDef>
    private prop: PropSchema
    compressable: boolean
    desc: string
    constructor(target:ObjectProxy<ObjectDef>, prop: PropSchema, index:number, value:ObjectProxy<ObjectDef>) {
        this.uuid = genId('event:setlistelement')
        this.target = target
        this.prop = prop
        const list = this.target.getPropValue(this.prop.name)
        console.log("inserting at", index)
        const oldList = list.slice()
        const newList = list.slice()
        list.splice(index,0,value)
        this.desc = `set element`
        this.compressable = false
    }
    redo(): Promise<void> {
        return Promise.resolve(undefined)
    }
    undo(): Promise<void> {
        return Promise.resolve(undefined)
    }
}
class RemoveListItemEvent<T> implements HistoryEvent {
    uuid: string
    private target: ObjectProxy<ObjectDef>
    private prop: PropSchema
    compressable: boolean
    desc: string
    constructor(target:ObjectProxy<ObjectDef>, prop: PropSchema, index:number) {
        this.uuid = genId('event:dellistelement')
        this.target = target
        this.prop = prop
        const list = this.target.getPropValue(this.prop.name)
        console.log("deleting at", index)
        const oldList = list.slice()
        const newList = list.slice()
        list.splice(index,1)
        this.desc = `del element`
        this.compressable = false
    }

    redo(): Promise<void> {
        return Promise.resolve(undefined)
    }

    undo(): Promise<void> {
        return Promise.resolve(undefined)
    }
}
class DeleteListEvent<T> implements HistoryEvent {
    target: ObjectProxy<any>
    def: ObjectDef
    prop: PropSchema
    oldValue:any
    newValue:any
    desc: string
    uuid: string
    index: number
    obj: ObjectProxy<any>
    compressable: boolean
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
        if(this.obj.setParent) this.obj.setParent(null)
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
    desc: string
    uuid: string
    target: ObjectProxy<T>
    private om: ObjectManager
    compressable: boolean

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
    desc: string
    uuid: string
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
    desc: string
    uuid: string
    compressable: boolean
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
    private global_prop_change_handler: (e:any) => void
    private changes: HistoryEvent[]
    private _undoing: boolean
    private current_change_index: number
    private listeners:Map<OMEventTypes,[]>
    private compressing: boolean

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
    make(def: ObjectDef, props: any, uuid?:string) {
        const cons = this.lookupConstructor(def.name)
        const obj:ObjectProxy<any> = new cons(def,props)
        const evt = new CreateObjectEvent(this,obj)
        this.changes.push(evt)
        this.current_change_index++
        evt.target.addEventListener(PropChanged, this.global_prop_change_handler)
        if(uuid) obj._setUUID(uuid)
        return evt.target
    }

    lookupDef(name: string) {
        if (!this.defs.has(name)) throw new Error(`cannot restore without def for ${name}`)
        return this.defs.get(name)
    }
    lookupConstructor(name: string) {
        if (!this.classes.has(name)) throw new Error(`cannot restore without class for ${name}`)
        return this.classes.get(name)
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
        const recent = this.changes[this.current_change_index]
        this._undoing = true
        await recent.undo()
        this._undoing = false
        this.current_change_index--
        this._fire(HistoryChanged, {})
    }

    async performRedo() {
        if(!this.canRedo()) return
        this.current_change_index++
        const recent = this.changes[this.current_change_index]
        this._undoing = true
        await recent.redo()
        this._undoing = false
        this._fire(HistoryChanged, {})
    }

    dumpHistory() {
        console.log("len",this.changes.length, "current",this.current_change_index)
        const changes = this.changes.map((ch,i) => {
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
    getObject(uuid:string) {
        return this._proxies.get(uuid)
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
            const last = this.changes[this.current_change_index]
            if(last instanceof PropChangeEvent) {
                last.compressable = false
            }
            // this.dumpHistory()
        }
    }

    private compressHistory() {
        const recent = this.changes[this.current_change_index]
        if(recent instanceof PropChangeEvent) {
            if(this.current_change_index-1 > 0) {
                const prev = this.changes[this.current_change_index - 1]
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

export type OO = ObjectProxy<ObjectDef>
