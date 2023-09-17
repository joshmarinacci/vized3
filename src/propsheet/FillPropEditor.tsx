import {toClass} from "josh_react_util"
import {useContext, useState} from "react"

import {DAWNBRINGER32, MINECRAFT, PICO8} from "../exporters/common"
import {PropDef, PropsBase} from "../models/base"
import {PopupContext} from "./popup"

function FillSwatchButton<Type>(props: {
    name: keyof Type,
    schema: PropDef<any>,
    target: PropsBase<Type>,
    onClick: () => void
}) {
    return <div className={'color-swatch-button input'}>
        <button
            className={'color-swatch-button'}
            style={{backgroundColor: props.target.getPropValue(props.name) as string}}
            onClick={props.onClick}
        />
    </div>
}

export function SwatchColorPicker(props: {
    colors: string[],
    selected: string,
    onSelect: (hex: string) => void
}) {
    return <div className={'color-picker'}>
        {props.colors.map((color, i) => {
            return <button className={toClass({
                selected: props.selected === color
            })} key={i} style={{
                backgroundColor: color,
            }} onClick={() => {
                props.onSelect(color)
            }}/>
        })}
    </div>
}

type PALETTE = {
    name: string
    colors: string[]
}
const PALETTES: PALETTE[] = [
    {
        name: 'Minecraft',
        colors: MINECRAFT,
    },
    {
        name: 'Pico8',
        colors: PICO8
    },
    {
        name: 'Dawnbringer32',
        colors: DAWNBRINGER32
    }
]

function TabbedColorPicker(props: { value: string, onSelect: (value: string) => void }) {
    const [selected, setSelected] = useState(0)

    return <div className={'tabbed-color-picker'}>
        <div className={'hbox'}>
            {PALETTES.map((v, i) => <button
                className={toClass({
                    selected: i === selected
                })}
                key={i}
                onClick={(e) => {
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

export function FillInput<Type>(props: {
    name: keyof Type,
    def: PropDef<Type[keyof Type]>,
    target: PropsBase<Type>
}) {
    const {name, def, target} = props
    const value = target.getPropValue(name)
    const pm = useContext(PopupContext)
    const setColor = async (hex: string) => target.setPropValue(name, hex)
    const choose = (e: MouseEvent) => {
        pm.show_at(<TabbedColorPicker value={value} onSelect={setColor}/>, e.target, 'right')
    }
    return <FillSwatchButton name={name} schema={def} target={target} onClick={choose}/>
}
