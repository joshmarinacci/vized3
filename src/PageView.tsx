import React, {MouseEvent, useContext, useEffect, useRef, useState} from "react";
import {Bounds, Point, Size} from "josh_js_util";
import {HBox, PopupContext} from "josh_react_util";
import {GlobalState} from "./models/state";
import {
    DrawableClass,
    DrawableShape,
    FamilyPropChanged, Handle,
    ObjectDef,
    ObjectProxy, PageClass
} from "./models/om";
import {MenuActionButton, MenuBox, useObjectProxyChange, useObservableChange} from "./common";
import {
    AddNewCircleAction,
    AddNewRectAction, BottomAlignShapes,
    DeleteSelection, HCenterAlignShapes,
    LeftAlignShapes,
    RightAlignShapes, TopAlignShapes, VCenterAlignShapes
} from "./actions";
import {PathShapeClass} from "./models/pathshape";
import {ObservableBase, Observable} from "./models/model";

function drawHandle(ctx: CanvasRenderingContext2D, h: Handle) {
    ctx.fillStyle = 'red'
    let p = h.getPosition()
    ctx.fillRect(p.x-10,p.y-10,20,20)
}

function drawCanvasState(canvas: HTMLCanvasElement, page: PageClass, state: GlobalState, handler:MouseHandlerProtocol) {
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

function findHandleInPage(page: PageClass, pt: Point, state:GlobalState):Handle|null {
    let selected = state.getSelectedObjects()
    for(let sel of selected) {
        if (sel instanceof DrawableClass) {
            let h = sel.getHandle()
            if (h && h.contains(pt)) return h
        }
    }
    return null
}

function calcObjPos(target: ObjectProxy<any>) {
    if(target instanceof DrawableClass) return target.getPosition()
    return new Point(-1,-1)
}
interface MouseHandlerProtocol extends Observable{
    drawOverlay(ctx: CanvasRenderingContext2D, state: GlobalState): void
    mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>
    mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>
    mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>
}
class DragHandler extends ObservableBase implements MouseHandlerProtocol{
    private pressed: boolean;
    private originalPositions: Map<ObjectProxy<ObjectDef>, Point>;
    private dragStartPoint: Point;
    private draggingRect: boolean;
    private dragRect: Bounds;
    private potentialShapes: DrawableClass<any>[];
    private draggingHandle: boolean;
    private dragHandle: Handle | null;
    constructor() {
        super()
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
                if (sel instanceof DrawableClass) {
                    await sel.setPosition(new_pos)
                }
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
                ctx.strokeStyle = 'rgba(100,255,255,0.5)'
                ctx.lineWidth = 10
                shape.drawSelected(ctx);
            }
        }
    }

    private findShapesInPageRect(page: PageClass | null, dragRect: Bounds):DrawableClass<any>[] {
        if(!page) return []
        let chs = page.getListProp('children') as DrawableClass<any>[]
        return chs.filter(obj => obj.intersects(dragRect))
    }
}

class EditHandle implements Handle {
    private pt: Point;
    private shape: PathShapeClass;
    private rad: number;
    private index: number;
    constructor(shape:PathShapeClass, index:number) {
        this.shape = shape
        this.index = index
        this.pt = (this.shape.getListPropAt('points',index) as Point).add(shape.getPosition())
        this.rad = 10
    }

    contains(pt: Point): boolean {
        let b = new Bounds(this.pt.x - this.rad, this.pt.y - this.rad, this.rad*2, this.rad*2)
        return b.contains(pt)
    }

    getPosition(): Point {
        return this.pt
    }

    async setPosition(pos: Point): Promise<void> {
        this.pt = pos
        await this.shape.setListPropAt('points',this.index,pos.subtract(this.shape.getPosition()))
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'red'
        ctx.fillRect(this.pt.x-this.rad,this.pt.y-this.rad,this.rad*2,this.rad*2)
    }
}

class PathShapeEditHandler extends ObservableBase implements MouseHandlerProtocol {
    private shape: PathShapeClass;
    private handles: EditHandle[];
    private target_handle: EditHandle | null;
    private pressed: boolean;
    constructor(shape:PathShapeClass) {
        super()
        this.shape = shape
        this.handles = (this.shape.props.points as Point[]).map((pt,i) => new EditHandle(this.shape,i))
        this.target_handle = null
        this.pressed = false
    }
    drawOverlay(ctx: CanvasRenderingContext2D, state: GlobalState): void {
        ctx.fillStyle = 'black'
        ctx.fillText('editing shape',100,100)
        // draw the handles for each point in the shape
        ctx.save()
        for(let hand of this.handles) {
            hand.draw(ctx)
        }
        ctx.restore()
    }

    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        let hand = this.handles.find(h => h.contains(pt))
        if(hand) {
            this.pressed = true
            this.target_handle = hand
        } else {
            console.log("not on a handle. bailing")
            this.fire('done',{})
        }
    }

    async mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        if(this.pressed && this.target_handle) {
            await this.target_handle.setPosition(pt)
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        this.pressed = false
        this.target_handle = null
    }

}

export function PageView(props:{page:any, state:GlobalState}) {
    const [size, setSize] = useState(() => new Size(800, 600));
    const canvasRef = useRef<HTMLCanvasElement>();
    const [handler, setHandler] = useState<MouseHandlerProtocol>(new DragHandler())
    useEffect(() => {
        if(canvasRef.current) drawCanvasState(canvasRef.current, props.page, props.state, handler)
    })
    useObjectProxyChange(props.page,FamilyPropChanged)
    useObservableChange(props.state,'selection')
    useEffect(() => {
        const hand = () => {
            console.log("mouse handler is done")
            setHandler(new DragHandler())
        }
        handler.addEventListener('done', hand)
        return () => {
            handler.removeEventListener('done', hand)
        }
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
