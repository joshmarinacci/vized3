import {GlobalState} from "./models/state";
import {CircleDef, ObjectProxy, PageType, RectDef, RectType} from "./models/om";
import {Bounds, Point} from "josh_js_util";
import {savePNGJSON} from "./exporters/json";
import {exportPNG} from "./exporters/png";
import {exportSVG} from "./exporters/svg";
import {exportCanvasJS} from "./exporters/canvas";
import {SupportedIcons} from "./icons";

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
export const BottomAlignShapes: MenuAction = {
    title: 'align bottom',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for (let obj of objs) {
            let bds = obj.getPropValue('bounds') as Bounds
            let bds2 = new Bounds(fbds.x, fbds.bottom() - bds.h, bds.w, bds.h)
            obj.setPropValue('bounds', bds2)
        }
    }
}
export const LeftAlignShapes: MenuAction = {
    title: 'align left',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds')
        for (let obj of objs) {
            let bds: Bounds = obj.getPropValue('bounds')
            let bds2 = new Bounds(fbds.x, bds.y, bds.w, bds.h)
            obj.setPropValue('bounds', bds2)
        }
    }
}
export const RightAlignShapes: MenuAction = {
    title: 'align right',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for (let obj of objs) {
            let bds: Bounds = obj.getPropValue('bounds')
            let bds2 = new Bounds(fbds.right() - bds.w, bds.y, bds.w, bds.h)
            obj.setPropValue('bounds', bds2)
        }
    }
}
export const HCenterAlignShapes: MenuAction = {
    title: 'align hcenter',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for (let obj of objs) {
            let bds: Bounds = obj.getPropValue('bounds')
            let bds2 = new Bounds(fbds.center().x - bds.w / 2, bds.y, bds.w, bds.h)
            obj.setPropValue('bounds', bds2)
        }
    }
}
export const TopAlignShapes: MenuAction = {
    title: 'Align Top',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for (let obj of objs) {
            let bds = obj.getPropValue('bounds') as Bounds
            let bds2 = new Bounds(bds.x, fbds.top(), bds.w, bds.h)
            obj.setPropValue('bounds', bds2)
        }
    }
}
export const VCenterAlignShapes: MenuAction = {
    title: 'align vcenter',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for (let obj of objs) {
            let bds = obj.getPropValue('bounds') as Bounds
            let bds2 = new Bounds(bds.x, fbds.center().y - bds.h / 2, bds.w, bds.h)
            obj.setPropValue('bounds', bds2)
        }
    }
}
