import {Point} from "josh_js_util"
import {canvas_to_blob, forceDownloadBlob} from "josh_web_util"

import {
    ColorAssetClass, ColorAssetDef,
    GradientAssetClass,
    GradientAssetDef,
    ImageAssetClass, ImageAssetDef,
    LinearColorGradient, NumberAssetClass, NumberAssetDef
} from "../models/assets"
import {DefList, PropDef, PropsBase, UUID} from "../models/base"
import {CircleClass, CircleDef} from "../models/circle"
import {DocClass, DocDefs} from "../models/doc"
import {NGonClass, NGonDef} from "../models/ngon"
import {PageClass, PageDefs} from "../models/page"
import {PathShapeClass, PathShapeDef} from "../models/pathshape"
import {RectClass, RectDef} from "../models/rect"
import {SimpleImageClass, SimpleImageDef} from "../models/simpleimage"
import {SimpleTextClass, SimpleTextDef} from "../models/simpletext"
import {GlobalState} from "../models/state"
import {stateToCanvas} from "./png"
import {readMetadata, writeMetadata} from "./vendor"


export type JSONPropReference = {
    type:'reference'
    reference:string,
}
export type JSONPropValue = {
    type:'value',
    value:unknown,
}

export type JSONProp = JSONPropValue | JSONPropReference
export type JSONObject = {
    name: string
    uuid: string
    props: Record<string, JSONProp>
}
export type JSONObjectV1 = {
    name: string
    props: Record<string, object>
}
export type JSONDoc = {
    version: number
    root: JSONObject
}
export type JSONDocReference = {
    uuid:string,
    name:string,
    thumbnail?:string,
    creationDate:Date,
    updateDate:Date,
}
export type JSONDocIndex = {
    docs:JSONDocReference[]
}

type Constructor<Type> = new () => Type
const CLASS_REGISTRY = new Map<string,Constructor<any>>()
const DEFS_REGISTRY = new Map<string,DefList<any>>

function register<Type>(obj:Constructor<PropsBase<Type>>, defs:DefList<Type>) {
    CLASS_REGISTRY.set(obj.name,obj)
    DEFS_REGISTRY.set(obj.name, defs)
}

register(DocClass, DocDefs)
register(PageClass, PageDefs)
register(RectClass, RectDef)
register(CircleClass, CircleDef)
register(PathShapeClass, PathShapeDef)
register(NGonClass, NGonDef)
register(SimpleTextClass, SimpleTextDef)
register(SimpleImageClass, SimpleImageDef)

register(GradientAssetClass, GradientAssetDef)
register(NumberAssetClass, NumberAssetDef)
register(ColorAssetClass, ColorAssetDef)
register(ImageAssetClass, ImageAssetDef)

const ObjectRegistry:Map<UUID,PropsBase<any>> = new Map()

export function propertyToJSON<Type,Key extends keyof Type>(name:Key, prop: PropDef<Type[Key]>, obj: PropsBase<Type>):JSONProp {
    if(obj.isPropProxySource(name)) {
        const ref:JSONPropReference = {
            type:'reference',
            reference: obj.getPropProxySource(name).getUUID()
        }
        return ref
    }
    if(prop.toJSON) return prop.toJSON(obj.getPropValue(name))
    if(prop.custom === 'css-gradient') {
        const v2 = obj.getPropValue(name) as LinearColorGradient
        return ({type:'value', value:v2.toJSON()})
    }
    if(prop.custom === 'points') {
        const v2:Point[] = obj.getPropValue(name) as Point[]
        return ({type:'value', value:v2.map(pt => pt.toJSON())})
    }
    if(prop.base === 'string') return ({ type: "value", value: obj.getPropValue(name) })
    if(prop.base === 'number') return ({  type:"value",  value: obj.getPropValue(name) })
    if(prop.base === 'boolean') return ({ type: "value", value: obj.getPropValue(name) })
    if(prop.base === 'list') {
        const list = obj.getPropValue(name) as []
        const arr:JSONObject[] = list.map(val => toJSONObj(val))
        return {
            type:"value",
            value:arr
        }
    }
    // if(prop.base === 'enum') {
    //     return ({
    //         type:"value",
    //         value: obj.getPropValue(name)
    //     })
    // }
    throw new Error(`unhandled toJSON type ${prop.base} ${name} on ${obj.constructor.name}`)
}
export function toJSONObj<Type>(obj: PropsBase<Type>): JSONObject {
    const json: JSONObject = {
        name: obj.constructor.name,
        props: {},
        uuid: obj.getUUID()
    }
    obj.getAllPropDefs().forEach(([name, prop]) => {
        json.props[name as string] = propertyToJSON(name,prop,obj)
    })
    return json
}
export function toJSONDoc(root: DocClass):JSONDoc {
    return {
        version: 2,
        root: toJSONObj(root),
    }
}
export function saveJSON(state: GlobalState):JSONDoc {
    return toJSONDoc(state.getCurrentDocument())
}

export function propertyFromJSON<Type, Key extends keyof Type>(
    name:Key,
    prop: PropDef<Type[Key]>,
    obj: JSONObject) {
    // console.log("restoring",name,prop,obj)
    const vv: JSONProp = obj.props[name] as JSONProp
    // if (vv.type === 'reference') {
    // }
    const v: JSONPropValue = vv as JSONPropValue
    // if (prop.base === 'enum') {
    //     const schema = prop as EnumSchema
    //     return schema.fromJSONValue(obj, prop.name, v.value)
    // }
    if(prop.fromJSON) return prop.fromJSON(v)
    if (prop.base === 'string') return v.value as string
    if (prop.base === 'number') return v.value as number
    if (prop.base === 'boolean')  return v.value as boolean
    if (prop.base === 'list') {
        const arr = []
        const vals = v.value as JSONObject[]
        for (const val of vals) {
            const obj_val = fromJSONObj(val)
            arr.push(obj_val)
        }
        return arr
    }
    throw new Error(`cannot restore property ${name.toString()} ${vv.toString()}`)
}


export function fromJSONObj<Type>(obj: JSONObject):PropsBase<Type> {
    const Constr = CLASS_REGISTRY.get(obj.name)
    if(!Constr) throw new Error(`cannot restore ${obj.name} because it is not registered `)
    const props: Record<string, object> = {}
    const refs = new Map<keyof Type,PropDef<Type[keyof Type]>>()
    const DEFS = DEFS_REGISTRY.get(obj.name)
    if(!DEFS) throw new Error(`cannot restore ${obj.name} because it is missing from the defs registry`)
    for (const key of Object.keys(obj.props)) {
        const propSchema = DEFS[key]
        const val = obj.props[key]
        if(val.type === 'reference') {
            console.log("skipping reference")
            refs.set(key,propSchema)
        } else {
            props[key] = propertyFromJSON(key,propSchema, obj)
        }
    }
    const finalObject = new Constr(props) as PropsBase<Type>
    finalObject._id = obj.uuid
    ObjectRegistry.set(finalObject.getUUID(),finalObject)
    Array.from(refs.entries()).forEach(([name,d]) => {
        console.log("must restore ref",name,d)
        const vv = obj.props[name] as JSONPropReference
        console.log("looking up the proxy source",vv.reference)
        console.log("proxy loaded?",ObjectRegistry.has(vv.reference))
        if(!ObjectRegistry.has(vv.reference)) {
            throw new Error("cannot restore JSON because reference not loaded yet")
        }
        const source = ObjectRegistry.get(vv.reference) as PropsBase<any>
        console.log("the source is",source)
        finalObject.setPropProxySource(name,source)
    })
    // console.log("final object is",finalObject)
    return finalObject
}

export function fromJSONDoc(json_obj: JSONDoc): DocClass {
    const root = json_obj.root
    const assets = (root.props['assets'] as JSONPropValue).value as JSONObject[]
    const loaded_assets = assets.map(asset => fromJSONObj(asset))
    // now load the rest
    const props: Record<string, object> = {}
    for (const key of Object.keys(DocDefs)) {
        if(key === 'assets') continue
        const propSchema = DocDefs[key]
        props[key] = propertyFromJSON(key,propSchema, root)
    }
    const doc = new DocClass(props)
    doc._id = json_obj.root.uuid
    doc.setPropValue('assets',loaded_assets)
    return doc
}

export async function savePNGJSON(state: GlobalState) {
    const canvas = await stateToCanvas(state)
    const json_obj = toJSONDoc(state.getCurrentDocument())
    const json_string = JSON.stringify(json_obj,null,'    ')

    const blob = await canvas_to_blob(canvas)
    const array_buffer = await blob.arrayBuffer()
    const uint8buffer = new Uint8Array(array_buffer)

    const out_buffer = writeMetadata(uint8buffer as Buffer,{ tEXt: { SOURCE:json_string,  } })
    const final_blob = new Blob([out_buffer as BlobPart], {type:'image/png'})
    // let url = buffer_to_dataurl(out_buffer,"image/png")
    forceDownloadBlob('final_blob.json.png',final_blob)
    // let url = buffer_to_dataurl(out_buffer,"image/png")
    // force_download(url,filename)
}

type Metadata = {tEXt: {keyword: any, SOURCE:any}}

export async function loadPNGJSON(state:GlobalState, file:File):Promise<DocClass> {
    return new Promise((res,rej) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            const buffer = new Uint8Array(reader.result as ArrayBufferLike)
            const metadata = readMetadata(buffer as Buffer) as unknown as Metadata
            console.log("metadata is",metadata)
            if(metadata && metadata.tEXt && metadata.tEXt.SOURCE) {
                const json = JSON.parse(metadata.tEXt.SOURCE)
                const obj = fromJSONDoc(json as JSONDoc)
                res(obj)
            }
        })
        reader.addEventListener('error', () => rej())
        reader.readAsArrayBuffer(file)
    })
}
