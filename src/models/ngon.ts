import {Bounds, Point} from "josh_js_util"

import {
    CenterPositionDef,
    DrawableClass,
    FillDef,
    Handle,
    NameDef,
    ObjectDef,
    ObjectManager,
    ScaledSurface,
    StrokeFillDef,
    StrokeWidthDef
} from "./om"

export const NGonDef:ObjectDef = {
    name:'ngon',
    props:{
        name:NameDef,
        center: CenterPositionDef,
        radius: {
            name:'radius',
            base:'number',
            readonly: false,
            defaultValue: 1
        },
        sides: {
            name:'sides',
            base:'number',
            readonly:false,
            defaultValue: 5,
        },
        star: {
            name:"star",
            base:"boolean",
            readonly:false,
            defaultValue:false,
        },
        starRadius: {
            name:'starRadius',
            base: "number",
            readonly: false,
            defaultValue: 0.5
        },
        fill: FillDef,
        strokeFill: StrokeFillDef,
        strokeWidth: StrokeWidthDef
    }
}

class NGonResizeHandle implements Handle {
    private obj: NGonClass

    constructor(obj: NGonClass) {
        this.obj = obj
    }

    getPosition(): Point {
        const center = this.obj.getPropValue("center")
        const radius = this.obj.getPropValue('radius')
        return center.add(new Point(radius, 0))
    }

    async setPosition(pos: Point) {
        const center = this.obj.getPropValue("center")
        const diff = pos.subtract(center)
        const radius = diff.x
        await this.obj.setPropValue('radius', radius)
    }

    contains(pt: Point) {
        const center = this.obj.getPropValue("center")
        const radius = this.obj.getPropValue('radius')
        const pos = center.add(new Point(radius, 0))
        const b = new Bounds(pos.x - 10, pos.y - 10, 20, 20)
        return b.contains(pt)
    }
}

export class NGonClass extends DrawableClass<typeof NGonDef> {
    constructor(om: ObjectManager, opts: Record<keyof typeof NGonDef.props, any>) {
        super(om, NGonDef, opts)
    }

    contains(pt: Point): boolean {
        return pt.subtract(this.props.center).magnitude() < this.props.radius
    }

    drawSelected(ctx: ScaledSurface): void {
        const points:Point[] = this.drawPath()
        ctx.outlineLinePath(this.getPosition(),points,true)
    }

    drawSelf(ctx: ScaledSurface): void {
        const fill = this.getPropValue('fill')
        const points:Point[] = this.drawPath()
        const center = this.getPosition()
        const closed = true
        ctx.fillLinePath(center,points,closed,fill)
        ctx.strokeLinePath(center,points,closed,this.getPropValue('strokeFill'), this.getPropValue('strokeWidth'))
    }

    getHandle(): Handle | null {
        return new NGonResizeHandle(this)
    }

    getPosition(): Point {
        return this.getPropValue('center')
    }

    intersects(bounds: Bounds): boolean {
        const center = this.getPropValue('center') as Point
        const rad = this.getPropValue('radius') as number
        const bds = new Bounds(center.x - rad, center.y - rad, rad * 2, rad * 2)
        return bds.intersects(bounds)
    }

    async setPosition(pos: Point): Promise<void> {
        await this.setPropValue('center', pos)
    }

    private drawPath():Point[] {
        const n = this.getPropValue('sides') as number
        const r = this.getPropValue('radius') as number
        const r2 = this.getPropValue('starRadius') as number
        const points:Point[] = []
        if(this.getPropValue('star')) {
            for (let i = 0; i < n*2; i++) {
                const theta = i * Math.PI * 2 / (n*2)
                const x = Math.sin(theta)
                const y = Math.cos(theta)
                const rr = (i%2 === 0)?r:r2
                points.push(new Point(x*rr, y*rr))
            }

        } else {
            for (let i = 0; i < n; i++) {
                const theta = i * Math.PI * 2 / n
                const x = Math.sin(theta) * r
                const y = Math.cos(theta) * r
                points.push(new Point(x, y))
            }
        }
        return points
    }

    getAlignmentBounds(): Bounds {
        const center = this.getPropValue('center') as Point
        const rad = this.getPropValue('radius') as number
        return new Bounds(center.x - rad, center.y - rad, rad * 2, rad * 2)
    }

    async translateBy(offset: Point): Promise<void> {
        const center = this.getPropValue('center') as Point
        await this.setPropValue('center', center.add(offset))
    }

    toSinglePath():LinePath {
        const path = new LinePath()
        const n = this.getPropValue('sides') as number
        const r = this.getPropValue('radius') as number
        const c = this.getPropValue('center') as Point
        const r2 = this.getPropValue('starRadius') as number
        if(this.getPropValue('star')) {
            for (let i = 0; i < n*2; i++) {
                const theta = i * Math.PI * 2 / (n*2)
                const x = Math.sin(theta)
                const y = Math.cos(theta)
                const rr = (i%2 === 0)?r:r2
                path.addPoint(new Point(x*rr + c.x, y*rr + c.y))
            }
        } else {
            for (let i = 0; i < n; i++) {
                const theta = i * Math.PI * 2 / n
                const x = Math.sin(theta) * r
                const y = Math.cos(theta) * r
                path.addPoint(new Point(x + c.x, y + c.y))
            }
        }
        path.close()
        return path
    }
}

export class LinePath {
    points: Point[]
    closed:boolean
    constructor() {
        this.points = []
        this.closed = false
    }
    addPoint(point: Point) {
        this.points.push(point)
    }

    close() {
        this.closed = true
    }
}
