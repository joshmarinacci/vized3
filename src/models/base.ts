import {genId} from "josh_js_util"
import {useEffect, useState} from "react"

import {JSONPropValue} from "../exporters/json"
import {HistoryBuffer, HistoryEvent} from "./history"

export type UUID = string
export type PropGetter<T> = () => T;
export type PropSetter<T> = (v:T) => void;
export type ToJSONner<T> = (v: T) => JSONPropValue;
export type FromJSONer<T> = (o:JSONPropValue) => T;
export type ToFormatString<T> = (v: T) => string;
export type PropDef<T> = {
    base: 'number' | 'string' | 'boolean' | 'list' | 'Point' | 'Size' | 'Bounds',
    default:PropGetter<T>,
    readonly:boolean,
    custom?:'css-color'|'css-gradient' | 'points' | 'image-asset',
    // subProps?:Record<string,PropDef>
    toJSON?: ToJSONner<T>,
    fromJSON?: FromJSONer<T>
    format?: ToFormatString<T>
    setter?:PropSetter<T>
    getter?:PropGetter<T>
    hidden?:boolean
    canProxy?:boolean
    displayUnit?:'pt'
}

export type WrapperCallback<Value> = (v:Value) => void
export type WrapperAnyCallback<Type> = (evtd:PropChangeEvent<Type>) => void
export type DefList<Type> = Record<keyof Type, PropDef<Type[keyof Type]>>
export type PropValues<Type> = Partial<Record<keyof Type, Type[keyof Type]>>

export class PropChangeEvent<Type> implements HistoryEvent{
    object: PropsBase<Type>
    name: keyof Type
    oldValue: Type[keyof Type]
    newValue: Type[keyof Type]
    constructor(object:PropsBase<Type>, name:keyof Type, oldValue:Type[keyof Type], newValue:Type[keyof Type]) {
        this.object = object
        this.name = name
        this.oldValue = oldValue
        this.newValue = newValue
    }

    async undo() {
        console.log("undoing",this.object.constructor.name,this.name,this.oldValue)
        this.object.setPropValue(this.name, this.oldValue)
    }
    async redo() {
        this.object.setPropValue(this.name, this.newValue)
    }
}
export class CreateObjectEvent<Type> implements HistoryEvent{
    private object: PropsBase<Type>
    constructor(finalObject: PropsBase<Type>) {
        this.object = finalObject
    }
    async undo() {
        console.log("undoing create object")
    }
    async redo() {
        console.log("redoing create object")
    }
}

export class PropsBase<Type> {
    private listeners: Map<keyof Type, WrapperCallback<Type[keyof Type]>[]>
    private all_listeners: WrapperAnyCallback<Type>[]
    private values: Map<keyof Type, Type[keyof Type]>
    private defs: Map<keyof Type, PropDef<Type[keyof Type]>>
    private proxies: Map<keyof Type, PropsBase<any>>
    _id: string

    constructor(defs: DefList<Type>, options?: PropValues<Type>) {
        this._id = genId("Wrapper")
        this.values = new Map()
        this.defs = new Map()
        this.proxies = new Map()
        this.listeners = new Map()
        this.all_listeners = []
        for (const [k, d] of Object.entries(defs)) {
            this.setPropDef(k as keyof Type, d as PropDef<Type[keyof Type]>)
            this.setPropValue(k as keyof Type, this.getPropDef(k as keyof Type).default())
        }
        if (options) this.setProps(options)
    }

    getUUID() {
        return this._id
    }

    setProps(props: PropValues<Type>) {
        for (const [k, d] of Object.entries(props)) {
            this.setPropValue(k as keyof Type, d as Type[keyof Type])
        }
    }

    // DEFS
    getAllPropDefs() {
        return Array.from(this.defs.entries())
    }
    getPropDef<Key extends keyof Type>(name: Key): PropDef<Type[Key]> {
        if (!this.defs.has(name)) throw new Error("")
        return this.defs.get(name) as unknown as PropDef<Type[Key]>
    }
    setPropDef<Key extends keyof Type>(name: Key, def: PropDef<Type[Key]>) {
        this.defs.set(name, def as unknown as PropDef<Type[keyof Type]>)
    }

    // VALUES
    getPropValue<K extends keyof Type>(name: K): Type[K] {
        if(this.proxies.has(name)) {
            return this.proxies.get(name).getPropValue('value')
        }
        return this.values.get(name) as Type[K]
    }
    setPropValue<K extends keyof Type>(name: K, value: Type[K]) {
        const oldValue = this.values.get(name) as Type[K]
        this.values.set(name, value)
        this._fire(name, oldValue, value)
    }

    // Proxy stuff
    getPropProxySource<K extends keyof Type>(name: K) {
        return this.proxies.get(name)
    }
    isPropProxySource<K extends keyof Type>(name: K) {
        return this.proxies.has(name)
    }
    setPropProxySource<K extends keyof Type>(name: K, source: PropsBase<any>) {
        this.proxies.set(name,source)
    }
    removePropProxySource<K extends keyof Type>(name: K) {
        if(this.proxies.has(name)) {
            const value = this.proxies.get(name)?.getPropValue('value')
            this.setPropValue(name,value)
            this.proxies.delete(name)
        }
    }

    // EVENT stuff
    _fireAll(evt:PropChangeEvent<Type>) {
        this.all_listeners.forEach(cb => cb(evt))
    }
    _fire<K extends keyof Type>(name: K, oldValue:Type[K], newValue: Type[K]) {
        this._get_listeners(name).forEach(cb => cb(newValue))
        this._fireAll(new PropChangeEvent<Type>(this,name,oldValue,newValue))
    }
    private _get_listeners<K extends keyof Type>(name: K) {
        if (!this.listeners.has(name)) {
            this.listeners.set(name, [])
        }
        return this.listeners.get(name) as WrapperCallback<Type[K]>[]
    }
    on<K extends keyof Type>(name: K, cb: WrapperCallback<Type[K]>) {
        this._get_listeners(name).push(cb)
    }
    onAny(hand: WrapperAnyCallback<Type>) {
        this.all_listeners.push(hand)
    }
    off<K extends keyof Type>(name: K, cb: WrapperCallback<Type[K]>) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.listeners.set(name, this._get_listeners(name).filter(c => c !== cb))
    }
    offAny(hand: WrapperAnyCallback<Type>) {
        this.all_listeners = this.all_listeners.filter(cb => cb !== hand)
    }
}

export type AllPropsWatcher<T> = (v: T) => void

export function useWatchAllProps<Type>(
    target: PropsBase<Type>,
    watcher?: AllPropsWatcher<PropsBase<Type>>) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        const hand = () => {
            if(watcher)watcher(target)
            setCount(count+1)
        }
        target.onAny(hand)
        return () => target.offAny(hand)
    }, [target])
}

export type PropWatcher<T> = (v: T) => void

export function useWatchProp<Type, Key extends keyof Type>(
    target: PropsBase<Type>,
    name:Key,
    watcher?: PropWatcher<Type[keyof Type]>
) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        const hand = () => {
            if(watcher)watcher(target.getPropValue(name))
            setCount(count+1)
        }
        target.on(name,hand)
        return () => target.off(name,hand)
    }, [target])
}


type Constructor<Type> = new () => Type

export class ObjectManager {
    private CLASS_REGISTRY: Map<string, Constructor<any>>
    private DEFS_REGISTRY: Map<string, DefList<any>>
    private objects: Map<UUID,PropsBase<any>>
    private change_handler:AllPropsWatcher<any>
    private historyBuffer: HistoryBuffer

    constructor() {
        this.CLASS_REGISTRY = new Map()
        this.DEFS_REGISTRY = new Map()
        this.objects = new Map()
        this.historyBuffer = new HistoryBuffer()
        this.change_handler = (evt:PropChangeEvent<any>) => {
            this.historyBuffer.push(evt)
        }
    }
    register<Type>(obj:Constructor<PropsBase<Type>>, defs:DefList<Type>) {
        this.CLASS_REGISTRY.set(obj.name,obj)
        this.DEFS_REGISTRY.set(obj.name, defs)
    }
    lookupClass(name: string) {
        return this.CLASS_REGISTRY.get(name)
    }
    lookupDefs(name: string) {
        return this.DEFS_REGISTRY.get(name)
    }
    registerObject<Type>(uuid: string, finalObject: PropsBase<Type>) {
        this.objects.set(uuid,finalObject)
    }
    registerLiveObject<Type>(finalObject: PropsBase<Type>) {
        this.objects.set(finalObject.getUUID(),finalObject)
        finalObject.onAny(this.change_handler)
        this.historyBuffer.push(new CreateObjectEvent(finalObject))
    }
    hasObject(reference: string) {
        return this.objects.has(reference)
    }
    lookupObject(reference: string) {
        return this.objects.get(reference)
    }
    insertPropChangeEvent<Type>(propChangeEvent: PropChangeEvent<Type>) {
        this.historyBuffer.push(propChangeEvent)
    }

    canUndo() {
        return this.historyBuffer.canUndo()
    }
    canRedo() {
        return this.historyBuffer.canRedo()
    }
    async performUndo() {
        return this.historyBuffer.performUndo()
    }
    async performRedo() {
        return this.historyBuffer.performRedo()
    }
    history() {
        return this.historyBuffer
    }

    make<T>(DocClass: Constructor<T>, opts?:PropValues<T>):PropsBase<T> {
        if(!this.CLASS_REGISTRY.has(DocClass.name)) throw new Error(`cannot create object of type ${DocClass.name}. Missing from reigstry`)
        const ClassCons = this.CLASS_REGISTRY.get(DocClass.name)
        const obj = opts?new ClassCons(opts):new ClassCons()
        this.registerLiveObject(obj)
        return obj
    }

    appendListProp<Type>(obj: PropsBase<Type>, name: keyof Type, child: Type[keyof Type]) {
        const array = (obj.getPropValue(name) as Type[keyof Type][]).slice()
        array.push(child)
        if('watchChild' in obj) {
            obj.watchChild(name,child)
        }
        obj.setPropValue(name,array)
    }

    removeListPropItemByValue<Type>(obj: PropsBase<Type>, name: keyof Type, child: Type[keyof Type]) {
        const before = obj.getPropValue(name)
        const new_children = obj.getPropValue(name).filter(ch => ch !== child)
        if('unwatchChild' in obj) {
            obj.unwatchChild(name,child)
        }
        obj.setPropValue(name,new_children)
        const after = obj.getPropValue(name)
        this.insertPropChangeEvent(new PropChangeEvent<Type>(obj,name,before,after))

    }
}


export const OM = new ObjectManager()

