import {Bounds, Point} from "josh_js_util"

import {make_filled_image} from "../platform"
import {ColorAssetClass, GradientAssetClass, ImageAssetClass, NumberAssetClass} from "./assets"
import {PropsBase} from "./base"
import {CircleClass} from "./circle"
import {BaseShape} from "./defs"
import {DocClass} from "./doc"
import {ObservableBase} from "./model"
import {PageClass} from "./page"
import {PathShapeClass} from "./pathshape"
import {RectClass} from "./rect"
import {SimpleImageClass} from "./simpleimage"
import {SimpleTextClass} from "./simpletext"

export type StateOpts = {
    localStorage:Storage
}

export class GlobalState extends ObservableBase {
    private selected_objects: PropsBase<any>[]
    private selected_page: PageClass | null
    localStorage: Storage
    private _doc: DocClass

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
        this._doc = new DocClass()
        const page = new PageClass()
        this._doc.getPropValue('pages').push(page)
        const rect = new RectClass({ bounds: new Bounds(1,1,2,3),  name:'rect',  fill:'#ff0000'})
        page.addChild(rect)
        const circle = new CircleClass({ center: new Point(1,3), radius: 1, name:'circle', fill:'#00ff00'})
        page.addChild(circle)
        this.setSelectedObjects([rect, circle])
        const text = new SimpleTextClass({ center: new Point(1,5), name:'text', fill:'#000000'})
        page.addChild(text)
        page.addChild(new PathShapeClass({ center: new Point(1,3), name:'path', fill:'#0000ff'}))

        this._doc.getPropValue('assets').push(new NumberAssetClass({name:'zero'}))
        this._doc.getPropValue('assets').push(new ColorAssetClass({name:'black'}))
        const dummy_img = make_filled_image(10,10,'green')
        const asset_img = new ImageAssetClass({value:dummy_img, name:'checkerboard'})
        this._doc.getPropValue('assets').push(asset_img)
        const image = new SimpleImageClass({ name:'image'})
        image.setPropProxySource('image',asset_img)
        page.addChild(image)

        this._doc.getPropValue('assets').push(new GradientAssetClass({name:'gradient'}))
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
