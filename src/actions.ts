import {Bounds, Point} from "josh_js_util"

import {exportCanvasJS} from "./exporters/canvas"
import {savePNGJSON} from "./exporters/json"
import {saveLocalStorage} from "./exporters/local"
import {exportPDF} from "./exporters/pdf"
import {exportPNG} from "./exporters/png"
import {exportSVG} from "./exporters/svg"
import {SupportedIcons} from "./icons"
import {ColorAssetDef, GradientAssetDef, ImageAssetDef, NumberAssetDef} from "./models/assets"
import {CircleDef} from "./models/circle"
import {NGonClass, NGonDef} from "./models/ngon"
import {
    DocClass,
    DocDef,
    DrawableClass,
    ObjectDef,
    ObjectProxy,
    PageDef
} from "./models/om"
import {PathShapeDef} from "./models/pathshape"
import {RectDef} from "./models/rect"
import {GlobalState} from "./models/state"

export type MenuAction = {
    title:string
    description?:string
    icon?:SupportedIcons,
    tags?:string[],
    perform: (state:GlobalState) => Promise<void>
}

export const SavePNGJSONAction:MenuAction = {
    icon:SupportedIcons.SaveDocument,
    title:'save',
    description:'Save the document as a PNG with the document embedded inside of the PNG as JSON.',
    tags:['save','export','download','png'],
    perform:async (state) => {
        await savePNGJSON(state)
    }
}

export const SaveLocalStorageAction:MenuAction = {
    icon:SupportedIcons.SaveDocument,
    title:'save in browser',
    description:'save the document in the browsers internal storage',
    tags:['save','local'],
    perform:async(state) => {
        await saveLocalStorage(state)
    }
}
export const DownloadPNGAction:MenuAction = {
    icon:SupportedIcons.Download,
    title:'PNG',
    tags:['save','export','download','png'],
    description:"Export the document as a PNG file",
    perform: async (state) => {
        await exportPNG(state)
    }
}
export const DownloadSVGAction:MenuAction = {
    title:'SVG',
    tags:['save','export','download','svg'],
    icon:SupportedIcons.Download,
    description:'Export the document as an SVG file',
    perform:async (state) => {
        await exportSVG(state)
    }
}
export const DownloadPDFAction:MenuAction = {
    title:'PDF',
    tags:['save','export','download','pdf'],
    icon:SupportedIcons.Download,
    description:'Export the document as a PDF file',
    perform:async (state) => {
        await exportPDF(state)
    }
}

export const ExportCanvasJSAction:MenuAction = {
    title:'Canvas JS',
    description:'export to javascript code using HTML Canvas',
    tags:['save','export','download','code'],
    icon:SupportedIcons.Download,
    perform:async (state) => {
        await exportCanvasJS(state)
    }
}

export const AddNewPageAction:MenuAction = {
    title:'add new page',
    icon:SupportedIcons.Add,
    tags:['add','page'],
    description:'adds a new page to the document',
    perform: async (state:GlobalState) => {
        const page = state.om.make(PageDef,{})
        state.getCurrentDocument().appendListProp('pages',page)
    }
}
export const AddNewRectAction:MenuAction = {
    title: 'new rect',
    icon: SupportedIcons.Add,
    tags:['add','shape','rect','rectangle'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const rect = state.om.make(RectDef, {
            bounds: new Bounds(1, 3, 1, 1)
        })
        page.appendListProp('children', rect)
    }
}
export const AddNewCircleAction:MenuAction = {
    title: 'new circle',
    icon: SupportedIcons.Add,
    tags:['add','shape','circle'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const circle = state.om.make(CircleDef, {
            center: new Point(2, 2),
            radius: 1,
        })
        page.appendListProp('children', circle)
    }
}
export const AddNewPathShapeAction:MenuAction = {
    title: 'new path shape',
    icon: SupportedIcons.Add,
    tags:['add','shape','curve','path'],
    perform: async (state:GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const shape = state.om.make(PathShapeDef, {})
        page.appendListProp('children', shape)
    }
}
export const AddNewNGonAction:MenuAction = {
    title: 'new N-gon',
    icon: SupportedIcons.Add,
    tags:['add','shape','polygon','ngon','n-gon'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const shape = state.om.make(NGonDef, {
            center: new Point(1, 1),
        })
        page.appendListProp('children', shape)
    }
}
export const AddNewNumberAssetAction:MenuAction = {
    title:'add number asset',
    perform: async (state)=> {
        const asset = state.om.make(NumberAssetDef,{})
        state.getCurrentDocument().appendListProp('assets',asset)
    }
}
export const AddNewColorAssetAction:MenuAction = {
    title:'add color asset',
    perform: async (state)=> {
        const asset = state.om.make(ColorAssetDef,{})
        state.getCurrentDocument().appendListProp('assets',asset)
    }

}
export const AddNewGradientAssetAction:MenuAction = {
    title:'add gradient asset',
    perform: async (state)=> {
        const asset = state.om.make(GradientAssetDef,{})
        state.getCurrentDocument().appendListProp('assets',asset)
    }
}
export const AddNewImageAssetAction:MenuAction = {
    title:'add image asset',
    perform: async (state)=> {
        const asset = state.om.make(ImageAssetDef,{})
        state.getCurrentDocument().appendListProp('assets',asset)
    }
}

export const DeleteSelection:MenuAction = {
    title: 'delete',
    icon:SupportedIcons.Delete,
    tags:['delete','shape'],
    perform: async (state: GlobalState) => {
        const objs = state.getSelectedObjects()
        for(const obj of objs) {
            if (obj && obj.parent) {
                const parent = obj.parent as unknown as ObjectProxy<ObjectDef>
                await parent.removeListPropByValue('children', obj)
            }
        }
        state.clearSelectedObjects()
    }
}

function calcObjectBounds(obj: ObjectProxy<ObjectDef>) {
    if (obj instanceof DrawableClass) {
        return obj.getAlignmentBounds()
    }
    throw new Error("object has no bounds")
}

async function moveObjBy(obj: ObjectProxy<ObjectDef>, diff: Point) {
    if (obj instanceof DrawableClass) {
        await obj.translateBy(diff)
        return
    }
    throw new Error("object has no bounds to move ")
}

export const BottomAlignShapes: MenuAction = {
    title: 'align bottom',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj,new Point(0,fbds.bottom()- calcObjectBounds(obj).bottom()))
        }
    }
}
export const LeftAlignShapes: MenuAction = {
    title: 'align left',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj,new Point(fbds.left() - calcObjectBounds(obj).left(),0))
        }
    }
}
export const RightAlignShapes: MenuAction = {
    title: 'align right',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            const bds = calcObjectBounds(obj)
            await moveObjBy(obj,new Point(fbds.right() - bds.right(),0))
        }
    }
}
export const TopAlignShapes: MenuAction = {
    title: 'Align Top',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj,new Point(0,fbds.top() - calcObjectBounds(obj).top()))
        }
    }
}
export const HCenterAlignShapes: MenuAction = {
    title: 'align hcenter',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj, new Point(fbds.center().x - calcObjectBounds(obj).center().x, 0))
        }
    }
}
export const VCenterAlignShapes: MenuAction = {
    title: 'align vcenter',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj, new Point(0,fbds.center().y - calcObjectBounds(obj).center().y))
        }
    }
}

export const NewDocumentAction: MenuAction = {
    title: 'New Document',
    icon: SupportedIcons.NewDocument,
    tags: ['new', 'document'],
    description: 'create a new empty document',
    perform: async (state) => {
        const doc = state.om.make(DocDef, {}) as DocClass
        const page = state.om.make(PageDef, {})
        doc.appendListProp('pages', page)
        state.swapDoc(doc)
    }
}

export const ConvertNGonToPath:MenuAction = {
    title:'Convert to Path',
    icon:SupportedIcons.Settings,
    tags:['path','convert','ngon'],
    description:"convert an N-gon shape to an editable path",
    perform: async (state) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const ngon = state.getSelectedObjects()[0] as NGonClass
        const line_path = ngon.toSinglePath()
        const parent = ngon.parent as unknown as ObjectProxy<ObjectDef>
        await parent.removeListPropByValue('children', ngon)
        const path = state.om.make(PathShapeDef,{
            points:line_path.points,
            closed: line_path.closed
        })
        page.appendListProp('children', path)
    }
}

export const ALL_ACTIONS: MenuAction[] = [
    SavePNGJSONAction,
    NewDocumentAction,
    DownloadPNGAction,
    DownloadSVGAction,
    DownloadPDFAction,
    ExportCanvasJSAction,

    AddNewPageAction,
    AddNewRectAction,
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewPathShapeAction,
    AddNewNumberAssetAction,
    AddNewColorAssetAction,

    DeleteSelection,
    RightAlignShapes,
    LeftAlignShapes,
    TopAlignShapes,
    BottomAlignShapes,
    VCenterAlignShapes,
    HCenterAlignShapes,
    SaveLocalStorageAction,
]
