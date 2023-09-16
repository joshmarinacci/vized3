import assert from "assert"
import {Bounds, Point} from "josh_js_util"
import {describe, expect, it} from "vitest"

import {CircleClass} from "../models/circle"
import {DocClass} from "../models/doc"
import {PageClass} from "../models/page"
import {RectClass} from "../models/rect"
import {GlobalState} from "../models/state"
import {
    BottomAlignShapes,
    HCenterAlignShapes,
    LeftAlignShapes,
    RightAlignShapes,
    TopAlignShapes,
    VCenterAlignShapes
} from "./actions"

async function createThreeRectsDoc() {
    const state = new GlobalState()
    const page = new PageClass()
    const rect1 = new RectClass({
        bounds: new Bounds(100, 100, 10, 10 * 2), fill: 'red'
    })
    page.addChild(rect1)
    const rect2 = new RectClass({
        bounds: new Bounds(200, 200, 20, 20 * 2), fill: 'green'
    })
    page.addChild(rect2)
    const rect3 = new RectClass({
        bounds: new Bounds(300, 300, 30, 30 * 2), fill: 'blue'
    })
    page.addChild(rect3)

    return {
        state:state,
        page:page,
        rects:[rect1,rect2,rect3]
    }
}

export async function createThreeCirclesDoc() {
    const state = new GlobalState()
    const doc = new DocClass()
    state.swapDoc(doc)
    const page = new PageClass()
    doc.getPropValue('pages').push(page)
    const circ1 = new CircleClass({
        center: new Point(100,100), radius: 10})
    page.addChild(circ1)
    const circ2 = new CircleClass({
        center: new Point(200,200), radius: 20})
    page.addChild(circ2)
    const circ3 = new CircleClass({
        center: new Point(300,300), radius: 30})
    page.addChild(circ3)

    return {
        state:state,
        page:page,
        circs:[circ1,circ2,circ3]
    }
}


describe('alignment actions', () => {
    it('should load objects correctly', async () => {
        const {rects} = await  createThreeRectsDoc()
        assert(rects[0].getPropValue('bounds').x === 100)
        assert(rects[1].getPropValue('bounds').x === 200)
        assert(rects[2].getPropValue('bounds').x === 300)
    })
    it('should left align rects', async () => {
        const {state, rects} = await  createThreeRectsDoc()
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
        const {state, circs} = await  createThreeCirclesDoc()
        assert(circs[0].getPropValue('center').x === 100)
        assert(circs[1].getPropValue('center').x === 200)
        assert(circs[2].getPropValue('center').x === 300)
        state.addSelectedObjects(circs)
        await LeftAlignShapes.perform(state)
        expect(circs[0].getPropValue('center').x).toBe(100)
        expect(circs[1].getPropValue('center').x).toBe(110)
        expect(circs[2].getPropValue('center').x).toBe(120)
    })
    it('should right align rects', async () => {
        const {state, rects} = await  createThreeRectsDoc()
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
        const {state, rects} = await  createThreeRectsDoc()
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
        const {state, rects} = await  createThreeRectsDoc()
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
        const {state, rects} = await  createThreeRectsDoc()
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
        const {state, rects} = await  createThreeRectsDoc()
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
