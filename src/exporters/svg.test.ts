import {Bounds, Point} from "josh_js_util"
import {describe, expect,it} from "vitest"

import {createThreeCirclesDoc} from "../actions/actions.test"
import {NGonClass, NGonDef} from "../models/ngon"
import {DocDef, PageDef} from "../models/om"
import {RectClass, RectDef} from "../models/rect"
import {GlobalState} from "../models/state"
import {toSVG} from "./svg"

describe('svg', () => {
    it('should save to svg', async () => {
        const {state} = await createThreeCirclesDoc()
        const doc = await toSVG(state)
        console.log("svg is",doc)
        expect(doc.match('svg')).toBeTruthy()
        expect(doc.match('circle')).toBeTruthy()
    })
    it('should save a rect to svg', async () => {
        const state = new GlobalState()
        const doc = state.om.make(DocDef, {})
        state.swapDoc(doc)
        const page = state.om.make(PageDef, {})
        doc.appendListProp('pages', page)
        const rect = state.om.make(RectDef, {
            bounds:new Bounds(1,2,3,4)}) as RectClass
        page.appendListProp('children', rect)
        expect(rect.getPropValue('bounds').x).toBe(1)

        const svg = await toSVG(state)
        expect(svg.match('svg')).toBeTruthy()
        expect(svg.match('rect')).toBeTruthy()
    })
    it('should save an  n-gon to svg', async () => {
        const state = new GlobalState()
        const doc = state.om.make(DocDef, {})
        state.swapDoc(doc)
        const page = state.om.make(PageDef, {})
        doc.appendListProp('pages', page)
        const ngon = state.om.make(NGonDef, {
            radius: 5,
            center: new Point(50,50),
            sides: 6,
        })as NGonClass
        page.appendListProp('children', ngon)
        expect(ngon.getPropValue('radius')).toBe(5)

        const svg = await toSVG(state)
        expect(svg.match('svg')).toBeTruthy()
        expect(svg.match('path')).toBeTruthy()
    })
})
