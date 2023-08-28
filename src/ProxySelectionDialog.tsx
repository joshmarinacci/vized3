import {GlobalState} from "./models/state";
import React, {useContext, useState} from "react";
import {DialogContext, Spacer} from "josh_react_util";
import {NumberAssetClass, ObjectProxy, PropSchema} from "./models/om";

function ProxyAssetView(props: { asset: any, source:ObjectProxy<any>, onChange:(value:ObjectProxy<any>)=>void }) {
    const {source} = props
    let asset = props.asset as NumberAssetClass
    return <li>
        <label>
            asset proxy
            <input type='radio' value={'proxy'} checked={source.getUUID() === asset.getUUID()}
                   onChange={() => props.onChange(asset)    }
            />
            {asset.getPropValue('name')}
            <b>{asset.getPropValue('value')}</b>
        </label>
    </li>
}

export function ProxySelectionDialog(props: { state: GlobalState, prop:PropSchema, target:ObjectProxy<any> }) {
    const {prop, state, target} = props
    const dm = useContext(DialogContext)
    const [source, setSource] = useState(target)
    const assets = props.state.getCurrentDocument().getListProp('assets')
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
            <p>The property <b>radius</b> is set by</p>
            <p>
                <label>
                    <input type='radio' value={source.getUUID()} checked={source === target}
                           onChange={() => setSource(target)}
                    /> plain value
                </label>
            </p>
            <ul>
                {
                    assets.map((asset, i) => {
                        return <ProxyAssetView key={asset.uuid} asset={asset} source={source} onChange={setSource}/>
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
