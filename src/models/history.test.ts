import {Bounds} from "josh_js_util"
import {describe, expect, it} from "vitest"

import {ObjectManager, PropChangeEvent} from "./base"
import {PageClass, PageType} from "./page"
import {RectClass} from "./rect"

describe('history tests', () => {
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
