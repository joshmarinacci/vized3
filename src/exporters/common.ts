import {DocClass} from "../models/om";

export function traverse(doc: DocClass, cb: (item: any) => void) {
    cb(doc)
    doc.getListProp('pages').forEach(page => {
        cb(page)
        page.getListProp('children').forEach((shape:any) => {
            cb(shape)
        })
    })
}
