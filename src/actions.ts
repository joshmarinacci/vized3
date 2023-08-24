import {GlobalState} from "./models/state";
import {DocClass, DocDef, DrawableClass, ObjectProxy, PageDef} from "./models/om";
import {Bounds, Point} from "josh_js_util";
import {savePNGJSON} from "./exporters/json";
import {exportPNG} from "./exporters/png";
import {exportSVG} from "./exporters/svg";
import {exportCanvasJS} from "./exporters/canvas";
import {SupportedIcons} from "./icons";
import {RectDef} from "./models/rect";
import {CircleDef} from "./models/circle";
import {PathShapeDef} from "./models/pathshape";
import {NGonClass, NGonDef} from "./models/ngon";
import {exportPDF} from "./exporters/pdf";

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

export const AddNewRectAction:MenuAction = {
    title: 'new rect',
    icon: SupportedIcons.Add,
    tags:['add','shape','rect','rectangle'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const rect = state.om.make(RectDef, {
            bounds: new Bounds(100, 300, 100, 100)
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
            center: new Point(200, 200),
        })
        await page.appendListProp('children', circle)
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
        await page.appendListProp('children', shape)
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
            center: new Point(200, 200),
        })
        await page.appendListProp('children', shape)
    }
}

export const DeleteSelection:MenuAction = {
    title: 'delete',
    icon:SupportedIcons.Delete,
    tags:['delete','shape'],
    perform: async (state: GlobalState) => {
        const objs = state.getSelectedObjects()
        for(let obj of objs) {
            if (obj && obj.parent) {
                const parent = obj.parent as unknown as any
                await parent.removeListPropByValue('children', obj)
            }
        }
        state.clearSelectedObjects()
    }
}

function calcObjectBounds(obj: ObjectProxy<any>) {
    if (obj instanceof DrawableClass) {
        return obj.getAlignmentBounds()
    }
    throw new Error("object has no bounds")
}

async function moveObjBy(obj: ObjectProxy<any>, diff: Point) {
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
        let fbds = calcObjectBounds(objs[0])
        for (let obj of objs) {
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
        let fbds = calcObjectBounds(objs[0]);
        for (let obj of objs) {
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
        let fbds = calcObjectBounds(objs[0]);
        for (let obj of objs) {
            let bds = calcObjectBounds(obj)
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
        let fbds = calcObjectBounds(objs[0]);
        for (let obj of objs) {
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
        let fbds = calcObjectBounds(objs[0])
        for (let obj of objs) {
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
        let fbds = calcObjectBounds(objs[0])
        for (let obj of objs) {
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
        let ngon = state.getSelectedObjects()[0] as NGonClass
        let line_path = ngon.toSinglePath()
        const parent = ngon.parent as unknown as any
        await parent.removeListPropByValue('children', ngon)
        let path = state.om.make(PathShapeDef,{
            points:line_path.points,
            closed: line_path.closed
        })
        page.appendListProp('children', path)
    }
};

export const ALL_ACTIONS: MenuAction[] = [
    SavePNGJSONAction,
    NewDocumentAction,
    DownloadPNGAction,
    DownloadSVGAction,
    DownloadPDFAction,
    ExportCanvasJSAction,
    AddNewRectAction,
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewPathShapeAction,
    DeleteSelection,
    RightAlignShapes,
    LeftAlignShapes,
    TopAlignShapes,
    BottomAlignShapes,
    VCenterAlignShapes,
    HCenterAlignShapes,
]
