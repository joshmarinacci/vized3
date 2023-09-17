import {Bounds, Point} from "josh_js_util"
import {describe, expect,it} from "vitest"

import {createThreeCirclesDoc} from "../actions/actions.test"
import {DocClass} from "../models/doc"
import {NGonClass}  from "../models/ngon"
import {PageClass} from "../models/page"
import {RectClass}  from "../models/rect"
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
        const doc = new DocClass()
        state.swapDoc(doc)
        const page = new PageClass()
        doc.getPropValue('pages').push(page)
        const rect = new RectClass({
            bounds:new Bounds(1,2,3,4)}) as RectClass
        page.addChild(rect)
        expect(rect.getPropValue('bounds').x).toBe(1)

        const svg = await toSVG(state)
        expect(svg.match('svg')).toBeTruthy()
        expect(svg.match('rect')).toBeTruthy()
    })
    it('should save an  n-gon to svg', async () => {
        const state = new GlobalState()
        const doc = new DocClass()
        state.swapDoc(doc)
        const page = new PageClass()
        doc.getPropValue('pages').push(page)
        const ngon = new NGonClass({
            radius: 5,
            center: new Point(50,50),
            sides: 6,
        })as NGonClass
        page.addChild(ngon)
        expect(ngon.getPropValue('radius')).toBe(5)

        const svg = await toSVG(state)
        expect(svg.match('svg')).toBeTruthy()
        expect(svg.match('path')).toBeTruthy()
    })
})
