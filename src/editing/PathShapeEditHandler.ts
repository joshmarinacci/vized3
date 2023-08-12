import {Handle} from "../models/om";
import {Bounds, Point} from "josh_js_util";
import {PathShapeClass} from "../models/pathshape";
import {ObservableBase} from "../models/model";
import {MouseHandlerProtocol} from "./editing";
import {GlobalState} from "../models/state";
import React from "react";

class EditHandle implements Handle {
    private pt: Point;
    private shape: PathShapeClass;
    private rad: number;
    private index: number;
    hover: boolean;

    constructor(shape: PathShapeClass, index: number) {
        this.shape = shape
        this.index = index
        this.pt = (this.shape.getListPropAt('points', index) as Point).add(shape.getPosition())
        this.rad = 10
        this.hover = false
    }

    contains(pt: Point): boolean {
        let b = new Bounds(this.pt.x - this.rad, this.pt.y - this.rad, this.rad * 2, this.rad * 2)
        return b.contains(pt)
    }

    getPosition(): Point {
        return this.pt
    }

    async setPosition(pos: Point): Promise<void> {
        this.pt = pos
        await this.shape.setListPropAt('points', this.index, pos.subtract(this.shape.getPosition()))
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.hover?'red':'blue'
        ctx.fillRect(this.pt.x - this.rad, this.pt.y - this.rad, this.rad * 2, this.rad * 2)
    }
}

export class PathShapeEditHandler extends ObservableBase implements MouseHandlerProtocol {
    private shape: PathShapeClass;
    private handles: EditHandle[];
    private target_handle: EditHandle | null;
    private pressed: boolean;
    private hover_handle: EditHandle | undefined;
    private hover_line: LineSegment | undefined;

    constructor(shape: PathShapeClass) {
        super()
        this.shape = shape
        this.handles = []
        this.target_handle = null
        this.pressed = false
        this.rebuild_handles()
    }


    drawOverlay(ctx: CanvasRenderingContext2D, state: GlobalState): void {
        ctx.fillStyle = 'black'
        ctx.fillText('editing shape', 100, 100)
        // draw the handles for each point in the shape
        ctx.save()
        for (let hand of this.handles) {
            hand.draw(ctx)
        }
        for(let line of this.findLines()) {
            let mp = line.midpoint()
            ctx.fillStyle = 'green'
            ctx.fillRect(mp.x-5,mp.y-5,10,10)
        }

        if(this.hover_line) {
            ctx.fillStyle = 'orange'
            let mp = this.hover_line.midpoint()
            ctx.fillRect(mp.x-5,mp.y-5,10,10)
        }

        ctx.restore()
    }

    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        let hand = this.handles.find(h => h.contains(pt))
        if (hand) {
            this.pressed = true
            this.target_handle = hand
            return
        }
        if (this.hover_line) {
            console.log("inserting a point")
            await this.insertPoint(this.hover_line)
        } else {
            this.fire('done', {})
        }
    }

    async mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        if (!this.pressed) {
            let hand = this.handles.find(h => h.contains(pt))
            if(hand !== this.hover_handle) {
                if(this.hover_handle) this.hover_handle.hover = false
                this.hover_handle = hand
                if(this.hover_handle) this.hover_handle.hover = true
                this.fire('redraw',{})
            }
            let line = this.findLines().find(l => l.midpoint().distance(pt) < 10)
            if (line !== this.hover_line) {
                this.hover_line = line
                this.fire('redraw',{})
            }
        }
        if (this.pressed && this.target_handle) {
            await this.target_handle.setPosition(pt)
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        this.pressed = false
        this.target_handle = null
    }

    private findLines() {
        let offset = this.shape.props.center
        let points = this.shape.props.points as Point[]
        let lines:LineSegment[] = []
        for(let i=0; i<points.length-1; i++) {
            lines.push(new LineSegment(points.at(i) as Point, points.at(i+1) as Point, i))
        }
        lines.push(new LineSegment(points.at(-1) as Point, points.at(0) as Point, points.length-1))
        return lines.map(l => l.add(offset))
    }

    private async insertPoint(hover_line: LineSegment) {
        await this.shape.insertListPropAt('points', hover_line.index+1, hover_line.midpoint().subtract(this.shape.props.center))
        this.rebuild_handles()
        this.fire('redraw',{})
    }

    private rebuild_handles() {
        this.handles = (this.shape.props.points as Point[]).map((pt, i) => new EditHandle(this.shape, i))
    }
}

class LineSegment {
    start:Point
    end:Point
    index: number;
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
