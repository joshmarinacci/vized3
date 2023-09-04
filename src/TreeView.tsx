import './TreeView.css'

import {Point} from "josh_js_util"
import {PopupContext, toClass,} from "josh_react_util"
import React, {useContext} from "react"

import {
    AddNewCircleAction,
    AddNewColorAssetAction,
    AddNewGradientAssetAction,
    AddNewNumberAssetAction,
    AddNewPageAction,
    AddNewRectAction,
    DeleteSelection
} from "./actions"
import {MenuActionButton, MenuBox, useObservableChange, ValueThumbnail} from "./common"
import {ObjectDef, ObjectProxy, PageClass} from "./models/om"
import {GlobalState} from "./models/state"

function TreeShapeItem(props: { shape: ObjectProxy<ObjectDef>, state:GlobalState, selected:ObjectProxy<ObjectDef>[] }) {
    const shape = props.shape
    const classes = toClass({
        'tree-item':true,
        'selectable':true,
        selected:props.selected.find(s => s === props.shape),
    })
    const pm = useContext(PopupContext)
    return <div className={classes}
                onClick={()=> props.state.setSelectedObjects([props.shape])}
                onContextMenu={(e) => {
                    e.preventDefault()
                    const menu = <MenuBox>
                        <MenuActionButton key={'rect'} state={props.state} action={AddNewRectAction}/>
                        <MenuActionButton key='circle' state={props.state} action={AddNewCircleAction}/>
                        <MenuActionButton key='delete' state={props.state} action={DeleteSelection}/>
                    </MenuBox>
                    pm.show_at(menu, e.target, "left", new Point(0,0))
                }}
    >
        <b>{shape.hasPropNamed('name')?shape.getPropValue("name"):"no name"}</b>
    </div>
}

function TreePageItem(props: { page: PageClass, state:GlobalState, selected:ObjectProxy<ObjectDef>[] }) {
    const {page, state} = props
    const classes = toClass({
        'selectable':true,
        selected:page === state.getSelectedPage(),
    })
    const select_page = () => {
        state.setSelectedPage(page)
        state.setSelectedObjects([page])
    }
    return <div className={'tree-item'}>
        <b className={classes} onClick={select_page}>page {props.page.getPropValue('name')}</b>
        {
            page.getListProp('children').map((shape:ObjectProxy<ObjectDef>,i:number) =>
                <TreeShapeItem key={i} shape={shape}
                               state={state} selected={props.selected}/>)
        }
    </div>
}

function TreeAssetItem(props: { asset: ObjectProxy<ObjectDef>, state:GlobalState, selected:ObjectProxy<ObjectDef>[] }) {
    const {asset, state} = props
    const classes = toClass({
        'tree-item':true,
        'selectable':true,
        'tree-leaf':true,
        selected:state.getSelectedObjects().find(s => s === asset),
    })
    return <div className={classes} onClick={() => {
        state.setSelectedObjects([asset])
    }}>
        <label>{asset.getPropValue('name')}</label>
        <ValueThumbnail target={asset} prop={asset.getPropSchemaNamed('value')}/>
    </div>
}
export function TreeView(props: { state:GlobalState}) {
    useObservableChange(props.state,'selection')
    const selected = props.state.getSelectedObjects()
    const doc = props.state.getCurrentDocument()
    const pm = useContext(PopupContext)
    const select_document = () => {
        props.state.setSelectedObjects([doc])
    }
    return <div className={'panel left tree-view'}>
        <h3 onClick={select_document}>document: {props.state.getCurrentDocument().getPropValue('name')}</h3>
        <h3
            onContextMenu={(e) => {
                e.preventDefault()
                const menu = <MenuBox>
                    <MenuActionButton key={'add_page'} state={props.state} action={AddNewPageAction}/>
                </MenuBox>
                pm.show_at(menu, e.target, "left", new Point(0,0))
            }}
        >pages</h3>
        {doc.getListProp('pages').map((pg,i) => {
            return <TreePageItem key={i} page={pg} state={props.state} selected={selected}/>
        })}
        <h3
            onContextMenu={(e) => {
                e.preventDefault()
                const menu = <MenuBox>
                    <MenuActionButton key={'add_num'} state={props.state} action={AddNewNumberAssetAction}/>
                    <MenuActionButton key={'add_color'} state={props.state} action={AddNewColorAssetAction}/>
                    <MenuActionButton key={'add_gradient'} state={props.state} action={AddNewGradientAssetAction}/>
                </MenuBox>
                pm.show_at(menu, e.target, "left", new Point(0,0))
            }}
        >assets</h3>

        {doc.getListProp('assets').map((asset,i) => {
            return <TreeAssetItem key={i} asset={asset} state={props.state} selected={selected}/>
        })}
    </div>
}
