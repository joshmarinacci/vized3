import "./PageView.css"

import {Point, Size} from "josh_js_util"
import {HBox, PopupContext} from "josh_react_util"
import React, {MouseEvent, useContext, useEffect, useRef, useState} from "react"

import {
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewRectAction,
    AddNewSimpletextAction,
    BottomAlignShapes,
    DeleteSelection,
    HCenterAlignShapes,
    LeftAlignShapes,
    LowerShapeAction,
    MenuAction,
    RaiseShapeAction,
    RightAlignShapes,
    TopAlignShapes,
    VCenterAlignShapes
} from "../actions/actions"
import {AddNewSimpleimageAction} from "../actions/reactactions"
import {MenuActionButton, MenuBox, useObjectProxyChange, useObservableChange} from "../common"
import {
    DocClass,
    DrawableClass,
    DrawableShape,
    FamilyPropChanged,
    PageClass,
    PropChanged
} from "../models/om"
import {PathShapeClass, PathShapeDef} from "../models/pathshape"
import {GlobalState} from "../models/state"
import {lookup_dpi, Unit} from "../models/unit"
import {DragHandler} from "./DragHandler"
import { findShapeInPage, MouseHandlerProtocol} from "./editing"
import {FloatingPalette} from "./FloatingPalette"
import {EditState, PathShapeEditHandler} from "./PathShapeEditHandler"
import {ScaledDrawingSurface} from "./scaled_drawing"


function drawCanvas(canvas: HTMLCanvasElement, page: PageClass, doc: DocClass, state: GlobalState, handler:MouseHandlerProtocol, zoomLevel:number, docUnit:Unit) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const can_scale = Math.pow(2,zoomLevel) * lookup_dpi(docUnit)
    ctx.save()
    ctx.fillStyle = '#be2424'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    const pageSize = page.getPropValue('size') as Size
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,pageSize.w*can_scale,pageSize.h*can_scale)
    const surf = new ScaledDrawingSurface(ctx,zoomLevel,docUnit)
    page.getListProp('children').forEach(shape => (shape as DrawableShape).drawSelf(surf))
    const selected = state.getSelectedObjects()
    for(const sel of selected) {
        ctx.strokeStyle = 'rgba(255,100,255,0.5)'
        ctx.lineWidth = 10
        if (sel instanceof DrawableClass) sel.drawSelected(surf)
    }
    //draw the handles
    for(const sel of selected) {
        if (sel instanceof DrawableClass) {
            const h = sel.getHandle()
            if(h) surf.overlayHandle(h)
        }
    }
    handler.drawOverlay(surf,state)
    ctx.restore()
}

export function PageView(props:{doc:DocClass, page:PageClass, state:GlobalState}) {
    const {doc, page, state} = props
    const pageSize:Size = page.getPropValue('size')
    const docUnit:Unit = doc.getPropValue('unit')
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [handler, setHandler] = useState<MouseHandlerProtocol>(new DragHandler())
    const [zoomLevel, setZoomLevel ] = useState(0)

    // const drawScale = Math.pow(2,zoomLevel) * lookup_dpi(docUnit)
    const canvasToModel = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ept = new Point(e.clientX, e.clientY)
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
        const cpt = ept.subtract(new Point(rect.x, rect.y))
        let pt = cpt.scale(window.devicePixelRatio)
        pt = pt.scale(1/Math.pow(2,zoomLevel))
        pt = pt.scale(1/lookup_dpi(docUnit))
        return pt
    }

    const redraw = () => {
        if(canvasRef.current) drawCanvas(canvasRef.current, page, doc, state, handler, zoomLevel, docUnit)
    }
    useEffect(() => redraw())
    useObjectProxyChange(props.page,FamilyPropChanged)
    useObservableChange(props.state,'selection')
    useObjectProxyChange(props.doc,PropChanged)
    useEffect(() => {
        const hand = () => setHandler(new DragHandler())
        handler.addEventListener('done', hand)
        return () => handler.removeEventListener('done', hand)
    }, [handler])
    useEffect(() => {
        const hand = () => redraw()
        handler.addEventListener('redraw', hand)
        return () => handler.removeEventListener('redraw', hand)
    }, [handler])
    const onMouseDown = async (e: MouseEvent<HTMLCanvasElement>) => {
        const pt = canvasToModel(e)
        await handler.mouseDown(pt, e, props.state)
    }
    const onMouseMove = async (e: MouseEvent<HTMLCanvasElement>) => {
        const pt = canvasToModel(e)
        await handler.mouseMove(pt,e,props.state)
    }
    const onMouseUp = async (e: MouseEvent<HTMLCanvasElement>) => {
        const pt = canvasToModel(e)
        await handler.mouseUp(pt, e, props.state)
    }
    const pm = useContext(PopupContext)
    const showContextMenu = async (e:MouseEvent<HTMLCanvasElement>) => {
        const pt = canvasToModel(e)
        await handler.mouseUp(pt, e, props.state)
        e.preventDefault()
        let items:MenuAction[] = []
        if(props.state.getSelectedObjects().length > 1) {
            items = items.concat([
                LeftAlignShapes,
                RightAlignShapes,
                TopAlignShapes,
                BottomAlignShapes,
                VCenterAlignShapes,
                HCenterAlignShapes,
            ])
        }


        items = items.concat([
            AddNewRectAction,
            AddNewCircleAction,
            AddNewNGonAction,
            AddNewSimpletextAction,
            AddNewSimpleimageAction,
            RaiseShapeAction,
            LowerShapeAction,
            DeleteSelection
        ])

        const menu = <MenuBox>{items.map((act,i) => {
                    return <MenuActionButton key={`action${i}`} action={act} state={props.state}/>
                })}</MenuBox>
        const elem = e.target as HTMLElement
        const dim = new Size(elem.clientWidth,elem.clientHeight)
        pm.show_at(menu, e.target, "below", new Point(0,-dim.h).add(pt.scale(0.5)).add(new Point(-5,5)))
    }
    const onDoubleClick = (e:MouseEvent<HTMLCanvasElement>) => {
        const pt = canvasToModel(e)
        const page = props.state.getSelectedPage()
        if(!page) return
        const shape = findShapeInPage(page,pt)
        if(shape) {
            if (shape instanceof PathShapeClass) {
                setHandler(new PathShapeEditHandler(shape as PathShapeClass, EditState.Existing))
            }
        }
    }

    let pal_vis = false
    const handler_commands = handler.getPaletteCommands()
    if(handler_commands) {
        pal_vis = true
    }

    const startNewPath = () => {
        const shape = state.om.make(PathShapeDef,{points:[]}) as PathShapeClass
        const page = state.getCurrentPage()
        page.appendListProp('children',shape)
        setHandler(new PathShapeEditHandler(shape, EditState.New))
    }
    const size = new Size(1200,800)
    const dom_size = size.scale(1/window.devicePixelRatio)
    const zoomIn = () => setZoomLevel(zoomLevel - 1)
    const zoomOut = () => setZoomLevel(zoomLevel + 1)
    return <div className={'panel page-view'}>
        <HBox>
            <label>{pageSize.w} {docUnit} x {pageSize.h} {docUnit}</label>
            <button onClick={startNewPath}>draw path</button>
            <button onClick={zoomIn}>-</button>
            <label>{zoomLevel}</label>
            <button onClick={zoomOut}>+</button>
        </HBox>
        <FloatingPalette visible={pal_vis}>{handler_commands}</FloatingPalette>
        <canvas
            ref={canvasRef}
            width={size.w}
            height={size.h}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            // onWheelCapture={onWheel}
            onDoubleClick={onDoubleClick}
            onContextMenuCapture={showContextMenu}
            style={{
                border: '1px solid black',
                width: dom_size.w + 'px',
                height: dom_size.h + 'px',
            }}></canvas>
    </div>

}
