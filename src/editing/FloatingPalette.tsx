import {Point} from "josh_js_util"
import React, {CSSProperties, MouseEvent, ReactNode, useState} from "react"

export function FloatingPalette(props: { children: ReactNode, visible: boolean }) {
    const [position, setPosition] = useState(new Point(0, 0))
    const style: CSSProperties = {
        top: `${position.y}px`,
        left: `${position.x}px`,
        visibility: props.visible ? 'visible' : 'hidden',
    }
    const mouseDown = (e: MouseEvent<HTMLDivElement>) => {
        let pos = position
        const dragger = (e: any) => {
            const trans = new Point(e.movementX, e.movementY)
            pos = pos.add(trans)
            setPosition(pos)
        }
        const upper = (e: any) => {
            window.removeEventListener('mousemove', dragger)
            window.removeEventListener('mouseup', upper)
        }
        window.addEventListener('mousemove', dragger)
        window.addEventListener('mouseup', upper)
    }
    return <div className={'floating-palette'} style={style}
                onMouseDown={mouseDown}>
        <header>tools</header>
        {props.children}
    </div>
}
