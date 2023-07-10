import {DocDef, ObjectDef, ObjectProxy, PageDef} from "../models/om";

export function traverse(doc: ObjectProxy<ObjectDef>, cb: (item: any) => void) {
    cb(doc)
    doc.getListProp(DocDef.props.pages).forEach(page => {
        cb(page)
        page.getListProp(PageDef.props.children).forEach(shape => {
            cb(shape)
        })
    })
}
