import './common.css'

import {Point} from "josh_js_util"
import {PopupContext, toClass} from "josh_react_util"
import React, {
    CSSProperties,
    JSX,
    MouseEvent,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react"

import {MenuAction} from "./actions"
import {SupportedIcons} from "./icons"
import {Observable} from "./models/model"
import {
    EventTypes,
    ObjectDef,
    ObjectManager,
    ObjectProxy,
    OMEventTypes,
    PropSchema
} from "./models/om"
import {GlobalState} from "./models/state"

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
            className="material-icons">{props.selected ? props.selectedIcon : props.regularIcon}</span>
    </button>
}

export function IconButton(props: {
    onClick?: () => void,
    icon: SupportedIcons,
    children?: ReactNode
    disabled?: boolean
}): JSX.Element {
    return <button onClick={props.onClick} className={'icon-button'} disabled={props.disabled}>
        <span
            className="material-icons">{props.icon}</span>
        {props.children}
    </button>
}

export function useObservableChange(ob: Observable | undefined, eventType: string) {
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

function MenuButton(props: { children: React.ReactNode, onClick: () => void }) {
    return <button onClick={props.onClick}>{props.children}</button>
}

export function MenuActionButton(props: { action: MenuAction, state: GlobalState }) {
    let icon = <></>
    if(props.action.icon) {
        icon = <span  className="material-icons">{props.action.icon}</span>
    }
    return <MenuButton
        onClick={() => props.action.perform(props.state)}>{icon}{props.action.title}</MenuButton>
}

export function DropdownMenuButton(props: {
    title: string,
    items: MenuAction[],
    state: GlobalState
}) {
    const {title, items, state} = props
    const pm = useContext(PopupContext)
    const showMenu = (e: MouseEvent<HTMLButtonElement>) => {
        const menu = <MenuBox>{items.map((m, i) => <MenuActionButton key={i} action={m}
                                                                     state={state}/>)}</MenuBox>
        pm.show_at(menu, e.target, "left", new Point(0, 0))
    }
    return <button onClick={showMenu}>{title}</button>
}

export function ValueThumbnail(props: { value: any, schema: PropSchema }) {
    const {value, schema} = props
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
