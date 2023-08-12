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

    constructor(shape: PathShapeClass, index: number) {
        this.shape = shape
        this.index = index
        this.pt = (this.shape.getListPropAt('points', index) as Point).add(shape.getPosition())
        this.rad = 10
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
        ctx.fillStyle = 'red'
        ctx.fillRect(this.pt.x - this.rad, this.pt.y - this.rad, this.rad * 2, this.rad * 2)
    }
}

export class PathShapeEditHandler extends ObservableBase implements MouseHandlerProtocol {
    private shape: PathShapeClass;
    private handles: EditHandle[];
    private target_handle: EditHandle | null;
    private pressed: boolean;

    constructor(shape: PathShapeClass) {
        super()
        this.shape = shape
        this.handles = (this.shape.props.points as Point[]).map((pt, i) => new EditHandle(this.shape, i))
        this.target_handle = null
        this.pressed = false
    }

    drawOverlay(ctx: CanvasRenderingContext2D, state: GlobalState): void {
        ctx.fillStyle = 'black'
        ctx.fillText('editing shape', 100, 100)
        // draw the handles for each point in the shape
        ctx.save()
        for (let hand of this.handles) {
            hand.draw(ctx)
        }
        ctx.restore()
    }

    async mouseDown(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        let hand = this.handles.find(h => h.contains(pt))
        if (hand) {
            this.pressed = true
            this.target_handle = hand
        } else {
            console.log("not on a handle. bailing")
            this.fire('done', {})
        }
    }

    async mouseMove(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        if (this.pressed && this.target_handle) {
            await this.target_handle.setPosition(pt)
        }
    }

    async mouseUp(pt: Point, e: React.MouseEvent<HTMLCanvasElement>, state: GlobalState): Promise<void> {
        this.pressed = false
        this.target_handle = null
    }

}
