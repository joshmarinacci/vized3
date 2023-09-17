import {Bounds, Point} from "josh_js_util"
import React from "react"

import {Handle, ScaledSurface} from "../models/drawing"
import {ObservableBase} from "../models/model"
import {PathShapeClass} from "../models/pathshape"
import {GlobalState} from "../models/state"
import {distance_to_pixels, Unit} from "../models/unit"
import {MouseHandlerProtocol} from "./editing"

class EditHandle implements Handle {
    private pt: Point
    private shape: PathShapeClass
    private rad: number
    index: number
    hover: boolean

    constructor(shape: PathShapeClass, index: number) {
        this.shape = shape
        this.index = index
        if(this.shape.getPropValue('points').length < 1) {
            this.pt = new Point(-99,-99)
        } else {
            this.pt = (this.shape.getPropValue('points')[index]).add(shape.getPosition())
        }
        this.rad = 10
        this.hover = false
    }

    contains(pt: Point): boolean {
        const b = new Bounds(this.pt.x - this.rad, this.pt.y - this.rad, this.rad * 2, this.rad * 2)
        return b.contains(pt)
    }

    getPosition(): Point {
        return this.pt
    }

    async setPosition(pos: Point): Promise<void> {
        this.pt = pos
        this.shape.getPropValue('points')[this.index] = pos.subtract(this.shape.getPosition())
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.hover?'red':'blue'
        ctx.fillRect(this.pt.x - this.rad, this.pt.y - this.rad, this.rad * 2, this.rad * 2)
    }
}

export enum EditState {
    New,
    Existing,
    DraggingLine,
    ReadyToAddLine,
    Delete,
}

function draw_point(ctx: CanvasRenderingContext2D, color: string, mp: Point) {
    const rad = 5
    ctx.fillStyle = color
    ctx.fillRect(mp.x - rad, mp.y - rad, rad*2, rad*2)
}

function draw_line(ctx: CanvasRenderingContext2D, color: string, line: LineSegment) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(line.start.x,line.start.y)
    ctx.lineTo(line.end.x,line.end.y)
    ctx.stroke()
}

export class PathShapeEditHandler extends ObservableBase implements MouseHandlerProtocol {
    private shape: PathShapeClass
    private handles: EditHandle[]
    private target_handle: EditHandle | null
    private pressed: boolean
    private hover_handle: EditHandle | undefined
    private hover_line: LineSegment | undefined
    private drag_line: LineSegment | undefined
    private state: EditState
    private hover_closed: boolean
    private hover_point: Point

    constructor(shape: PathShapeClass, state:EditState) {
        super()
        this.state = state
        this.shape = shape
        this.handles = []
        this.target_handle = null
        this.pressed = false
        this.drag_line = undefined
        this.hover_closed = false
        this.hover_point = new Point(0,0)
        this.rebuild_handles()
    }


    drawOverlay(ctx: ScaledSurface, state: GlobalState): void {
        ctx.overlayFillText(`state: ${this.state}`, new Point(50,150))
        ctx.overlayFillText(`mouse: ${this.hover_point.x.toFixed(0)} , ${this.hover_point.y.toFixed(0)}`, new Point(50, 100))

        // // draw the handles for each point in the shape
        for (const hand of this.handles) ctx.overlayHandle(hand,'green')
        if(this.state === EditState.Existing) {
            for (const line of this.findLines()) ctx.overlayPoint(line.midpoint(),'green')
        }
        if(this.hover_handle) ctx.overlayHandle(this.hover_handle,'yellow')
        if(this.hover_line) ctx.overlayPoint(this.hover_line.midpoint(), 'orange')
        if(this.drag_line) ctx.overlayLine(this.drag_line.start, this.drag_line.end,'blue')
        if(this.hover_closed) ctx.overlayPoint(this.shape.getPropValue('points')[0], 'blue')
    }

    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        if(this.state === EditState.New) {
            this.pressed = true
            this.shape.getPropValue('points').push(pt)
            this.state = EditState.DraggingLine
            this.drag_line = new LineSegment(pt, pt, 0)
            this.repaint()
            return
        }
        if(this.state === EditState.ReadyToAddLine) {
            this.pressed = true
            const last_pt = this.shape.getPropValue('points')[this.shape.getPropValue('points').length-1]
            this.state = EditState.DraggingLine
            this.drag_line = new LineSegment(last_pt, pt, 0)
            this.repaint()
            return
        }
        const hand = this.findHandleAt(state,pt)
        if (hand) {
            this.pressed = true
            if(this.state === EditState.Delete) {
                const points = this.shape.getPropValue('points')
                points.splice(hand.index,1)
                this.rebuild_handles()
                this.state = EditState.Existing
                this.repaint()
            } else {
                this.target_handle = hand
            }
            return
        }
        if (this.hover_line) {
            await this.insertPoint(this.hover_line)
        } else {
            this.fire('done', {})
        }
    }

    async mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        this.hover_point = pt
        if (!this.pressed) {
            const hand = this.findHandleAt(state,pt)
            if(hand !== this.hover_handle) {
                if(this.hover_handle) this.hover_handle.hover = false
                this.hover_handle = hand
                if(this.hover_handle) this.hover_handle.hover = true
                this.repaint()
            }
            const line = this.findLineAt(state,pt)
            if (line !== this.hover_line) {
                this.hover_line = line
                this.repaint()
            }
        }
        if (this.pressed && this.state === EditState.DraggingLine) {
            this.drag_line.end = pt
            //if pt is near the start point of the shape, show a hover handle at the start point
            const first_pt:Point = this.shape.getPropValue('points')[0]
            if(this.calc_distance(state,first_pt,pt) < 10) {
                this.hover_closed = true
            } else {
                this.hover_closed = false
            }
            this.repaint()
        }
        if (this.pressed && this.target_handle) {
            await this.target_handle.setPosition(pt)
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        if(this.pressed && this.state === EditState.DraggingLine) {
            const first_pt:Point = this.shape.getPropValue('points')[0]
            const dist = this.calc_distance(state, first_pt,pt)
            if(dist < 10) {
                await this.shape.setPropValue('filled',true)
                await this.shape.setPropValue('closed',true)
                this.state = EditState.Existing
            } else {
                this.shape.getPropValue('points').push(this.drag_line.end)
                this.state = EditState.ReadyToAddLine
            }
            this.drag_line = undefined
            this.repaint()
        }
        this.pressed = false
        this.target_handle = null
    }

    private findLines() {
        const offset = this.shape.getPropValue('center')
        const points = this.shape.getPropValue('points')
        if(points.length < 2) return []
        const lines:LineSegment[] = []
        for(let i=0; i<points.length-1; i++) {
            lines.push(new LineSegment(points.at(i) as Point, points.at(i+1) as Point, i))
        }
        lines.push(new LineSegment(points.at(-1) as Point, points.at(0) as Point, points.length-1))
        return lines.map(l => l.add(offset))
    }

    private async insertPoint(hover_line: LineSegment) {
        const points = this.shape.getPropValue('points')
        points.splice(hover_line.index+1,0, hover_line.midpoint().subtract(this.shape.getPropValue('center')))
        this.rebuild_handles()
        this.repaint()
    }

    private rebuild_handles() {
        this.handles = (this.shape.getPropValue('points') as Point[]).map((pt, i) => new EditHandle(this.shape, i))
    }

    private repaint() {
        this.fire('redraw',{})
    }

    enterDeleteMode() {
        this.state = EditState.Delete
        this.repaint()
    }

    getPaletteCommands() {
        const finishNewPath = () => {
            this.fire('done',{})
        }
        const enterDeleteMode = () => {
            this.enterDeleteMode()
        }


        return <div>
            <button onClick={enterDeleteMode}>delete</button>
            <button onClick={finishNewPath}>done</button>
        </div>
    }

    private findHandleAt(state:GlobalState,pt: Point) {
        return this.handles.find(h => {
            const dist = h.getPosition().distance(pt)
            const unit = state.getCurrentDocument().getPropValue('unit') as Unit
            const v = distance_to_pixels(dist,unit)
            return v < 10
        })
    }

    private findLineAt(state:GlobalState, pt: Point) {
        return this.findLines().find(l => {
            const dist = l.midpoint().distance(pt)
            const unit = state.getCurrentDocument().getPropValue('unit') as Unit
            const v = distance_to_pixels(dist,unit)
            return v < 10
        })
    }

    private calc_distance(state:GlobalState, first_pt: Point, pt: Point) {
        const dist = first_pt.distance(pt)
        const unit = state.getCurrentDocument().getPropValue('unit') as Unit
        const v = distance_to_pixels(dist,unit)
        return v
    }
}

class LineSegment {
    start:Point
    end:Point
    index: number
    constructor(start:Point, end:Point, index:number) {
        this.start = start
        this.end = end
        this.index = index
    }
    add(offset:Point) {
        return new LineSegment(this.start.add(offset), this.end.add(offset), this.index)
    }
    midpoint():Point {
        return this.start.add(this.end).scale(0.5)
    }
}
