import React, {CSSProperties, JSX} from "react";

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
