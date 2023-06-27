import React, {useEffect, useState} from "react";
import {GlobalState, Observable, RealCircle, RealShape, RealSquare} from "./models/model";
import {useObservableChange} from "./PageView";
import {
    BlockPicker,
    ColorResult,
    CustomPicker,
    PhotoshopPicker,
    SketchPicker,
    SwatchesPicker
} from 'react-color';
import {TabbedPanel} from "josh_react_util";

interface PropSchema {
    name:string,
    base:'number'|"string"|"fill",
    set(name:string, value:any): void
    get(name:string):any
}

class NumberPropSchema implements  PropSchema {
    base: "number";
    name: string;
    private target: RealShape;

    constructor(name:string, target:RealShape) {
        this.base = "number"
        this.name = name
        this.target = target
    }

    set(name:string, value:any) {
        this.target.setProperty(name,value)
    }
    get(name:string) {
        return this.target.getProperty(name)
    }
}
class StringPropSchema implements PropSchema {
    base: "string";
    name: string;
    private target: any;

    constructor(name:string, target:any) {
        this.base = "string"
        this.name = name
        this.target = target
    }

    set(name:string, value:any) {
        this.target.setProperty(name,value)
    }
    get(name:string) {
        return this.target.getProperty(name)
    }
}
class FillPropSchema implements PropSchema {
    base: 'string'
    name: string
    private target: RealShape
    constructor(name:string, target:RealShape) {
        this.base = 'string'
        this.name = name
        this.target = target
    }
    set(name:string, value:any) {
        this.target.setProperty(name,value)
    }
    get(name:string) {
        return this.target.getProperty(name)
    }
}

function NumberEditor(props: { schema: PropSchema }) {
    const value = props.schema.get(props.schema.name)
    return <>
        <label>{props.schema.name}</label>
        <input type={"number"} value={value} onChange={(e)=>{
            let num = parseInt(e.target.value)
            props.schema.set(props.schema.name,num)
        }}/>
    </>
}

function StringEditor(props: { schema: PropSchema }) {
    const value = props.schema.get(props.schema.name)
    return <>
        <label>{props.schema.name}</label>
        <input type={"text"} value={value} onChange={(e)=>{
            props.schema.set(props.schema.name,e.target.value)
        }}/>
    </>
}

type CB = () => any
function FillSwatchButton(props:{schema: PropSchema, onClick:CB}) {
    return <div className={'color-swatch-button'}>
        <button
            className={'color-swatch-button'}
            style={{backgroundColor:props.schema.get(props.schema.name) as string}}
            onClick={props.onClick}
        >&nbsp;</button>
        {/*<label>{objToHsla(props.color)}</label>*/}
    </div>
}

function FillInput(props:{ schema: PropSchema}) {
    const value = props.schema.get(props.schema.name)
    const [visible, setVisible] = useState(false)
    const show:CB = () => setVisible((!visible))
    return <>
        <label>{props.schema.name}</label>
        <div className={'color-picker-wrapper'}>
        <FillSwatchButton schema={props.schema} onClick={show}/>
        {visible && (
        <div className={'popover'}>
        <TabbedPanel titles={['swatches','other']}>
            <SwatchesPicker color={value} onChange={(e)=>{
                console.log("new result is",e.hex)
                props.schema.set(props.schema.name,e.hex)
            }}/>
            <button>Hello</button>
        </TabbedPanel>
        <button style={{
            position:'absolute',
            top:'0',
            right:'0',
        }} onClick={show}>x</button>
    </div>)}
        </div>
    </>
}

// function HSLColorInput(props: { value: HSLColor, onChange: (v:HSLColor) => void  }) {
//     const [visible, setVisible] = useState(false)
//     return <div className={"color-picker-wrapper"}>
//         <ColorSwatchButton color={props.value} onClick={()=>setVisible(!visible)}/>
//         {visible &&  <div className={'popover'}>
//             <div className={'cover'}
//                 // onClick={()=>setVisible(false)}
//             >
//                 <MetaColorInput value={props.value} onChange={props.onChange} onClose={()=>setVisible(false)}/>
//                 {/*<SketchPicker color={props.value}*/}
//                 {/*              onChange={(e)=> props.onChange(e.hsl as HSLColor)}/>*/}
//             </div>
//         </div>}
//     </div>
// }


function PropEditor(props: { schema: PropSchema }) {
    const { schema } = props
    if(schema instanceof FillPropSchema) return <FillInput schema={schema}/>
    if(schema.base === 'number') return <NumberEditor schema={schema}/>
    if(schema.base === 'string') return <StringEditor schema={schema}/>
    return <label>unknown property type {schema.name}</label>
}

export function PropSheet(props:{state:GlobalState}) {
    const selected = props.state.getSelectedObject()
    useObservableChange(selected as unknown as Observable,'changed')
    useObservableChange(props.state,'selection')
    const schemas:PropSchema[] = []
    if(selected instanceof RealSquare) {
        schemas.push(new NumberPropSchema('x',selected))
        schemas.push(new NumberPropSchema('y',selected))
        schemas.push(new StringPropSchema('name',selected))
    }
    if(selected instanceof RealCircle) {
        schemas.push(new NumberPropSchema('x',selected))
        schemas.push(new NumberPropSchema('y',selected))
        schemas.push(new NumberPropSchema('radius',selected))
        schemas.push(new StringPropSchema('name',selected))
        schemas.push(new FillPropSchema('fill',selected))
    }

    return <div className={'prop-sheet panel'}>{schemas.map((schema) => {
        return <PropEditor key={schema.name} schema={schema}/>
    })}</div>
}
