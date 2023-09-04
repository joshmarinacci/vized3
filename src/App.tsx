import './App.css'

import {
    DialogContainer,
    DialogContext,
    DialogContextImpl,
    FillPage,
    HBox,
    PopupContainer,
    PopupContext,
    PopupContextImpl,
    Spacer,
} from "josh_react_util"
import React, {useContext, useState} from 'react'

import {
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewPathShapeAction,
    AddNewRectAction,
    DownloadPDFAction,
    DownloadPNGAction,
    DownloadSVGAction,
    ExportCanvasJSAction,
    NewDocumentAction,
    SaveLocalStorageAction
} from "./actions"
import {ActionSearchBox} from "./actionsearch"
import {
    DropdownMenuButton,
    IconButton,
    MainLayout,
    ToggleIconButton,
    useObjectManagerChange,
    useObservableChange
} from "./common"
import {PageView,} from "./editing/PageView"
import {SupportedIcons} from "./icons"
import {ListFilesDialog} from "./ListFilesDialog"
import {LoadFileDialog} from "./LoadFileDialog"
import {HistoryChanged} from "./models/om"
import {GlobalState} from "./models/state"
import {PropSheet} from "./PropSheet"
import {SettingsDialog} from "./SettingsDialog"
import {TreeView} from "./TreeView"

const state = new GlobalState()

// const UploadDocumentAction:MenuAction = {
//     title:"Upload Document",
//     icon:SupportedIcons.UploadDocument,
//     tags:['upload','document'],
//     description: "upload document from disk in JSON or PNG JSON form",
//     perform: async (state) => {
//         const dialog = <LoadFileDialog state={state}/>
//         console.log("made dialog",dialog)
//     }
// }

function Main() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    useObjectManagerChange(state.om, HistoryChanged)
    useObservableChange(state,'selection')
    const dm = useContext(DialogContext)
    const showLoadDialog = () => dm.show(<LoadFileDialog state={state}/>)
    const showOpenDialog = () => dm.show(<ListFilesDialog state={state}/>)


    return (<FillPage>
        <HBox className={'toolbar'}>
            <DropdownMenuButton title={'File'} state={state} items={[
                NewDocumentAction,
                // UploadDocumentAction,
                // SavePNGJSONAction,
                SaveLocalStorageAction,
                DownloadPNGAction,
                DownloadSVGAction,
                DownloadPDFAction,
                ExportCanvasJSAction
            ]}/>
            <DropdownMenuButton title={'Add'} state={state} items={[
                AddNewRectAction,
                AddNewCircleAction,
                AddNewPathShapeAction,
                AddNewNGonAction,
            ]}/>
            <IconButton icon={SupportedIcons.UploadDocument} onClick={async () => showLoadDialog()}>load</IconButton>
            <IconButton icon={SupportedIcons.Undo} disabled={!state.om.canUndo()} onClick={() => state.om.performUndo()}>Undo</IconButton>
            <IconButton icon={SupportedIcons.Redo} disabled={!state.om.canRedo()} onClick={() => state.om.performRedo()}>Redo</IconButton>
            <IconButton icon={SupportedIcons.SaveDocument} onClick={async () => showOpenDialog()}>Open List</IconButton>
            <Spacer/>
            <ActionSearchBox state={state}/>
            <Spacer/>
            <IconButton icon={SupportedIcons.Settings} onClick={()=>dm.show(<SettingsDialog state={state}/>)}>settings</IconButton>
        </HBox>
        <MainLayout
            rightVisible={rightVisible}
            leftVisible={leftVisible}
            left={<TreeView state={state}/>}
            center={<PageView doc={state.getCurrentDocument()} page={state.getCurrentPage()} state={state}/>}
            right={<PropSheet state={state}/>}
        />
        <HBox>
            <ToggleIconButton
                regularIcon={SupportedIcons.LeftPanelCloseIcon}
                selectedIcon={SupportedIcons.LeftPanelOpenIcon}
                onClick={() => setLeftVisible(!leftVisible)}
                selected={!leftVisible}
            />
            <Spacer/>
            <ToggleIconButton
                regularIcon={SupportedIcons.RightPanelCloseIcon}
                selectedIcon={SupportedIcons.RightPanelOpenIcon}
                onClick={() => setRightVisible(!rightVisible)}
                selected={!rightVisible}
            />
        </HBox>
    </FillPage>)
}

function App() {
    return (
        <DialogContext.Provider value={new DialogContextImpl()}>
            <PopupContext.Provider value={new PopupContextImpl()}>
                <Main/>
                <PopupContainer/>
                <DialogContainer/>
            </PopupContext.Provider>
        </DialogContext.Provider>
    )
}
export default App
