import {GlobalState} from "./models/state";
import {CircleDef, ObjectProxy, PageType, RectDef, RectType} from "./models/om";
import {Bounds, Point} from "josh_js_util";

export type MenuAction = {
    title:string
    perform: (state:GlobalState) => Promise<void>
}

export const AddNewRectAction:MenuAction = {
    title: 'new rect',
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const rect = state.om.make<RectType>(RectDef, {
            bounds: new Bounds(100, 300, 100, 100)
        })
        page.appendListProp('children', rect)
    }
}

export const AddNewCircleAction:MenuAction = {
    title: 'new circle',
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const circle = state.om.make(CircleDef, {
            center: new Point(200, 200),
        })
        await page.appendListProp('children', circle)
    }
}

export const DeleteSelection:MenuAction = {
    title: 'delete',
    perform: async (state: GlobalState) => {
        const objs = state.getSelectedObjects()
        for(let obj of objs) {
            if (obj && obj.parent) {
                const parent = obj.parent as unknown as ObjectProxy<PageType>
                await parent.removeListPropByValue('children', obj)
            }
        }
        state.clearSelectedObjects()
    }
}
