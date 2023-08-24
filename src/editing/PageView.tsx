import React, {
    CSSProperties,
    MouseEvent,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import {Bounds, Point, Size} from "josh_js_util";
import {HBox, PopupContext} from "josh_react_util";
import {GlobalState} from "../models/state";
import {
    DocClass,
    DrawableClass,
    DrawableShape,
    FamilyPropChanged,
    Handle,
    PageClass,
    PropChanged,
    ScaledSurface
} from "../models/om";
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
import {lookup_dpi, point_to_pixels, Unit} from "../models/unit";


export class ScaledDrawingSurface implements ScaledSurface {
    private ctx: CanvasRenderingContext2D;
    private scale: number;
    private unit: Unit;

    constructor(ctx: CanvasRenderingContext2D, scale: number, unit: Unit) {
        this.ctx = ctx
        this.scale = scale
        this.unit = unit
    }
    fillRect(bounds: Bounds, fill: "string") {
        this.ctx.fillStyle = fill
        this.ctx.fillRect(bounds.x*this.scale,bounds.y*this.scale,bounds.w*this.scale,bounds.h*this.scale)
    }
    outlineRect(bounds: Bounds) {
        this.ctx.strokeRect(bounds.x*this.scale, bounds.y*this.scale, bounds.w*this.scale, bounds.h*this.scale)
    }
    strokeRect(bounds: Bounds, strokeFill: string, strokeWidth: number) {
        this.ctx.strokeStyle = strokeFill
        this.ctx.lineWidth = strokeWidth
        this.ctx.strokeRect(bounds.x*this.scale, bounds.y*this.scale, bounds.w*this.scale, bounds.h*this.scale)
    }

    fillRoundRect(bounds: Bounds, radius: number, fill: any) {
        this.ctx.fillStyle = fill
        this.ctx.beginPath()
        this.ctx.roundRect(bounds.left()*this.scale, bounds.top()*this.scale, bounds.w*this.scale, bounds.h*this.scale, radius)
        this.ctx.closePath()
        this.ctx.fill()
    }
    strokeRoundRect(bounds: Bounds, radius: number, strokeFill: string, strokeWidth: number) {
        this.ctx.strokeStyle = strokeFill
        this.ctx.lineWidth = strokeWidth
        this.ctx.beginPath()
        this.ctx.roundRect(bounds.left()*this.scale, bounds.top()*this.scale, bounds.w*this.scale, bounds.h*this.scale, radius)
        this.ctx.closePath()
        this.ctx.stroke()
    }

    fillArc(center: Point, radius: number, startAngle: number, endAngle: number, fill: string) {
        this.ctx.fillStyle = fill
        this.ctx.beginPath()
        this.ctx.arc(center.x*this.scale, center.y*this.scale, radius*this.scale, startAngle, endAngle)
        this.ctx.fill()
    }
    outlineArc(center: Point, radius: number, startAngle: number, endAngle: number, fill: string) {
        this.ctx.beginPath()
        this.ctx.arc(center.x*this.scale, center.y*this.scale, radius*this.scale, startAngle, endAngle)
        this.ctx.stroke()
    }

    private calcFont(fontSize:number) {
        return `${fontSize}pt sans-serif`
    }
    fillText(text: string, center: Point, fill: string, fontSize: number) {
        this.ctx.fillStyle = fill
        this.ctx.font = this.calcFont(fontSize)
        this.ctx.fillText(text, center.x*this.scale, center.y*this.scale)
    }
    fillLinePath(position: Point, points: Point[], closed: boolean, filled: boolean, fill: string) {
        if(points.length < 3) return
        this.ctx.save()
        this.ctx.fillStyle = fill
        this.ctx.translate(position.x*this.scale, position.y*this.scale)
        this.ctx.beginPath()
        this.ctx.moveTo(points[0].x*this.scale,points[0].y*this.scale)
        for (let pt of points) this.ctx.lineTo(pt.x*this.scale, pt.y*this.scale)
        if(closed) this.ctx.closePath()
        this.ctx.fill()
        this.ctx.restore()
    }
    outlineLinePath(position: Point, points: Point[]) {
        if(points.length < 3) return
        this.ctx.save()
        this.ctx.translate(position.x*this.scale, position.y*this.scale)
        this.ctx.beginPath()
        this.ctx.moveTo(points[0].x*this.scale,points[0].y*this.scale)
        for (let pt of points) this.ctx.lineTo(pt.x*this.scale, pt.y*this.scale)
        this.ctx.closePath()
        this.ctx.stroke()
        this.ctx.restore()
    }

    overlayHandle(h: Handle) {
        this.ctx.fillStyle = 'red'
        let p = point_to_pixels(h.getPosition(),this.unit)
        this.ctx.fillRect(p.x-10,p.y-10,20,20)
    }
    dragRect(dragRect: Bounds) {
        this.ctx.strokeStyle = 'cyan'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(dragRect.x*this.scale, dragRect.y*this.scale, dragRect.w*this.scale, dragRect.h*this.scale)
    }

    overlayFillText(s: string, point: Point) {
        this.ctx.fillStyle = 'black'
        this.ctx.font = '20pt sans-serif'
        this.ctx.fillText(s, point.x, point.y)
    }
    overlayPoint(point: Point, green: string) {
        this.ctx.fillStyle = green
        let r = 5
        this.ctx.fillRect(point.x*this.scale-r, point.y*this.scale-r, r*2, r*2)
    }
}

function drawCanvas(canvas: HTMLCanvasElement, page: PageClass, doc: DocClass, state: GlobalState, handler:MouseHandlerProtocol, scale:number) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.save()
    ctx.fillStyle = '#be2424'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    const pageSize = page.getPropValue('size') as Size
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,pageSize.w*scale,pageSize.h*scale)
    let surf = new ScaledDrawingSurface(ctx,scale,doc.getPropValue('unit'))
    page.getListProp('children').forEach(shape => (shape as DrawableShape).drawSelf(surf))
    let selected = state.getSelectedObjects()
    for(let sel of selected) {
        ctx.strokeStyle = 'rgba(255,100,255,0.5)';
        ctx.lineWidth = 10;
        if (sel instanceof DrawableClass) sel.drawSelected(surf);
    }
    handler.drawOverlay(surf,state)
    //draw the handles
    for(let sel of selected) {
        if (sel instanceof DrawableClass) {
            let h = sel.getHandle()
            if(h) surf.overlayHandle(h)
        }
    }
    ctx.restore()
}

function FloatingPalette(props: { children: ReactNode, visible:boolean }) {
    const [position, setPosition] = useState(new Point(0,0))
    const style:CSSProperties = {
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

export function PageView(props:{doc:DocClass, page:PageClass, state:GlobalState}) {
    const {doc, page, state} = props
    const pageSize:Size = page.getPropValue('size')
    const docUnit:Unit = doc.getPropValue('unit')
    const canvasRef = useRef<HTMLCanvasElement>();
    const [handler, setHandler] = useState<MouseHandlerProtocol>(new DragHandler())
    const [zoomLevel, setZoomLevel ] = useState(0)
    const scale = Math.pow(2,zoomLevel) * lookup_dpi(docUnit)

    const redraw = () => {
        if(canvasRef.current) drawCanvas(canvasRef.current, page, doc, state, handler, scale)
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
        let pt = canvasToModel(e)
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
                    return <MenuActionButton key={`action${i}`} action={act} state={props.state}/>
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
