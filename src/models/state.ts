import {Bounds, Point} from "josh_js_util";
import {Observable } from "./model";
import {
    CircleClass,
    CircleDef, CircleType,
    DocClass,
    DocDef, DocType,
    ObjectDef,
    ObjectManager,
    ObjectProxy,
    PageClass,
    PageDef, PageType, RectClass,
    RectDef, RectType, SimpleTextClass, SimpleTextDef, SimpleTextType
} from "./om";

export class GlobalState extends Observable {
    om: ObjectManager;
    private _doc: ObjectProxy<DocType>;
    private current_page: ObjectProxy<PageType>;
    private selected_objects: ObjectProxy<ObjectDef>[]
    private selected_page: ObjectProxy<PageType> | null

    constructor() {
        super()
        this.om = new ObjectManager()
        this.om.registerDef(DocDef,DocClass)
        this.om.registerDef(PageDef,PageClass)
        this.om.registerDef(RectDef,RectClass)
        this.om.registerDef(CircleDef,CircleClass)
        this.om.registerDef(SimpleTextDef, SimpleTextClass)
        this._doc = this.om.make(DocDef,{})
        let page = this.om.make<PageType>(PageDef, {})
        this._doc.appendListProp('pages',page)
        let rect = this.om.make<RectType>(RectDef, { bounds: new Bounds(20,20,50,50)})
        page.appendListProp('children', rect)
        let circ = this.om.make<CircleType>(CircleDef, { center: new Point(100,200), radius: 20})
        page.appendListProp("children", circ)
        let text = this.om.make<SimpleTextType>(SimpleTextDef, {})
        page.appendListProp("children", text)
        this.current_page = page
        this.selected_objects = []
        this.selected_page = page
    }

    getCurrentDocument(): ObjectProxy<DocType> {
        return this._doc
    }

    getCurrentPage() {
        return this.current_page
    }

    getSelectedObjects(): ObjectProxy<any>[] {
        return this.selected_objects
    }

    addSelectedObjects(objs: ObjectProxy<any>[]) {
        this.selected_objects  = this.selected_objects.concat(...objs)
        this.fire('selection', {})
    }
    setSelectedObjects(objs: ObjectProxy<any>[]) {
        this.selected_objects = objs
        this.fire('selection', {})
    }
    clearSelectedObjects() {
        this.selected_objects = []
        this.fire('selection', {})
    }

    setSelectedPage(page: any) {
        this.selected_page = page
        this.fire('selection', {})
    }

    getSelectedPage() {
        return this.selected_page
    }

    swapDoc(doc:ObjectProxy<DocType>) {
        this._doc = doc
        this.clearSelectedObjects()
        this.setSelectedPage(this._doc.getListPropAt('pages',0))
        if(this.selected_page) {
            this.current_page = this.selected_page
        }
        this.fire('selection', {})
    }

    fireSelectionChange() {
        this.fire('selection',{})
    }
}
