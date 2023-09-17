import "./ProxySelectionDialog.css"

import {DialogContext, Spacer} from "josh_react_util"
import React, {useContext, useState} from "react"

import {ValueThumbnail} from "../common"
import {GlobalState} from "../models/state"
function ProxyAssetView(props: { asset: OO, source:OO, onChange:(value:OO)=>void }) {
    const {source, asset} = props
    return <li>
        <label>
            <input type='radio' value={'proxy'} checked={source.getUUID() === asset.getUUID()}
                   onChange={() => props.onChange(asset)    }
            />
            <span>{asset.getPropValue('name')}</span>
        </label>
        <ValueThumbnail target={asset} prop={asset.getPropSchemaNamed('value')}/>
    </li>
}
export function ProxySelectionDialog(props: { state: GlobalState, prop:PropDef, target:OO }) {
    const {prop, state, target} = props
    const dm = useContext(DialogContext)
    const [source, setSource] = useState(target)
    const assets = (state.getCurrentDocument().getPropValue('assets'))
        .filter(a => {
            if (prop.custom === 'css-color') {
                if(a.getPropSchemaNamed('value').custom === 'css-color') return true
                if(a.getPropSchemaNamed('value').custom === 'css-gradient') return true
                return false
            }
            if (prop.custom === 'image-asset') {
                if(a.getPropSchemaNamed('value').custom === "image-asset") return true
                return false
            }
            return (a.getPropSchemaNamed('value').base === prop.base)
        })

    const cancel = () => dm.hide()
    const choose = () => {
        if(source.getUUID() === target.getUUID()) {
            props.target.removePropProxySource(props.prop.name)
        } else {
            props.target.setPropProxySource(props.prop.name, source)
        }
        dm.hide()
    }
    return <div className={'dialog'}>
        <header>choose proxy value</header>
        <section>
            <p>The property <b>{prop.name}</b> is set by</p>
            <p>
                <label>
                    <input type='radio' value={source.getUUID()} checked={source === target}
                           onChange={() => setSource(target)}
                    /> plain value
                </label>
            </p>
            <ul className={'assets-list'}>
                {
                    assets.map((asset) => {
                        return <ProxyAssetView key={asset.getUUID()} asset={asset} source={source} onChange={setSource}/>
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
