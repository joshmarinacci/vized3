import React, {CSSProperties, JSX} from "react";
import {toClass} from "josh_react_util";

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
