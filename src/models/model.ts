import {Bounds, genId, Point, toRadians} from "josh_js_util"
// - [ ] Start with persistence. Save and load an arbitrary data graph. How to restore inherited classes? Has tests.
//     - [ ] Give doc a unit

/*

model needs types for each possible shape
listener on root should be able to know about any change
listen on shapes to know about change to just that shape or it's children
selection can have multiple
given a child need a way to find the parent so we can have a full selection path
typed listener handlers
need a schema system so editors and props can dynamically adjust to the selected object. zod or something else?


*/

export type OEvent = string
type ObservableListener = (type: OEvent) => void

export class Observable {
    private listeners: Map<OEvent, Array<ObservableListener>>

    constructor() {
        this.listeners = new Map<OEvent, Array<ObservableListener>>();
    }

    protected _get_listeners(type: OEvent): ObservableListener[] {
        if (!this.listeners.has(type)) this.listeners.set(type, new Array<ObservableListener>())
        return this.listeners.get(type) as ObservableListener[]
    }

    public addEventListener(type: OEvent, cb: ObservableListener) {
        this._get_listeners(type).push(cb)
    }

    public removeEventListener(type: OEvent, cb: ObservableListener) {
        let list = this._get_listeners(type)
        list = list.filter(l => l !== cb)
        this.listeners.set(type, list)
    }

    protected fire(type: OEvent, payload: any) {
        this._get_listeners(type).forEach(cb => cb(payload))
    }
}


/*

start with document, page, and rect
make left sidebar with tree view
make GlobalState with current doc, which tabs are open, etc
make right sidebar with prop editors for currently selected object
make center view which draws the current document, but is not interactive


 */
type Unit = "mm" | "in"
type VUUID = string
export interface VDocument {
    type:'document'
    uuid:VUUID
    unit:Unit
    pages:VPage[]
}
export interface VPage {
    type:'page'
    uuid:VUUID
    children:VShape[]
}

export interface VShape {
    uuid:VUUID
    name:string,
    drawSelf(ctx:CanvasRenderingContext2D):void
    contains(pt:Point):boolean
    drawSelected(ctx: CanvasRenderingContext2D): void;
}
export interface VSquare extends VShape {
    type:'square'
    bounds:Bounds
}
export interface VCircle extends VShape {
    type:'circle'
    center:Point
    radius:number
}

class RealDocument implements VDocument {
    pages: VPage[];
    unit: Unit;
    uuid: VUUID;
    type: 'document';
    constructor() {
        this.type = 'document'
        this.pages = []
        this.unit = "mm"
        this.uuid = genId('document')
    }

}
class RealPage extends Observable implements VPage {
    type: 'page'
    children: VShape[];
    uuid: VUUID;
    constructor() {
        super()
        this.type = 'page'
        this.uuid = genId('page')
        this.children = []
    }

    addChild(square: VShape) {
        this.children.push(square);
        let ob = square as unknown as Observable
        ob.addEventListener('changed', (p) => {
            this.fire('changed',p)
        })
    }
}

export interface RealShape {
    getProperty(name:string):any
    setProperty(name:string, value:any):void
}
export class RealSquare extends Observable implements VSquare, RealShape {
    type: 'square'
    bounds: Bounds
    uuid: string
    name: string
    constructor(bounds:Bounds) {
        super()
        this.type = 'square'
        this.uuid = genId('square')
        this.name = 'unnamed'
        this.bounds = bounds
    }

    contains(pt: Point): boolean {
        return this.bounds.contains(pt)
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'red'
        ctx.fillRect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h)
    }
    getProperty(name:string) {
        if(name === 'x') return this.bounds.x
        if(name === 'y') return this.bounds.y
        if(name === 'name') return this.name
    }
    setProperty(name:string, value:any) {
        if(name === 'x') {
            this.bounds = new Bounds((value as number),
                this.bounds.y,
                this.bounds.w,this.bounds.h)
            this.fire('changed',{})
        }
        if(name === 'y') {
            this.bounds = new Bounds(this.bounds.x,
                (value as number),
                this.bounds.w,this.bounds.h)
            this.fire('changed',{})
        }
        if(name === 'name') {
            this.name = value
            this.fire('changed',{})
        }
    }

    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.strokeRect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h)
    }
}

type VFill = string

export class RealCircle extends Observable implements VShape, RealShape {
    uuid: VUUID
    name: string
    center: Point
    radius: number
    type: 'circle'
    fill: VFill
    constructor(center:Point) {
        super()
        this.type = 'circle'
        this.uuid = genId('square')
        this.name = 'unnamed'
        this.center = center
        this.radius = 20
        this.fill = "red"
    }

    drawSelf(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.fill
        ctx.beginPath()
        ctx.arc(this.center.x,this.center.y,this.radius,0,toRadians(360))
        ctx.fill()
    }
    getProperty(name:string) {
        if(name === 'x') return this.center.x
        if(name === 'y') return this.center.y
        if(name === 'radius') return this.radius
        if(name === 'name') return this.name
        if(name === 'fill') return this.fill
    }
    setProperty(name:string, value:any) {
        if(name === 'x') {
            this.center = new Point(value,this.center.y)
            this.fire('changed',{})
        }
        if(name === 'y') {
            this.center = new Point(this.center.x,value)
            this.fire('changed',{})
        }
        if(name === 'radius') {
            this.radius = value
            this.fire('changed',{})
        }
        if(name === 'name') {
            this.name = value
            this.fire('changed',{})
        }
        if(name === 'fill') {
            this.fill = value as VFill
            this.fire('changed',{})
        }
    }
    contains(pt: Point): boolean {
        return pt.subtract(this.center).magnitude() < this.radius
    }
    drawSelected(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath()
        ctx.arc(this.center.x,this.center.y,this.radius,0,toRadians(360))
        ctx.stroke()
    }
}

export class GlobalState extends Observable {
    _doc:VDocument
    private current_page: RealPage;
    private selected_object: any;
    private selected_page: VPage | null;
    constructor() {
        super()
        this._doc = new RealDocument()
        let page = new RealPage()
        page.addChild(new RealSquare(new Bounds(20,20,50,50)))
        page.addChild(new RealCircle(new Point(100,200)))
        this.current_page = page
        this._doc.pages.push(page)
        this.selected_object = null
        this.selected_page = page
    }

    getCurrentDocument():VDocument {
        return this._doc
    }

    getCurrentPage() {
        return this.current_page
    }

    getSelectedObject():VShape|undefined {
        return this.selected_object
    }
    setSelectedObject(obj:any) {
        this.selected_object = obj
        this.fire('selection',{})
    }

    setSelectedPage(page: VPage) {
        this.selected_page = page
        this.fire('selection',{})
    }
    getSelectedPage() {
        return this.selected_page
    }
}
