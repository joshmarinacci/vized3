import {Observable} from "../models/model";
import {GlobalState} from "../models/state";
import {Point} from "josh_js_util";
import React from "react";
import {
    DrawableClass,
    DrawableShape,
    Handle,
    ObjectDef,
    ObjectProxy,
    PageClass
} from "../models/om";

export interface MouseHandlerProtocol extends Observable {
    drawOverlay(ctx: CanvasRenderingContext2D, state: GlobalState): void

    mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>

    mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>

    mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>
}

export function findHandleInPage(page: PageClass, pt: Point, state: GlobalState): Handle | null {
    let selected = state.getSelectedObjects()
    for (let sel of selected) {
        if (sel instanceof DrawableClass) {
            let h = sel.getHandle()
            if (h && h.contains(pt)) return h
        }
    }
    return null
}

export function findShapeInPage(page: PageClass, pt: Point): ObjectProxy<ObjectDef> | undefined {
    let matching = page.getListProp('children').filter(shape => {
        return (shape as DrawableShape).contains(pt)
    })
    if (matching.length > 0) {
        return matching.at(-1)
    }
    return undefined
}

export function canvasToModel(e: React.MouseEvent<HTMLCanvasElement>) {
    let pt = new Point(e.clientX, e.clientY)
    let rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    pt = pt.subtract(new Point(rect.x, rect.y))
    pt = pt.scale(window.devicePixelRatio)
    return pt
}
