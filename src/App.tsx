import './App.css'

import {DialogContainer, DialogContext, DialogContextImpl, HBox, Spacer,} from "josh_react_util"
import React, {useRef, useState} from 'react'

import {
    ActionRegistry,
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewPathShapeAction,
    AddNewRectAction,
    AddNewSimpletextAction,
    DeleteSelection,
    DownloadPDFAction,
    DownloadPNGAction,
    DownloadSVGAction,
    ExportCanvasJSAction,
    LowerShapeAction,
    OpenSearchMenu,
    RaiseShapeAction,
    RedoAction,
    SaveLocalStorageAction,
    SavePNGJSONAction,
    SelectAllInPage,
    SimpleMenuAction,
    UndoAction,
    ZoomInAction,
    ZoomOutAction
} from "./actions/actions"
import {ActionSearchBox} from "./actions/actionsearch"
import {
    AddNewSimpleimageAction,
    LoadLocalStorageAction,
    NewDocumentAction,
    OpenSettingsAction,
    UploadAction
} from "./actions/reactactions"
import {
    ActionRegistryContext,
    DropdownMenuButton,
    MainLayout,
    ToggleIconButton,
    ToolbarActionButton,
    useObservableChange
} from "./common"
import {PageView} from "./editing/PageView"
import {SupportedIcons} from "./icons"
import {GlobalState} from "./models/state"
import {PopupContainer, PopupContext, PopupContextImpl} from "./propsheet/popup"
import {PropSheet} from "./propsheet/PropSheet"
import {TreeView} from "./treeview/TreeView"

const state = new GlobalState()

const AR = new ActionRegistry()
AR.register([
    DeleteSelection,
    RedoAction,
    UndoAction,
    OpenSearchMenu,
    SelectAllInPage,
    OpenSettingsAction,
    ZoomInAction,
    ZoomOutAction,

    NewDocumentAction,
    LoadLocalStorageAction,
    SaveLocalStorageAction,
    UploadAction,
    SavePNGJSONAction,
    DownloadPNGAction,
    DownloadSVGAction,
    DownloadPDFAction,
    ExportCanvasJSAction,

    AddNewRectAction,
    AddNewCircleAction,
    AddNewPathShapeAction,
    AddNewNGonAction,
    AddNewSimpletextAction,
    AddNewSimpleimageAction,

    RaiseShapeAction,
    LowerShapeAction,
])

function Main() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    // useObjectManagerChange(state.om, HistoryChanged)
    useObservableChange(state,'selection')

    const keyref = useRef(null)
    let pageView = <div>No page selected</div>
    const page = state.getSelectedPage()
    if(page !== null) {
        pageView =  <PageView doc={state.getCurrentDocument()} page={page} state={state}/>
    }

    return (<div
        ref={keyref}
        className={'fill-page'}
                 tabIndex={0}
                 onKeyDown={async (e) => {
                     console.log(e.key, e.code, e.metaKey)
                     if (e.target === keyref.current) {
                         const action = AR.match(e)
                         if(action) {
                             console.log("matched the action",action)
                             e.preventDefault()
                             e.stopPropagation()
                             if (action.type == 'simple') {
                                 await (action as SimpleMenuAction).perform(state)
                             } else {
                                 console.log("other type of keyboard action ")
                             }
                         }
                     }
                 }}
        >
        <HBox className={'toolbar'}>
            <DropdownMenuButton title={'File'} state={state} items={[
                NewDocumentAction,
                LoadLocalStorageAction,
                SaveLocalStorageAction,
                UploadAction,
                SavePNGJSONAction,
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
                AddNewSimpleimageAction,
            ]}/>
            <ToolbarActionButton action={UndoAction} state={state} disabled={!state.om.canUndo()}/>
            <ToolbarActionButton action={RedoAction} state={state} disabled={!state.om.canRedo()}/>
            <Spacer/>
            <ActionSearchBox state={state}/>
            <Spacer/>
            <ToolbarActionButton action={OpenSettingsAction} state={state}/>
        </HBox>
        <MainLayout
            rightVisible={rightVisible}
            leftVisible={leftVisible}
            left={<TreeView state={state}/>}
            center={pageView}
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
                <ActionRegistryContext.Provider value={AR}>
                    <Main/>
                    <PopupContainer/>
                    <DialogContainer/>
                </ActionRegistryContext.Provider>
            </PopupContext.Provider>
        </DialogContext.Provider>
    )
}
export default App
