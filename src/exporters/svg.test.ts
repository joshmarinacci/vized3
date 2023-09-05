import {describe, expect,it} from "vitest"

import {createThreeCirclesDoc} from "../actions/actions.test"
import {toSVG} from "./svg"

describe('svg', () => {
    it('should save to svg', async () => {
        const {state} = await createThreeCirclesDoc()
        const doc = await toSVG(state)
        console.log("svg is",doc)
        expect(doc.match('svg')).toBeTruthy()
        expect(doc.match('circle')).toBeTruthy()
    })
})
