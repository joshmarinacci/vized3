import React, {CSSProperties, JSX, ReactNode, useEffect, useState} from "react";
import {toClass} from "josh_react_util";
import {Observable} from "./models/model";
import {EventTypes, ObjectDef, ObjectManager, ObjectProxy, OMEventTypes} from "./models/om";
import {MenuAction} from "./actions";
import {GlobalState} from "./models/state";
import './common.css';

export function MainLayout(props: {
    leftVisible: boolean,
    rightVisible: boolean,
    left: JSX.Element,
    center: JSX.Element,
    right: JSX.Element,
}): JSX.Element {
    const mainStyle: CSSProperties = {}
    if (props.leftVisible && props.rightVisible) {
        mainStyle.gridTemplateColumns = '250px 3fr 250px'
    }
    if (props.leftVisible && !props.rightVisible) {
        mainStyle.gridTemplateColumns = '250px 3fr'
    }
    if (!props.leftVisible && props.rightVisible) {
        mainStyle.gridTemplateColumns = '3fr 250px'
    }
    return <div className={'main-view'} style={mainStyle}>
        {props.leftVisible && props.left}
        {props.center}
        {props.rightVisible && props.right}
    </div>
}

export enum SupportedIcons {
    LeftPanelCloseIcon = 'left_panel_close',
    LeftPanelOpenIcon = 'left_panel_open',
    RightPanelCloseIcon = 'right_panel_close',
    RightPanelOpenIcon = 'right_panel_open',
    Download='download',
    Undo='undo',
    Redo='redo',
    NewDocument='note_add',
    SaveDocument='save',
    UploadDocument='upload_file',
    Add='add',
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
            className="material-symbols-rounded">{props.selected ? props.selectedIcon : props.regularIcon}</span>
    </button>
}

export function IconButton(props: {
    onClick?: () => any,
    icon: SupportedIcons,
    children: ReactNode
    disabled?: boolean
}): JSX.Element {
    return <button onClick={props.onClick} className={'icon-button'} disabled={props.disabled}>
        <span
            className="material-symbols-rounded">{props.icon}</span>
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
    return <MenuButton
        onClick={() => props.action.perform(props.state)}>{props.action.title}</MenuButton>
}
