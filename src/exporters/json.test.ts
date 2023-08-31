import * as fs from "fs"
import {describe, expect,it} from "vitest"

import {createThreeCirclesDoc} from "../actions.test"
import {DocClass, JSONDoc} from "../models/om"
import {GlobalState} from "../models/state"
import {saveJSON} from "./json"

describe('json', () => {
    it('should save to json', async () => {
        const {state, circs} = await createThreeCirclesDoc()
        expect(state).toBeTruthy()
        const doc = await saveJSON(state)
        console.log(JSON.stringify(doc,null, '   '))
        expect(doc.version).toBe(1)
        expect(doc.root).toBeTruthy()
        expect(doc.root.props.pages.length).toBe(1)
        const page = doc.root.props.pages[0]
        expect(page).toBeTruthy()
        expect(page.props.children.length).toBe(3)
        const shape1 = page.props.children[0]
        expect(shape1.props.center.x).toEqual(circs[0].getPropValue('center').x)
        // await fs.promises.writeFile('foo.json', JSON.stringify(doc, null, '   '))
    })

    it('should restore from JSON', async () => {
        const raw = await fs.promises.readFile('./src/exporters/jsonout.json')
        const json = JSON.parse(raw.toString())
        const state = new GlobalState()
        const obj = await state.om.fromJSON<DocClass>(json as JSONDoc)
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
