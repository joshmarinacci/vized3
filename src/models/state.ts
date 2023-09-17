import {Bounds, Point} from "josh_js_util"

import {make_filled_image} from "../platform"
import {
    ColorAssetClass, ColorAssetDef, ColorAssetType,
    GradientAssetClass,
    GradientAssetDef,
    ImageAssetClass, ImageAssetDef,
    NumberAssetClass, NumberAssetDef, NumberAssetType
} from "./assets"
import {ObjectManager, OM, PropsBase} from "./base"
import {CircleClass, CircleDef} from "./circle"
import {BaseShape} from "./defs"
import {DocClass, DocDefs} from "./doc"
import {ObservableBase} from "./model"
import {NGonClass, NGonDef} from "./ngon"
import {PageClass, PageDefs, PageType} from "./page"
import {PathShapeClass, PathShapeDef} from "./pathshape"
import {RectClass, RectDef} from "./rect"
import {SimpleImageClass, SimpleImageDef, SimpleImageType} from "./simpleimage"
import {SimpleTextClass, SimpleTextDef} from "./simpletext"

export type StateOpts = {
    localStorage:Storage
}
OM.register(DocClass, DocDefs)
OM.register(PageClass, PageDefs)
OM.register(RectClass, RectDef)
OM.register(CircleClass, CircleDef)
OM.register(PathShapeClass, PathShapeDef)
OM.register(NGonClass, NGonDef)
OM.register(SimpleTextClass, SimpleTextDef)
OM.register(SimpleImageClass, SimpleImageDef)

OM.register(GradientAssetClass, GradientAssetDef)
OM.register(NumberAssetClass, NumberAssetDef)
OM.register(ColorAssetClass, ColorAssetDef)
OM.register(ImageAssetClass, ImageAssetDef)

export class GlobalState extends ObservableBase {
    private selected_objects: PropsBase<any>[]
    private selected_page: PageClass | null
    localStorage: Storage
    private _doc: DocClass
    public om: ObjectManager

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
        this.om = OM
        this._doc = this.om.make(DocClass)
        const page = this.om.make<PageType>(PageClass) as PageClass
        this.om.appendListProp(this._doc,'pages',page)
        const rect = this.om.make(RectClass,{ bounds: new Bounds(1,1,2,3),  name:'rect',  fill:'#ff0000'})
        this.om.appendListProp(page,'children',rect)
        const circle = this.om.make(CircleClass,{ center: new Point(1,3), radius: 1, name:'circle', fill:'#00ff00'})
        this.om.appendListProp(page,'children',circle)
        this.setSelectedObjects([rect, circle])
        const text = this.om.make(SimpleTextClass,{ center: new Point(1,5), name:'text', fill:'#000000'})
        this.om.appendListProp(page,'children',text)
        this.om.appendListProp(page,'children',this.om.make(PathShapeClass,{ center: new Point(1,3), name:'path', fill:'#0000ff'}))

        this.om.appendListProp(this._doc,'assets',this.om.make<NumberAssetType>(NumberAssetClass,{name:'zero'}))
        this.om.appendListProp(this._doc,'assets',this.om.make<ColorAssetType>(ColorAssetClass,{name:'black'}))
        const dummy_img = make_filled_image(10,10,'green')
        const asset_img = this.om.make(ImageAssetClass,{value:dummy_img, name:'checkerboard'})
        this._doc.getPropValue('assets').push(asset_img)
        const image = this.om.make<SimpleImageType>(SimpleImageClass,{ name:'image'})
        image.setPropProxySource('image',asset_img)
        this.om.appendListProp(page,'children',image)

        this.om.appendListProp(this._doc,'assets',this.om.make(GradientAssetClass,{name:'gradient'}))
        this.selected_objects = []
        this.selected_page = page
    }

    getCurrentDocument(): DocClass {
        return this._doc
    }

    getSelectedObjects(): PropsBase<any>[] {
        return this.selected_objects
    }
    getSelectedShapes() {
        return this.selected_objects.filter(s => s instanceof BaseShape).map(s => s as BaseShape<any>)
    }
    addSelectedObjects(objs: PropsBase<any>[]) {
        this.selected_objects  = this.selected_objects.concat(...objs)
        this.fire('selection', {})
    }
    setSelectedObjects(objs: PropsBase<any>[]) {
        this.selected_objects = objs
        if(this.selected_objects.length > 0) {
            const first = this.selected_objects[0]
            if(first instanceof BaseShape && first.parent instanceof PageClass) {
                this.setSelectedPage(first.parent)
            }
        }
        this.fire('selection', {})
    }
    clearSelectedObjects() {
        this.selected_objects = []
        this.fire('selection', {})
    }
    isSelectedObject(obj:PropsBase<any>) :boolean {
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
        this.setSelectedPage(this._doc.getPropValue('pages')[0])
        this.fire('selection', {})
    }

    fireSelectionChange() {
        this.fire('selection',{})
    }

    async sendCommand(command: string, payload: object) {
        await this.fire(command, payload)
    }
}
