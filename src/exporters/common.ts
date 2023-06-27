import {VDocument} from "../models/model";

export function traverse(doc: VDocument, cb: (item: any) => void) {
    cb(doc)
    doc.pages.forEach(page => {
        cb(page)
        page.children.forEach(shape => {
            cb(shape)
        })
    })
}
