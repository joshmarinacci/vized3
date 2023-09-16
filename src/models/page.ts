import {Size} from "josh_js_util"

import {DefList, PropsBase, PropValues, WrapperAnyCallback} from "./base"
import {BaseShape, NameDef, SizeDef} from "./defs"

export type PageType = {
    name: string,
    size: Size,
}
const PageDefs:DefList<PageType> = {
    name: NameDef,
    size: SizeDef,
}
export class PageClass extends PropsBase<PageType> {
    _children: PropsBase<any>[]
    _handler:WrapperAnyCallback<any>
    constructor(opts?: PropValues<PageType>) {
        super(PageDefs,opts)
        this._children = []
        this._handler = (t:any) => {
            this._fireAll()
        }
    }
    hasChildren(): boolean {
        return this._children.length > 0
    }
    addChild<T>(obj:PropsBase<T>) {
        if(obj instanceof BaseShape) {
            obj.parent = this
            obj.onAny(this._handler)
        }
        this._children.push(obj)
        this._fireAll()
    }

    async removeChild<T>(obj: PropsBase<T>) {
        this._children = this._children.filter(ch => ch !==obj)
        if(obj instanceof BaseShape) {
            obj.offAny(this._handler)
            obj.parent = null
        }
        this._fireAll()
    }
}

