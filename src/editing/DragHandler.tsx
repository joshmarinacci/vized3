import {Bounds, Point} from "josh_js_util"
import React from "react"

import {BaseShape} from "../models/defs"
import {Handle, ScaledSurface} from "../models/drawing"
import {ObservableBase} from "../models/model"
import {PageClass} from "../models/page"
import {GlobalState} from "../models/state"
import {findHandleInPage, findShapeInPage, MouseHandlerProtocol} from "./editing"

export class DragHandler extends ObservableBase implements MouseHandlerProtocol {
    private pressed: boolean
    private originalPositions: Map<BaseShape<any>, Point>
    private dragStartPoint: Point
    private draggingRect: boolean
    private dragRect: Bounds
    private potentialShapes: BaseShape<any>[]
    private draggingHandle: boolean
    private dragHandle: Handle | null
    private hoverHandle: Handle | null

    constructor() {
        super()
        this.pressed = false
        this.originalPositions = new Map()
        this.dragStartPoint = new Point(-99, -99)
        this.draggingRect = false
        this.draggingHandle = false
        this.dragHandle = null
        this.dragRect = new Bounds(0, 0, 50, 50)
        this.potentialShapes = []
        this.hoverHandle = null
    }

    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        const page = state.getSelectedPage()
        if (!page) return
        const hand = findHandleInPage(page, pt, state)
        if (hand) {
            this.draggingHandle = true
            this.dragHandle = hand
            this.dragStartPoint = pt
            this.pressed = true
            return
        }

        const shape = findShapeInPage(page, pt)
        const sel = state.getSelectedObjects()
        if (shape) {
            if (sel.some(s => s === shape)) {
                // console.log("already selected")
            } else {
                if (e.shiftKey) {
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
        // state.om.setCompressingHistory(true)
    }

    async mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        if (this.pressed) {
            if (this.draggingRect) {
                this.dragRect = new Bounds(
                    this.dragStartPoint.x,
                    this.dragStartPoint.y,
                    pt.x - this.dragStartPoint.x,
                    pt.y - this.dragStartPoint.y,
                )
                this.potentialShapes = this.findShapesInPageRect(state.getSelectedPage(), this.dragRect)
                state.fireSelectionChange()
                return
            }
            const diff = pt.subtract(this.dragStartPoint)
            if (this.draggingHandle && this.dragHandle) {
                await this.dragHandle.setPosition(pt)
                return
            }
            for (const sel of state.getSelectedShapes()) {
                if (!this.originalPositions.has(sel)) {
                    this.originalPositions.set(sel, sel.getPosition())
                }
                const original_pos = this.originalPositions.get(sel) as Point
                const new_pos = original_pos.add(diff)
                await sel.setPosition(new_pos)
            }
        } else {
            const page = state.getSelectedPage()
            if (!page) return
            const hand = findHandleInPage(page, pt, state)
            if(hand !== this.hoverHandle) {
                this.hoverHandle = hand
                state.fireSelectionChange()
            }
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        if (this.draggingRect) {
            state.setSelectedObjects(this.potentialShapes)
            this.potentialShapes = []
        }
        if (this.draggingHandle) {
            this.draggingHandle = false
            this.dragHandle = null
        }
        this.pressed = false
        this.originalPositions.clear()
        this.dragStartPoint = new Point(-99, -99)
        this.draggingRect = false
        state.fireSelectionChange()
        // state.om.setCompressingHistory(false)
    }

    drawOverlay(ctx: ScaledSurface, state: GlobalState) {
        if (this.draggingRect) {
            ctx.dragRect(this.dragRect)
            for (const shape of this.potentialShapes) {
                shape.drawSelected(ctx)
            }
        }
        if(this.hoverHandle) {
            ctx.overlayHandle(this.hoverHandle, 'blue')
        }
    }

    private findShapesInPageRect(page: PageClass | null, dragRect: Bounds): BaseShape<any>[] {
        if (!page) return []
        const chs = page.getShapeChildren()
        return chs.filter(obj => obj.intersects(dragRect))
    }

    getPaletteCommands(): any {
        return null
    }
}
