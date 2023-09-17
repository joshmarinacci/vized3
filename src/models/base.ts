import {genId} from "josh_js_util"
import {useEffect, useState} from "react"

import {JSONPropValue} from "../exporters/json"

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
export type WrapperAnyCallback<Type> = (t:Type) => void
export type DefList<Type> = Record<keyof Type, PropDef<Type[keyof Type]>>
export type PropValues<Type> = Partial<Record<keyof Type, Type[keyof Type]>>

export class PropsBase<Type> {
    private listeners: Map<keyof Type, WrapperCallback<Type[keyof Type]>[]>
    private all_listeners: WrapperAnyCallback<Type>[]
    private values: Map<keyof Type, Type[keyof Type]>
    private defs: Map<keyof Type, PropDef<Type[keyof Type]>>
    _id: string

    constructor(defs: DefList<Type>, options?: PropValues<Type>) {
        this._id = genId("Wrapper")
        this.values = new Map()
        this.defs = new Map()
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

    getPropValue<K extends keyof Type>(name: K): Type[K] {
        return this.values.get(name) as Type[K]
    }

    setPropValue<K extends keyof Type>(name: K, value: Type[K]) {
        this.values.set(name, value)
        this._fire(name, value)
    }

    _fire<K extends keyof Type>(name: K, value: Type[K]) {
        this._get_listeners(name).forEach(cb => cb(value))
        this._fireAll()
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

    private _get_listeners<K extends keyof Type>(name: K) {
        if (!this.listeners.has(name)) {
            this.listeners.set(name, [])
        }
        return this.listeners.get(name) as WrapperCallback<Type[K]>[]
    }

    toJSON() {
        const obj = {
            class: 'Wrapper',
            props: {},
            id: this._id,
        }
        for (const [k, d] of this.getAllPropDefs()) {
            // obj.props[k] = d.toJSON(this.getPropValue(k))
        }
        return obj
    }

    _fireAll() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.all_listeners.forEach(cb => cb(this))
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
