import {make_logger, Size} from "josh_js_util"

import {DocClass} from "../models/om"
import {GlobalState} from "../models/state"
import {fromJSONDoc, JSONDoc, JSONDocIndex, saveJSON} from "./json"
import {stateToCanvas} from "./png"

function loadIndex(state:GlobalState):JSONDocIndex {
    const index = state.localStorage.getItem('index')
    if(index) {
        return JSON.parse(index) as JSONDocIndex
    } else {
        return {docs:[]}
    }
}

function scaleCropCanvasTo(original_canvas: HTMLCanvasElement, size: Size) {
    const new_canvas = document.createElement('canvas')
    new_canvas.width = size.w
    new_canvas.height = size.h
    const ctx = new_canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,size.w,size.h)
    ctx.fillStyle = 'red'
    ctx.fillRect(0+10,0+10,size.w-20,size.h-20)
    ctx.drawImage(original_canvas,
        0,0,original_canvas.width,original_canvas.height,
        0,0, size.w,size.h)
    return new_canvas
}

export async function saveLocalStorage(state: GlobalState, withThumbnail:boolean) {
    const log = make_logger('local')
    const json_obj =  saveJSON(state)
    // console.log("generated json",json_obj)
    const doc = state.getCurrentDocument()
    // log.info('json is',json_obj)
    //first save the doc itself
    state.localStorage.setItem(doc.getUUID(),JSON.stringify(json_obj,null,'    '))
    //now save a thumbnail
    let thumbnail_url = ""
    if(withThumbnail) {
        const canvas = await stateToCanvas(state)
        const thumbnail = scaleCropCanvasTo(canvas, new Size(64,64))
        thumbnail_url = thumbnail.toDataURL('png')
    }

    const index:JSONDocIndex = loadIndex(state)
    console.log("index before is",index)
    const old_doc = index.docs.find(dr => dr.uuid === doc.getUUID())
    if(old_doc) {
        old_doc.name = doc.getPropValue('name')
        old_doc.updateDate = new Date(Date.now())
        old_doc.thumbnail = thumbnail_url
    } else {
        index.docs.push({
            uuid: doc.getUUID(),
            name: doc.getPropValue('name'),
            creationDate: new Date(Date.now()),
            updateDate: new Date(Date.now()),
            thumbnail: thumbnail_url
        })
    }
    console.log("saving back the index",index)
    state.localStorage.setItem('index',JSON.stringify(index,null,'    '))
}

export async function listLocalDocs(state: GlobalState) {
    return loadIndex(state).docs
}
export async function loadLocalDoc(state:GlobalState, uuid:string):Promise<DocClass> {
    const log = make_logger('local')
    const index:JSONDocIndex = loadIndex(state)
    log.info("the index is",index)
    const docref = index.docs.find(dr => dr.uuid === uuid)
    log.info("docref is",docref)
    const json = state.localStorage.getItem(uuid)
    if(json) {
        const obj:JSONDoc = JSON.parse(json)
        return fromJSONDoc(state.om,obj)
    } else {
        throw new Error(`no such document with uuid: ${uuid}`)
    }
}

// async function doit() {
//     const log = make_logger('local')
//     const state = new GlobalState()
//     //clear the index if it exists
//     localStorage.clear()
//     {
//         //list the index, see it is empty
//         const docs = await listLocalDocs(state)
//         log.info("doc count is", docs.length)
//     }
//     //create a new doc
//     const doc = state.om.make(DocDef, {}) as DocClass
//     const page = state.om.make(PageDef, {})
//     doc.appendListProp('pages', page)
//
//     const circle = state.om.make(CircleDef,{})
//     page.appendListProp('children',circle)
//     state.swapDoc(doc)
//
//     //save the doc with the action
//     await saveLocalStorage(state)
//     {
//         //list the docs with the action
//         const docs = await listLocalDocs(state)
//         log.info("doc count is", docs.length)
//         log.info(docs)
//     }
//
//     //re-load the doc with the action
//     const doc2 = await loadLocalDoc(state,doc.getUUID())
//     log.info("the local doc2 is",doc2)
//     return doc2
// }
// doit()
//     .then((doc)=>console.log("doc is",doc))
//     .catch((e)=>console.error(e))

