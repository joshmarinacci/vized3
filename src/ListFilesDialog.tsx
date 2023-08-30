import {DialogContext, Spacer} from "josh_react_util"
import React, {useContext, useEffect, useState} from "react"

import {listLocalDocs, loadLocalDoc} from "./exporters/local"
import {JSONDocReference} from "./models/om"
import {GlobalState} from "./models/state"

export function ListFilesDialog(props: { state: GlobalState }) {
    const {state} = props
    const [canLoad, setCanLoad] = useState(false)
    const dm = useContext(DialogContext)
    const [files, setFiles] = useState<JSONDocReference[]>([])
    console.log("files is", files)
    useEffect(() => {
        listLocalDocs(props.state).then(files => setFiles(files))
    }, [state])
    const cancel = () => {
        dm.hide()
    }
    const load = (file: JSONDocReference) => {
        console.log("loading")
        loadLocalDoc(state, file.uuid).then(doc => {
            console.log("the new doc is", doc)
            state.swapDoc(doc)
            dm.hide()
        })
    }
    return <div className={'dialog'}>
        <header>Open Document</header>
        <section>
            {files.map(file => {
                return <div key={file.uuid}>{file.name} <i>{file.uuid}</i>
                    <button
                        onClick={() => {
                            load(file)
                        }}
                    >load
                    </button>
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
