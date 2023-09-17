import {Bounds, Point} from "josh_js_util"
import React from "react"

import {exportCanvasJS} from "../exporters/canvas"
import {savePNGJSON} from "../exporters/json"
import {saveLocalStorage} from "../exporters/local"
import {exportPDF} from "../exporters/pdf"
import {exportPNG} from "../exporters/png"
import {exportSVG} from "../exporters/svg"
import {SupportedIcons} from "../icons"
import {
    ColorAssetClass,
    GradientAssetClass,
    ImageAssetClass,
    NumberAssetClass
} from "../models/assets"
import {CircleClass} from "../models/circle"
import {DrawableShape} from "../models/drawing"
import {NGonClass} from "../models/ngon"
import {PageClass, PageType} from "../models/page"
import {PathShapeClass} from "../models/pathshape"
import {RectClass, RectType} from "../models/rect"
import {SimpleTextClass} from "../models/simpletext"
import {GlobalState} from "../models/state"

export type Shortcut = {
    key:string,
    meta:boolean,
    shift:boolean,
}
export type MenuAction = {
    type:string,
    title:string
    shortcut?:Shortcut,
    description?:string
    icon?:SupportedIcons,
    tags?:string[],
}
export type SimpleMenuAction = {
    type:'simple',
    perform: (state:GlobalState) => Promise<void>,
} & MenuAction

export class ActionRegistry {
    private actions: MenuAction[]
    private by_key: Map<string, MenuAction[]>

    constructor() {
        this.actions = []
        this.by_key = new Map()
    }

    match(e: React.KeyboardEvent): MenuAction | null {
        if (this.by_key.has(e.key)) {
            let actions = this.by_key.get(e.key)
            if (!actions) return null
            actions = actions.filter(a => a.shortcut?.meta === e.metaKey)
            actions = actions.filter(a => a.shortcut?.shift === e.shiftKey)
            if (actions.length > 0) return actions[0]
        }
        return null
    }

    register(actions: MenuAction[]) {
        actions.forEach(a => {
            this.actions.push(a)
            if (a.shortcut) {
                let acts = this.by_key.get(a.shortcut.key)
                if (!acts) acts = []
                acts.push(a)
                this.by_key.set(a.shortcut.key, acts)
            }
        })
    }

    all():MenuAction[] {
        return this.actions.slice()
    }
}

export const SavePNGJSONAction:SimpleMenuAction = {
    type:'simple',
    icon:SupportedIcons.SaveDocument,
    title:'Save As doc.JSON.PNG',
    description:'Save the document as a PNG with the document embedded inside of the PNG as JSON.',
    tags:['save','export','download','png'],
    perform:async (state) => {
        await savePNGJSON(state)
    },
}

export const SaveLocalStorageAction:SimpleMenuAction = {
    type:'simple',
    icon:SupportedIcons.SaveDocument,
    title:'Save',
    description:'save the document in the browsers internal storage',
    tags:['save','local'],
    perform:async(state) => {
        await saveLocalStorage(state, true)
    }
}
export const DownloadPNGAction:SimpleMenuAction = {
    type:'simple',
    icon:SupportedIcons.Download,
    title:'export as PNG',
    tags:['save','export','download','png'],
    description:"Export the document as a PNG file",
    perform: async (state:GlobalState) => {
        await exportPNG(state)
    }
}
export const DownloadSVGAction:SimpleMenuAction = {
    type:'simple',
    title:'export as SVG',
    tags:['save','export','download','svg'],
    icon:SupportedIcons.Download,
    description:'Export the document as an SVG file',
    perform:async (state) => {
        await exportSVG(state)
    }
}
export const DownloadPDFAction:SimpleMenuAction = {
    type:'simple',
    title:'export as PDF',
    tags:['save','export','download','pdf'],
    icon:SupportedIcons.Download,
    description:'Export the document as a PDF file',
    perform:async (state) => {
        await exportPDF(state)
    }
}

export const ExportCanvasJSAction:SimpleMenuAction = {
    type:'simple',
    title:'Canvas JS',
    description:'export to javascript code using HTML Canvas',
    tags:['save','export','download','code'],
    icon:SupportedIcons.Download,
    perform:async (state) => {
        await exportCanvasJS(state)
    }
}

export const AddNewPageAction:SimpleMenuAction = {
    type:'simple',
    title:'add new page',
    icon:SupportedIcons.Add,
    tags:['add','page'],
    description:'adds a new page to the document',
    perform: async (state:GlobalState) => {
        const page = state.om.make<PageType>(PageClass)
        state.om.appendListProp(state.getCurrentDocument(),'pages',page)
    }
}
export const AddNewRectAction:SimpleMenuAction = {
    type:'simple',
    title: 'new rect',
    icon: SupportedIcons.Add,
    tags:['add','shape','rect','rectangle'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const rect = state.om.make<RectType>(RectClass,{
            bounds: new Bounds(1, 3, 1, 1)
        })
        state.om.appendListProp(page,'children',rect)
    }
}
export const AddNewCircleAction:SimpleMenuAction = {
    type:'simple',
    title: 'new circle',
    icon: SupportedIcons.Add,
    tags:['add','shape','circle'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const circle = new CircleClass({
            center: new Point(2, 2),
            radius: 1,
        })
        state.om.appendListProp(page,'children',circle)
    }
}
export const AddNewPathShapeAction:SimpleMenuAction = {
    type:'simple',
    title: 'new path shape',
    icon: SupportedIcons.Add,
    tags:['add','shape','curve','path'],
    perform: async (state:GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const shape = new PathShapeClass({})
        state.om.appendListProp(page,'children',shape)
    }
}
export const AddNewNGonAction:SimpleMenuAction = {
    type:'simple',
    title: 'new N-gon',
    icon: SupportedIcons.Add,
    tags:['add','shape','polygon','ngon','n-gon'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const shape = new NGonClass({
            center: new Point(1, 1),
        })
        state.om.appendListProp(page,'children',shape)
    }
}
export const AddNewSimpletextAction:SimpleMenuAction = {
    type:'simple',
    title: 'new simple text',
    icon: SupportedIcons.Add,
    tags:['add','shape','text'],
    perform: async (state: GlobalState) => {
        const page = state.getSelectedPage()
        if (!page) return console.warn("no page selected")
        const shape = new SimpleTextClass({
            center:new Point(0,1)
        })
        state.om.appendListProp(page,'children',shape)
    }
}

export const AddNewNumberAssetAction:SimpleMenuAction = {
    type:'simple',
    title:'add number asset',
    icon: SupportedIcons.Number,
    perform: async (state)=> {
        const asset = new NumberAssetClass()
        state.getCurrentDocument().getPropValue('assets').push(asset)
        state.getCurrentDocument()._fireAll()
    }
}
export const AddNewColorAssetAction:SimpleMenuAction = {
    type:'simple',
    title:'add color asset',
    icon:SupportedIcons.Color,
    perform: async (state)=> {
        const asset = new ColorAssetClass()
        state.getCurrentDocument().getPropValue('assets').push(asset)
        state.getCurrentDocument()._fireAll()
    }

}
export const AddNewGradientAssetAction:SimpleMenuAction = {
    type:'simple',
    title:'add gradient asset',
    icon:SupportedIcons.Gradient,
    perform: async (state)=> {
        const asset = new GradientAssetClass()
        state.getCurrentDocument().getPropValue('assets').push(asset)
        state.getCurrentDocument()._fireAll()
    }
}
export const AddNewImageAssetAction:SimpleMenuAction = {
    type:'simple',
    title:'add image asset',
    icon:SupportedIcons.Image,
    perform: async (state)=> {
        const asset = new ImageAssetClass()
        state.getCurrentDocument().getPropValue('assets').push(asset)
        state.getCurrentDocument()._fireAll()
    }
}

export const DeleteSelection:SimpleMenuAction = {
    type:'simple',
    title: 'delete',
    icon:SupportedIcons.Delete,
    tags:['delete','shape'],
    perform: async (state: GlobalState) => {
        const objs = state.getSelectedShapes()
        for(const obj of objs) {
            if (obj && obj.parent) {
                const parent = obj.parent
                state.om.removeListPropItemByValue(parent,'children',obj)
            }
        }
        state.clearSelectedObjects()
    },
    shortcut: {
        key: 'Backspace',
        meta: false,
        shift: false,
    }
}

function calcObjectBounds(obj: DrawableShape) {
    return obj.getAlignmentBounds()
}

async function moveObjBy(obj: DrawableShape, diff: Point) {
    await obj.translateBy(diff)
}

export const BottomAlignShapes: SimpleMenuAction = {
    type:'simple',
    title: 'align bottom',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedShapes()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj,new Point(0,fbds.bottom()- calcObjectBounds(obj).bottom()))
        }
    }
}
export const LeftAlignShapes: SimpleMenuAction = {
    type:'simple',
    title: 'align left',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedShapes()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj,new Point(fbds.left() - calcObjectBounds(obj).left(),0))
        }
    }
}
export const RightAlignShapes: SimpleMenuAction = {
    type:'simple',
    title: 'align right',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedShapes()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            const bds = calcObjectBounds(obj)
            await moveObjBy(obj,new Point(fbds.right() - bds.right(),0))
        }
    }
}
export const TopAlignShapes: SimpleMenuAction = {
    type:'simple',
    title: 'Align Top',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedShapes()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj,new Point(0,fbds.top() - calcObjectBounds(obj).top()))
        }
    }
}
export const HCenterAlignShapes: SimpleMenuAction = {
    type:'simple',
    title: 'align hcenter',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedShapes()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj, new Point(fbds.center().x - calcObjectBounds(obj).center().x, 0))
        }
    }
}
export const VCenterAlignShapes: SimpleMenuAction = {
    type:'simple',
    title: 'align vcenter',
    tags:['align','shape'],
    perform: async (state) => {
        const objs = state.getSelectedShapes()
        if (objs.length < 2) return
        const fbds = calcObjectBounds(objs[0])
        for (const obj of objs) {
            await moveObjBy(obj, new Point(0,fbds.center().y - calcObjectBounds(obj).center().y))
        }
    }
}

export const RaiseShapeAction:SimpleMenuAction = {
    type:'simple',
    title:'Raise',
    tags:['selection','shape'],
    shortcut: {
        key:']',
        meta:true,
        shift:false
    },
    perform: async (state) => {
        if(state.getSelectedShapes().length !== 1) return
        const shape = state.getSelectedShapes()[0]
        const page = state.getSelectedPage()
        if(!page) return
        if(shape.parent !== page) return
        const list = page._children
        const index = list.indexOf(shape)
        if(index >= list.length-1) return
        await page.removeListPropAt('children',index)
        await page.insertListPropAt('children',index+1,shape)
    }
}
export const LowerShapeAction:SimpleMenuAction = {
    type:'simple',
    title:'Lower',
    tags:['selection','shape'],
    shortcut: {
        key:'[',
        meta:true,
        shift:false
    },
    perform: async (state) => {
        if(state.getSelectedObjects().length !== 1) return
        const shape = state.getSelectedShapes()[0]
        const page = state.getSelectedPage()
        if(!page) return
        if(shape.parent !== page) return
        const list = page._children
        const index = list.indexOf(shape)
        if(index < 1) return
        await page.removeListPropAt('children',index)
        await page.insertListPropAt('children',index-1,shape)
    }
}

export const UndoAction:SimpleMenuAction = {
    type:'simple',
    title:'UnDo',
    tags:['undo','action','history','redo'],
    description:'un-does the previous action',
    icon: SupportedIcons.Undo,
    perform: async (state) => {
        await state.om.performUndo()
    },
    shortcut: {
        key:'z',
        meta:true,
        shift:false,
    }
}
export const RedoAction:SimpleMenuAction = {
    type:'simple',
    title:'ReDo',
    tags:['redo','action','history','undo'],
    description:'un-does the previous action',
    icon: SupportedIcons.Redo,
    perform: async (state) => {
        await state.om.performRedo()
    },
    shortcut: {
        key:'z',
        meta:true,
        shift:true,
    }
}


export const OpenSearchMenu:SimpleMenuAction = {
    type:'simple',
    title: 'Action Search',
    tags:['action'],
    description:'opens the action search',
    perform: async (state) => {
        console.log("opening the search")
        await state.sendCommand('open-search',{})
    },
    shortcut: {
        key: '/',
        meta:true,
        shift:false
    }
}


export const SelectAllInPage:SimpleMenuAction = {
    type:'simple',
    title:'Select All',
    shortcut: {
        key:'a',
        shift:false,
        meta:true,
    },
    tags:['selection'],
    description:'selects all objects in the current page',
    perform: async (state) => {
        const page = state.getSelectedPage()
        if(!page) return
        const children = page._children
        state.setSelectedObjects(children)
    }

}


export const ZoomInAction:SimpleMenuAction = {
    type:'simple',
    title:'zoom in',
    shortcut: {
        key:'=',
        meta:true,
        shift:false,
    },
    tags:['zoom','view'],
    description:'zooms in the current drawing view',
    perform: async (state) => {
        await state.sendCommand('zoom-in',{})
    }
}

export const ZoomOutAction:SimpleMenuAction = {
    type:'simple',
    title:'zoom out',
    shortcut: {
        key:'-',
        meta:true,
        shift:false,
    },
    tags:['zoom','view'],
    description:'zooms out the current drawing view',
    perform: async (state) => {
        await state.sendCommand('zoom-out',{})
    }
}
