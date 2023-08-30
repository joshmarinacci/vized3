import {make_logger} from "josh_js_util"

import {DocClass, JSONDoc, JSONDocIndex} from "../models/om"
import {GlobalState} from "../models/state"

function loadIndex():JSONDocIndex {
    const index = localStorage.getItem('index')
    if(index) {
        return JSON.parse(index) as JSONDocIndex
    } else {
        return {docs:[]}
    }
}

export async function saveLocalStorage(state: GlobalState) {
    const log = make_logger('local')
    const json_obj = await state.om.toJSON(state.getCurrentDocument())
    const doc = state.getCurrentDocument()
    log.info('json is',json_obj)
    //first save the doc itself
    localStorage.setItem(doc.getUUID(),JSON.stringify(json_obj,null,'    '))

    const index:JSONDocIndex = loadIndex()
    console.log("index before is",index)
    const old_doc = index.docs.find(dr => dr.uuid === doc.getUUID())
    if(old_doc) {
        old_doc.name = doc.getPropValue('name')
        old_doc.updateDate = new Date(Date.now)
    } else {
        index.docs.push({
            uuid: doc.getUUID(),
            name: doc.getPropValue('name'),
            creationDate: new Date(Date.now()),
            updateDate: new Date(Date.now()),
        })
    }
    console.log("saving back the index",index)
    localStorage.setItem('index',JSON.stringify(index,null,'    '))
}

export async function listLocalDocs(state: GlobalState) {
    const log = make_logger('local')
    log.info('state is',state)
    const index:JSONDocIndex = loadIndex()
    log.info("the index is",index)
    return index.docs
}
export async function loadLocalDoc(state:GlobalState, uuid:string):Promise<DocClass> {
    const log = make_logger('local')
    const index:JSONDocIndex = loadIndex()
    log.info("the index is",index)
    const docref = index.docs.find(dr => dr.uuid === uuid)
    log.info("docref is",docref)
    const json = localStorage.getItem(uuid)
    if(json) {
        const obj:JSONDoc = JSON.parse(json)
        return await state.om.fromJSON(obj) as DocClass
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

