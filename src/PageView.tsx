import React, {MouseEvent, useEffect, useRef, useState} from "react";
import {Bounds, Point, Size} from "josh_js_util";
import {HBox} from "josh_react_util";
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
import {useObjectProxyChange, useObservableChange} from "./common";

function drawCanvasState(canvas: HTMLCanvasElement, page: ObjectProxy<any>, state: GlobalState) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    page.getListProp(PageDef.props.children).forEach(shape => {
        (shape.obj as DrawableShape).drawSelf(ctx)
    })
    let selected = state.getSelectedObject()
    if(selected) {
        ctx.strokeStyle = 'rgba(255,100,255,0.5)';
        ctx.lineWidth = 10;
        (selected.obj as DrawableShape).drawSelected(ctx);
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

function calcObjPos(target: ObjectProxy<ObjectDef>) {
    if(!target) return new Point(-1,-1)
    if(target.def.name === 'rect') {
        return (target.getPropValue(RectDef.props.bounds) as Bounds).position()
    }
    if(target.def.name === 'circle') {
        return target.getPropValue(CircleDef.props.center)
    }
    return new Point(-1,-1)
}

async function moveObj(startPress: Point, originalPos: Point, curr: Point, target: ObjectProxy<ObjectDef>) {
    const diff = curr.subtract(startPress)
    let new_pos = originalPos.add(diff)
    if (target.def.name === 'rect') {
        let bounds = target.getPropValue(RectDef.props.bounds) as Bounds
        await target.setPropValue(RectDef.props.bounds, new Bounds(new_pos.x, new_pos.y, bounds.w, bounds.h))
    }
    if (target.def.name === 'circle') {
        await target.setPropValue(CircleDef.props.center, new_pos)
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
    const [pressed, setPressed] = useState(false)
    const [pressPoint, setPressPoint] = useState(new Point(0,0))
    const [startPoint, setStartPoint] = useState(new Point(0,0))
    const onMouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        if(props.page) {
            let page = props.page as ObjectProxy<ObjectDef>
            let shape = findShapeInPage(page,pt)
            if(shape) {
                props.state.setSelectedObject(shape)
                setStartPoint(calcObjPos(shape))
            } else {
                props.state.setSelectedObject(null)
            }
        }
        setPressPoint(pt)
        setPressed(true)
    }
    const onMouseMove = async (e: MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        let obj = props.state.getSelectedObject()
        if (pressed && obj) {
            await moveObj(pressPoint, startPoint, pt, obj)
        }
    }
    const onMouseUp = (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        setPressed(false)
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
            // onContextMenuCapture={showContextMenu}
            style={{
                border: '1px solid black',
                width: dom_size.w + 'px',
                height: dom_size.h + 'px',
            }}></canvas>
    </div>

}
