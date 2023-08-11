import React, {MouseEvent, useContext, useEffect, useRef, useState} from "react";
import {Bounds, Point, Size} from "josh_js_util";
import {HBox, PopupContext} from "josh_react_util";
import {GlobalState} from "./models/state";
import {
    CircleClass,
    DrawableShape,
    FamilyPropChanged,
    ObjectDef,
    ObjectProxy, PageClass,
    RectClass} from "./models/om";
import {MenuActionButton, MenuBox, useObjectProxyChange, useObservableChange} from "./common";
import {
    AddNewCircleAction,
    AddNewRectAction, BottomAlignShapes,
    DeleteSelection, HCenterAlignShapes,
    LeftAlignShapes,
    RightAlignShapes, TopAlignShapes, VCenterAlignShapes
} from "./actions";

function drawHandle(ctx: CanvasRenderingContext2D, h: Handle) {
    ctx.fillStyle = 'red'
    let p = h.getPosition()
    ctx.fillRect(p.x-10,p.y-10,20,20)
}

function drawCanvasState(canvas: HTMLCanvasElement, page: PageClass, state: GlobalState, handler:DragHandler) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    page.getListProp('children').forEach(shape => {
        (shape as DrawableShape).drawSelf(ctx)
    })
    let selected = state.getSelectedObjects()
    for(let sel of selected) {
        ctx.strokeStyle = 'rgba(255,100,255,0.5)';
        ctx.lineWidth = 10;
        if (Object.hasOwn(sel,'drawSelected')) {
            (sel as unknown as DrawableShape).drawSelected(ctx);
        }
    }
    handler.drawOverlay(ctx,state)
    //draw the handles
    for(let sel of selected) {
        let h = handleForShape(sel)
        if(h) drawHandle(ctx,h)
    }
}

function handleForShape(obj:ObjectProxy<any>):Handle | null {
    if(obj.def.name === 'rect') {
        return new RectResizeHandle(obj as RectClass)
    }
    if(obj.def.name === 'circle') {
        return new CircleResizeHandle(obj as CircleClass)
    }
    return null
}

function findShapeInPage(page: PageClass, pt: Point):ObjectProxy<ObjectDef>|undefined {
    let matching = page.getListProp('children').filter(shape => {
        return (shape as DrawableShape).contains(pt)
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

interface Handle {
    getPosition(): Point;
    setPosition(pos: Point): Promise<void>;
    contains(pt: Point): boolean;
}

class RectResizeHandle implements Handle {
    private obj: RectClass;
    constructor(obj:RectClass) {
        this.obj = obj
    }
    getPosition():Point {
        return this.obj.getPropValue("bounds").bottom_right()
    }
    async setPosition(pos: Point) {
        let old_bounds = this.obj.getPropValue('bounds')
        const new_bounds: Bounds = new Bounds(old_bounds.x, old_bounds.y, pos.x - old_bounds.x, pos.y - old_bounds.y)
        await this.obj.setPropValue("bounds", new_bounds)
    }

    contains(pt: Point) {
        let pos = this.obj.getPropValue('bounds').bottom_right()
        let b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

class CircleResizeHandle implements Handle{
    private obj: CircleClass
    constructor(obj:CircleClass) {
        this.obj = obj
    }

    getPosition(): Point {
        let center = this.obj.getPropValue("center")
        let radius = this.obj.getPropValue('radius')
        return center.add(new Point(radius, 0))
    }

    async setPosition(pos: Point) {
        let center = this.obj.getPropValue("center")
        let diff = pos.subtract(center)
        let radius = diff.x
        await this.obj.setPropValue('radius', radius)
    }

    contains(pt: Point) {
        let center = this.obj.getPropValue("center")
        let radius = this.obj.getPropValue('radius')
        let pos = center.add(new Point(radius, 0))
        let b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

function findHandleInPage(page: PageClass, pt: Point, state:GlobalState):Handle|null {
    let selected = state.getSelectedObjects()
    for(let sel of selected) {
        let h = handleForShape(sel)
        if (h && h.contains(pt)) return h
    }
    return null
}

function calcObjPos(target: ObjectProxy<any>) {
    if(!target) return new Point(-1,-1)
    if(target.def.name === 'rect') {
        return (target.getPropValue('bounds') as Bounds).position()
    }
    if(target.def.name === 'circle') {
        return target.getPropValue('center')
    }
    if(target.def.name === 'simple-text') {
        return target.getPropValue('center')
    }
    return new Point(-1,-1)
}
function calcObjIntersects(obj: ObjectProxy<any>, bounds:Bounds):boolean {
    if(obj.def.name === 'rect') {
        return ((obj.getPropValue('bounds')) as Bounds).intersects(bounds)
    }
    if(obj.def.name === 'circle') {
        let center = obj.getPropValue('center') as Point
        let rad = obj.getPropValue('radius') as number
        let bds = new Bounds(center.x-rad,center.y-rad,rad*2,rad*2)
        return bds.intersects(bounds)
    }
    if(obj.def.name === 'simple-text') {
        let center = obj.getPropValue('center') as Point
        let bds = new Bounds(center.x,center.y-50,100,50)
        return bds.intersects(bounds)
    }
    return false
}
async function setObjPos(target: ObjectProxy<any>, new_pos: Point) {
    if (target.def.name === 'rect') {
        let bounds = target.getPropValue('bounds') as Bounds
        await target.setPropValue('bounds', new Bounds(new_pos.x, new_pos.y, bounds.w, bounds.h))
    }
    if (target.def.name === 'circle') {
        await target.setPropValue('center', new_pos)
    }
    if (target.def.name === 'simple-text') {
        await target.setPropValue('center', new_pos)
    }
}

class DragHandler {
    private pressed: boolean;
    private originalPositions: Map<ObjectProxy<ObjectDef>, Point>;
    private dragStartPoint: Point;
    private draggingRect: boolean;
    private dragRect: Bounds;
    private potentialShapes: ObjectProxy<ObjectDef>[];
    private draggingHandle: boolean;
    private dragHandle: Handle | null;
    constructor() {
        this.pressed = false
        this.originalPositions = new Map()
        this.dragStartPoint = new Point(-99,-99)
        this.draggingRect = false
        this.draggingHandle = false
        this.dragHandle = null
        this.dragRect = new Bounds(0,0,50,50)
        this.potentialShapes = []
    }


    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        const page = state.getSelectedPage();
        if(!page) return
        let hand = findHandleInPage(page,pt, state)
        if(hand) {
            this.draggingHandle = true
            this.dragHandle = hand
            this.dragStartPoint = pt
            this.pressed = true
            return
        }

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
                return
            }
            const diff = pt.subtract(this.dragStartPoint)
            if(this.draggingHandle && this.dragHandle) {
                await this.dragHandle.setPosition(pt)
                return
            }
            for (let sel of state.getSelectedObjects()) {
                if (!this.originalPositions.has(sel)) {
                    this.originalPositions.set(sel, calcObjPos(sel))
                }
                let original_pos = this.originalPositions.get(sel) as Point
                let new_pos = original_pos.add(diff)
                await setObjPos(sel, new_pos)
            }
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        if(this.draggingRect) {
            state.setSelectedObjects(this.potentialShapes)
            this.potentialShapes = []
        }
        if(this.draggingHandle) {
            this.draggingHandle = false
            this.dragHandle = null
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
                (shape as unknown as DrawableShape).drawSelected(ctx);
            }
        }
    }

    private findShapesInPageRect(page: PageClass | null, dragRect: Bounds) {
        if(!page) return []
        const included = []
        let chs = page.getListProp('children')
        for(let obj of chs) {
            let bds = calcObjIntersects(obj, dragRect)
            if(bds) included.push(obj)
        }
        return included
    }

}

export function PageView(props:{page:any, state:GlobalState}) {
    const [size, setSize] = useState(() => new Size(800, 600));
    const canvasRef = useRef<HTMLCanvasElement>();
    const [handler, setHandler] = useState(new DragHandler())
    useEffect(() => {
        if(canvasRef.current) drawCanvasState(canvasRef.current, props.page, props.state, handler)
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
