import React, {useState} from "react";
import {GlobalState} from "./models/state";
import {ObjectDef, ObjectProxy, PropChanged, PropSchema} from "./models/om";
import {TabbedPanel} from "josh_react_util";
import {SwatchesPicker} from "react-color";
import {Bounds} from "josh_js_util";
import {useObjectProxyChange, useObservableChange} from "./common";

function NumberEditor(props: { schema: PropSchema, target:ObjectProxy<ObjectDef> }) {
    const value = props.target.getPropValue(props.schema)
    return <>
        <label>{props.schema.name}</label>
        <input type={"number"} value={value} onChange={async (e) => {
            let num = parseInt(e.target.value)
            await props.target.setPropValue(props.schema, num)
        }}/>
    </>
}

function SubNumberEditor(props: { parentSchema:PropSchema, schema: PropSchema, target:ObjectProxy<ObjectDef> }) {
    const value = props.target.getPropValue(props.parentSchema)
    return <>
        <label>{props.schema.name}</label>
        <input type={"number"} value={value[props.schema.name]} onChange={async (e) => {
            let num = parseInt(e.target.value)
            let v = props.target.getPropValue(props.parentSchema)
            if(!props.parentSchema.setter) throw new Error('cannot use sub props without a setter')
            let nv = props.parentSchema.setter(v,props.schema.name,num)
            await props.target.setPropValue(props.parentSchema, nv)
        }}/>
    </>
}

function StringEditor(props: { schema: PropSchema, target:ObjectProxy<ObjectDef> }) {
    const value = props.target.getPropValue(props.schema)
    return <>
        <label>{props.schema.name}</label>
        <input type={"text"} value={value} onChange={async (e) => {
            await props.target.setPropValue(props.schema, e.target.value)
        }}/>
    </>
}

function SubPropEditor(props: { schema: PropSchema, target:ObjectProxy<ObjectDef> }) {
    const schema = props.schema
    const target = props.target
    const value = target.getPropValue(schema)
    const subs = schema.subProps as Record<string,PropSchema>
    return <>
        <label>{props.schema.name}</label>
        {Object.keys(subs).map((key:string) => {
            return <SubNumberEditor key={key} parentSchema={schema} schema={subs[key]} target={target}/>
        })}
    </>
}

type CB = () => any
function FillSwatchButton(props:{schema: PropSchema, target:ObjectProxy<ObjectDef>, onClick:CB}) {
    return <div className={'color-swatch-button'}>
        <button
            className={'color-swatch-button'}
            style={{backgroundColor:props.target.getPropValue(props.schema) as string}}
            onClick={props.onClick}
        >&nbsp;</button>
        {/*<label>{objToHsla(props.color)}</label>*/}
    </div>
}


function FillInput(props:{ schema: PropSchema, target:ObjectProxy<ObjectDef>}) {
    const { schema, target } = props
    const value = props.target.getPropValue(props.schema)
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
                await target.setPropValue(props.schema, e.hex)
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

function PropEditor(props: { prop: PropSchema, target: ObjectProxy<ObjectDef> }) {
    const { prop, target } = props
    if(prop.custom === 'css-color') return <FillInput schema={prop} target={target}/>
    if(prop.readonly) return <><label>{prop.name}</label><b>{target.getPropValue(prop)}</b></>
    if(prop.base === 'object' && prop.subProps) return <SubPropEditor schema={prop} target={target}/>
    if(prop.base === 'number') return <NumberEditor schema={prop} target={target}/>
    if(prop.base === 'string') return <StringEditor schema={prop} target={target}/>
    return <label>unknown property type {prop.name}</label>
}

export function PropSheet(props:{state:GlobalState}) {
    const selected = props.state.getSelectedObject()
    useObjectProxyChange(selected,PropChanged)
    useObservableChange(props.state,'selection')
    const schemas = (selected)?selected.getPropSchemas():[]
    return <div className={'prop-sheet panel'}>{schemas.map((schema) => {
        return <PropEditor key={schema.name} prop={schema} target={selected as ObjectProxy<ObjectDef>}/>
    })}</div>
}
