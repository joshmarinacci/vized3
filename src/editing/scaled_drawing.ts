import {Handle, ScaledSurface} from "../models/om";
import {point_to_pixels, Unit} from "../models/unit";
import {Bounds, Point} from "josh_js_util";

export class ScaledDrawingSurface implements ScaledSurface {
    private ctx: CanvasRenderingContext2D;
    private scale: number;
    private unit: Unit;

    constructor(ctx: CanvasRenderingContext2D, scale: number, unit: Unit) {
        this.ctx = ctx
        this.scale = scale
        this.unit = unit
    }

    fillRect(bounds: Bounds, fill: "string") {
        this.ctx.fillStyle = fill
        this.ctx.fillRect(bounds.x * this.scale, bounds.y * this.scale, bounds.w * this.scale, bounds.h * this.scale)
    }

    outlineRect(bounds: Bounds) {
        this.ctx.strokeRect(bounds.x * this.scale, bounds.y * this.scale, bounds.w * this.scale, bounds.h * this.scale)
    }

    strokeRect(bounds: Bounds, strokeFill: string, strokeWidth: number) {
        this.ctx.strokeStyle = strokeFill
        this.ctx.lineWidth = strokeWidth
        this.ctx.strokeRect(bounds.x * this.scale, bounds.y * this.scale, bounds.w * this.scale, bounds.h * this.scale)
    }

    fillRoundRect(bounds: Bounds, radius: number, fill: any) {
        this.ctx.fillStyle = fill
        this.ctx.beginPath()
        this.ctx.roundRect(bounds.left() * this.scale, bounds.top() * this.scale, bounds.w * this.scale, bounds.h * this.scale, radius)
        this.ctx.closePath()
        this.ctx.fill()
    }

    strokeRoundRect(bounds: Bounds, radius: number, strokeFill: string, strokeWidth: number) {
        this.ctx.strokeStyle = strokeFill
        this.ctx.lineWidth = strokeWidth
        this.ctx.beginPath()
        this.ctx.roundRect(bounds.left() * this.scale, bounds.top() * this.scale, bounds.w * this.scale, bounds.h * this.scale, radius)
        this.ctx.closePath()
        this.ctx.stroke()
    }

    fillArc(center: Point, radius: number, startAngle: number, endAngle: number, fill: string) {
        this.ctx.fillStyle = fill
        this.ctx.beginPath()
        this.ctx.arc(center.x * this.scale, center.y * this.scale, radius * this.scale, startAngle, endAngle)
        this.ctx.fill()
    }

    outlineArc(center: Point, radius: number, startAngle: number, endAngle: number, fill: string) {
        this.ctx.beginPath()
        this.ctx.arc(center.x * this.scale, center.y * this.scale, radius * this.scale, startAngle, endAngle)
        this.ctx.stroke()
    }

    private calcFont(fontSize: number) {
        return `${fontSize}pt sans-serif`
    }

    fillText(text: string, center: Point, fill: string, fontSize: number) {
        this.ctx.fillStyle = fill
        this.ctx.font = this.calcFont(fontSize)
        this.ctx.fillText(text, center.x * this.scale, center.y * this.scale)
    }

    fillLinePath(position: Point, points: Point[], closed: boolean, filled: boolean, fill: string) {
        if (points.length < 3) return
        this.ctx.save()
        this.ctx.fillStyle = fill
        this.ctx.translate(position.x * this.scale, position.y * this.scale)
        this.ctx.beginPath()
        this.ctx.moveTo(points[0].x * this.scale, points[0].y * this.scale)
        for (let pt of points) this.ctx.lineTo(pt.x * this.scale, pt.y * this.scale)
        if (closed) this.ctx.closePath()
        this.ctx.fill()
        this.ctx.restore()
    }

    outlineLinePath(position: Point, points: Point[]) {
        if (points.length < 3) return
        this.ctx.save()
        this.ctx.translate(position.x * this.scale, position.y * this.scale)
        this.ctx.beginPath()
        this.ctx.moveTo(points[0].x * this.scale, points[0].y * this.scale)
        for (let pt of points) this.ctx.lineTo(pt.x * this.scale, pt.y * this.scale)
        this.ctx.closePath()
        this.ctx.stroke()
        this.ctx.restore()
    }

    overlayHandle(h: Handle, color='red') {
        this.ctx.fillStyle = color
        let p = point_to_pixels(h.getPosition(), this.unit)
        this.ctx.fillRect(p.x - 10, p.y - 10, 20, 20)
        this.ctx.strokeStyle = 'black'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(p.x - 10, p.y - 10, 20, 20)
    }

    dragRect(dragRect: Bounds) {
        this.ctx.strokeStyle = 'cyan'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(dragRect.x * this.scale, dragRect.y * this.scale, dragRect.w * this.scale, dragRect.h * this.scale)
    }

    overlayFillText(s: string, point: Point) {
        this.ctx.fillStyle = 'black'
        this.ctx.font = '20pt sans-serif'
        this.ctx.fillText(s, point.x, point.y)
    }

    overlayPoint(point: Point, green: string) {
        this.ctx.fillStyle = green
        let r = 5
        this.ctx.fillRect(point.x * this.scale - r, point.y * this.scale - r, r * 2, r * 2)
    }
}
