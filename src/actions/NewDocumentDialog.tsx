import {Size} from "josh_js_util"
import {DialogContext, Spacer} from "josh_react_util"
import React, {useContext, useState} from "react"

import {ItemRenderer, ItemToKey, SelectView} from "../common"
import {DocClass} from "../models/doc"
import {PageClass} from "../models/page"
import {GlobalState} from "../models/state"
import {Unit} from "../models/unit"


type DocSize = {
    size:Size,
    name:string,
    key:string,
    unit:Unit,
}
const DOC_SIZES:DocSize[] = [
    {
        name:'US Letter',
        size: new Size(8.5,11),
        key:'letter',
        unit: Unit.Inch
    },
    {
        name:'A4',
        size: new Size(21.0,29.7),
        key:'a4',
        unit: Unit.Centimeter
    },
    {
        name:'VGA',
        size: new Size(640,480),
        key:'vga640',
        unit: Unit.Pixel,
    }
]

const UnitRenderer:ItemRenderer<Unit> = (item:Unit) => {
    return <>{item.toString()}</>
}
const UnitToKey:ItemToKey<Unit> = (item:Unit) => {
    return item.toString()
}
const DocSizeRenderer:ItemRenderer<DocSize> = (d) => <>{d.name}</>
const DocSizeToKey:ItemToKey<DocSize> = (d) => d.key

export function NewDocumentDialog(props: { state: GlobalState }) {
    const {state} = props
    const [unit, setUnit] = useState<Unit>(DOC_SIZES[0].unit)
    const units = [Unit.Pixel, Unit.Inch, Unit.Centimeter]
    const [size, setSize] = useState<DocSize>(DOC_SIZES[0])
    const dm = useContext(DialogContext)
    const [width, setWidth] = useState(DOC_SIZES[0].size.w)
    const [height, setHeight] = useState(DOC_SIZES[0].size.h)

    const cancel = () => dm.hide()
    const create = () => {
        const size = new Size(width,height)
        const doc = new DocClass({name:'new doc', unit:unit})
        const page = new PageClass({size, name:'new page'})
        doc.getPropValue('pages').push(page)
        state.swapDoc(doc)
        dm.hide()
    }
    return <div className={'dialog'}>
        <header>Create New Document</header>
        <section>
            <form className={'std-form'}>
                <label>Size</label>
                <SelectView
                    toKey={DocSizeToKey}
                    data={DOC_SIZES}
                    renderer={DocSizeRenderer}
                    selected={size}
                    onSelect={(s:DocSize)=>{
                        setSize(s)
                        setUnit(s.unit)
                        setWidth(s.size.w)
                        setHeight(s.size.h)
                    }}/>
                <label>Units</label>
                <SelectView
                    toKey={UnitToKey}
                    data={units}
                    renderer={UnitRenderer}
                    selected={unit}
                    onSelect={(u:Unit) => setUnit(u)}
                />
                <label>Width</label>
                <input type={'number'} value={width} onChange={(e)=>setWidth(parseFloat(e.target.value))}/>
                <label>Height</label>
                <input type={'number'} value={height} onChange={(e)=>setHeight(parseFloat(e.target.value))}/>
            </form>
        </section>
        <footer>
            <Spacer/>
            <button onClick={cancel}>cancel</button>
            <button className={'primary'} onClick={create}>create</button>
        </footer>
    </div>
}
