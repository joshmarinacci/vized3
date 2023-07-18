import {EventTypes, RectDef} from "./om";

type PropSchema<Value> = {
    name: string,
    base: string,
    default: Value,
    restrict?:Value[],
}

const XProp:PropSchema<number> = {
    name:'x',
    base: 'number',
    default: 22,
    restrict:[8,22,33],
}

const RectSchema = {
    name:'rect',
    props: {
        'x':XProp,
        'y': {
            name:'y',
            base:'number',
            default:0,
        },
        'mood': {
            name:'mood',
            base:'string',
            default:'happy',
            restrict:['happy','sad']
        }
    }
}

type RectType = {
    x:number,
    y:number,
    mood:string
}

class RectObject {
    private x: number;
    private y: number;
    constructor() {
        this.x = 3
        this.y = 4
    }
}

type ObjectWrapperEvent = {
    name:string
}
type ObjectWrapperEventHandler = (evt:ObjectWrapperEvent) => void;
type ObjectWrapperEventTypes = 'PropChanged' | 'Deleted'
const PropChanged:ObjectWrapperEventTypes = 'PropChanged'

class ObjWrapper<T> {
    private obj: any
    private def: typeof RectSchema
    private listeners: Map<ObjectWrapperEventTypes, ObjectWrapperEventHandler[]>;
    private props: typeof RectSchema["props"]
    constructor(def:typeof RectSchema, obj:RectObject, init:Partial<T>) {
        this.def = def
        this.props = def.props
        this.obj = obj
        this.listeners = new Map<ObjectWrapperEventTypes,ObjectWrapperEventHandler[]>()
        Object.entries(init).forEach(([k, v], i) => {
            this.obj[k] = v
        })
    }
    addEventListener(type:ObjectWrapperEventTypes, handler:ObjectWrapperEventHandler) {
        this._get_listeners(type).push(handler)
    }
    removeEventListener(type: ObjectWrapperEventTypes, handler: ObjectWrapperEventHandler) {
        this.listeners.set(type, this._get_listeners(type).filter(h => h !== handler))
    }
    private _fire(type: ObjectWrapperEventTypes, event: ObjectWrapperEvent) {
        this._get_listeners(type).forEach(hand => hand(event))
    }

    getPropSchemas() {
        return Object.values(this.def.props)
    }

    hasPropNamed(uuid: keyof typeof RectSchema["props"]) {
        return this.def.props.hasOwnProperty(uuid)
    }

    getPropNamed(name: keyof typeof RectSchema["props"]) {
        return this.obj[this.def.props[name].name]
    }


    getValue<K extends keyof T>(name: K):T[K] {
        return this.obj[name]
    }
    setValue<K extends keyof T>(name: K, value: T[K]):void {
        this.obj[name] = value
    }

    private _get_listeners(type: ObjectWrapperEventTypes):ObjectWrapperEventHandler[] {
        if(!this.listeners.has(type)) this.listeners.set(type,[])
        return this.listeners.get(type) as ObjectWrapperEventHandler[]
    }
}


const obj = new ObjWrapper<RectType>(RectSchema,new RectObject(),{x:1});
const hand:ObjectWrapperEventHandler = (evt) => {
    console.log("an event happened")
}
obj.addEventListener(PropChanged, hand)
const x = obj.getValue('x');
const mood = obj.getValue('mood');
obj.setValue('mood','happy')

// const y:string = obj.getValue('y'); // type error, y is a number
// const z:string = obj.getValue('z'); // type error, there is no z prop
// obj.setValue('x','foo'); // type error, x is a number property
// obj.setValue('mood','angry') // type error, angry is not a valid value for mood
/*

start over. begin with the usage examples then create api types to fit it.

should we subclass a base class, or else its a proxy wrapping a target class which holds the data and
has the app specific methods?  *the second*

The object wrapper:
    * has schema mediated access to all object properties
    * can tell if an object and attribute is valid or not
    * can provide multi-object proxies for editing multiple objects at once
    * provides a unique ID for the object
    * introspection to properties (list of all props, schema for each)
    * event handlers for prop changes, creation, destruction
    * parent / child management and event propagation
    * nice typesafe accessors for props that can be atomic or compound objects

The object manager
    * has a registry of all created wrappers and objects
    * tracks all history of objects
    * serializes and de-serializes objects
    * has registry of the schemas for all objects
    *


 */


export const foo = 'bar'
