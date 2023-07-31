import {Bounds} from "josh_js_util";
import assert from "assert";
import {
    PageDef, PageType,
    RectDef,
    RectType
} from "./models/om";
import {MenuAction} from "./actions";
import {GlobalState} from "./models/state";

async function createThreeRectsDoc() {
    const state = new GlobalState()
    let page = await state.om.make<PageType>(PageDef, {})
    let rect1 = await state.om.make<RectType>(RectDef, {
        bounds: new Bounds(100,100,10,10*2), fill:'red' })
    await page.appendListProp('children',rect1)
    let rect2 = await state.om.make<RectType>(RectDef, {
        bounds: new Bounds(200,200,20,20*2), fill:'green' })
    await page.appendListProp('children',rect2)
    let rect3 = await state.om.make<RectType>(RectDef, {
        bounds: new Bounds(300,300,30,30*2), fill:'blue' })
    await page.appendListProp('children',rect3)

    return {
        state:state,
        page:page,
        rects:[rect1,rect2,rect3]
    }
}

export const LeftAlignShapes:MenuAction = {
    title:'align left',
    perform: async (state) => {
        console.log("running")
        const objs = state.getSelectedObjects()
        if (objs.length > 0) {
            let first = objs[0]
            let left = first.getPropValue('bounds').x
            for(let obj of objs) {
                let bds:Bounds = obj.getPropValue('bounds')
                let bds2 = new Bounds(left,bds.y,bds.w,bds.h)
                obj.setPropValue('bounds',bds2)
            }
        }
    }
}


describe('alignment actions', () => {
    it('should load objects correctly', async () => {
        const {state, page, rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 200)
        assert(rects[2].getPropValue('bounds').x === 300)
    })
    it('should left align rects', async () => {
        const {state, page, rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 200)
        assert(rects[2].getPropValue('bounds').x === 300)
        state.addSelectedObjects(rects)
        await LeftAlignShapes.perform(state)
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 100)
        assert(rects[2].getPropValue('bounds').x === 100)
    })
})
