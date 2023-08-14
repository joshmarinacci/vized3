import React, {MouseEvent, ReactNode, useContext, useEffect, useRef, useState} from "react";
import {Point, Size} from "josh_js_util";
import {HBox, PopupContext} from "josh_react_util";
import {GlobalState} from "../models/state";
import {DrawableClass, DrawableShape, FamilyPropChanged, Handle, PageClass} from "../models/om";
import {MenuActionButton, MenuBox, useObjectProxyChange, useObservableChange} from "../common";
import {
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewRectAction,
    BottomAlignShapes,
    ConvertNGonToPath,
    DeleteSelection,
    HCenterAlignShapes,
    LeftAlignShapes,
    MenuAction,
    RightAlignShapes,
    TopAlignShapes,
    VCenterAlignShapes
} from "../actions";
import {PathShapeClass, PathShapeDef} from "../models/pathshape"
import {canvasToModel, findShapeInPage, MouseHandlerProtocol} from "./editing"
import {EditState, PathShapeEditHandler} from "./PathShapeEditHandler"
import {DragHandler} from "./DragHandler"
import "./PageView.css"
import {NGonClass} from "../models/ngon";

function drawHandle(ctx: CanvasRenderingContext2D, h: Handle) {
    ctx.fillStyle = 'red'
    let p = h.getPosition()
    ctx.fillRect(p.x-10,p.y-10,20,20)
}

function drawCanvas(canvas: HTMLCanvasElement, page: PageClass, state: GlobalState, handler:MouseHandlerProtocol, scale:number) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.save()
    ctx.scale(scale,scale)
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    page.getListProp('children').forEach(shape => (shape as DrawableShape).drawSelf(ctx))
    let selected = state.getSelectedObjects()
    for(let sel of selected) {
        ctx.strokeStyle = 'rgba(255,100,255,0.5)';
        ctx.lineWidth = 10;
        if (sel instanceof DrawableClass) sel.drawSelected(ctx);
    }
    handler.drawOverlay(ctx,state)
    //draw the handles
    for(let sel of selected) {
        if (sel instanceof DrawableClass) {
            let h = sel.getHandle()
            if(h) drawHandle(ctx,h)
        }
    }
    ctx.restore()
}

function FloatingPalette(props: { children: ReactNode, visible:boolean }) {
    const [position, setPosition] = useState(new Point(0,0))
    const style = {
        top: `${position.y}px`,
        left: `${position.x}px`,
        visibility: props.visible?'visible':'hidden',
    }
    const mouseDown = (e:MouseEvent<HTMLDivElement>) => {
        let pos = position
        const dragger = (e:any) => {
            let trans = new Point(e.movementX,e.movementY)
            pos = pos.add(trans)
            setPosition(pos)
        }
        const upper = (e:any) => {
            window.removeEventListener('mousemove',dragger)
            window.removeEventListener('mouseup',upper)
        }
        window.addEventListener('mousemove', dragger)
        window.addEventListener('mouseup',upper)
    }
    return <div className={'floating-palette'} style={style}
                onMouseDown={mouseDown}>
        <header>tools</header>
        {props.children}
    </div>
}

export function PageView(props:{page:any, state:GlobalState}) {
    const {page, state} = props
    const [size, setSize] = useState(() => new Size(1200, 800));
    const canvasRef = useRef<HTMLCanvasElement>();
    const [handler, setHandler] = useState<MouseHandlerProtocol>(new DragHandler())
    const [zoomLevel, setZoomLevel ] = useState(0)
    const scale = Math.pow(2,zoomLevel)

    const redraw = () => {
        if(canvasRef.current) drawCanvas(canvasRef.current, props.page, props.state, handler, scale)
    }
    useEffect(() => redraw())
    useObjectProxyChange(props.page,FamilyPropChanged)
    useObservableChange(props.state,'selection')
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
        let pt = canvasToModel(e).scale(1/scale)
        await handler.mouseDown(pt, e, props.state)
    }
    const onMouseMove = async (e: MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e).scale(1/scale)
        await handler.mouseMove(pt,e,props.state)
    }
    const onMouseUp = async (e: MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e).scale(1/scale)
        await handler.mouseUp(pt, e, props.state)
    }
    const pm = useContext(PopupContext)
    const showContextMenu = async (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e).scale(1/scale)
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

        if(props.state.getSelectedObjects().length === 1) {
            let sel = props.state.getSelectedObjects()[0]
            if(sel instanceof NGonClass) {
                items.push(ConvertNGonToPath)
            }
        }

        items = items.concat([
            AddNewRectAction,
            AddNewCircleAction,
            AddNewNGonAction,
            DeleteSelection
        ])

        const menu = <MenuBox>{items.map((act,i) => {
                    return <MenuActionButton action={act} state={props.state}/>
                })}</MenuBox>
        let elem = e.target as HTMLElement
        let dim = new Size(elem.clientWidth,elem.clientHeight)
        pm.show_at(menu, e.target, "below", new Point(0,-dim.h).add(pt.scale(0.5)).add(new Point(-5,5)))
    }
    const onDoubleClick = (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e).scale(1/scale)
        const page = props.state.getSelectedPage();
        if(!page) return
        let shape = findShapeInPage(page,pt)
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
    const dom_size = size.scale(1/window.devicePixelRatio)
    const zoomIn = () => setZoomLevel(zoomLevel - 1)
    const zoomOut = () => setZoomLevel(zoomLevel + 1)
    return <div className={'panel page-view'}>
        <HBox>
            <label>{size.w} x {size.h}</label>
            <button onClick={startNewPath}>draw path</button>
            <button onClick={zoomIn}>-</button>
            <label>{zoomLevel}</label>
            <button onClick={zoomOut}>+</button>
        </HBox>
        <FloatingPalette visible={pal_vis}>{handler_commands}</FloatingPalette>
        <canvas
            ref={canvasRef as any}
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
