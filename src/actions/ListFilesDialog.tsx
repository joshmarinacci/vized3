import {DialogContext, Spacer} from "josh_react_util"
import React, {useContext, useEffect, useState} from "react"

import {ListView} from "../common"
import {JSONDocReference} from "../exporters/json"
import {deleteLocalDoc, listLocalDocs, loadLocalDoc} from "../exporters/local"
import {GlobalState} from "../models/state"

export function ListFilesDialog(props: { state: GlobalState }) {
    const {state} = props
    const dm = useContext(DialogContext)
    const [files, setFiles] = useState<JSONDocReference[]>([])
    useEffect(() => {
        listLocalDocs(props.state).then(files => setFiles(files))
    }, [state])
    const cancel = () => dm.hide()
    const load = async (file: JSONDocReference) => {
        const doc = await loadLocalDoc(state, file.uuid)
        state.swapDoc(doc)
        dm.hide()
    }
    const deleteFile = async (file: JSONDocReference) => {
        await deleteLocalDoc(state, file.uuid)
        const files = await listLocalDocs(state)
        setFiles(files)
    }
    return <div className={'dialog'}>
        <header>Open Document</header>
        <section className={'scroll'}>
            <ListView  key={'listview'} data={files} renderer={(file)=>{
                return <>
                    <b>{file.name}</b>
                    <button  onClick={() => load(file)}>load</button>
                    <button  onClick={() => deleteFile(file)}>delete</button>
                    <img src={file.thumbnail}/>
                </>
            }}/>
        </section>
        <footer>
            <Spacer/>
            <button className={'default'} onClick={() => cancel()}>Cancel</button>
            {/*<button disabled={!canLoad} className={'primary'} onClick={() => load()}>Load</button>*/}
        </footer>
    </div>
}
