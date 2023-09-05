import './App.css'

import {
    DialogContainer,
    DialogContext,
    DialogContextImpl,
    HBox,
    PopupContainer,
    PopupContext,
    PopupContextImpl,
    Spacer,
} from "josh_react_util"
import React, {useContext, useRef, useState} from 'react'

import {
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewPathShapeAction,
    AddNewRectAction, AddNewSimpletextAction,
    DeleteSelection,
    DownloadPDFAction,
    DownloadPNGAction,
    DownloadSVGAction,
    ExportCanvasJSAction,
    NewDocumentAction,
    RedoAction,
    SaveLocalStorageAction,
    UndoAction
} from "./actions"
import {ActionSearchBox} from "./actionsearch"
import {
    DropdownMenuButton,
    IconButton,
    MainLayout,
    MenuActionButton,
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

async function handle_shortcuts(e: React.KeyboardEvent, state: GlobalState) {
    if (e.key === 'Backspace') return await DeleteSelection.perform(state)
    if (e.key === 'z' && e.metaKey) {
        if(e.shiftKey) {
            return await RedoAction.perform(state)
        } else {
            return await UndoAction.perform(state)
        }
    }
}

function Main() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    useObjectManagerChange(state.om, HistoryChanged)
    useObservableChange(state,'selection')
    const dm = useContext(DialogContext)
    const showLoadDialog = () => dm.show(<LoadFileDialog state={state}/>)
    const showOpenDialog = () => dm.show(<ListFilesDialog state={state}/>)

    const keyref = useRef(null)

    return (<div
        ref={keyref}
        className={'fill-page'}
                 tabIndex={0}
                 onKeyDown={async (e) => {
                     if (e.target === keyref.current) {
                         await handle_shortcuts(e, state)
                     }
                 }}
        >
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
                AddNewSimpletextAction,
            ]}/>
            <IconButton icon={SupportedIcons.UploadDocument} onClick={async () => showLoadDialog()}>load</IconButton>
            <MenuActionButton action={UndoAction} state={state} disabled={!state.om.canUndo()}/>
            <MenuActionButton action={RedoAction} state={state} disabled={!state.om.canRedo()}/>
            <IconButton icon={SupportedIcons.SaveDocument} onClick={async () => showOpenDialog()}>Open List</IconButton>
            <Spacer/>
            <ActionSearchBox state={state}/>
            <Spacer/>
            <IconButton icon={SupportedIcons.Settings} onClick={()=>dm.show(<SettingsDialog state={state}/>)}/>
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
    </div>)
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
