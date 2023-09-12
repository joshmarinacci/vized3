import './common.css'

import {Point} from "josh_js_util"
import {toClass} from "josh_react_util"
import React, {
    ChangeEvent,
    CSSProperties,
    JSX,
    MouseEvent,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react"

import {ActionRegistry, MenuAction, SimpleMenuAction} from "./actions/actions"
import {SupportedIcons} from "./icons"
import {Observable, ObservableListener, OEvent} from "./models/model"
import {
    EventTypes,
    ObjectDef,
    ObjectManager,
    ObjectProxy,
    OMEventTypes,
    PropSchema
} from "./models/om"
import {GlobalState} from "./models/state"
import {PopupContext} from "./propsheet/popup"

const AR = new ActionRegistry()
export const ActionRegistryContext =  React.createContext(AR)
export function MainLayout(props: {
    leftVisible: boolean,
    rightVisible: boolean,
    left: JSX.Element,
    center: JSX.Element,
    right: JSX.Element,
}): JSX.Element {
    const mainStyle: CSSProperties = {}
    if (props.leftVisible && props.rightVisible) {
        mainStyle.gridTemplateColumns = '250px 3fr 350px'
    }
    if (props.leftVisible && !props.rightVisible) {
        mainStyle.gridTemplateColumns = '250px 3fr'
    }
    if (!props.leftVisible && props.rightVisible) {
        mainStyle.gridTemplateColumns = '3fr 350px'
    }
    return <div className={'main-view'} style={mainStyle}>
        {props.leftVisible && props.left}
        {props.center}
        {props.rightVisible && props.right}
    </div>
}


export function ToggleIconButton(props: {
    onClick: () => void,
    regularIcon: SupportedIcons,
    selectedIcon: SupportedIcons,
    selected: boolean
}): JSX.Element {
    return <button className={toClass({
        'icon-button': true,
        'borderless': true,
    })} onClick={props.onClick}>
        <span
            className={toClass({
                "material-symbols-rounded":true,
                filled:props.selected
            })}>{props.selected ? props.selectedIcon : props.regularIcon}</span>
    </button>
}

export function IconButton(props: {
    onClick?: (e:MouseEvent<HTMLButtonElement>) => void,
    icon?: SupportedIcons,
    children?: ReactNode
    disabled?: boolean
}): JSX.Element {
    const {icon} = props
    return <button onClick={props.onClick} className={'icon-button'} disabled={props.disabled}>
        {icon && <span className="material-symbols-rounded">{icon}</span>}
        {props.children}
    </button>
}

export function Icon(props:{ icon:SupportedIcons }) {
    return <span className={'material-symbols-rounded'}>{props.icon}</span>
}

export function useObservableChange(ob: Observable | undefined, eventType: string, cb?:ObservableListener) {
    const [count, setCount] = useState(0)
    return useEffect(() => {
        const hand = async (e:OEvent) => {
            setCount(count + 1)
            if(cb) await cb(e)
        }
        if (ob) ob.addEventListener(eventType, hand)
        return () => {
            if (ob) ob.removeEventListener(eventType, hand)
        }

    }, [ob, count])
}

export function useObjectManagerChange(ob: ObjectManager, eventType: OMEventTypes) {
    const [count, setCount] = useState(0)
    return useEffect(() => {
        const hand = () => {
            setCount(count + 1)
        }
        if (ob) ob.addEventListener(eventType, hand)
        return () => {
            if (ob) ob.removeEventListener(eventType, hand)
        }

    }, [ob, count])
}

export function useObjectProxyChange(ob: ObjectProxy<ObjectDef> | null, eventType: EventTypes) {
    const [count, setCount] = useState(0)
    return useEffect(() => {
        const hand = () => {
            setCount(count + 1)
        }
        if (ob) ob.addEventListener(eventType, hand)
        return () => {
            if (ob) ob.removeEventListener(eventType, hand)
        }

    }, [ob, count])
}

export function MenuBox(props: { children: ReactNode }) {
    return <div className={'menu-box'}>{props.children}</div>
}

export type ReactMenuAction = {
    type:'react',
    title:string
    icon?:SupportedIcons,
    makeComponent: (state:GlobalState) => JSX.Element
} & MenuAction

export function MenuActionButton(props: { action: MenuAction|ReactMenuAction, state: GlobalState, disabled?:boolean }):JSX.Element {
    const {action, state, disabled=false} = props
    if(action.type === 'react') {
        return (action as ReactMenuAction).makeComponent(state) as JSX.Element
    }
    let icon = <></>
    if(action.icon) {
        icon = <span  className="material-icons material-symbols-rounded">{action.icon}</span>
    }
    const perform = async () => {
        if(action.type === 'simple') await (action as SimpleMenuAction).perform(state)
    }
    let shortcut = <></>
    if(action.shortcut) {
        shortcut = <b>SHORTCUT</b>
    }
    return <button className={'menu-button'} onClick={perform} disabled={disabled}> {icon} {shortcut} {action.title}</button>
}
export function ToolbarActionButton(props:{action:MenuAction, state:GlobalState, disabled?:boolean}):JSX.Element {
    const {action, state, disabled=false} = props
    if(action.type === 'react') {
        return (action as ReactMenuAction).makeComponent(state) as JSX.Element
    }
    let icon = <></>
    if(action.icon) {
        icon = <span  className="material-icons material-symbols-rounded">{action.icon}</span>
    }
    const perform = async () => {
        if(action.type === 'simple') await (action as SimpleMenuAction).perform(state)
    }
    return <button className={'menu-button'} onClick={perform} disabled={disabled}> {icon} {action.title}</button>
}

export function DropdownMenuButton(props: {
    title?:string,
    icon?:SupportedIcons,
    items: (MenuAction)[],
    state: GlobalState
}) {
    const {title, icon, items, state} = props
    const pm = useContext(PopupContext)
    const showMenu = (e: MouseEvent<HTMLButtonElement>) => {
        const menu = <MenuBox>{items.map((m, i) => {
            return <MenuActionButton key={i} action={m} state={state}/>
        })}</MenuBox>
        pm.show_at(menu, e.target as HTMLElement, "left", new Point(0, 0))
    }
    return <IconButton icon={icon} onClick={showMenu}>{title}</IconButton>
}

export function ValueThumbnail(props: { target: ObjectProxy<ObjectDef>, prop: PropSchema }) {
    const schema = props.prop
    const value = props.target.getPropValue(props.prop.name)
    if (typeof value === 'undefined') {
        return <div>undefined</div>
    }
    if (schema.custom === 'css-color') {
        return <div style={{
            width: '32px',
            height: '32px',
            border: '1px solid black',
            backgroundColor: value as string
        }}></div>
    }
    if(schema.custom === 'image-asset') {
        const img:ImageData = value
        return <div>image: size:{img.width} x {img.height}</div>
    }
    if (schema.custom === 'css-gradient') {
        return <div style={{
            width: '32px',
            height: '32px',
            border: '1px solid black',
            backgroundColor: 'green',
        }}></div>
    }
    if (typeof value === 'string') {
        return <div>{value}</div>
    }
    if (schema.base === 'number') {
        return <div>{value}</div>
    }
    return <div>some kind of value</div>
}

export type ItemRenderer<T> = (item: T) => JSX.Element
export type ItemToKey<T> = (item: T) => string

export function ListView<T>(props: { data: T[], renderer: ItemRenderer<T> }) {
    const {data, renderer} = props
    return <div className={'list-view'}>
        {data.map((file, i) => {
            return <div className={'list-item'} key={i}>{renderer(file)}</div>
        })}
    </div>
}
export function SelectView<T>(props: {
    toKey:ItemToKey<T>,
    data:T[],
    renderer:ItemRenderer<T>,
    selected:T,
    onSelect:(t:T)=>void
}) {
    const { toKey, data, selected, onSelect, renderer} = props
    return <select value={toKey(selected)} onChange={(e:ChangeEvent<HTMLSelectElement>)=>{
        onSelect(data.find(d => toKey(d) === e.target.value) as T)
    }}>
        {data.map((d:T) => {
            return <option key={toKey(d)} value={toKey(d)}>{renderer(d)}</option>
        })}
    </select>
}
