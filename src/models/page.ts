import {Size} from "josh_js_util"

import {DefList, PropsBase, PropValues, WrapperAnyCallback} from "./base"
import {BaseShape, NameDef, SizeDef} from "./defs"

export type PageType = {
    name: string,
    size: Size,
    children: PropsBase<any>[]
}
export const PageDefs:DefList<PageType> = {
    name: NameDef,
    size: SizeDef,
    children: {
        base:'list',
        readonly: true,
        hidden: true,
        default: () => [],
    }
}
export class PageClass extends PropsBase<PageType> {
    _handler:WrapperAnyCallback<any>
    constructor(opts?: PropValues<PageType>) {
        super(PageDefs,opts)
        this._handler = (t) => {
            this._fireAll()
        }
    }
    hasChildren(): boolean {
        return this.getPropValue('children').length > 0
    }
    watchChild<PageType>(name: keyof PageType,child:PageType[keyof PageType]) {
        if(child instanceof BaseShape) {
            child.parent = null
            child.onAny(this._handler)
        }
    }
    unwatchChild<PageType>(name: keyof PageType,child:PageType[keyof PageType]) {
        if(child instanceof BaseShape) {
            child.parent = this
            child.offAny(this._handler)
        }
    }
    getShapeChildren():BaseShape<any>[] {
        return this.getPropValue('children')
            .filter(ch => ch instanceof BaseShape)
            .map(ch => ch as BaseShape<any>)
    }
}

