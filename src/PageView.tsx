import React, {MouseEvent, useContext, useEffect, useRef, useState} from "react";
import {Bounds, Point, Size} from "josh_js_util";
import {HBox, PopupContext} from "josh_react_util";
import {GlobalState} from "./models/state";
import {
    DrawableShape,
    FamilyPropChanged,
    ObjectDef,
    ObjectProxy,
    PageType
} from "./models/om";
import {MenuActionButton, MenuBox, useObjectProxyChange, useObservableChange} from "./common";
import {
    AddNewCircleAction,
    AddNewRectAction, BottomAlignShapes,
    DeleteSelection, HCenterAlignShapes,
    LeftAlignShapes,
    RightAlignShapes, TopAlignShapes, VCenterAlignShapes
} from "./actions";

function drawCanvasState(canvas: HTMLCanvasElement, page: ObjectProxy<PageType>, state: GlobalState, handler:DragHandler) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    page.getListProp('children').forEach(shape => {
        (shape.obj as DrawableShape).drawSelf(ctx)
    })
    let selected = state.getSelectedObjects()
    for(let sel of selected) {
        ctx.strokeStyle = 'rgba(255,100,255,0.5)';
        ctx.lineWidth = 10;
        if (sel.obj.drawSelected) {
            (sel.obj as DrawableShape).drawSelected(ctx);
        }
    }
    handler.drawOverlay(ctx,state)
}

function findShapeInPage(page: ObjectProxy<PageType>, pt: Point):ObjectProxy<ObjectDef>|undefined {
    let matching = page.getListProp('children').filter(shape => {
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
    private draggingRect: boolean;
    private dragRect: Bounds;
    private potentialShapes: ObjectProxy<ObjectDef>[];
    constructor() {
        this.pressed = false
        this.originalPositions = new Map()
        this.dragStartPoint = new Point(-99,-99)
        this.draggingRect = false
        this.dragRect = new Bounds(0,0,50,50)
        this.potentialShapes = []
    }

    calcObjPos(target: ObjectProxy<any>) {
        if(!target) return new Point(-1,-1)
        if(target.def.name === 'rect') {
            return (target.getPropValue('bounds') as Bounds).position()
        }
        if(target.def.name === 'circle') {
            return target.getPropValue('center')
        }
        return new Point(-1,-1)
    }
    private calcObjIntersects(obj: ObjectProxy<any>, bounds:Bounds):boolean {
        if(obj.def.name === 'rect') {
            return ((obj.getPropValue('bounds')) as Bounds).intersects(bounds)
        }
        if(obj.def.name === 'circle') {
            let center = obj.getPropValue('center') as Point
            let rad = obj.getPropValue('radius') as number
            let bds = new Bounds(center.x-rad,center.y-rad,rad*2,rad*2)
            return bds.intersects(bounds)
        }
        return false
    }


    async setObjPos(target: ObjectProxy<any>, new_pos: Point) {
        if (target.def.name === 'rect') {
            let bounds = target.getPropValue('bounds') as Bounds
            await target.setPropValue('bounds', new Bounds(new_pos.x, new_pos.y, bounds.w, bounds.h))
        }
        if (target.def.name === 'circle') {
            await target.setPropValue('center', new_pos)
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
            this.draggingRect = true
        }
        this.dragStartPoint = pt
        this.pressed = true
        state.om.setCompressingHistory(true)
    }

    async mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        if (this.pressed) {
            if(this.draggingRect) {
                this.dragRect = new Bounds(
                    this.dragStartPoint.x,
                    this.dragStartPoint.y,
                    pt.x-this.dragStartPoint.x,
                    pt.y-this.dragStartPoint.y,
                )
                this.potentialShapes = this.findShapesInPageRect(state.getSelectedPage(),this.dragRect)
                state.fireSelectionChange()
            } else {
                const diff = pt.subtract(this.dragStartPoint)
                for (let sel of state.getSelectedObjects()) {
                    if (!this.originalPositions.has(sel)) {
                        this.originalPositions.set(sel, this.calcObjPos(sel))
                    }
                    let original_pos = this.originalPositions.get(sel) as Point
                    let new_pos = original_pos.add(diff)
                    await this.setObjPos(sel, new_pos)
                }
            }
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        if(this.draggingRect) {
            state.setSelectedObjects(this.potentialShapes)
            this.potentialShapes = []
        }
        this.pressed = false
        this.originalPositions.clear()
        this.dragStartPoint = new Point(-99,-99)
        this.draggingRect = false
        state.fireSelectionChange()
        state.om.setCompressingHistory(false)
    }

    drawOverlay(ctx: CanvasRenderingContext2D, state: GlobalState) {
        if(this.draggingRect) {
            ctx.strokeStyle = 'cyan'
            ctx.lineWidth = 1
            ctx.strokeRect(this.dragRect.x,this.dragRect.y,this.dragRect.w,this.dragRect.h)
            for(let shape of this.potentialShapes) {
                ctx.strokeStyle = 'rgba(100,255,255,0.5)';
                ctx.lineWidth = 10;
                (shape.obj as DrawableShape).drawSelected(ctx);
            }
        }
    }

    private findShapesInPageRect(page: ObjectProxy<PageType> | null, dragRect: Bounds) {
        if(!page) return []
        const included = []
        let chs = page.getListProp('children')
        for(let obj of chs) {
            let bds = this.calcObjIntersects(obj, dragRect)
            if(bds)included.push(obj)
        }
        return included
    }

}

export function PageView(props:{page:any, state:GlobalState}) {
    const [size, setSize] = useState(() => new Size(800, 600));
    const canvasRef = useRef<HTMLCanvasElement>();
    const [handler, setHandler] = useState(new DragHandler())
    useEffect(() => {
        if(canvasRef.current) {
            drawCanvasState(canvasRef.current, props.page, props.state, handler)
        }
    })
    useObjectProxyChange(props.page,FamilyPropChanged)
    useObservableChange(props.state,'selection')
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
