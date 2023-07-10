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


describe('model tests', () => {
    it('should make a graph', async () => {
        const om = new ObjectManager()
        assert(om !== null, 'om is not null')
        let rect:ObjectProxy<typeof RectDef> = await om.make(RectDef, { })
        assert(rect !== null)
        rect = await om.make(RectDef, { bounds: new Bounds(1,2,3,4)})
        assert(rect.getPropValue(RectDef.props.bounds) !== null)
        assert(rect.getPropValue(RectDef.props.bounds).x === 1)
        assert(rect.getPropValue(RectDef.props.bounds).y === 2)
        assert(rect.getPropValue(RectDef.props.fill) === 'red')
        await rect.setPropValue(RectDef.props.fill,'blue')
        assert(rect.getPropValue(RectDef.props.fill) === 'blue')
    })
    it('should make an object with array chlidren', async () => {
        const om = new ObjectManager()
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
    // it('should undo and redo', async () => {
    //     // const rect = om.make(RectDef, { bounds: new Bounds(0,1,2,3), fill: 'red' })
    //     // assert(om.canUndo() === false)
    //     // assert(om.canRedo() === false)
    //     // await rect.setPropValue(RectDef.fill,'blue')
    //     // assert(om.canUndo() === true)
    //     // assert(om.canRedo() === false)
    //     // assert(rect.getPropValue(RectDef.fill) === 'blue')
    //     // await om.undo()
    //     // assert(rect.getPropValue(RectDef.fill) === 'red')
    //     // assert(om.canUndo() === false)
    //     // assert(om.canRedo() === true)
    //
    // })
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
    // // it('should get the document history', async () => {
    //     // make some objects and change some values in om
    //     // om.history().forEach(hist => {
    //     //     console.log("at", hist.timestamp, 'did', hist.name, 'of type', hist.type)
    //     //     if(hist.type === 'set') {
    //     //         console.log('set property',hist.prop.name,'from',hist.prop.oldvalue,'to',hist.prop.newvalue)
    //     //     }
    //     //     if(hist.type === 'additem') {
    //     //         console.log('added object',hist.add.value,'to',hist.obj)
    //     //     }
    //     //     if(hist.type === 'removeitem') {
    //     //         console.log('added object',hist.add.value,'to',hist.obj)
    //     //     }
    //     //     if(hist.type === 'makeobject') {
    //     //         console.log("made object', hist.obj)
    //     //     }
    //     //     if(hist.type === 'deleteobject') {
    //     //         console.log("deleted object', hist.obj)
    //     //     }
    //     // })
    // // });
})
