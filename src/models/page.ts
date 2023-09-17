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
    addChild<T>(obj:PropsBase<T>) {
        if(obj instanceof BaseShape) {
            obj.parent = this
            obj.onAny(this._handler)
        }
        this.getPropValue('children').push(obj)
        this._fireAll()
    }
    getShapeChildren():BaseShape<any>[] {
        return this.getPropValue('children')
            .filter(ch => ch instanceof BaseShape)
            .map(ch => ch as BaseShape<any>)
    }

    async removeChild<T>(obj: PropsBase<T>) {
        const children = this.getPropValue('children').filter(ch => ch !==obj)
        this.setPropValue('children',children)
        if(obj instanceof BaseShape) {
            obj.offAny(this._handler)
            obj.parent = null
        }
        this._fireAll()
    }
}

