import {Bounds, Point} from "josh_js_util";
import {describe, it, expect } from "vitest";
import {calcBounds} from "./pathshape";

describe('geometry tests', function () {
    it('should make a bounds', () => {
        let bds = new Bounds(0,0,50,50)
        expect(bds.right()).toBe(50)
    })
    it('should union a bounds', () => {
        let points = [
            new Point(50,50),
            new Point(100,80),
            new Point(80,100),
        ]
        let bds = calcBounds(points)
        expect(bds.left()).toBe(50)
        expect(bds.right()).toBe(100)
        expect(bds.top()).toBe(50)
        expect(bds.bottom()).toBe(100)
    })
    it('should union a bounds 2', () => {
        let points = [
            new Point(80,100),
            new Point(50,50),
            new Point(100,80),
        ]
        let bds = calcBounds(points)
        expect(bds.left()).toBe(50)
        expect(bds.right()).toBe(100)
        expect(bds.top()).toBe(50)
        expect(bds.bottom()).toBe(100)
    })
});
