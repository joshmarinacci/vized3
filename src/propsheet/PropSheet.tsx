import "./PropSheet.css"

import {Bounds, Point, Size} from "josh_js_util"
import {DialogContext} from "josh_react_util"
import {ChangeEvent, useContext, useEffect, useState} from "react"

import {useObservableChange, ValueThumbnail} from "../common"
import {PropDef, PropsBase, useWatchAllProps, useWatchProp} from "../models/base"
import {GlobalState} from "../models/state"
import {FillInput} from "./FillPropEditor"


function NumberEditor<Type>(props: {
    name: keyof Type,
    schema: PropDef<number>,
    target: PropsBase<Type>
}) {
    const {name, schema, target} = props
    const [value, setValue] = useState(target.getPropValue(name) as number)
    useWatchProp(target, name, () => setValue(target.getPropValue(name) as number))
    useEffect(() => setValue(target.getPropValue(name) as number), [target])
    const update = (e: ChangeEvent<HTMLInputElement>) => target.setPropValue(name, parseFloat(e.target.value) as Type[keyof Type])
    const displayUnit = schema.displayUnit ? schema.displayUnit : ''
    return <><input type={"number"} value={value} step={0.1}
                    onChange={update}/><i>{displayUnit}</i></>
}


function StringEditor<Type>(props: {
    name: keyof Type,
    schema: PropDef<string>,
    target: PropsBase<Type>
}) {
    const {name, schema, target} = props
    const [value, setValue] = useState(target.getPropValue(name) as string)
    useWatchProp(target, name, () => setValue(target.getPropValue(name) as string))
    useEffect(() => setValue(target.getPropValue(name) as string), [target])
    const update = (e: ChangeEvent<HTMLInputElement>) => target.setPropValue(name, e.target.value as Type[keyof Type])
    return <input type={"text"} value={value} onChange={update}/>
}

function BooleanEditor<Type>(props: {
    name: keyof Type,
    schema: PropDef<boolean>,
    target: PropsBase<Type>
}) {
    const {name, schema, target} = props
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

// function ProxyValueThumbnail(props: { prop: PropDef, target: OO }) {
//     const {prop, target} = props
//     return <div className={'proxy-value-thumbnail'}>
//         <ValueThumbnail target={target} prop={prop}/>
//         <b>{target.getPropProxySource(prop.name).getPropValue('name')}</b>
//     </div>
// }
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
    def: PropDef<any>,
    target: PropsBase<Type>,
    state: GlobalState
}) {
    const {name, def, target, state} = props
    const dm = useContext(DialogContext)
    // const isProxied = target.isPropProxySource(prop.name)
    const isProxied = false

    if (def.hidden) return <></>
    if (def.readonly) return <>
        <label>{name.toString()}</label>
        <ValueThumbnail target={target} prop={def} name={name}/></>

    // if(prop.base === 'enum') return <>
    //     <label>{prop.name}</label>
    //     <EnumPropEditor schema={prop as EnumSchema} target={target}/>
    // </>
    // if(prop.base === 'object' && prop.subProps) return <SubPropEditor schema={prop} target={target}/>

    const the_label = <label>{name.toString()}</label>
    // const proxy_button = <ToggleIconButton
    //         regularIcon={SupportedIcons.Star}
    //         selectedIcon={SupportedIcons.Star}
    //         selected={target.isPropProxySource(prop.name)}
    //         onClick={() => {
    //             dm.show(<ProxySelectionDialog state={state} prop={prop} target={target}/>)
    //         }}
    //     />
    // const proxied_value = <ProxyValueThumbnail target={target} prop={prop}/>
    let regular_input = <label>unknown input</label>
    if (def.base === 'number') regular_input =
        <NumberEditor name={name} schema={def as PropDef<number>} target={target}/>
    if (def.base === 'string') regular_input =
        <StringEditor name={name} schema={def as PropDef<string>} target={target}/>
    if (def.base === 'boolean') regular_input =
        <BooleanEditor name={name} schema={def as PropDef<boolean>} target={target}/>
    if (def.base === 'Size') regular_input =
        <SizeEditor name={name} def={def as PropDef<Size>} target={target}/>
    if (def.base === 'Point') regular_input =
        <PointEditor name={name} def={def as PropDef<Point>} target={target}/>
    if (def.base === 'Bounds') regular_input =
        <BoundsEditor name={name} def={def as PropDef<Bounds>} target={target}/>
    if (def.custom === 'css-color') regular_input =
        <FillInput name={name} schema={def} target={target}/>
    // if(def.custom === 'image-asset') regular_input = <label>an image</label>
    return <>
        {the_label}
        {/*{prop.canProxy && proxy_button}*/}
        {/*{isProxied && proxied_value}*/}
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
    // useObjectProxyChange(props.selected,PropChanged)
    useWatchAllProps(props.selected)
    useObservableChange(props.state, 'selection')
    const schemas = props.selected.getAllPropDefs()
    return <div className={'prop-sheet panel'}>{schemas.map(([k, d]) => {
        return <PropEditor key={k.toString()} name={k} def={d} target={props.selected}
                           state={props.state}/>
    })}</div>
}
