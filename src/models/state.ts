import {Bounds, Point} from "josh_js_util";
import {ObservableBase } from "./model";
import {
    DocClass,
    DocDef, ObjectDef,
    ObjectManager,
    ObjectProxy,
    PageClass,
    PageDef
} from "./om";
import {RectClass, RectDef} from "./rect";
import {CircleClass, CircleDef} from "./circle";
import {SimpleTextClass, SimpleTextDef} from "./simpletext";
import {PathShapeClass, PathShapeDef} from "./pathshape";
import {NGonClass, NGonDef} from "./ngon";

export class GlobalState extends ObservableBase {
    om: ObjectManager;
    private _doc: DocClass;
    private current_page: PageClass
    private selected_objects: ObjectProxy<ObjectDef>[]
    private selected_page: PageClass | null

    constructor() {
        super()
        this.om = new ObjectManager()
        this.om.registerDef(DocDef,DocClass)
        this.om.registerDef(PageDef,PageClass)
        this.om.registerDef(RectDef,RectClass)
        this.om.registerDef(CircleDef,CircleClass)
        this.om.registerDef(SimpleTextDef, SimpleTextClass)
        this.om.registerDef(PathShapeDef, PathShapeClass)
        this.om.registerDef(NGonDef, NGonClass)
        this._doc = this.om.make(DocDef,{})
        let page = this.om.make(PageDef, {}) as PageClass
        this._doc.appendListProp('pages',page)
        page.appendListProp('children',this.om.make(RectDef, { bounds: new Bounds(20,20,50,50)}))
        page.appendListProp('children',this.om.make(CircleDef, { center: new Point(100,200), radius: 20}))
        page.appendListProp("children", this.om.make(SimpleTextDef,{ center: new Point(200,100)}))
        page.appendListProp("children",this.om.make(PathShapeDef, { center: new Point(100,300)}))
        this.current_page = page
        this.selected_objects = []
        this.selected_page = page
    }

    getCurrentDocument(): DocClass {
        return this._doc
    }

    getCurrentPage():PageClass {
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

    swapDoc(doc:DocClass) {
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
