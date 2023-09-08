import {Bounds, Point} from "josh_js_util"
import {describe, expect,it } from "vitest"

import {calcBounds} from "./pathshape"

describe('geometry tests', function () {
    it('should make a bounds', () => {
        const bds = new Bounds(0,0,50,50)
        expect(bds.right()).toBe(50)
    })
    it('should union a bounds', () => {
        const points = [
            new Point(50,50),
            new Point(100,80),
            new Point(80,100),
        ]
        const bds = calcBounds(points)
        expect(bds.left()).toBe(50)
        expect(bds.right()).toBe(100)
        expect(bds.top()).toBe(50)
        expect(bds.bottom()).toBe(100)
    })
    it('should union a bounds 2', () => {
        const points = [
            new Point(80,100),
            new Point(50,50),
            new Point(100,80),
        ]
        const bds = calcBounds(points)
        expect(bds.left()).toBe(50)
        expect(bds.right()).toBe(100)
        expect(bds.top()).toBe(50)
        expect(bds.bottom()).toBe(100)
    })
})
