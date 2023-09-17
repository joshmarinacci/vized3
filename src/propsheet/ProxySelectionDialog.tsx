import "./ProxySelectionDialog.css"

import {DialogContext, Spacer} from "josh_react_util"
import React, {useContext, useState} from "react"

import {ValueThumbnail} from "../common"
import {AssetBase, BaseAssetType} from "../models/assets"
import {PropDef, PropsBase} from "../models/base"
import {GlobalState} from "../models/state"

function ProxyAssetView<Type extends BaseAssetType>(props: {
    asset: AssetBase<Type>,
    source:PropsBase<any>,
    onChange:(value:PropsBase<any>)=>void
}) {
    const {source, asset} = props
    return <li>
        <label>
            <input type='radio' value={'proxy'} checked={source.getUUID() === asset.getUUID()}
                   onChange={() => props.onChange(asset)    }
            />
            <span>{asset.getPropValue('name')}</span>
        </label>
        <ValueThumbnail target={asset} prop={asset.getPropDef('value')} name={'value'}/>
    </li>
}
export function ProxySelectionDialog<Type>(props: { name: keyof Type, state: GlobalState, prop:PropDef<Type[keyof Type]>, target:PropsBase<Type> }) {
    const {name, prop, state, target} = props
    const dm = useContext(DialogContext)
    const [source, setSource] = useState(target)
    const assets = (state.getCurrentDocument().getPropValue('assets'))
        .filter(a => {
            if (prop.custom === 'css-color') {
                if(a.getPropDef('value').custom === 'css-color') return true
                if(a.getPropDef('value').custom === 'css-gradient') return true
                return false
            }
            if (prop.custom === 'image-asset') {
                if(a.getPropDef('value').custom === "image-asset") return true
                return false
            }
            return (a.getPropDef('value').base === prop.base)
        })

    const cancel = () => dm.hide()
    const choose = () => {
        if(source.getUUID() === target.getUUID()) {
            props.target.removePropProxySource(name)
        } else {
            props.target.setPropProxySource(name, source)
        }
        dm.hide()
    }
    return <div className={'dialog'}>
        <header>choose proxy value</header>
        <section>
            <p>The property <b>{name.toString()}</b> is set by</p>
            <p>
                <label>
                    <input type='radio' value={source.getUUID()}
                           checked={source === target}
                           onChange={() => setSource(target)}
                    /> plain value
                </label>
            </p>
            <ul className={'assets-list'}>
                {
                    assets.map((asset) => {
                        return <ProxyAssetView key={asset.getUUID()}
                                               asset={asset}
                                               source={source}
                                               onChange={setSource}/>
                    })
                }

            </ul>
        </section>
        <footer>
            <Spacer/>
            <button className={'default'} onClick={() => cancel()}>Cancel</button>
            <button className={'primary'} onClick={() => choose()}>Save</button>
        </footer>
    </div>
}
