import {describe, it, expect} from "vitest";
import {createThreeCirclesDoc} from "../actions.test";
import {saveJSON} from "./json";
import * as fs from "fs";
import {GlobalState} from "../models/state";
import {DocClass, JSONDoc} from "../models/om";

describe('json', () => {
    it('should save to json', async () => {
        let {state, circs} = await createThreeCirclesDoc()
        expect(state).toBeTruthy()
        let doc = await saveJSON(state)
        console.log(JSON.stringify(doc,null, '   '))
        expect(doc.version).toBe(1)
        expect(doc.root).toBeTruthy()
        expect(doc.root.props.pages.length).toBe(1)
        const page = doc.root.props.pages[0]
        expect(page).toBeTruthy()
        expect(page.props.children.length).toBe(3)
        let shape1 = page.props.children[0]
        expect(shape1.props.center.x).toEqual(circs[0].getPropValue('center').x)
        // await fs.promises.writeFile('foo.json', JSON.stringify(doc, null, '   '))
    })

    it('should restore from JSON', async () => {
        let raw = await fs.promises.readFile('./src/exporters/jsonout.json')
        let json = JSON.parse(raw.toString())
        let state = new GlobalState()
        let obj = await state.om.fromJSON<DocClass>(json as JSONDoc)
        expect(obj.getListProp('pages').length).toBe(1)
        expect(obj.getListPropAt('pages',0).getListProp('children').length).toBe(3)
    })

    // it('should save to PNG JSON', async () => {
    //     let {state, circs} = await createThreeCirclesDoc()
    //     expect(state).toBeTruthy()
    //     let canvas = PureImage.make(800,600, {})
    //     let doc = await savePNGJSONToArray(state, canvas)
    //     console.log("blob is",doc)
    // })
})
