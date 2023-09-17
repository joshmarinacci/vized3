import "./PropSheet.css"

import {Bounds, Point, Size} from "josh_js_util"
import {DialogContext} from "josh_react_util"
import React, {ChangeEvent, useContext, useEffect, useState} from "react"

import {ToggleIconButton, useObservableChange, ValueThumbnail} from "../common"
import {SupportedIcons} from "../icons"
import {PropDef, PropsBase, useWatchAllProps, useWatchProp} from "../models/base"
import {GlobalState} from "../models/state"
import {FillInput} from "./FillPropEditor"
import {ProxySelectionDialog} from "./ProxySelectionDialog"


function NumberEditor<Type>(props: {
    name: keyof Type,
    def: PropDef<number>,
    target: PropsBase<Type>
}) {
    const {name, def, target} = props
    const [value, setValue] = useState(target.getPropValue(name) as number)
    useWatchProp(target, name, () => setValue(target.getPropValue(name) as number))
    useEffect(() => setValue(target.getPropValue(name) as number), [target])
    const update = (e: ChangeEvent<HTMLInputElement>) => target.setPropValue(name, parseFloat(e.target.value) as Type[keyof Type])
    const displayUnit = def.displayUnit ? def.displayUnit : ''
    return <><input type={"number"} value={value} step={0.1}
                    onChange={update}/><i>{displayUnit}</i></>
}


function StringEditor<Type>(props: {
    name: keyof Type,
    def: PropDef<string>,
    target: PropsBase<Type>
}) {
    const {name, def, target} = props
    const [value, setValue] = useState(target.getPropValue(name) as string)
    useWatchProp(target, name, () => setValue(target.getPropValue(name) as string))
    useEffect(() => setValue(target.getPropValue(name) as string), [target])
    const update = (e: ChangeEvent<HTMLInputElement>) => target.setPropValue(name, e.target.value as Type[keyof Type])
    return <input type={"text"} value={value} onChange={update}/>
}

function BooleanEditor<Type>(props: {
    name: keyof Type,
    def: PropDef<boolean>,
    target: PropsBase<Type>
}) {
    const {name, def, target} = props
    const value = target.getPropValue(name) as boolean
    const update = async (e: ChangeEvent<HTMLInputElement>) => {
        target.setPropValue(name, e.target.checked)
    }
    return <input type={"checkbox"} checked={value} onChange={update}/>
}

// function EnumPropEditor<Type>(props: { schema: EnumSchema, target: target:PropsBase<Type> }) {
//     const {schema, target} = props
//     const value = target.getPropValue(schema.name)
//     const sch = schema as EnumSchema
//     const update = async (e:ChangeEvent<HTMLSelectElement>) => {
//         await target.setPropValue(schema.name, e.target.value)
//     }
//     return <>
//         <select className={'input'} value={value} onChange={update}>
//             {sch.possibleValues.map(val => {
//                 return <option key={val} value={val}>{sch.renderer(props.target, sch.name, val)}</option>
//             })}
//         </select>
//     </>
// }

function ProxyValueThumbnail<Type>(props: { name: keyof Type, prop: PropDef<Type[keyof Type]>, target: PropsBase<Type> }) {
    const {name, prop, target} = props
    return <div className={'proxy-value-thumbnail'}>
        <ValueThumbnail name={name} target={target} prop={prop}/>
        <b>{target.getPropProxySource(name).getPropValue('name')}</b>
    </div>
}
function SizeEditor<Type, Key extends keyof Type>(props: {
    target: PropsBase<Type>
    name: Key,
    def: PropDef<Size>,
}) {
    const {name, target, def} = props
    const [value, setValue] = useState(target.getPropValue(name) as Size)
    useWatchProp(target, name, () => setValue(target.getPropValue(name) as Size))
    return <>
        <label>w</label>
        <input type={'number'}
               value={value.w}
               onChange={(e) => {
                   const v = parseInt(e.target.value)
                   const size = new Size(v, value.h)
                   target.setPropValue(props.name, size as Type[Key])
               }}/>
        <label>h</label>
        <input type={'number'}
               value={value.h}
               onChange={(e) => {
                   const v = parseInt(e.target.value)
                   const size = new Size(value.w, v)
                   props.target.setPropValue(props.name, size as Type[Key])
               }}/>
    </>
}

function PointEditor<Type, Key extends keyof Type>(props: {
    target: PropsBase<Type>
    name: Key,
    def: PropDef<Point>,
}) {
    const {name, target, def} = props
    const [value, setValue] = useState(target.getPropValue(name) as Point)
    useWatchProp(target, name, () => setValue(target.getPropValue(name) as Point))

    return <>
        <label>x</label>
        <input type={'number'}
               value={value.x}
               onChange={(e) => {
                   const v = parseFloat(e.target.value)
                   const size = new Point(v, value.y)
                   target.setPropValue(props.name, size as Type[Key])
               }}/>
        <label>y</label>
        <input type={'number'}
               value={value.y}
               onChange={(e) => {
                   const v = parseFloat(e.target.value)
                   const size = new Point(value.x, v)
                   props.target.setPropValue(props.name, size as Type[Key])
               }}/>
    </>
}

function fromParts(pos: Point, size: Size) {
    return new Bounds(pos.x, pos.y, size.w, size.h)
}

function BoundsEditor<Type, Key extends keyof Type>(props: {
    target: PropsBase<Type>
    name: Key,
    def: PropDef<Bounds>,
}) {
    const {name, target, def} = props
    const [value, setValue] = useState(target.getPropValue(name) as Bounds)
    useWatchProp(target, name, () => setValue(target.getPropValue(name) as Bounds))

    return <>
        <label>x</label>
        <input type={'number'}
               value={value.x}
               onChange={(e) => {
                   const v = parseFloat(e.target.value)
                   const pos = new Point(v, value.y)
                   const bounds = fromParts(pos, value.size())
                   target.setPropValue(props.name, bounds as Type[Key])
               }}/>
        <label>y</label>
        <input type={'number'}
               value={value.y}
               onChange={(e) => {
                   const v = parseFloat(e.target.value)
                   const pos = new Point(value.x, v)
                   const bounds = fromParts(pos, value.size())
                   target.setPropValue(props.name, bounds as Type[Key])
               }}/>
        <label>w</label>
        <input type={'number'}
               value={value.w}
               onChange={(e) => {
                   const v = parseInt(e.target.value)
                   const size = new Size(v, value.h)
                   const bounds = fromParts(value.position(), size)
                   target.setPropValue(props.name, bounds as Type[Key])
               }}/>
        <label>h</label>
        <input type={'number'}
               value={value.h}
               onChange={(e) => {
                   const v = parseInt(e.target.value)
                   const size = new Size(value.w, v)
                   const bounds = fromParts(value.position(), size)
                   props.target.setPropValue(props.name, bounds as Type[Key])
               }}/>
    </>
}

function PropEditor<Type, K extends keyof Type>(props: {
    name: K,
    def: PropDef<Type[K]>,
    target: PropsBase<Type>,
    state: GlobalState
}) {
    const {name, def, target, state} = props
    const dm = useContext(DialogContext)
    const isProxied = target.isPropProxySource(name)

    if (def.hidden) return <></>
    if (def.readonly) return <>
        <label>{name.toString()}</label>
        <ValueThumbnail target={target} prop={def} name={name}/></>

    // if(prop.base === 'enum') return <>
    //     <label>{prop.name}</label>
    //     <EnumPropEditor schema={prop as EnumSchema} target={target}/>
    // </>

    const the_label = <label>{name.toString()}</label>
    const proxy_button = <ToggleIconButton
            regularIcon={SupportedIcons.Star}
            selectedIcon={SupportedIcons.Star}
            selected={target.isPropProxySource(name)}
            onClick={() => {
                dm.show(<ProxySelectionDialog name={name} state={state} prop={def} target={target}/>)
            }}
        />
    const proxied_value = <ProxyValueThumbnail name={name} target={target} prop={def}/>
    let regular_input = <label>unknown input</label>
    if (def.base === 'number') regular_input =
        <NumberEditor name={name} def={def} target={target}/>
    if (def.base === 'string') regular_input =
        <StringEditor name={name} def={def} target={target}/>
    if (def.base === 'boolean') regular_input =
        <BooleanEditor name={name} def={def} target={target}/>
    if (def.base === 'Size') regular_input =
        <SizeEditor name={name} def={def} target={target}/>
    if (def.base === 'Point') regular_input =
        <PointEditor name={name} def={def} target={target}/>
    if (def.base === 'Bounds') regular_input =
        <BoundsEditor name={name} def={def} target={target}/>
    if (def.custom === 'css-color') regular_input =
        <FillInput name={name} def={def} target={target}/>
    if(def.custom === 'image-asset') regular_input = <label>an image</label>
    return <>
        {the_label}
        {def.canProxy && proxy_button}
        {isProxied && proxied_value}
        {!isProxied && regular_input}
    </>
}

export function PropSheet(props: { state: GlobalState }) {
    const selected = props.state.getSelectedObjects()
    if (selected.length === 0) return <div>nothing selected</div>
    if (selected.length > 1) return <div>multiple items selected</div>
    return <InnerPropSheet state={props.state} selected={selected[0]}/>
}

export function InnerPropSheet(props: { state: GlobalState, selected: PropsBase<any> }) {
    useWatchAllProps(props.selected)
    useObservableChange(props.state, 'selection')
    const schemas = props.selected.getAllPropDefs()
    return <div className={'prop-sheet panel'}>{schemas.map(([k, d]) => {
        return <PropEditor key={k.toString()} name={k} def={d} target={props.selected}
                           state={props.state}/>
    })}</div>
}
