import {GlobalState} from "./models/state";
import {CircleDef, ObjectProxy, PageType, RectDef, RectType} from "./models/om";
import {Bounds, Point} from "josh_js_util";
import {SupportedIcons} from "./common";
import {savePNGJSON} from "./exporters/json";
import {exportPNG} from "./exporters/png";
import {exportSVG} from "./exporters/svg";
import {exportCanvasJS} from "./exporters/canvas";

export type MenuAction = {
    title:string
    icon?:SupportedIcons,
    perform: (state:GlobalState) => Promise<void>
}

export const SavePNGJSONAction:MenuAction = {
    icon:SupportedIcons.SaveDocument,
    title:'save',
    perform:async (state) => {
        await savePNGJSON(state)
    }
}
export const DownloadPNGAction:MenuAction = {
    icon:SupportedIcons.Download,
    title:'PNG',
    perform: async (state) => {
        await exportPNG(state)
    }
}
export const DownloadSVGAction:MenuAction = {
    title:'SVG',
    icon:SupportedIcons.Download,
    perform:async (state) => {
        await exportSVG(state)
    }
}

export const ExportCanvasJSAction:MenuAction = {
    title:'Canvas JS',
    icon:SupportedIcons.Download,
    perform:async (state) => {
        await exportCanvasJS(state)
    }
}

export const AddNewRectAction:MenuAction = {
    title: 'new rect',
    icon: SupportedIcons.Add,
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
    icon: SupportedIcons.Add,
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
