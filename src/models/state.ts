import {Bounds, Point} from "josh_js_util"

import {make_filled_image} from "../platform"
import {
    ColorAssetClass,
    ColorAssetDef,
    GradientAssetClass,
    GradientAssetDef,
    ImageAssetClass,
    ImageAssetDef,
    NumberAssetClass,
    NumberAssetDef
} from "./assets"
import {CircleClass, CircleDef} from "./circle"
import {ObservableBase} from "./model"
import {NGonClass, NGonDef} from "./ngon"
import {DocClass, DocDef, ObjectManager, OO, PageClass, PageDef} from "./om"
import {PathShapeClass, PathShapeDef} from "./pathshape"
import {RectClass, RectDef} from "./rect"
import {SimpleImageClass, SimpleImageDef} from "./simpleimage"
import {SimpleTextClass, SimpleTextDef} from "./simpletext"

export type StateOpts = {
    localStorage:Storage
}

export class GlobalState extends ObservableBase {
    om: ObjectManager
    private _doc: DocClass
    private selected_objects: OO[]
    private selected_page: PageClass | null
    localStorage: Storage

    constructor(opts?:StateOpts) {
        super()
        if(opts) {
            this.localStorage = opts.localStorage ? opts.localStorage : localStorage
        } else {
            if (typeof localStorage !== 'undefined') {
                this.localStorage = localStorage
            } else {
                this.localStorage = null
            }
        }
        this.om = new ObjectManager()
        this.om.registerDef(DocDef,DocClass)
        this.om.registerDef(PageDef,PageClass)
        this.om.registerDef(RectDef,RectClass)
        this.om.registerDef(CircleDef,CircleClass)
        this.om.registerDef(SimpleTextDef, SimpleTextClass)
        this.om.registerDef(SimpleImageDef, SimpleImageClass)
        this.om.registerDef(PathShapeDef, PathShapeClass)
        this.om.registerDef(NGonDef, NGonClass)
        this.om.registerDef(NumberAssetDef, NumberAssetClass)
        this.om.registerDef(ColorAssetDef, ColorAssetClass)
        this.om.registerDef(GradientAssetDef, GradientAssetClass)
        this.om.registerDef(ImageAssetDef, ImageAssetClass)
        this._doc = this.om.make(DocDef,{})
        const page = this.om.make(PageDef, {}) as PageClass
        this._doc.appendListProp('pages',page)
        page.appendListProp('children',this.om.make(RectDef, { bounds: new Bounds(1,1,2,3), name:'rect', fill:'#ff0000'}))
        page.appendListProp('children',this.om.make(CircleDef, { center: new Point(1,3), radius: 1, name:'circle', fill:'#00ff00'}))
        page.appendListProp("children", this.om.make(SimpleTextDef,{ center: new Point(1,5), name:'text', fill:'#000000'}))
        page.appendListProp("children",this.om.make(PathShapeDef, { center: new Point(1,3), name:'path', fill:'#0000ff'}))

        this._doc.appendListProp('assets', this.om.make(NumberAssetDef,{ name:'zero'}))
        this._doc.appendListProp('assets', this.om.make(ColorAssetDef,{ name:'black'}))
        const dummy_img = make_filled_image(10,10,'green')
        const asset_img = this.om.make(ImageAssetDef, {value:dummy_img, name:'checkerboard'})
        this._doc.appendListProp('assets', asset_img)
        const image = this.om.make(SimpleImageDef, { name:'image'})
        image.setPropProxySource('image',asset_img)
        page.appendListProp('children',image)

        // this._doc.appendListProp('assets', this.om.make(GradientAssetDef,{}))
        this.selected_objects = []
        this.selected_page = page
    }

    getCurrentDocument(): DocClass {
        return this._doc
    }

    getSelectedObjects(): OO[] {
        return this.selected_objects
    }

    addSelectedObjects(objs: OO[]) {
        this.selected_objects  = this.selected_objects.concat(...objs)
        this.fire('selection', {})
    }
    setSelectedObjects(objs: OO[]) {
        this.selected_objects = objs
        if(this.selected_objects.length > 0) {
            const first = this.selected_objects[0]
            if(first.parent instanceof PageClass) {
                this.setSelectedPage(first.parent)
            }
        }
        this.fire('selection', {})
    }
    clearSelectedObjects() {
        this.selected_objects = []
        this.fire('selection', {})
    }
    isSelectedObject(obj:OO) :boolean {
        return this.selected_objects.includes(obj)
    }

    setSelectedPage(page: PageClass | null) {
        const old = this.selected_page
        this.selected_page = page
        if(old !== this.selected_page) {
            this.fire('selection', {})
        }
    }

    getSelectedPage() {
        return this.selected_page
    }

    swapDoc(doc:DocClass) {
        this._doc = doc
        this.clearSelectedObjects()
        this.setSelectedPage(this._doc.getListPropAt('pages',0))
        this.fire('selection', {})
    }

    fireSelectionChange() {
        this.fire('selection',{})
    }
}
