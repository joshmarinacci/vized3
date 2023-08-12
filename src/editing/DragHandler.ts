import {DrawableClass, Handle, ObjectDef, ObjectProxy, PageClass} from "../models/om";
import {Bounds, Point} from "josh_js_util";
import {ObservableBase} from "../models/model";
import {findHandleInPage, findShapeInPage, MouseHandlerProtocol} from "./editing";
import React from "react";
import {GlobalState} from "../models/state";

function calcObjPos(target: ObjectProxy<any>) {
    if (target instanceof DrawableClass) return target.getPosition()
    return new Point(-1, -1)
}

export class DragHandler extends ObservableBase implements MouseHandlerProtocol {
    private pressed: boolean;
    private originalPositions: Map<ObjectProxy<ObjectDef>, Point>;
    private dragStartPoint: Point;
    private draggingRect: boolean;
    private dragRect: Bounds;
    private potentialShapes: DrawableClass<any>[];
    private draggingHandle: boolean;
    private dragHandle: Handle | null;

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
    }

    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState) {
        const page = state.getSelectedPage();
        if (!page) return
        let hand = findHandleInPage(page, pt, state)
        if (hand) {
            this.draggingHandle = true
            this.dragHandle = hand
            this.dragStartPoint = pt
            this.pressed = true
            return
        }

        let shape = findShapeInPage(page, pt)
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
        state.om.setCompressingHistory(true)
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
            for (let sel of state.getSelectedObjects()) {
                if (!this.originalPositions.has(sel)) {
                    this.originalPositions.set(sel, calcObjPos(sel))
                }
                let original_pos = this.originalPositions.get(sel) as Point
                let new_pos = original_pos.add(diff)
                if (sel instanceof DrawableClass) {
                    await sel.setPosition(new_pos)
                }
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
        state.om.setCompressingHistory(false)
    }

    drawOverlay(ctx: CanvasRenderingContext2D, state: GlobalState) {
        if (this.draggingRect) {
            ctx.strokeStyle = 'cyan'
            ctx.lineWidth = 1
            ctx.strokeRect(this.dragRect.x, this.dragRect.y, this.dragRect.w, this.dragRect.h)
            for (let shape of this.potentialShapes) {
                ctx.strokeStyle = 'rgba(100,255,255,0.5)'
                ctx.lineWidth = 10
                shape.drawSelected(ctx);
            }
        }
    }

    private findShapesInPageRect(page: PageClass | null, dragRect: Bounds): DrawableClass<any>[] {
        if (!page) return []
        let chs = page.getListProp('children') as DrawableClass<any>[]
        return chs.filter(obj => obj.intersects(dragRect))
    }
}
