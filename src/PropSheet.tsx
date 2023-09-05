import "./PropSheet.css"

import {DialogContext, PopupContext, toClass} from "josh_react_util"
import React, {ChangeEvent, useContext, useState} from "react"

import {ToggleIconButton, useObjectProxyChange, useObservableChange, ValueThumbnail} from "./common"
import {MINECRAFT, PICO8} from "./exporters/common"
import {SupportedIcons} from "./icons"
import {EnumSchema, OO, PropChanged, PropSchema} from "./models/om"
import {GlobalState} from "./models/state"
import {ProxySelectionDialog} from "./ProxySelectionDialog"

function NumberEditor(props: { schema: PropSchema, target:OO }) {
    const {schema, target} = props
    const value = target.getPropValue(schema.name)
    const update = async (e: ChangeEvent<HTMLInputElement>) => {
        const num = parseFloat(e.target.value)
        await target.setPropValue(schema.name, num)
    }
    return <input type={"number"} value={value} step={0.1} onChange={update}/>
}

function SubNumberEditor(props: { parentSchema:PropSchema, schema: PropSchema, target:OO }) {
    const {parentSchema, schema, target} = props
    const value = props.target.getPropValue(props.parentSchema.name)
    const update = async (e: ChangeEvent<HTMLInputElement>) => {
        const num = parseFloat(e.target.value)
        const v = target.getPropValue(parentSchema.name)
        if(!parentSchema.setter) throw new Error('cannot use sub props without a setter')
        const nv = parentSchema.setter(v,schema.name,num)
        await target.setPropValue(parentSchema.name, nv)
    }
    return <>
        <label>{schema.name}</label>
        <input type={"number"} value={value[schema.name]} step={0.1} onChange={update}/>
    </>
}

function StringEditor(props: { schema: PropSchema, target:OO }) {
    const {schema, target} = props
    const value = target.getPropValue(schema.name)
    const update = async (e: ChangeEvent<HTMLInputElement>) => {
        await target.setPropValue(schema.name, e.target.value)
    }
    return <input type={"text"} value={value} onChange={update}/>
}

function SubPropEditor(props: { schema: PropSchema, target:OO }) {
    const schema = props.schema
    const target = props.target
    const subs = schema.subProps as Record<string,PropSchema>
    return <>
        <label>{props.schema.name}</label>
        {Object.keys(subs).map((key:string) => {
            return <SubNumberEditor key={key} parentSchema={schema} schema={subs[key]} target={target}/>
        })}
    </>
}

function FillSwatchButton(props:{schema: PropSchema, target:OO, onClick:()=>void}) {
    return <div className={'color-swatch-button input'}>
        <button
            className={'color-swatch-button'}
            style={{backgroundColor:props.target.getPropValue(props.schema.name) as string}}
            onClick={props.onClick}
        />
    </div>
}

export function SwatchColorPicker(props:{colors:string[], selected:string, onSelect:(hex:string)=>void}) {
    return <div className={'color-picker'}>
        {props.colors.map((color,i) => {
            return <button className={toClass({
                selected:props.selected === color
            })} key={i} style={{
                backgroundColor:color,
            }} onClick={() => {
                props.onSelect(color)
            }}/>
        })}
    </div>
}

type PALETTE = {
    name:string
    colors:string[]
}
const PALETTES:PALETTE[] = [
    {
        name:'Minecraft',
        colors:MINECRAFT,
    },
    {
        name:'Pico8',
        colors:PICO8
    }
]

function TabbedColorPicker(props:{value:string, onSelect:(value:string)=>void}) {
    const [selected, setSelected] = useState(0)

    return <div className={'tabbed-color-picker'}>
        <div className={'hbox'}>
            {PALETTES.map((v,i) => <button
                className={toClass({
                    selected:i===selected
                })}
                key={i}
                onClick={(e)=>{
                    e.preventDefault()
                    e.stopPropagation()
                    setSelected(i)
                }}
            >{PALETTES[i].name}</button>)}
        </div>
        <SwatchColorPicker colors={PALETTES[selected].colors}
                           selected={props.value}
                           onSelect={props.onSelect}/>
    </div>
}
function FillInput(props:{ schema: PropSchema, target:OO}) {
    const { schema, target } = props
    const value = target.getPropValue(schema.name)
    const pm = useContext(PopupContext)
    const setColor = async (hex:string ) => await target.setPropValue(schema.name, hex)
    const choose = (e:MouseEvent) => {
        pm.show_at(<TabbedColorPicker value={value} onSelect={setColor}/>,e.target,'below')
    }
    return <FillSwatchButton schema={schema} target={target} onClick={choose}/>
}

function BooleanEditor(props: { schema: PropSchema, target: OO }) {
    const {schema, target} = props
    const value = target.getPropValue(schema.name)
    const update = async (e:ChangeEvent<HTMLInputElement>) => {
        await props.target.setPropValue(props.schema.name, e.target.checked)
    }
    return <input type={"checkbox"} value={value} onChange={update}/>
}

function EnumPropEditor(props: { schema: EnumSchema, target: OO }) {
    const {schema, target} = props
    const value = target.getPropValue(schema.name)
    const sch = schema as EnumSchema
    const update = async (e:ChangeEvent<HTMLSelectElement>) => {
        await target.setPropValue(schema.name, e.target.value)
    }
    return <>
        <select value={value} onChange={update}>
            {sch.possibleValues.map(val => {
                return <option key={val} value={val}>{sch.renderer(props.target, sch.name, val)}</option>
            })}
        </select>
    </>
}

function ProxyValueThumbnail(props: { prop: PropSchema, target: OO }) {
    const {prop, target} = props
    return <div className={'proxy-value-thumbnail'}>
        <ValueThumbnail target={target} prop={prop}/>
        <b>{target.getPropProxySource(prop.name).getPropValue('name')}</b>
    </div>
}

function PropEditor(props: { prop: PropSchema, target: OO, state:GlobalState }) {
    const { prop, target , state} = props
    const dm = useContext(DialogContext)
    const isProxied = target.isPropProxySource(prop.name)

    if(prop.hidden) return <></>
    if(prop.readonly) return <>
        <label>{prop.name}</label>
        <ValueThumbnail target={target} prop={prop}/></>

    if(prop.base === 'enum') return <EnumPropEditor schema={prop as EnumSchema} target={target}/>
    if(prop.base === 'object' && prop.subProps) return <SubPropEditor schema={prop} target={target}/>

    const the_label = <label>{prop.name}</label>
    const proxy_button = <ToggleIconButton
            regularIcon={SupportedIcons.Star}
            selectedIcon={SupportedIcons.Star}
            selected={target.isPropProxySource(prop.name)}
            onClick={() => {
                dm.show(<ProxySelectionDialog state={state} prop={prop} target={target}/>)
            }}
        />
    const proxied_value = <ProxyValueThumbnail target={target} prop={prop}/>
    let regular_input= <label>unknown input</label>
    if(prop.base === 'number') regular_input = <NumberEditor schema={prop} target={target}/>
    if(prop.base === 'string') regular_input = <StringEditor schema={prop} target={target}/>
    if(prop.base === 'boolean') regular_input = <BooleanEditor schema={prop} target={target}/>
    if(prop.custom === 'css-color') regular_input = <FillInput schema={prop} target={target}/>
    if(prop.custom === 'image-asset') regular_input = <label>an image</label>
    return <>
        {the_label}
        {prop.canProxy && proxy_button}
        {isProxied && proxied_value}
        {!isProxied && regular_input}
    </>
}

export function PropSheet(props:{state:GlobalState}) {
    const selected = props.state.getSelectedObjects()
    if(selected.length === 0) return <div>nothing selected</div>
    if(selected.length > 1) return <div>multiple items selected</div>
    return <InnerPropSheet state={props.state} selected={selected[0]}/>
}
export function InnerPropSheet(props:{state:GlobalState, selected:OO}) {
    useObjectProxyChange(props.selected,PropChanged)
    useObservableChange(props.state,'selection')
    const schemas = (props.selected)?props.selected.getPropSchemas():[]
    return <div className={'prop-sheet panel'}>{schemas.map((schema) => {
        return <PropEditor key={schema.name} prop={schema} target={props.selected} state={props.state}/>
    })}</div>
}
