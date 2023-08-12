import React, {useState} from "react";
import {GlobalState} from "./models/state";
import {ObjectDef, ObjectProxy, PropChanged, PropSchema} from "./models/om";
import {TabbedPanel} from "josh_react_util";
import {SwatchesPicker} from "react-color";
import {useObjectProxyChange, useObservableChange} from "./common";

function NumberEditor(props: { schema: PropSchema, target:ObjectProxy<any> }) {
    const value = props.target.getPropValue(props.schema.name)
    return <>
        <label>{props.schema.name}</label>
        <input type={"number"} value={value} onChange={async (e) => {
            let num = parseInt(e.target.value)
            await props.target.setPropValue(props.schema.name, num)
        }}/>
    </>
}

function SubNumberEditor(props: { parentSchema:PropSchema, schema: PropSchema, target:ObjectProxy<any> }) {
    const value = props.target.getPropValue(props.parentSchema.name)
    return <>
        <label>{props.schema.name}</label>
        <input type={"number"} value={value[props.schema.name]} onChange={async (e) => {
            let num = parseInt(e.target.value)
            let v = props.target.getPropValue(props.parentSchema.name)
            if(!props.parentSchema.setter) throw new Error('cannot use sub props without a setter')
            let nv = props.parentSchema.setter(v,props.schema.name,num)
            await props.target.setPropValue(props.parentSchema.name, nv)
        }}/>
    </>
}

function StringEditor(props: { schema: PropSchema, target:ObjectProxy<any> }) {
    const value = props.target.getPropValue(props.schema.name)
    return <>
        <label>{props.schema.name}</label>
        <input type={"text"} value={value} onChange={async (e) => {
            await props.target.setPropValue(props.schema.name, e.target.value)
        }}/>
    </>
}

function SubPropEditor(props: { schema: PropSchema, target:ObjectProxy<any> }) {
    const schema = props.schema
    const target = props.target
    const value = target.getPropValue(schema.name)
    const subs = schema.subProps as Record<string,PropSchema>
    return <>
        <label>{props.schema.name}</label>
        {Object.keys(subs).map((key:string) => {
            return <SubNumberEditor key={key} parentSchema={schema} schema={subs[key]} target={target}/>
        })}
    </>
}

type CB = () => any
function FillSwatchButton(props:{schema: PropSchema, target:ObjectProxy<any>, onClick:CB}) {
    return <div className={'color-swatch-button'}>
        <button
            className={'color-swatch-button'}
            style={{backgroundColor:props.target.getPropValue(props.schema.name) as string}}
            onClick={props.onClick}
        >&nbsp;</button>
        {/*<label>{objToHsla(props.color)}</label>*/}
    </div>
}


function FillInput(props:{ schema: PropSchema, target:ObjectProxy<any>}) {
    const { schema, target } = props
    const value = props.target.getPropValue(props.schema.name)
    const [visible, setVisible] = useState(false)
    const show:CB = () => setVisible((!visible))
    return <>
        <label>{props.schema.name}</label>
        <div className={'color-picker-wrapper'}>
        <FillSwatchButton schema={props.schema} target={target} onClick={show}/>
        {visible && (
        <div className={'popover'}>
        <TabbedPanel titles={['swatches','other']}>
            <SwatchesPicker color={value} onChange={async (e) => {
                await target.setPropValue(props.schema.name, e.hex)
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

function BooleanEditor(props: { schema: PropSchema, target: ObjectProxy<any> }) {
    const value = props.target.getPropValue(props.schema.name)
    return <>
        <label>{props.schema.name}</label>
        <input type={"checkbox"} value={value} onChange={async (e) => {
            await props.target.setPropValue(props.schema.name, e.target.value)
        }}/>
    </>
}

function PropEditor(props: { prop: PropSchema, target: ObjectProxy<any> }) {
    const { prop, target } = props
    if(prop.custom === 'css-color') return <FillInput schema={prop} target={target}/>
    if(prop.readonly) return <><label>{prop.name}</label><b>{target.getPropValue(prop.name)+""}</b></>
    if(prop.base === 'object' && prop.subProps) return <SubPropEditor schema={prop} target={target}/>
    if(prop.base === 'number') return <NumberEditor schema={prop} target={target}/>
    if(prop.base === 'string') return <StringEditor schema={prop} target={target}/>
    if(prop.base === 'boolean') return <BooleanEditor schema={prop} target={target}/>
    return <label>unknown property type {prop.name}</label>
}

export function PropSheet(props:{state:GlobalState}) {
    const selected = props.state.getSelectedObjects()
    if(selected.length === 0) {
        return <div>nothing selected</div>
    }
    if(selected.length > 1) {
        return <div>multiple items selected</div>
    }
    return <InnerPropSheet state={props.state} selected={selected[0]}/>
}
export function InnerPropSheet(props:{state:GlobalState, selected:ObjectProxy<ObjectDef>}) {
    useObjectProxyChange(props.selected,PropChanged)
    useObservableChange(props.state,'selection')
    const schemas = (props.selected)?props.selected.getPropSchemas():[]
    return <div className={'prop-sheet panel'}>{schemas.map((schema) => {
        return <PropEditor key={schema.name} prop={schema} target={props.selected}/>
    })}</div>
}
