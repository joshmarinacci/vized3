import {Bounds, Insets, Point, Size} from "josh_js_util"
import {canvas_to_blob, forceDownloadBlob} from "josh_web_util"

import {LinearColorGradient} from "../models/assets"
import {
    DocClass, DocDef,
    EnumSchema,
    ObjectDef,
    ObjectManager,
    OO,
    PropSchema
} from "../models/om"
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
export type JSONDocV1 = {
    version: 1,
    root: JSONObjectV1
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

function propertyToJSON(prop: PropSchema, obj: OO):JSONProp {
    if(obj.isPropProxySource(prop.name)) {
        const ref:JSONPropReference = {
            type:'reference',
            reference: obj.getPropProxySource(prop.name).getUUID()
        }
        return ref
    }
    if(prop.custom === 'css-gradient') {
        const v2:LinearColorGradient = obj.getPropValue(prop.name)
        return ({type:'value', value:v2.toJSON()})
    }
    if(prop.custom === 'points') {
        const v2:Point[] = obj.getPropValue(prop.name)
        return ({type:'value', value:v2.map(pt => pt.toJSON())})
    }
    if(prop.base === 'string') {
        return {
            type:"value",
            value: obj.getPropValue(prop.name)
        }
    }
    if(prop.base === 'list') {
        const list = obj.getListProp(prop.name)
        const arr:JSONObject[] = list.map(val => toJSONObj(val))
        return {
            type:"value",
            value:arr
        }
    }
    if(prop.base === 'object') {
        const val = obj.getPropValue(prop.name)
        if (val instanceof Bounds) return ({ type: 'value', value: val.toJSON() })
        if (val instanceof Point)  return ({ type: 'value', value: val.toJSON()})
        if (val instanceof Size)   return ({ type: 'value', value: val.toJSON()})
        if (val instanceof Insets) return ({ type: 'value', value: val.toJSON()})
        throw new Error(`unhandled toJSON object type ${prop.name}`)
    }
    if(prop.base === 'number') {
        return ({
            type:"value",
            value: obj.getPropValue(prop.name)
        })
    }
    if(prop.base === 'boolean') {
        return ({
            type:"value",
            value: obj.getPropValue(prop.name)
        })
    }
    if(prop.base === 'enum') {
        return ({
            type:"value",
            value: obj.getPropValue(prop.name)
        })
    }
    throw new Error(`unhandled toJSON type ${prop.toString()}`)
}

export function toJSONObj(obj: OO): JSONObject {
    const json: JSONObject = {
        name: obj.def.name,
        props: {},
    }
    obj.getPropSchemas().forEach(prop => {
        json.props[prop.name] = propertyToJSON(prop,obj)
    })
    return json
}

function toJSONDoc(root: DocClass):JSONDoc {
    return {
        version: 2,
        root: toJSONObj(root),
    }
}
export function saveJSON(state: GlobalState):JSONDoc {
    return toJSONDoc(state.getCurrentDocument())
}




function propertyFromJSON(om: ObjectManager, prop: PropSchema, obj: JSONObject) {
    const vv: JSONProp = obj.props[prop.name] as JSONProp
    if (vv.type === 'reference') {
    }
    const v: JSONPropValue = vv as JSONPropValue
    if(prop.custom === 'css-gradient') {
        return LinearColorGradient.fromJSON(v.value)
    }
    if(prop.custom === 'points') {
        return ((v.value as []).map(pt => Point.fromJSON(pt))) as Point[]
    }
    if (prop.base === 'enum') {
        const schema = prop as EnumSchema
        return schema.fromJSONValue(obj, prop.name, v.value)
    }
    if (prop.base === 'string') return v.value as string
    if (prop.base === 'number') return v.value as number
    if (prop.base === 'boolean')  return v.value as boolean
    if (prop.base === 'list') {
        const arr = []
        const vals = v.value as JSONObject[]
        for (const val of vals) {
            const obj_val = fromJSONObj(om, val)
            arr.push(obj_val)
        }
        return arr
    }
    if (prop.base === 'object') {
        if (prop.name === 'bounds') return Bounds.fromJSON(v.value as Bounds)
        if (prop.name === 'center') return Point.fromJSON(v.value as Point)
        if (prop.name === 'size') return Size.fromJSON(v.value as Size)
    }
    throw new Error(`cannot restore property ${vv.toString()}`)
}

function propertyFromJSONV1(om: ObjectManager, prop: PropSchema, obj: JSONObjectV1) {
    const v = obj.props[prop.name] as unknown
    if(prop.base === 'enum') {
        const schema = prop as EnumSchema
        return schema.fromJSONValue(obj as JSONObject, prop.name, v)
    }
    if(prop.base === 'string') return v as string
    if(prop.base === 'boolean') return v as boolean
    if(prop.base === 'number') return v as number
    if(prop.base === 'object') {
        if (prop.name === 'bounds') return Bounds.fromJSON(v as Bounds)
        if (prop.name === 'center') return Point.fromJSON(v as Point)
        if (prop.name === 'size') return Size.fromJSON(v as Size)
    }
    if(prop.base === 'list') {
        const arr = []
        const vals = v as JSONObjectV1[]
        for (const val of vals) {
            const obj_val = fromJSONV1(om, val)
            arr.push(obj_val)
        }
        return arr
    }

    throw new Error(`cannot restore property ${v}`)

}

export function fromJSONObj(om: ObjectManager, obj: JSONObject):OO {
    const def: ObjectDef = om.lookupDef(obj.name) as ObjectDef
    const props: Record<string, object> = {}
    const refs = []
    for (const key of Object.keys(def.props)) {
        const propSchema = def.props[key]
        const val = obj.props[propSchema.name]
        if(val.type === 'reference') {
            console.log("skipping reference")
            refs.push(propSchema)
        } else {
            props[key] = propertyFromJSON(om, propSchema, obj)
        }
    }
    const finalObject = om.make(def, props)
    refs.forEach(ref => {
        console.log("must restore ref",ref)
        const vv = obj.props[ref.name] as JSONPropReference
        console.log("looking up the proxy source",vv.reference)
        console.log("proxy loaded?",om.hasObject(vv.reference))
        if(!om.hasObject(vv.reference)) {
            throw new Error("cannot restore JSON because reference not loaded yet")
        }
        const source = om.getObject(vv.reference) as OO
        console.log("the source is",source)
        finalObject.setPropProxySource(ref.name,source)
    })
    console.log("final object is",finalObject)
    return finalObject
}

export function fromJSONV1<T>(om: ObjectManager, obj: JSONObjectV1):T {
    const def: ObjectDef = om.lookupDef(obj.name) as ObjectDef
    const props: Record<string, object> = {}
    for (const key of Object.keys(def.props)) {
        const propSchema = def.props[key]
        if(propSchema.name === 'assets') {
            props[key] = []
            continue
        }
        props[key] = propertyFromJSONV1(om, propSchema,obj)
    }
    return om.make(def, props) as T
}

export function fromJSONDoc(om:ObjectManager, json_obj: JSONDoc): DocClass {
    // const def = om.lookupDef(json_obj.root.name) as ObjectDef
    const root = json_obj.root
    const props: Record<string, object> = {}
    console.log("loading assets first")
    const assetsdef = DocDef.props['assets']
    props[assetsdef.name] = []
    const assets = (root.props['assets'] as JSONPropValue).value as JSONObject[]
    console.log(assets)
    props[assetsdef.name] = assets.map(asset => {
        return fromJSONObj(om,asset)
    })
    console.log('final assets',assets)
    const def = DocDef
    for (const key of Object.keys(def.props)) {
        const propSchema = def.props[key]
        if(propSchema.name === 'assets') continue
        props[key] = propertyFromJSON(om, propSchema,root)
    }
    return om.make(def, props) as DocClass
}
export function fromJSONDocV1(om:ObjectManager, json_obj:JSONDocV1):DocClass {
    return fromJSONV1(om, json_obj.root) as DocClass
}


export async function savePNGJSON(state: GlobalState) {
    const canvas = await stateToCanvas(state)
    const json_obj = toJSONDoc(state.getCurrentDocument())
    const json_string = JSON.stringify(json_obj,null,'    ')

    const blob = await canvas_to_blob(canvas)
    const array_buffer = await blob.arrayBuffer()
    const uint8buffer = new Uint8Array(array_buffer)

    // @ts-ignore
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
                const obj = fromJSONDoc(state.om, json as JSONDoc)
                res(obj)
            }
        })
        reader.addEventListener('error', () => rej())
        reader.readAsArrayBuffer(file)
    })
}
