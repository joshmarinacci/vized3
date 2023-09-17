import assert from "assert"
import {Bounds} from "josh_js_util"
import {describe, expect, it} from "vitest"

import {PageClass} from "./page"
import {RectClass}  from "./rect"

describe('model tests', () => {
    it('should make a graph', async () => {
        let rect:RectClass = new RectClass({})//om.make(RectDef, { })
        assert(rect !== null)
        rect = new RectClass({bounds: new Bounds(1, 2, 3, 4), fill: 'red'})
        assert(rect.getPropValue('bounds') !== null)
        assert(rect.getPropValue('bounds').x === 1)
        assert(rect.getPropValue('bounds').y === 2)
        assert(rect.getPropValue('fill') === 'red')
        rect.setPropValue('fill','blue')
        assert(rect.getPropValue('fill') === 'blue')
    })
    it('should make an object with array children', async () => {
        const page = new PageClass()
        assert(page.getPropValue('children').length === 0)
        const rect = new RectClass({})
        page.addChild(rect)
        assert(page.getPropValue('children').length === 1)
        const rect2 = page.getPropValue('children')[0]
        assert(rect === rect2)
    })
    it('should watch for changes on a single object', async () => {
        const rect = new RectClass({})
        // add listener
        let changed = false
        rect.onAny((evt) => {
            changed = true
        })
        rect.setPropValue('fill', 'blue')
        assert(changed)
        assert(rect.getPropValue('fill') === 'blue')
    })
    it('should watch for changes on a family tree object', async () => {
        const page = new PageClass({})
        const rect = new RectClass({})
        page.addChild(rect)
        let changed = false
        page.onAny( (evt) => {
            changed = true
        })
        rect.setPropValue('fill', 'blue')
        expect(changed).toBeTruthy()
        expect(page.getPropValue('children')[0].getPropValue('fill')).toEqual('blue')
    })
    it('should list the properties and schemas of an object', async () => {
        const page = new PageClass()
        const rect = new RectClass()
        page.getAllPropDefs().forEach(([k,p]) => {
            if(k === 'children') {
                assert(p.base === 'list')
            }
        })
        rect.getAllPropDefs().forEach(([k,p]) => {
            if(k === 'bounds') {
                assert(p.base === 'Bounds')
            }
            if(k === 'fill') {
                assert(p.base === 'string')
            }
        })
    })
})

