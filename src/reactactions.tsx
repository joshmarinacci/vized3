import {Size} from "josh_js_util"
import {DialogContext, Spacer} from "josh_react_util"
import React, {ChangeEvent, JSX, useContext, useState} from "react"

import {IconButton, ReactMenuAction} from "./common"
import {loadPNGJSON} from "./exporters/json"
import {SupportedIcons} from "./icons"
import {ListFilesDialog} from "./ListFilesDialog"
import {LoadFileDialog} from "./LoadFileDialog"
import {DocClass, DocDef, PageDef} from "./models/om"
import {GlobalState} from "./models/state"
import {lookup_name, Unit} from "./models/unit"
import {SettingsDialog} from "./SettingsDialog"

function UploadButton(props: { state: GlobalState }) {
    const {state} = props
    const dm = useContext(DialogContext)
    const showLoadDialog = () => {
        const onComplete = async (file: File) => {
            console.log("file is", file)
            const doc_proxy = await loadPNGJSON(state, file)
            console.log("loaded doc is", doc_proxy)
            state.swapDoc(doc_proxy)
        }
        dm.show(<LoadFileDialog state={state} onComplete={onComplete}/>)
    }
    return <IconButton icon={SupportedIcons.UploadDocument} onClick={showLoadDialog}>Import doc.JSON.PNG</IconButton>
}

export const UploadAction: ReactMenuAction = {
    title: "Import Doc",
    makeComponent: (state: GlobalState) => {
        return <UploadButton state={state}/>
    }
}

function LoadDocButton(props: { state: GlobalState }): JSX.Element {
    const dm = useContext(DialogContext)
    const showOpenDialog = () => dm.show(<ListFilesDialog state={props.state}/>)
    return <IconButton icon={SupportedIcons.OpenDocument} onClick={showOpenDialog}>Open</IconButton>
}

export const LoadLocalStorageAction: ReactMenuAction = {
    title: "Open Doc",
    makeComponent: (state: GlobalState) => <LoadDocButton state={state}/>
}

function OpenSettingsButton(props: { state: GlobalState }): JSX.Element {
    const dm = useContext(DialogContext)
    return <IconButton icon={SupportedIcons.Settings}
                       onClick={() => dm.show(<SettingsDialog state={props.state}/>)}/>
}

export const OpenSettingsAction: ReactMenuAction = {
    title: 'Open Settings',
    makeComponent: (state: GlobalState) => <OpenSettingsButton state={state}/>
}

function NewDocumentDialog(props: { state: GlobalState }) {
    const {state} = props
    const [value, setValue] = useState<Unit>(Unit.Centimeter)
    const values = Object.keys(Unit)
    const dm = useContext(DialogContext)

    const cancel = () => dm.hide()
    const create = () => {
        let size = new Size(8.5,11)
        if(value === Unit.Pixel) {
            size = new Size(640,480)
        }
        const doc = state.om.make(DocDef, {unit:value}) as DocClass
        const page = state.om.make(PageDef, {size})
        doc.appendListProp('pages', page)
        state.swapDoc(doc)
        dm.hide()
    }
    const update = (e:ChangeEvent<HTMLSelectElement>) => {
        setValue(lookup_name(e.target.value))
    }
    return <div className={'dialog'}>
        <header>Create New Document</header>
        <section>
            <select value={value} onChange={update}>
                {values.map(val => {
                    return <option key={val} value={val}>{val}</option>
                })}
            </select>

        </section>
        <footer>
            <Spacer/>
            <button onClick={cancel}>cancel</button>
            <button className={'primary'} onClick={create}>create</button>
        </footer>
    </div>
}

function NewDocumentButton(props:{state:GlobalState}):JSX.Element {
    const dm = useContext(DialogContext)
    const showNewDialog = () => dm.show(<NewDocumentDialog state={props.state}/>)
    return <IconButton icon={SupportedIcons.NewDocument} onClick={showNewDialog}>New Document</IconButton>
}
export const NewDocumentAction: ReactMenuAction = {
    title: 'New Document',
    icon: SupportedIcons.NewDocument,
    // tags: ['new', 'document'],
    // description: 'create a new empty document',
    makeComponent: (state) => <NewDocumentButton state={state}/>,

}
