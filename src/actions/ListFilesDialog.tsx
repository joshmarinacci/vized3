import {DialogContext, Spacer} from "josh_react_util"
import React, {useContext, useEffect, useState} from "react"

import {JSONDocReference} from "../exporters/json"
import {listLocalDocs, loadLocalDoc} from "../exporters/local"
import {GlobalState} from "../models/state"

export function ListFilesDialog(props: { state: GlobalState }) {
    const {state} = props
    const dm = useContext(DialogContext)
    const [files, setFiles] = useState<JSONDocReference[]>([])
    useEffect(() => {
        listLocalDocs(props.state).then(files => setFiles(files))
    }, [state])
    const cancel = () => dm.hide()
    const load = (file: JSONDocReference) => {
        loadLocalDoc(state, file.uuid).then(doc => {
            state.swapDoc(doc)
            dm.hide()
        })
    }
    return <div className={'dialog'}>
        <header>Open Document</header>
        <section className={'scroll'}>
            {files.map(file => {
                return <div key={file.uuid}>
                    <b>{file.name}</b>
                    <button  onClick={() => load(file)}>load</button>
                    <img src={file.thumbnail}/>
                </div>
            })}
        </section>
        <footer>
            <Spacer/>
            <button className={'default'} onClick={() => cancel()}>Cancel</button>
            {/*<button disabled={!canLoad} className={'primary'} onClick={() => load()}>Load</button>*/}
        </footer>
    </div>
}
