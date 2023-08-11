import {describe, it, expect} from "vitest";
import {createThreeCirclesDoc} from "../actions.test";
import {toSVG} from "./svg";

describe('svg', () => {
    it('should save to svg', async () => {
        let {state, circs} = await createThreeCirclesDoc()
        let doc = await toSVG(state)
        console.log("svg is",doc)
        expect(doc.match('svg')).toBeTruthy()
        expect(doc.match('circle')).toBeTruthy()
    })
})
