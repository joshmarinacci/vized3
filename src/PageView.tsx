import React, {MouseEvent, useEffect, useRef, useState} from "react";
import {Point, Size} from "josh_js_util";
import {HBox} from "josh_react_util";
import {Observable} from "./models/model";
import {GlobalState} from "./models/state";
import {
    DrawableShape,
    EventTypes,
    FamilyPropChanged,
    ObjectDef, ObjectManager,
    ObjectProxy, OMEventTypes,
    PageDef
} from "./models/om";

function drawCanvasState(canvas: HTMLCanvasElement, page: ObjectProxy<any>, state: GlobalState) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    page.getListProp(PageDef.props.children).forEach(shape => {
        (shape.obj as DrawableShape).drawSelf(ctx)
    })
    let selected = state.getSelectedObject()
    if(selected) {
        ctx.strokeStyle = 'magenta';
        ctx.lineWidth = 8;
        (selected.obj as DrawableShape).drawSelected(ctx);
    }
}

export function useObservableChange(ob:Observable|undefined, eventType:string) {
    const [count, setCount] = useState(0)
    return useEffect(() => {
        const hand = () => {
            setCount(count+1)
        }
        if(ob) ob.addEventListener(eventType,hand)
        return () => {
            if(ob) ob.removeEventListener(eventType,hand)
        }

    },[ob,count])
}
export function useObjectManagerChange(ob:ObjectManager, eventType:OMEventTypes) {
    const [count, setCount] = useState(0)
    return useEffect(() => {
        const hand = () => {
            setCount(count+1)
        }
        if(ob) ob.addEventListener(eventType,hand)
        return () => {
            if(ob) ob.removeEventListener(eventType,hand)
        }

    },[ob,count])
}
export function useObjectProxyChange(ob:ObjectProxy<ObjectDef>|null, eventType:EventTypes) {
    const [count, setCount] = useState(0)
    return useEffect(() => {
        const hand = () => {
            setCount(count+1)
        }
        if(ob) ob.addEventListener(eventType,hand)
        return () => {
            if(ob) ob.removeEventListener(eventType,hand)
        }

    },[ob,count])
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
    const onMouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
        if(props.page) {
            let page = props.page as ObjectProxy<ObjectDef>
            let shape = findShapeInPage(page,pt)
            if(shape) {
                props.state.setSelectedObject(shape)
            } else {
                props.state.setSelectedObject(null)
            }
        }
    }
    const onMouseUp = (e:MouseEvent<HTMLCanvasElement>) => {
        let pt = canvasToModel(e)
    }

    const dom_size = size.scale(1/window.devicePixelRatio)
    return <div className={'panel page-view'}>
        <HBox>size = {size.w} x {size.h}</HBox>
        <canvas
            ref={canvasRef as any}
            width={size.w}
            height={size.h}
            onMouseDown={onMouseDown}
            // onMouseMove={onMouseMove}
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
