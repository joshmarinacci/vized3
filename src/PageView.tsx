import React, { useEffect, useRef, useState } from "react";
import {Size} from "josh_js_util";
import {HBox} from "josh_react_util";
import {Observable, VPage} from "./models/model"

function drawCanvasState(canvas: HTMLCanvasElement, page:VPage) {
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    page.children.forEach(shape => {
        shape.drawSelf(ctx)
    })
}

export function PageView(props:{page:any}) {
    const [count, setCount] = useState(0)
    const [size, setSize] = useState(() => new Size(300, 300));
    const canvasRef = useRef<HTMLCanvasElement>();
    useEffect(() => {
        if(canvasRef.current) {
            drawCanvasState(canvasRef.current, props.page as VPage)
        }
    })
    useEffect(() => {
        if(props.page) {
            let ob = props.page as Observable
            const hand = () => {
                setCount(count+1)
            }
            ob.addEventListener('changed',hand)
            return () => {
                ob.removeEventListener('changed',hand)
            }
        }
    })


    const dom_size = size.scale(window.devicePixelRatio)
    return <div className={'panel page-view'}>
        <HBox>size = {size.w} x {size.h}</HBox>
        <canvas
            ref={canvasRef as any}
            width={dom_size.w}
            height={dom_size.h}
            // onMouseDown={onMouseDown}
            // onMouseMove={onMouseMove}
            // onMouseUp={onMouseUp}
            // onWheelCapture={onWheel}
            // onContextMenuCapture={showContextMenu}
            style={{
                border: '1px solid black',
                width: size.w + 'px',
                height: size.h + 'px',
            }}></canvas>
    </div>

}
