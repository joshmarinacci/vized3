import {Point} from "josh_js_util"
import React from "react"

import {Observable} from "../models/model"
import {
    DrawableClass,
    DrawableShape,
    Handle,
    ObjectDef,
    ObjectProxy, OO,
    PageClass,
    ScaledSurface
} from "../models/om"
import {GlobalState} from "../models/state"
import {distance_to_pixels, Unit} from "../models/unit"

export interface MouseHandlerProtocol extends Observable {
    drawOverlay(ctx: ScaledSurface, state: GlobalState): void

    mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>

    mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>

    mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void>

    getPaletteCommands():any
}

export function findHandleInPage(page: PageClass, pt: Point, state: GlobalState): Handle | null {
    const selected = state.getSelectedObjects()
    for (const sel of selected) {
        if (sel instanceof DrawableClass) {
            const h = sel.getHandle()
            if (h) {
                const dist = h.getPosition().distance(pt)
                const unit = state.getCurrentDocument().getPropValue('unit') as Unit
                const v = distance_to_pixels(dist,unit)
                if(v < 10) return h
            }
        }
    }
    return null
}

export function findShapeInPage(page: PageClass, pt: Point): OO | undefined {
    const matching = page.getListProp('children').filter(shape => {
        return (shape as DrawableShape).contains(pt)
    })
    if (matching.length > 0) {
        return matching.at(-1)
    }
    return undefined
}

