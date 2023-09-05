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
    DeleteSelection,
    MenuAction
} from "./actions"
import {
    DropdownMenuButton,
    MenuActionButton,
    MenuBox,
    useObservableChange,
    ValueThumbnail
} from "./common"
import {SupportedIcons} from "./icons"
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

function TreeLeafItem(props: {item:ObjectProxy<ObjectDef>, text:string, state:GlobalState, actions:MenuAction[]}) {
    const {item, text, state, actions}= props
    const pm = useContext(PopupContext)
    return <div
        className={toClass({
            selected:state.isSelectedObject(item),
            'tree-item':true,
        })}
        onClick={() => state.setSelectedObjects([item])}
        onContextMenu={(e) => {
            e.preventDefault()
            const menu = <MenuBox>{actions.map((m, i) => {
                return <MenuActionButton key={i} action={m} state={state}/>
            })}</MenuBox>
            pm.show_at(menu, e.target, "left", new Point(0, 0))
        }}
    >{text}</div>
}

export function TreeView(props: { state:GlobalState}) {
    const {state} = props
    useObservableChange(state,'selection')
    const selected = state.getSelectedObjects()
    const doc = state.getCurrentDocument()
    const add_assets:MenuAction[] = [
        AddNewNumberAssetAction,
        AddNewColorAssetAction,
        AddNewGradientAssetAction
    ]
    const add_page:MenuAction[] = [
        AddNewPageAction
    ]

    return <div className={'panel left tree-view'}>
        <TreeLeafItem
            item={doc} state={state}
            text={doc.getPropValue('name')}
            actions={[
                AddNewPageAction,
                AddNewNumberAssetAction,
                AddNewColorAssetAction,
                AddNewGradientAssetAction,
            ]}
        />
        <header>
            Pages
            <DropdownMenuButton icon={SupportedIcons.Add} items={add_page} state={state}/>
        </header>
        {doc.getListProp('pages').map((pg,i) => {
            return <TreePageItem key={i} page={pg} state={props.state} selected={selected}/>
        })}
        <header>
            Assets
            <DropdownMenuButton icon={SupportedIcons.Add} items={add_assets} state={state}/>
        </header>
        {doc.getListProp('assets').map((asset,i) => {
            return <TreeAssetItem key={i} asset={asset} state={props.state} selected={selected}/>
        })}
    </div>
}
