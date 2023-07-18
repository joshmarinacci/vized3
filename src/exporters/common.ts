import {DocType, ObjectProxy} from "../models/om";

export function traverse(doc: ObjectProxy<DocType>, cb: (item: any) => void) {
    cb(doc)
    doc.getListProp('pages').forEach(page => {
        cb(page)
        page.getListProp('children').forEach((shape:any) => {
            cb(shape)
        })
    })
}
