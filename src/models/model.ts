import {Bounds, genId} from "josh_js_util"
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
    uuid:VUUID
    unit:Unit
    pages:VPage[]
}
export interface VPage {
    uuid:VUUID
    children:VShape[]
}

export interface VShape {
    uuid:VUUID
    drawSelf(ctx:CanvasRenderingContext2D):void
}
export interface VSquare extends VShape {
    bounds:Bounds
}

class RealDocument implements VDocument {
    pages: VPage[];
    unit: Unit;
    uuid: VUUID;
    constructor() {
        this.pages = []
        this.unit = "mm"
        this.uuid = genId('document')
    }

}
class RealPage extends Observable implements VPage {
    children: VShape[];
    uuid: VUUID;
    constructor() {
        super()
        this.uuid = genId('page')
        this.children = []
    }

    addChild(square: RealSquare) {
        this.children.push(square)
        square.addEventListener('changed', (p) => {
            console.log("page child changed")
            this.fire('changed',p)
        })
    }
}

class RealSquare extends Observable implements VSquare {
    bounds: Bounds;
    uuid: string;
    private name: string;
    constructor(bounds:Bounds) {
        super()
        this.uuid = genId('square')
        this.name = 'unnamed'
        this.bounds = bounds
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
}

export class GlobalState {
    _doc:VDocument
    private current_page: VPage;
    constructor() {
        this._doc = new RealDocument()
        let page = new RealPage()
        page.addChild(new RealSquare(new Bounds(20,20,50,50)))
        this.current_page = page
        this._doc.pages.push(page)
    }

    getCurrentDocument():VDocument {
        return this._doc
    }

    getCurrentPage() {
        return this.current_page
    }

    getSelectedObject():any {
        return this.current_page.children[0]
    }
}
