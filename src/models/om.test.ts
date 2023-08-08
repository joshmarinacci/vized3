import {Bounds} from "josh_js_util";
import assert from "assert";
import {
    FamilyPropChanged,
    JSONObject,
    ObjectDef,
    ObjectManager,
    ObjectProxy,
    PageDef,
    PropChanged,
    PropSchema,
    PageClass, RectClass,
    RectDef, CircleDef, CircleClass, RectType, PageType, CircleType
} from "./om";
// import {assert_eq} from "josh_js_util/dist/assert";


describe('model tests', () => {
    it('should make a graph', async () => {
        const om = new ObjectManager()
        assert(om !== null, 'om is not null')
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        let rect:ObjectProxy<RectType> = await om.make<RectType>(RectDef, { })
        assert(rect !== null)
        rect = await om.make<RectType>(RectDef, { bounds: new Bounds(1,2,3,4), fill:'red' })
        assert(rect.getPropValue('bounds') !== null)
        assert(rect.getPropValue('bounds').x === 1)
        assert(rect.getPropValue('bounds').y === 2)
        assert(rect.getPropValue('fill') === 'red')
        await rect.setPropValue('fill','blue')
        assert(rect.getPropValue('fill') === 'blue')
    })

    it('should make an object with array chlidren', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        let page = await om.make<PageType>(PageDef, {})
        assert(page.getPropValue('children').length == 0)
        let rect = await om.make(RectDef, {})
        await page.appendListProp('children',rect)
        assert(page.getPropValue('children').length === 1)
        let rect2 = page.getListPropAt('children',0)
        assert(rect === rect2)
    })
    it('should watch for changes on a single object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        let rect = await om.make<RectType>(RectDef, {})
        // add listener
        let changed = false
        rect.addEventListener(PropChanged, (evt) => {
            changed = true
        })
        await rect.setPropValue('fill', 'blue')
        assert(changed)
        assert(rect.getPropValue('fill') === 'blue')
    })
    it('should watch for changes on a family tree object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        const page = await om.make<PageType>(PageDef, {})
        const rect = await om.make<RectType>(RectDef, {})
        await page.appendListProp('children',rect)
        let changed:boolean = false
        page.addEventListener(FamilyPropChanged, (evt) => {
            changed = true
        })
        await rect.setPropValue('fill', 'blue')
        assert(changed)
        assert(page.getListPropAt('children',0).getPropValue('fill') === 'blue')
    })
    it('should list the properties and schemas of an object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        const page = await om.make<PageType>(PageDef, {})
        const rect = await om.make<RectType>(RectDef, {})
        page.getPropSchemas().forEach((s:PropSchema) => {
            if(s.name === 'children') {
                assert(s.base === 'list')
            }
        })
        rect.getPropSchemas().forEach((s:PropSchema) => {
            if(s.name === 'bounds') {
                assert(s.base === 'object')
            }
            if(s.name === 'fill') {
                assert(s.base === 'string')
            }
        })
    })
    it('should export to json', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        const pageProxy = await om.make<PageType>(PageDef, {})
        const rectProxy = await om.make<RectType>(RectDef, {bounds:new Bounds(1,2,3,4), fill: 'green'})
        await pageProxy.appendListProp('children',rectProxy)
        const json_obj:any = await om.toJSON(pageProxy)
        assert(typeof json_obj === 'object')
        assert(json_obj.version === 1)
        assert(json_obj.root.name === 'page')
        assert(Array.isArray(json_obj.root.props.children))
        assert(json_obj.root.props.children.length === 1)
        let json_rect:JSONObject = json_obj.root.props.children[0]

        assert(json_rect.name === 'rect')
        assert(typeof json_rect.props.fill == 'string')
        assert(json_rect.props.fill === 'green')
        assert(typeof json_rect.props.bounds === 'object')
        assert(json_obj.root.props.children[0].props.bounds.x === 1)
        assert(json_obj.root.props.children[0].props.bounds.y === 2)
        assert(json_obj.root.props.children[0].props.bounds.w === 3)
        assert(json_obj.root.props.children[0].props.bounds.h === 4)
    })
    it('should import from json', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        const pageProxy = await om.make<PageType>(PageDef, {})
        const rectProxy = await om.make<RectType>(RectDef, {bounds:new Bounds(1,2,3,4), fill: 'green'})
        await pageProxy.appendListProp('children',rectProxy)
        const json_obj = await om.toJSON(pageProxy)
        const new_root:ObjectProxy<any> = await om.fromJSON(json_obj)
        // will restore inner objects using the impl class names
        // correct def
        assert(new_root.def.name === 'page')
        // has actual RealPage methods
        assert(new_root.obj instanceof PageClass)
        assert((new_root.obj as PageClass).hasChildren !== null)
        assert((new_root.obj as PageClass).hasChildren())
        let new_rects = new_root.getPropValue('children')
        assert(new_rects.length == 1)
        let new_rect:ObjectProxy<RectType> = new_root.getListPropAt('children',0)
        assert(new_rect.def.name === 'rect')
        assert(new_rect.getPropValue("fill") === 'green')
        assert(new_rect.getPropValue("bounds") instanceof Bounds)
        assert(new_rect.getPropValue("bounds").w === 3)
    })
    it('should undo and redo props', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        assert(!om.canUndo())
        assert(!om.canRedo())
        const rect = om.make<RectType>(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
        await rect.setPropValue('fill','blue')
        assert(om.canUndo())
        assert(!om.canRedo())
        assert(rect.getPropValue('fill') === 'blue')
        await om.performUndo()
        assert(rect.getPropValue('fill') === 'red')
        await om.performUndo()
        assert(!om.canUndo())
        assert(om.canRedo())
        await om.performRedo()
        await om.performRedo()
        assert(om.canUndo())
        assert(!om.canRedo())
        assert(rect.getPropValue('fill') === 'blue')
    })
    it('should undo and redo adding a rect to a page', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        // make an empty page
        const page = om.make<PageType>(PageDef, {})
        assert(page.getListProp('children').length === 0)
        assert(om.history().length===1)
        // make and add rect
        const rect = om.make<RectType>(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
        assert(om.history().length===2)
        await page.appendListProp('children', rect)
        assert(om.history().length===3)
        assert(page.getListProp('children').length === 1)
        assert(page.getListPropAt('children',0) === rect)
        // undo
        await om.performUndo()
        assert(page.getListProp('children').length === 0)
        // redo
        await om.performRedo()
        assert(page.getListProp('children').length === 1)
    })

    it('it should undo and redo deleting an object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        // make a page containing a rect
        const page = om.make<PageType>(PageDef, {})
        const rect = om.make<RectType>(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
        await page.appendListProp('children', rect)
        assert(page.getListProp('children').length === 1)

        //delete the rect
        await page.removeListPropByValue('children',rect)
        assert(page.getListProp('children').length === 0)
        //undo
        await om.performUndo()
        assert(page.getListProp('children').length === 1)
        //redo
        await om.performRedo()
        assert(page.getListProp('children').length === 0)

    })
    it('should coalesce move events into a single undo/redo event', async () => {
        const om = new ObjectManager()
        om.registerDef(CircleDef, CircleClass)
        // make a page containing a rect
        const circle = om.make<CircleType>(CircleDef, { radius: 5})
        assert(circle.getPropValue("radius") === 5)

        // change radius
        await circle.setPropValue('radius',6)
        assert(circle.getPropValue('radius') === 6)
        // undo
        await om.performUndo()
        assert(circle.getPropValue('radius') === 5)

        // set the radius twice
        await circle.setPropValue('radius',7)
        await circle.setPropValue('radius',8)
        assert(circle.getPropValue('radius') === 8)

        // undo twice
        await om.performUndo()
        assert(circle.getPropValue('radius') === 7)
        await om.performUndo()
        assert(circle.getPropValue('radius') === 5)

        // set the radius twice with coalescing
        // turn on coalescing
        om.setCompressingHistory(true)
        await circle.setPropValue('radius',7)
        await circle.setPropValue('radius',8)
        // om.dumpHistory()
        // turn off coalescing
        om.setCompressingHistory(false)
        assert(circle.getPropValue('radius') === 8)
        // om.dumpHistory()

        // undo once
        await om.performUndo()
        assert(circle.getPropValue('radius') === 5)

        // set the radius three times with coalescing, then undo
        om.setCompressingHistory(true)
        await circle.setPropValue('radius',90)
        await circle.setPropValue('radius',91)
        await circle.setPropValue('radius',92)
        // om.dumpHistory()
        om.setCompressingHistory(false)
        // om.dumpHistory()
        await om.performUndo()
        assert(circle.getPropValue('radius') === 5)
    })
    it('should get the document history', async () => {
        // make some objects and change some values in om
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        {
            // make a rect
            const rect = om.make<RectType>(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
            // confirm object is registered
            assert(om.hasObject(rect.getUUID()))
            // confirm history is one long
            // console.log('history 1',om.history())
            assert(om.history().length == 1)
            // set a property
            await rect.setPropValue('fill','blue')
            // console.log('history 2',om.history().map(e => e.desc))
            // confirm prop value
            assert(rect.getPropValue('fill') === 'blue')
            // confirm history is two long
            assert(om.history().length === 2)
            // undo
            assert(om.canUndo())
            await om.performUndo()
            // confirm old prop value
            assert(rect.getPropValue('fill') === 'red')
            // undo
            assert(om.canUndo())
            await om.performUndo()
            // confirm object is not registered anymore
            assert(!om.hasObject(rect.getUUID()))
        }
    });
})
