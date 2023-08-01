import {Bounds, Point} from "josh_js_util";
import assert from "assert";
import {
    CircleDef, CircleType, ObjectProxy,
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

async function createThreeCirclesDoc() {
    const state = new GlobalState()
    let page = await state.om.make<PageType>(PageDef, {})
    let circ1 = await state.om.make<CircleType>(CircleDef, {
        center: new Point(100,100), radius: 10})
    await page.appendListProp('children',circ1)
    let circ2 = await state.om.make<CircleType>(CircleDef, {
        center: new Point(200,200), radius: 20})
    await page.appendListProp('children',circ2)
    let circ3 = await state.om.make<CircleType>(CircleDef, {
        center: new Point(300,300), radius: 30})
    await page.appendListProp('children',circ3)

    return {
        state:state,
        page:page,
        circs:[circ1,circ2,circ3]
    }
}

export const LeftAlignShapes:MenuAction = {
    title:'align left',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds')
        for(let obj of objs) {
            let bds:Bounds = obj.getPropValue('bounds')
            let bds2 = new Bounds(fbds.x,bds.y,bds.w,bds.h)
            obj.setPropValue('bounds',bds2)
        }
    }
}

export const RightAlignShapes:MenuAction = {
    title:'align right',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for(let obj of objs) {
            let bds:Bounds = obj.getPropValue('bounds')
            let bds2 = new Bounds(fbds.right() - bds.w,bds.y,bds.w,bds.h)
            obj.setPropValue('bounds',bds2)
        }
    }
}

export const HCenterAlignShapes:MenuAction = {
    title:'align hcenter',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for(let obj of objs) {
            let bds:Bounds = obj.getPropValue('bounds')
            let bds2 = new Bounds(fbds.center().x - bds.w/2,bds.y,bds.w,bds.h)
            obj.setPropValue('bounds',bds2)
        }
    }
}

export const TopAlignShapes:MenuAction = {
    title:'align top',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for(let obj of objs) {
            let bds = obj.getPropValue('bounds') as Bounds
            let bds2 = new Bounds(fbds.x,fbds.top(),bds.w,bds.h)
            obj.setPropValue('bounds',bds2)
        }
    }
}

export const VCenterAlignShapes:MenuAction = {
    title:'align top',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for(let obj of objs) {
            let bds = obj.getPropValue('bounds') as Bounds
            let bds2 = new Bounds(fbds.x,fbds.center().y - bds.h/2,bds.w,bds.h)
            obj.setPropValue('bounds',bds2)
        }
    }
}

export const BottomAlignShapes:MenuAction = {
    title:'align top',
    perform: async (state) => {
        const objs = state.getSelectedObjects()
        if (objs.length < 2) return
        let first = objs[0]
        let fbds = first.getPropValue('bounds') as Bounds
        for(let obj of objs) {
            let bds = obj.getPropValue('bounds') as Bounds
            let bds2 = new Bounds(fbds.x,fbds.bottom() - bds.h,bds.w,bds.h)
            obj.setPropValue('bounds',bds2)
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
    it('should left align circles', async () => {
        const {state, page, circs} = await  createThreeCirclesDoc()
        assert(circs[0].getPropValue('center').x === 100)
        assert(circs[1].getPropValue('center').x === 200)
        assert(circs[2].getPropValue('center').x === 300)
        state.addSelectedObjects(circs)
        await LeftAlignShapes.perform(state)
        assert(circs[0].getPropValue('center').x === 100)
        assert(circs[1].getPropValue('center').x === 100)
        assert(circs[2].getPropValue('center').x === 100)
    })
    it('should right align rects', async () => {
        const {state, page, rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 200)
        assert(rects[2].getPropValue('bounds').x === 300)
        state.addSelectedObjects(rects)
        await RightAlignShapes.perform(state)
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 90)
        assert(rects[2].getPropValue('bounds').x === 80)
    })
    it('should center align rects', async () => {
        const {state, page, rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 200)
        assert(rects[2].getPropValue('bounds').x === 300)
        state.addSelectedObjects(rects)
        await HCenterAlignShapes.perform(state)
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 95)
        assert(rects[2].getPropValue('bounds').x === 90)
    })
    it('should Top align rects', async () => {
        const {state, page, rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').y === 100)
        assert(rects[1].getPropValue('bounds').y === 200)
        assert(rects[2].getPropValue('bounds').y === 300)
        state.addSelectedObjects(rects)
        await TopAlignShapes.perform(state)
        assert(rects[0].getPropValue('bounds').top() === 100)
        assert(rects[1].getPropValue('bounds').top() === 100)
        assert(rects[2].getPropValue('bounds').top() === 100)
    })
    it('should center vertical align rects', async () => {
        const {state, page, rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').y === 100)
        assert(rects[1].getPropValue('bounds').y === 200)
        assert(rects[2].getPropValue('bounds').y === 300)
        state.addSelectedObjects(rects)
        await VCenterAlignShapes.perform(state)
        assert(rects[0].getPropValue('bounds').center().y === 110)
        assert(rects[1].getPropValue('bounds').center().y === 110)
        assert(rects[2].getPropValue('bounds').center().y === 110)
    })
    it('should bottom align rects', async () => {
        const {state, page, rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').y === 100)
        assert(rects[1].getPropValue('bounds').y === 200)
        assert(rects[2].getPropValue('bounds').y === 300)
        state.addSelectedObjects(rects)
        await BottomAlignShapes.perform(state)
        assert(rects[0].getPropValue('bounds').bottom() === 120)
        assert(rects[1].getPropValue('bounds').bottom() === 120)
        assert(rects[2].getPropValue('bounds').bottom() === 120)
    })
})
