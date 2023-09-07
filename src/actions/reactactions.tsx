import {Bounds} from "josh_js_util"
import {DialogContext} from "josh_react_util"
import React, {JSX, useContext} from "react"

import {IconButton, ReactMenuAction} from "../common"
import {loadPNGJSON} from "../exporters/json"
import {SupportedIcons} from "../icons"
import {ImageAssetClass, ImageAssetDef} from "../models/assets"
import {SimpleImageClass, SimpleImageDef} from "../models/simpleimage"
import {GlobalState} from "../models/state"
import {ChooseImageDialog} from "./ChooseImageDialog"
import {ListFilesDialog} from "./ListFilesDialog"
import {LoadFileDialog} from "./LoadFileDialog"
import {NewDocumentDialog} from "./NewDocumentDialog"
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

function ImportImageButton(props: { state: GlobalState }) {
    const {state} = props
    const dm = useContext(DialogContext)
    const showNewDialog = () => dm.show(<ChooseImageDialog state={props.state} onComplete={async (htmlImage, fileName)=>{
        const asset = state.om.make(ImageAssetDef, {}) as ImageAssetClass
        await asset.setPropValue('value', htmlImage)
        await asset.setPropValue('name',fileName)
        state.getCurrentDocument().appendListProp('assets', asset)
        const ratio = htmlImage.height / htmlImage.width

        const image = state.om.make(SimpleImageDef, { name:'image'}) as SimpleImageClass
        image.setPropProxySource('image',asset)
        await image.setPropValue('bounds', new Bounds(0, 0, 1, 1 * ratio))
        state.getCurrentPage().appendListProp('children',image)
    }}/>)
    return <IconButton icon={SupportedIcons.Image} onClick={showNewDialog}>import image</IconButton>
}

export const AddNewSimpleimageAction: ReactMenuAction = {
    title: 'new simple image',
    icon: SupportedIcons.Image,
    // tags: ['add', 'shape', 'image'],
    makeComponent: (state) => <ImportImageButton state={state}/>
}
