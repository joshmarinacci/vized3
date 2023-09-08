import {Point} from "josh_js_util"
import {toClass} from "josh_react_util"
import React, {createContext, useContext, useEffect, useState} from "react"

export type PopupDirection = "left" | "right" | "inside-top-left"
/*
'left' means the popup is below the owner, aligned with the left edges, and overflowing to the right
'right' means the popup is below the owner, aligned with the right edges, and overflowing to the left
'inside-top-left' means the popup is in the top left corner of the scrim (0,0), plus any additional offset.

 */
export type PopupEvent = {
    type:'popup-event',
    content?:JSX.Element,
    owner?:HTMLElement,
    offset:Point,
    direction: PopupDirection
    visible:boolean
}
export type ShowPopupType = (e:PopupEvent) => void
export interface PopupContextInterface {
    show_at(view: JSX.Element, owner: HTMLElement, direction?:PopupDirection, offset?:Point): void
    hide():void
    on_change(cb:ShowPopupType): void
}

export class PopupContextImpl implements PopupContextInterface {
    private listeners: ShowPopupType[]
    constructor() {
        this.listeners = []
    }
    hide(): void {
        const evt:PopupEvent = {
            type:"popup-event",
            direction:"left",
            offset: new Point(0,0),
            visible:false,
        }
        this.listeners.forEach(cb => cb(evt))
    }

    on_change(cb:ShowPopupType): void {
        this.listeners.push(cb)
    }

    show_at(view: JSX.Element, owner: HTMLElement, direction?:PopupDirection, offset?:Point ): void {
        const evt:PopupEvent = {
            type:"popup-event",
            direction:direction || "right",
            owner:owner,
            offset: offset || new Point(0,0),
            content:view,
            visible:true,
        }
        this.listeners.forEach(cb => cb(evt))
    }

}
const samplePopupContext: PopupContextInterface = new PopupContextImpl()
export const PopupContext = createContext<PopupContextInterface>(samplePopupContext)

function calcStyle(event:PopupEvent) {
    // console.log("direction is",event.direction)
    const offset = event.offset||new Point(0,0)
    const body_rect = document.body.getBoundingClientRect()
    // console.log("body",document.body.getBoundingClientRect())
    if(!event.owner) return {}
    const rect = event.owner.getBoundingClientRect()
    // console.log("owner",rect)
    if(event.direction === 'left') {
        return {
            left:`${rect.left+offset.x}px`,
            top:`${rect.top+rect.height+offset.y}px`
        }
    }
    if(event.direction === 'right') {
        return {
            right:`${body_rect.width - rect.right - offset.x}px`,
            top:`${rect.top+rect.height + offset.y}px`
        }
    }

    if(event.direction === "inside-top-left") {
        return {
            left:`${0 + offset.x}px`,
            top: `${0 + offset.y}px`,
        }
    }
    return {
        left:'0px',
        top: '0px',
    }
}

export function PopupContainer() {
    const pm = useContext(PopupContext)
    const [event, set_event] = useState<PopupEvent | null>(null)
    const [visible, set_visible] = useState(false)
    useEffect(()=>{
        pm.on_change((e) => {
            set_event(e)
            set_visible(e.visible)
        })
    },[pm])
    const clickedScrim = () => {
        set_visible(false)
    }
    let content = <div>"no content"</div>
    let style = {}
    if(event && event.visible) {
        style = calcStyle(event)
        if(event.content) content = event.content
    }
    return <div className={toClass({
        popupScrim:true,
        visible:visible,
    })} onClick={clickedScrim}>
        <div className={"popupWrapper"} style={style}>{content}</div>
    </div>
}
