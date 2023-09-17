import './TreeView.css'

import {Point} from "josh_js_util"
import {DialogContext, PopupContext, toClass,} from "josh_react_util"
import React, {useContext} from "react"

import {
    AddNewCircleAction,
    AddNewColorAssetAction,
    AddNewGradientAssetAction,
    AddNewImageAssetAction, AddNewNGonAction,
    AddNewNumberAssetAction,
    AddNewPageAction, AddNewPathShapeAction,
    AddNewRectAction,
    DeleteSelection,
    MenuAction
} from "../actions/actions"
import {ChooseImageDialog} from "../actions/ChooseImageDialog"
import {
    DropdownMenuButton,
    Icon,
    MenuActionButton,
    MenuBox,
    useObservableChange,
    ValueThumbnail
} from "../common"
import {SupportedIcons} from "../icons"
import {AssetBase, BaseAssetType, ImageAssetClass} from "../models/assets"
import {useWatchAllProps, useWatchProp} from "../models/base"
import {BaseShape, BaseShapeType} from "../models/defs"
import {DocClass} from "../models/doc"
import {PageClass} from "../models/page"
import {GlobalState} from "../models/state"

function TreeShapeItem<Type extends BaseShapeType>(props: { shape: BaseShape<Type>, state:GlobalState}) {
    const {shape, state} = props
    const classes = toClass({
        'tree-item':true,
        'selectable':true,
        'tree-leaf':true,
        selected:state.isSelectedObject(shape),
    })
    const pm = useContext(PopupContext)
    return <div className={classes}
                onClick={()=> state.setSelectedObjects([shape])}
                onContextMenu={(e) => {
                    e.preventDefault()
                    const menu = <MenuBox>
                        <MenuActionButton key={'rect'} state={state} action={AddNewRectAction}/>
                        <MenuActionButton key='circle' state={state} action={AddNewCircleAction}/>
                        <MenuActionButton key='delete' state={state} action={DeleteSelection}/>
                    </MenuBox>
                    pm.show_at(menu, e.target, "left", new Point(0,0))
                }}
    >
        <Icon icon={SupportedIcons.Shape}/>
        <b>sss{shape.getPropValue('name')}</b>
    </div>
}

function TreePageItem(props: { page: PageClass, state:GlobalState}) {
    const {page, state} = props
    const classes = toClass({
        'selectable':true,
        selected:page === state.getSelectedPage(),
    })
    useWatchAllProps(page)
    const select_page = () => {
        state.setSelectedPage(page)
        state.setSelectedObjects([page])
    }
    const actions = [
        AddNewRectAction,
        AddNewCircleAction,
        AddNewPathShapeAction,
        AddNewNGonAction,
        DeleteSelection,
    ]
    const pm = useContext(PopupContext)
    return <div className={'tree-item'}
    onContextMenu={(e) => {
        e.preventDefault()
        const menu = <MenuBox>{actions.map((m, i) => {
            return <MenuActionButton key={i} action={m} state={state}/>
        })}</MenuBox>
        pm.show_at(menu, e.target, "left", new Point(0, 0))
    }}
    >
        <Icon icon={SupportedIcons.Page}/>
        <b className={classes} onClick={select_page}>{page.getPropValue('name')}</b>
        {
            page.getShapeChildren().map((shape,i:number) =>
                <TreeShapeItem key={i} shape={shape} state={state}/>)
        }
    </div>
}

function TreeAssetItem<Type extends BaseAssetType>(props: { asset: AssetBase<Type>, state:GlobalState}) {
    const {asset, state} = props
    const schema = asset.getPropDef('value')
    const pm = useContext(PopupContext)
    const actions = [
        DeleteSelection
    ]
    const classes = toClass({
        'tree-item':true,
        'selectable':true,
        'tree-leaf':true,
        selected:state.isSelectedObject(asset),
    })
    let icon:SupportedIcons = SupportedIcons.Star
    if(schema.base === 'number') {
        icon = SupportedIcons.Number
    }
    if(schema.custom === "css-color") {
        icon = SupportedIcons.Color
    }
    if(schema.custom === "css-gradient") {
        icon = SupportedIcons.Gradient
    }
    if(schema.custom === "image-asset") {
        icon = SupportedIcons.Image
    }
    return <div className={classes} onClick={() => state.setSelectedObjects([asset])}
                onContextMenu={(e) => {
                    e.preventDefault()
                    const menu = <MenuBox>{actions.map((m, i) => {
                        return <MenuActionButton key={i} action={m} state={state}/>
                    })}</MenuBox>
                    pm.show_at(menu, e.target, "left", new Point(0, 0))
                }}
    >
        <Icon icon={icon}/>
        <label>{asset.getPropValue('name')}</label>
        <ValueThumbnail target={asset} name={'value'} prop={asset.getPropDef('value')}/>
    </div>
}

function TreeDocItem(props: {item:DocClass, text:string, state:GlobalState, actions:MenuAction[], icon:SupportedIcons}) {
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
    ><Icon icon={SupportedIcons.Document}/>{text}</div>
}

export function TreeView(props: { state:GlobalState}) {
    const {state} = props
    useObservableChange(state,'selection')
    const doc = state.getCurrentDocument()
    useWatchProp(doc,'pages')
    const add_assets:MenuAction[] = [
        AddNewNumberAssetAction,
        AddNewColorAssetAction,
        AddNewGradientAssetAction,
        AddNewImageAssetAction,
    ]
    const add_page:MenuAction[] = [
        AddNewPageAction
    ]
    const dm = useContext(DialogContext)
    const open_image_dialog = () => {
        dm.show(<ChooseImageDialog state={state} onComplete={async (img, fileName) => {
            const asset = new ImageAssetClass()
            asset.setPropValue('value', img)
            asset.setPropValue('name',fileName)
            state.getCurrentDocument().getPropValue('assets').push(asset)
            state.getCurrentDocument()._fireAll()
        }}/>)
    }

    return <div className={'panel left tree-view'}>
        <TreeDocItem
            item={doc}
            state={state}
            icon={SupportedIcons.SaveDocument}
            text={doc.getPropValue('name')}
            actions={[
                AddNewPageAction,
            ]}
        />
        <header>
            Pages
            <DropdownMenuButton icon={SupportedIcons.Add} items={add_page} state={state}/>
        </header>
        {doc.getPropValue('pages').map((pg,i) => {
            return <TreePageItem key={i} page={pg} state={props.state}/>
        })}
        <header>
            Assets
            <DropdownMenuButton icon={SupportedIcons.Add} items={add_assets} state={state}/>
            <button onClick={open_image_dialog}>+I</button>
        </header>
        {doc.getPropValue('assets').map((asset,i) => {
            return <TreeAssetItem key={i} asset={asset} state={props.state}/>
        })}
    </div>
}
