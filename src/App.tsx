import React, {useContext, useState} from 'react';
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
import './App.css';
import {TreeView} from "./TreeView";
import {PageView,} from "./editing/PageView";
import {PropSheet} from "./PropSheet";
import {
    DropdownMenuButton,
    IconButton,
    MainLayout,
    ToggleIconButton,
    useObjectManagerChange,
    useObservableChange
} from "./common";
import {GlobalState} from "./models/state";
import {HistoryChanged} from "./models/om";
import {
    AddNewCircleAction,
    AddNewNGonAction,
    AddNewPathShapeAction,
    AddNewRectAction,
    DownloadPDFAction,
    DownloadPNGAction,
    DownloadSVGAction,
    ExportCanvasJSAction,
    MenuAction,
    NewDocumentAction,
    SavePNGJSONAction
} from "./actions";
import {LoadFileDialog} from "./LoadFileDialog";
import {SettingsDialog} from "./SettingsDialog";
import {SupportedIcons} from "./icons";
import {ActionSearchBox} from "./actionsearch";

const state = new GlobalState()

const UploadDocumentAction:MenuAction = {
    title:"Upload Document",
    icon:SupportedIcons.UploadDocument,
    tags:['upload','document'],
    description: "upload document from disk in JSON or PNG JSON form",
    perform: async (state) => {
        const dialog = <LoadFileDialog state={state}/>
        console.log("made dialog",dialog)
    }
}

function Main() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    useObjectManagerChange(state.om, HistoryChanged)
    useObservableChange(state,'selection')
    const dm = useContext(DialogContext)
    const showLoadDialog = () => dm.show(<LoadFileDialog state={state}/>)
    const pm = useContext(PopupContext)
    return (<FillPage>
        <HBox className={'toolbar'}>
            <DropdownMenuButton title={'File'} state={state} items={[
                NewDocumentAction,
                // UploadDocumentAction,
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
            ]}/>
            <IconButton icon={SupportedIcons.UploadDocument} onClick={async () => showLoadDialog()}>load</IconButton>
            <IconButton icon={SupportedIcons.Undo} disabled={!state.om.canUndo()} onClick={() => state.om.performUndo()}>Undo</IconButton>
            <IconButton icon={SupportedIcons.Redo} disabled={!state.om.canRedo()} onClick={() => state.om.performRedo()}>Redo</IconButton>
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
export default App;
