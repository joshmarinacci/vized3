import assert from "assert"
import {Bounds} from "josh_js_util"
import {describe, expect, it} from "vitest"

import {createThreeCirclesDoc} from "../actions/actions.test"
import {fromJSONDoc, saveJSON} from "../exporters/json"
import {ColorAssetClass, GradientAssetClass, NumberAssetClass} from "./assets"
import {ObjectManager, PropChangeEvent} from "./base"
import {CircleClass,} from "./circle"
import {PageClass, PageType} from "./page"
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
    it('should undo and redo props', async () => {
        const om = new ObjectManager()
        expect(om.canUndo()).toBeFalsy()
        expect(om.canRedo()).toBeFalsy()
        const rect = new RectClass({ bounds: new Bounds(0,1,2,3), fill: 'red' })
        om.registerLiveObject(rect)
        rect.setPropValue('fill','blue')
        expect(om.canUndo()).toBeTruthy()
        expect(om.canUndo()).toBeTruthy()
        expect(om.canRedo()).toBeFalsy()
        expect(rect.getPropValue('fill')).toBe('blue')
        await om.performUndo()
        expect(rect.getPropValue('fill')).toBe('red')
        await om.performUndo()
        expect(om.canUndo()).toBeFalsy()
        expect(om.canRedo()).toBeTruthy()
        await om.performRedo()
        await om.performRedo()
        expect(om.canUndo()).toBeTruthy()
        expect(om.canRedo()).toBeFalsy()
        expect(rect.getPropValue('fill')).toBe('blue')
    })
    it('should undo and redo adding a rect to a page', async () => {
        const om = new ObjectManager()
        // make an empty page
        const page = new PageClass()
        om.registerLiveObject(page)
        expect(page.getPropValue('children').length).toBe(0)
        expect(om.history().length).toBe(1)
        // make and add rect
        const rect = new RectClass({ bounds: new Bounds(0,1,2,3), fill: 'red' })
        om.registerLiveObject(rect)
        expect(om.history().length).toBe(2)

        //insert child
        const old_children = page.getPropValue('children').slice()
        page.getPropValue('children').push(rect)
        const new_children = page.getPropValue('children').slice()
        om.insertPropChangeEvent(new PropChangeEvent(page,'children',old_children,new_children))
        expect(om.history().length).toBe(3)
        expect(page.getPropValue('children').length).toBe(1)
        expect(page.getPropValue('children')[0]).toBe(rect)
        // undo
        await om.performUndo()
        console.log("come undon")
        expect(page.getPropValue('children').length).toBe(0)
        // redo
        await om.performRedo()
        expect(page.getPropValue('children').length).toBe(1)
    })
    it('should undo and redo deleting an object', async () => {
        // make a page containing a rect
        const om = new ObjectManager()
        const page = new PageClass()
        om.registerLiveObject(page)
        const rect = new RectClass({ bounds: new Bounds(0,1,2,3), fill: 'red' })
        om.registerLiveObject(rect)
        // add the rect
        {
            const before = page.getPropValue('children')
            page.getPropValue('children').push(rect)
            const after = page.getPropValue('children')
            om.insertPropChangeEvent(new PropChangeEvent<PageType>(page, 'children', before, after))
            expect(page.getPropValue('children').length).toBe(1)
        }

        //delete the rect
        {
            const before = page.getPropValue('children')
            // await page.removeChild(rect)
            const new_children = page.getPropValue('children').filter(ch => ch !== rect)
            page.setPropValue('children',new_children)
            const after = page.getPropValue('children')
            om.insertPropChangeEvent(new PropChangeEvent<PageType>(page,'children',before,after))
            expect(page.getPropValue('children').length).toBe(0)
            //undo
            await om.performUndo()
            expect(page.getPropValue('children').length).toBe(1)
            //redo
            await om.performRedo()
            expect(page.getPropValue('children').length).toBe(0)
        }

    })
    // it('should coalesce move events into a single undo/redo event', async () => {
    //     // make a page containing a rect
    //     const circle = new CircleClass({ radius: 5})
    //     assert(circle.getPropValue("radius") === 5)
    //
    //     // change radius
    //     await circle.setPropValue('radius',6)
    //     assert(circle.getPropValue('radius') === 6)
    //     // undo
    //     await om.performUndo()
    //     assert(circle.getPropValue('radius') === 5)
    //
    //     // set the radius twice
    //     await circle.setPropValue('radius',7)
    //     await circle.setPropValue('radius',8)
    //     assert(circle.getPropValue('radius') === 8)
    //
    //     // undo twice
    //     await om.performUndo()
    //     assert(circle.getPropValue('radius') === 7)
    //     await om.performUndo()
    //     assert(circle.getPropValue('radius') === 5)
    //
    //     // set the radius twice with coalescing
    //     // turn on coalescing
    //     om.setCompressingHistory(true)
    //     await circle.setPropValue('radius',7)
    //     await circle.setPropValue('radius',8)
    //     // om.dumpHistory()
    //     // turn off coalescing
    //     om.setCompressingHistory(false)
    //     assert(circle.getPropValue('radius') === 8)
    //     // om.dumpHistory()
    //
    //     // undo once
    //     await om.performUndo()
    //     assert(circle.getPropValue('radius') === 5)
    //
    //     // set the radius three times with coalescing, then undo
    //     om.setCompressingHistory(true)
    //     circle.setPropValue('radius', 90)
    //     circle.setPropValue('radius', 91)
    //     circle.setPropValue('radius', 92)
    //     // om.dumpHistory()
    //     om.setCompressingHistory(false)
    //     // om.dumpHistory()
    //     await om.performUndo()
    //     assert(circle.getPropValue('radius') === 5)
    // })
    // it('should get the document history', async () => {
    //     // make some objects and change some values in om
    //     {
    //         // make a rect
    //         const rect = new RectClass({ bounds: new Bounds(0,1,2,3), fill: 'red' })
    //         // confirm object is registered
    //         assert(om.hasObject(rect.getUUID()))
    //         // confirm history is one long
    //         // console.log('history 1',om.history())
    //         assert(om.history().length == 1)
    //         // set a property
    //         await rect.setPropValue('fill','blue')
    //         // console.log('history 2',om.history().map(e => e.desc))
    //         // confirm prop value
    //         assert(rect.getPropValue('fill') === 'blue')
    //         // confirm history is two long
    //         assert(om.history().length === 2)
    //         // undo
    //         assert(om.canUndo())
    //         await om.performUndo()
    //         // confirm old prop value
    //         assert(rect.getPropValue('fill') === 'red')
    //         // undo
    //         assert(om.canUndo())
    //         await om.performUndo()
    //         // confirm object is not registered anymore
    //         assert(!om.hasObject(rect.getUUID()))
    //     }
    // })
})

describe('asset tests', () => {
    it('should have an empty assets section', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        expect(state).toBeTruthy()
        const doc = state.getCurrentDocument()
        const name = doc.getPropValue('name')
        expect(name).toEqual('unnamed')
        const pages = doc.getPropValue('pages')
        expect(pages).toBeTruthy()
        expect(pages.length).toEqual(1)
        const page = doc.getPropValue('pages')[0]
        const children = page.getPropValue('children')
        expect(children.length).toEqual(3)

        const assets = doc.getPropValue('assets')
        expect(assets).toBeTruthy()
        expect(assets.length).toEqual(0)
    })
    it('should make a number asset and persist it', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        const doc = state.getCurrentDocument()

        // persist with no assets
        {
            const json_doc = saveJSON(state)
            // console.log(JSON.stringify(json_doc, null, '   '))
            expect(json_doc.root.props.pages['value'][0].props.children['value'].length).toBe(3)
            expect(json_doc.root.props.assets['value'].length).toBe(0)
        }

        // add a number asset
        {
            const numAsset = new NumberAssetClass({value: 66})
            expect(numAsset).toBeTruthy()
            expect(numAsset.getPropValue('name')).toEqual('unnamed')
            expect(numAsset.getPropValue('value')).toEqual(66)

            //add asset to the assets list
            state.getCurrentDocument().getPropValue('assets').push(numAsset)
            expect(state.getCurrentDocument().getPropValue('assets').length).toEqual(1)
        }

        // persist with the single asset
        {
            const json_doc = saveJSON(state)
            console.log(JSON.stringify(json_doc, null, '   '))
            expect(json_doc.root.props.pages['value'][0].props.children['value'].length).toBe(3)
            expect(json_doc.root.props.assets['value'].length).toBe(1)
            const num_asset_json = json_doc.root.props.assets['value'][0]
            console.log("num asset is",num_asset_json)
            expect(num_asset_json.props.name.value).toBe('unnamed')
            expect(num_asset_json.props.value.value).toBe(66)
        }
        //reload json
        {
            const json_doc = saveJSON(state)
            const doc_obj = fromJSONDoc(json_doc)
            expect(doc_obj.getPropValue('assets').length).toEqual(1)
            const num_asset = doc_obj.getPropValue('assets')[0]
            expect(num_asset.getPropValue('name')).toEqual('unnamed')
            expect(num_asset.getPropValue('value')).toEqual(66)

        }

    })
    it('should update a circle radius with a number asset', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        const doc = state.getCurrentDocument()
        // add a number asset
        const numAsset = new NumberAssetClass({value: 66})
        //add asset to the assets list
        doc.getPropValue('assets').push(numAsset)
        // get the first circle
        const page = doc.getPropValue('pages')[0]
        const circle = page.getPropValue('children')[0]
        expect(circle.getPropValue('radius')).toEqual(10)
        expect(circle.isPropProxySource('radius')).toBeFalsy()

        //set the circles radius property to the num asset
        circle.setPropProxySource('radius',numAsset)
        expect(circle.isPropProxySource('radius')).toBeTruthy()
        //now radius should equal 66
        expect(numAsset.getPropValue('value')).toEqual(66)
        expect(circle.getPropValue('radius')).toEqual(66)
        //update num to 67
        await numAsset.setPropValue('value',67)
        // now radius should equal 67
        expect(circle.getPropValue('radius')).toEqual(67)
        // disconnect
        circle.removePropProxySource('radius')
        // radius should still be 67
        expect(circle.getPropValue('radius')).toEqual(67)
        //update num to 68
        await numAsset.setPropValue('value', 68)
        expect(numAsset.getPropValue('value')).toEqual(68)
        //radius should still be 67
        expect(circle.getPropValue('radius')).toEqual(67)
        //re-connect
        circle.setPropProxySource('radius',numAsset)
        //radius should now be 68
        expect(circle.getPropValue('radius')).toEqual(68)

    })
    it('should make a color asset', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        const colorAsset = new ColorAssetClass({value:'#ffff00'})
        expect(colorAsset).toBeTruthy()
        expect(colorAsset.getPropValue('value')).toEqual('#ffff00')
        state.getCurrentDocument().getPropValue('assets').push(colorAsset)
        const circle = circs[0] as CircleClass
        expect(circle.getPropValue('fill')).toEqual('#cccccc')
        circle.setPropProxySource('fill',colorAsset)
        expect(circle.getPropValue('fill')).toEqual('#ffff00')
    })

    it('should make a gradient asset', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        const gradientAsset = new GradientAssetClass({})
        expect(gradientAsset).toBeTruthy()
        state.getCurrentDocument().getPropValue('assets').push(gradientAsset)
    })
})
