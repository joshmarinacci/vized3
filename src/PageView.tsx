import React, {MouseEvent, useContext, useEffect, useRef, useState} from "react";
import {Bounds, Point, Size} from "josh_js_util";
import {HBox, PopupContext} from "josh_react_util";
import {GlobalState} from "./models/state";
import {
    CircleDef,
    DrawableShape,
    FamilyPropChanged,
    ObjectDef,
    ObjectProxy,
    PageDef,
    RectDef
} from "./models/om";
import {MenuActionButton, MenuBox, useObjectProxyChange, useObservableChange} from "./common";
import {AddNewCircleAction, AddNewRectAction, DeleteSelection} from "./actions";

function drawCanvasState(canvas: HTMLCanvasElement, page: ObjectProxy<any>, state: GlobalState) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    page.getListProp(PageDef.props.children).forEach(shape => {
        (shape.obj as DrawableShape).drawSelf(ctx)
    })
    let selected = state.getSelectedObjects()
    for(let sel of selected) {
        ctx.strokeStyle = 'rgba(255,100,255,0.5)';
        ctx.lineWidth = 10;
        (sel.obj as DrawableShape).drawSelected(ctx);
    }
}

function findShapeInPage(page: ObjectProxy<ObjectDef>, pt: Point):ObjectProxy<ObjectDef>|undefined {
    let matching = page.getListProp(PageDef.props.children).filter(shape => {
        return (shape.obj as DrawableShape).contains(pt)
    })
    if(matching.length > 0) {
        return matching.at(-1)
    }
    return undefined
}

function canvasToModel(e: React.MouseEvent<HTMLCanvasElement>) {
    let pt = new Point(e.clientX, e.clientY)
    let rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    pt = pt.subtract(new Point(rect.x, rect.y))
    pt = pt.scale(window.devicePixelRatio)
    return pt
}


class DragHandler {
    private pressed: boolean;
    private originalPositions: Map<ObjectProxy<ObjectDef>, Point>;
    private dragStartPoint: Point;
    constructor() {
        this.pressed = false
        this.originalPositions = new Map()
        this.dragStartPoint = new Point(-99,-99)
    }

    calcObjPos(target: ObjectProxy<ObjectDef>) {
        if(!target) return new Point(-1,-1)
        if(target.def.name === 'rect') {
            return (target.getPropValue(RectDef.props.bounds) as Bounds).position()
        }
        if(target.def.name === 'circle') {
            return target.getPropValue(CircleDef.props.center)
        }
        return new Point(-1,-1)
    }


    async setObjPos(target: ObjectProxy<ObjectDef>, new_pos: Point) {
        if (target.def.name === 'rect') {
            let bounds = target.getPropValue(RectDef.props.bounds) as Bounds
            await target.setPropValue(RectDef.props.bounds, new Bounds(new_pos.x, new_pos.y, bounds.w, bounds.h))
        }
        if (target.def.name === 'circle') {
            await target.setPropValue(CircleDef.props.center, new_pos)
        }
    }

    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        const page = state.getSelectedPage();
        if(!page) return
        let shape = findShapeInPage(page,pt)
        const sel = state.getSelectedObjects()
        if(shape) {
            if(sel.some(s => s === shape)) {
                // console.log("already selected")
            } else {
                if(e.shiftKey) {
                    state.addSelectedObjects([shape])
                } else {
                    state.setSelectedObjects([shape])
                }
            }
        } else {
            state.clearSelectedObjects()
        }
        this.dragStartPoint = pt
        this.pressed = true
        state.om.setCompressingHistory(true)
    }

    async mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        if (this.pressed) {
            const diff = pt.subtract(this.dragStartPoint)
            for(let sel of state.getSelectedObjects()) {
                if (!this.originalPositions.has(sel)) {
                    this.originalPositions.set(sel,this.calcObjPos(sel))
                }
                let original_pos = this.originalPositions.get(sel) as Point
                let new_pos = original_pos.add(diff)
                await this.setObjPos(sel,new_pos)
            }
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        this.pressed = false
        this.originalPositions.clear()
        this.dragStartPoint = new Point(-99,-99)
        state.om.setCompressingHistory(false)
    }
}

export function PageView(props:{page:any, state:GlobalState}) {
    const [size, setSize] = useState(() => new Size(800, 600));
    const canvasRef = useRef<HTMLCanvasElement>();
    useEffect(() => {
        if(canvasRef.current) {
            drawCanvasState(canvasRef.current, props.page, props.state)
        }
    })
    useObjectProxyChange(props.page,FamilyPropChanged)
    useObservableChange(props.state,'selection')
    const [handler, setHandler] = useState(new DragHandler())
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
    const showContextMenu = (e:MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const menu = <MenuBox>
            <MenuActionButton state={props.state} action={AddNewRectAction}/>
            <MenuActionButton state={props.state} action={AddNewCircleAction}/>
            <MenuActionButton state={props.state} action={DeleteSelection}/>
        </MenuBox>
        pm.show_at(menu, e.target, "left", new Point(0,0))
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
            onContextMenuCapture={showContextMenu}
            style={{
                border: '1px solid black',
                width: dom_size.w + 'px',
                height: dom_size.h + 'px',
            }}></canvas>
    </div>

}
