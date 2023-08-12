import React, {MouseEvent, useContext, useEffect, useRef, useState} from "react";
import {Point, Size} from "josh_js_util";
import {HBox, PopupContext} from "josh_react_util";
import {GlobalState} from "../models/state";
import {DrawableClass, DrawableShape, FamilyPropChanged, Handle, PageClass} from "../models/om";
import {MenuActionButton, MenuBox, useObjectProxyChange, useObservableChange} from "../common";
import {
    AddNewCircleAction,
    AddNewRectAction,
    BottomAlignShapes,
    DeleteSelection,
    HCenterAlignShapes,
    LeftAlignShapes,
    RightAlignShapes,
    TopAlignShapes,
    VCenterAlignShapes
} from "../actions";
import {PathShapeClass} from "../models/pathshape";
import {canvasToModel, findShapeInPage, MouseHandlerProtocol} from "./editing";
import {PathShapeEditHandler} from "./PathShapeEditHandler";
import {DragHandler} from "./DragHandler";

function drawHandle(ctx: CanvasRenderingContext2D, h: Handle) {
    ctx.fillStyle = 'red'
    let p = h.getPosition()
    ctx.fillRect(p.x-10,p.y-10,20,20)
}

function drawCanvas(canvas: HTMLCanvasElement, page: PageClass, state: GlobalState, handler:MouseHandlerProtocol) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
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
}

export function PageView(props:{page:any, state:GlobalState}) {
    const [size, setSize] = useState(() => new Size(800, 600));
    const canvasRef = useRef<HTMLCanvasElement>();
    const [handler, setHandler] = useState<MouseHandlerProtocol>(new DragHandler())

    const redraw = () => {
        if(canvasRef.current) drawCanvas(canvasRef.current, props.page, props.state, handler)
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
        let pt = canvasToModel(e)
        await handler.mouseDown(pt, e, props.state)
    }
    const onMouseMove = async (e: MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        await handler.mouseMove(pt,e,props.state)
    }
    const onMouseUp = async (e: MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        await handler.mouseUp(pt, e, props.state)
    }
    const pm = useContext(PopupContext)
    const showContextMenu = async (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        await handler.mouseUp(pt, e, props.state)
        e.preventDefault()
        let extras = <></>
        if(props.state.getSelectedObjects().length > 1) {
            extras = <>
                <MenuActionButton action={LeftAlignShapes} state={props.state}/>
                <MenuActionButton action={RightAlignShapes} state={props.state}/>
                <MenuActionButton action={TopAlignShapes} state={props.state}/>
                <MenuActionButton action={BottomAlignShapes} state={props.state}/>
                <MenuActionButton action={VCenterAlignShapes} state={props.state}/>
                <MenuActionButton action={HCenterAlignShapes} state={props.state}/>
            </>
        }
        const menu = <MenuBox>
            <MenuActionButton state={props.state} action={AddNewRectAction}/>
            <MenuActionButton state={props.state} action={AddNewCircleAction}/>
            <MenuActionButton state={props.state} action={DeleteSelection}/>
            {extras}
        </MenuBox>
        let elem = e.target as HTMLElement
        let dim = new Size(elem.clientWidth,elem.clientHeight)
        pm.show_at(menu, e.target, "below", new Point(0,-dim.h).add(pt.scale(0.5)).add(new Point(-5,5)))
    }
    const onDoubleClick = (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        const page = props.state.getSelectedPage();
        if(!page) return
        let shape = findShapeInPage(page,pt)
        if(shape) {
            if (shape instanceof PathShapeClass) {
                setHandler(new PathShapeEditHandler(shape as PathShapeClass))
            }
        }
    }

    const dom_size = size.scale(1/window.devicePixelRatio)
    return <div className={'panel page-view'}>
        <HBox>size = {size.w} x {size.h}</HBox>
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