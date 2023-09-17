import {describe, expect, it} from "vitest"

import {createThreeCirclesDoc} from "../actions/actions.test"
import {fromJSONDoc, saveJSON} from "../exporters/json"
import {ColorAssetClass, GradientAssetClass, NumberAssetClass} from "./assets"
import {CircleClass} from "./circle"

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
