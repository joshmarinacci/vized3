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
    RectDef
} from "./om";
import {assert_eq} from "josh_js_util/dist/assert";


describe('model tests', () => {
    it('should make a graph', async () => {
        const om = new ObjectManager()
        assert(om !== null, 'om is not null')
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        let rect:ObjectProxy<typeof RectDef> = await om.make(RectDef, { })
        assert(rect !== null)
        rect = await om.make(RectDef, { bounds: new Bounds(1,2,3,4), fill:'red' })
        assert(rect.getPropValue(RectDef.props.bounds) !== null)
        assert(rect.getPropValue(RectDef.props.bounds).x === 1)
        assert(rect.getPropValue(RectDef.props.bounds).y === 2)
        assert(rect.getPropValue(RectDef.props.fill) === 'red')
        await rect.setPropValue(RectDef.props.fill,'blue')
        assert(rect.getPropValue(RectDef.props.fill) === 'blue')
    })
    it('should make an object with array chlidren', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        let page = await om.make(PageDef, {})
        assert(page.getPropValue(PageDef.props.children).length == 0)
        let rect = await om.make(RectDef, {})
        await page.appendListProp(PageDef.props.children,rect)
        assert(page.getPropValue(PageDef.props.children).length == 1)
        let rect2 = page.getListPropAt(PageDef.props.children,0)
        assert(rect === rect2)
    })
    it('should watch for changes on a single object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        let rect = await om.make(RectDef, {})
        // add listener
        let changed = false
        rect.addEventListener(PropChanged, (evt) => {
            changed = true
        })
        await rect.setPropValue(RectDef.props.fill, 'blue')
        assert(changed)
        assert(rect.getPropValue(RectDef.props.fill) === 'blue')
    })
    it('should watch for changes on a family tree object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        const page = await om.make(PageDef, {})
        const rect = await om.make(RectDef, {})
        await page.appendListProp(PageDef.props.children,rect)
        let changed:boolean = false
        page.addEventListener(FamilyPropChanged, (evt) => {
            changed = true
        })
        await rect.setPropValue(RectDef.props.fill, 'blue')
        assert(changed)
        assert(page.getListPropAt(PageDef.props.children,0).getPropValue(RectDef.props.fill) === 'blue')
    })
    it('should list the properties and schemas of an object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        const page = await om.make(PageDef, {})
        const rect = await om.make(RectDef, {})
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
        const pageProxy = await om.make(PageDef, {})
        const rectProxy = await om.make(RectDef, {bounds:new Bounds(1,2,3,4), fill: 'green'})
        await pageProxy.appendListProp(PageDef.props.children,rectProxy)
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
        const pageProxy = await om.make(PageDef, {})
        const rectProxy = await om.make(RectDef, {bounds:new Bounds(1,2,3,4), fill: 'green'})
        await pageProxy.appendListProp(PageDef.props.children,rectProxy)
        const json_obj = await om.toJSON(pageProxy)
        const new_root:ObjectProxy<ObjectDef> = await om.fromJSON(json_obj)
        // will restore inner objects using the impl class names
        // correct def
        assert(new_root.def.name === 'page')
        // has actual RealPage methods
        assert(new_root.obj instanceof PageClass)
        assert((new_root.obj as PageClass).hasChildren !== null)
        assert((new_root.obj as PageClass).hasChildren())
        let new_rects = new_root.getPropValue(PageDef.props.children)
        assert(new_rects.length == 1)
        let new_rect:ObjectProxy<ObjectDef> = new_root.getListPropAt(PageDef.props.children,0)
        assert(new_rect.def.name === 'rect')
        assert(new_rect.getPropValue(RectDef.props.fill) === 'green')
        assert(new_rect.getPropValue(RectDef.props.bounds) instanceof Bounds)
        assert(new_rect.getPropValue(RectDef.props.bounds).w === 3)
    })
    it('should undo and redo props', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        assert(!om.canUndo())
        assert(!om.canRedo())
        const rect = om.make(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
        await rect.setPropValue(RectDef.props.fill,'blue')
        assert(om.canUndo())
        assert(!om.canRedo())
        assert(rect.getPropValue(RectDef.props.fill) === 'blue')
        await om.performUndo()
        assert(rect.getPropValue(RectDef.props.fill) === 'red')
        await om.performUndo()
        assert(!om.canUndo())
        assert(om.canRedo())
        await om.performRedo()
        await om.performRedo()
        assert(om.canUndo())
        assert(!om.canRedo())
        assert(rect.getPropValue(RectDef.props.fill) === 'blue')
    })
    it('should undo and redo adding a rect to a page', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        // make an empty page
        const page = om.make(PageDef, {})
        assert(page.getListProp(PageDef.props.children).length === 0)
        assert(om.history().length===1)
        // make and add rect
        const rect = om.make(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
        assert(om.history().length===2)
        await page.appendListProp(PageDef.props.children, rect)
        assert(om.history().length===3)
        assert(page.getListProp(PageDef.props.children).length === 1)
        assert(page.getListPropAt(PageDef.props.children,0) === rect)
        // undo
        await om.performUndo()
        assert(page.getListProp(PageDef.props.children).length === 0)
        // redo
        await om.performRedo()
        assert(page.getListProp(PageDef.props.children).length === 1)
    })

    it('it should undo and redo deleting an object', async () => {
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        // make a page containing a rect
        const page = om.make(PageDef, {})
        const rect = om.make(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
        await page.appendListProp(PageDef.props.children, rect)
        assert(page.getListProp(PageDef.props.children).length === 1)

        //delete the rect
        await page.removeListPropByValue(PageDef.props.children,rect)
        assert(page.getListProp(PageDef.props.children).length === 0)
        //undo
        await om.performUndo()
        assert(page.getListProp(PageDef.props.children).length === 1)
        //redo
        await om.performRedo()
        assert(page.getListProp(PageDef.props.children).length === 0)

    })
    // it('should coalesce move events into a single undo/redo event', async () => {
    //     // const circ = om.make(CircleDef, { center: new Point(10,10), fill: 'red', radius:35 })
    //     // assert(om.canUndo() === false)
    //     // await circ.setPropValueMerged(CircDef.center, new Point(50,50))
    //     // assert(om.canUndo() ==== true)
    //     // await circ.setPropValueMerged(CircDef.center, new Point(100,100))
    //     // assert(om.history().length === 2)
    //     // assert(circ.getPropValue(CircDef.center).x === 100)
    //     // await om.undo()
    //     // assert(circ.getPropValue(CircDef.center).x === 10)
    // })
    it('should get the document history', async () => {
        // make some objects and change some values in om
        const om = new ObjectManager()
        om.registerDef(PageDef, PageClass)
        om.registerDef(RectDef, RectClass)
        {
            // make a rect
            const rect = om.make(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
            // confirm object is registered
            assert(om.hasObject(rect.getUUID()))
            // confirm history is one long
            console.log('history 1',om.history())
            assert_eq('history is one long',om.history().length,1)
            // set a property
            await rect.setPropValue(RectDef.props.fill,'blue')
            console.log('history 2',om.history().map(e => e.desc))
            // confirm prop value
            assert(rect.getPropValue(RectDef.props.fill) === 'blue')
            // confirm history is two long
            assert(om.history().length === 2)
            // undo
            assert(om.canUndo())
            await om.performUndo()
            // confirm old prop value
            assert(rect.getPropValue(RectDef.props.fill) === 'red')
            // undo
            assert(om.canUndo())
            await om.performUndo()
            // confirm object is not registered anymore
            assert(!om.hasObject(rect.getUUID()))
        }
    });
})
