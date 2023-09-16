import {Point} from "josh_js_util"
import React from "react"

import {Handle, ScaledSurface} from "../models/drawing"
import {Observable} from "../models/model"
import {PageClass} from "../models/page"
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
    const selected = state.getSelectedShapes()
    for (const sel of selected) {
        const h = sel.getHandle()
        if (h) {
            const dist = h.getPosition().distance(pt)
            const unit = state.getCurrentDocument().getPropValue('unit') as Unit
            const v = distance_to_pixels(dist,unit)
            if(v < 10) return h
        }
    }
    return null
}

export function findShapeInPage(page: PageClass, pt: Point) {
    const matching = page.getShapeChildren().filter(shape => {
        return shape.contains(pt)
    })
    if (matching.length > 0) {
        return matching.at(-1)
    }
    return undefined
}

