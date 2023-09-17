import * as fs from "fs"
import {Point} from "josh_js_util"
import pureimage, {Bitmap} from "pureimage"
import {describe, expect,it} from "vitest"

import {createThreeCirclesDoc} from "../actions/actions.test"
import {
    GradientAssetClass, GradientAssetType,
    ImageAssetClass, NumberAssetClass,
} from "../models/assets"
import {CircleClass} from "../models/circle"
import {DocClass, DocType} from "../models/doc"
import {PathShapeClass, PathShapeType} from "../models/pathshape"
import {
    fromJSONDoc,
    fromJSONObj,
    JSONObject,
    JSONPropValue, propertyToJSON,
    saveJSON, toJSONDoc, toJSONObj
} from "./json"

describe('json', () => {
    it('should save to json', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        expect(state).toBeTruthy()
        const doc = await saveJSON(state)
        console.log(JSON.stringify(doc,null, '   '))
        expect(doc.version).toBe(2)
        expect(doc.root).toBeTruthy()
        expect(doc.root.uuid).toBe(state.getCurrentDocument().getUUID())
        expect(doc.root.props.pages.type).toEqual('value')
        const pages = doc.root.props.pages as JSONPropValue
        expect((pages.value as []).length).toBe(1)
        const page = (pages.value as JSONObject[])[0] as JSONObject
        expect(page).toBeTruthy()
        expect(page.props.children.type).toEqual('value')
        const children = page.props.children as JSONPropValue
        expect((children.value as []).length).toBe(3)
        const shape1 = ((children.value as JSONObject[])[0])
        expect(shape1.props.center.type).toEqual('value')
        const center = (shape1.props.center as JSONPropValue).value as {x:number, y:number}
        expect(center.x).toEqual(circs[0].getPropValue('center').x)
    })

    it('should restore a small doc', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        const doc = state.getCurrentDocument()
        doc.getPropValue('pages')[0].setPropValue('name','rad page')
        const doc_json = toJSONDoc(doc)
        console.log(JSON.stringify(doc_json,null, '   '))
        expect(doc_json.version).toBe(2)
        expect(doc_json.root.uuid).toBe(doc.getUUID())

        const doc2 = fromJSONDoc(doc_json)
        expect(doc2.getUUID()).toBe(doc_json.root.uuid)
        expect(doc2.getPropValue('name')).toBe(doc.getPropValue('name'))
        expect(doc2.getPropValue('pages').length).toBe(1)
        const page = doc2.getPropValue('pages')[0]
        expect(page.getPropValue('name')).toBe('rad page')
    })

    it('should save a JSON property',async() => {
        const doc = new DocClass({name:'cool doc'})
        expect(doc.getPropValue('name')).toBe('cool doc')
        const ret = propertyToJSON<DocType, 'name'>('name',doc.getPropDef('name'),doc)
        expect(ret.type).toBe('value')
        expect((ret as JSONPropValue).value).toBe('cool doc')
        const json = toJSONObj<DocType>(doc)
        console.log("json is",json)
        const doc2 = fromJSONObj<DocType>(json)
        console.log('doc2 is',doc2)
        expect(doc2.getPropValue('name')).toBe('cool doc')
    })

    it('should save to json with a proxy', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        const circle = circs[0]
        const numAsset = new NumberAssetClass({value: 66})
        state.getCurrentDocument().getPropValue('assets').push(numAsset)
        // circle.setPropProxySource('radius',numAsset)
        // expect(circle.isPropProxySource('radius')).toBeTruthy()
        //now radius should equal 66
        expect(numAsset.getPropValue('value')).toEqual(66)

        //save to JSON
        const json_doc = saveJSON(state)
        // console.log(JSON.stringify(json_doc,null, '   '))

        expect(json_doc.version).toBe(2)

        // check that radius is 66 and still a proxy
        // expect(shape1.props.radius).toEqual(66)
        {
            const doc = await fromJSONDoc(json_doc)
            const page = doc.getPropValue('pages')[0]
            const circ2 = page.getPropValue('children')[0] as CircleClass
            expect(circ2.getPropValue('center').x).toEqual(100)
            // expect(circ2.isPropProxySource('radius')).toBeTruthy()
            expect(circ2.getPropValue('radius')).toEqual(66)
        }

    })

    it('should save a number asset', async () => {
        const num_asset = new NumberAssetClass({value:66})
        const num_json = toJSONObj(num_asset)
        console.log("num json is",num_json)
        expect(num_json.name).toEqual(NumberAssetClass.name)
        expect(num_json.props['name']).toBeTruthy()
        expect(num_json.props['name'].type).toEqual('value')
        expect(num_json.props['name'].value).toEqual('unnamed')
        expect(num_json.props['value'].type).toEqual('value')
        expect(num_json.props['value'].value).toEqual(66)
    })
    it('should save a gradient asset', async () => {
        const grad_asset = new GradientAssetClass({})
        const grad_json = toJSONObj(grad_asset)
        console.log("grad json is",grad_json)
        expect(grad_json.name).toEqual(GradientAssetClass.name)
        expect(grad_json.props['name']).toBeTruthy()
        expect(grad_json.props['name'].type).toEqual('value')
        expect(grad_json.props['name'].value).toEqual('unnamed')
        expect(grad_json.props['value'].type).toEqual('value')
        const grad = grad_json.props['value'].value as unknown
        expect(grad.type).toEqual('linear-color-gradient')
    })
    it('should restore a gradient asset', async () => {
        const grad_asset = new GradientAssetClass()
        const grad_json = toJSONObj(grad_asset)
        const grad = fromJSONObj<GradientAssetType>(grad_json)
        console.log("restored grad is",grad)
        expect(grad.constructor.name).toBe(GradientAssetClass.name)
    })

    it('should save and restore a path', async () => {
        const path_obj = new PathShapeClass({ points:[new Point(5,6)]})
        console.log("original path is",path_obj.getPropValue('points'))
        const path_json = toJSONObj(path_obj)
        console.log("path json is", path_json)

        const new_path = fromJSONObj<PathShapeType>(path_json)
        console.log("new path is",new_path)

        expect(new_path.constructor.name).toBe(PathShapeClass.name)
        const points = new_path.getPropValue('points') as Point[]
        console.log("oints are",points)
        expect(points.length).toBe(1)
        expect(points[0].x).toBe(5)
        expect(points[0].y).toBe(6)
    })

    it('should save and restore an image asset', async () => {
        const stream = fs.createReadStream('./src/exporters/checkerboard.png')
        const raw_img:Bitmap = await pureimage.decodePNGFromStream(stream)
        console.log("img is",raw_img)
        const img_asset = new ImageAssetClass()
        img_asset.setPropValue('value',{
            width:raw_img.width,
            height:raw_img.height,
            data:raw_img.data
        })
        const img_json = toJSONObj(img_asset)
        console.log("img json is",img_json.props.value)
        expect(img_json.name).toEqual(ImageAssetClass.name)
        expect(img_json.props['name']).toBeTruthy()
        expect(img_json.props['name'].type).toEqual('value')
        expect(img_json.props['name'].value).toEqual('unnamed')
        expect(img_json.props['value'].type).toEqual('value')
        // const img = img_json.props['value'].value as unknown
        // expect(img.type).toEqual('linear-color-gradient')
    })
    // it('should save to PNG JSON', async () => {
    //     let {state, circs} = await createThreeCirclesDoc()
    //     expect(state).toBeTruthy()
    //     let canvas = PureImage.make(800,600, {})
    //     let doc = await savePNGJSONToArray(state, canvas)
    //     console.log("blob is",doc)
    // })
})
