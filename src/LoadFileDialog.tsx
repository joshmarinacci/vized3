import './dialog.css'

import {DialogContext, Spacer} from "josh_react_util"
import React, {ChangeEvent, useContext, useRef, useState} from "react"

import {loadPNGJSON} from "./exporters/json"
import {GlobalState} from "./models/state"

function isValidJSONPNGFile(file: File) {
    if(!file) return false
    if(!file.name.toLowerCase().endsWith('.png')) return false
    if (!file.name.toLowerCase().includes('.json')) return false
    return true
}

export function LoadFileDialog(props: { state: GlobalState, onComplete:(file:File)=>Promise<void> }) {
    const [canLoad, setCanLoad] = useState(false)
    const dm = useContext(DialogContext)
    const input = useRef<HTMLInputElement>(null)
    const load = async () => {
        console.log("loading")
        if (input && input.current && input.current.files) {
            const file = input.current.files[0]
            await props.onComplete(file)
        }
        dm.hide()
    }
    const cancel = () => {
        dm.hide()
    }
    const fileChanged = (e: ChangeEvent<HTMLInputElement>) => {
        // console.log("file changed",e.target.files)
        if (e.target.files && e.target.files.length === 1) {
            const file = e.target.files[0]
            setCanLoad(isValidJSONPNGFile(file))
        }
    }
    return <div className={'dialog'}>
        <header>Choose JSON.PNG file to load</header>
        <section>
            <input ref={input}
                   type={'file'}
                   onChange={e => fileChanged(e)}/>
        </section>
        <footer>
            <Spacer/>
            <button className={'default'} onClick={() => cancel()}>Cancel</button>
            <button disabled={!canLoad} className={'primary'} onClick={() => load()}>Load</button>
        </footer>
    </div>
}
