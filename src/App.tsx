import React, {MouseEvent, useContext, useState} from 'react';
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
    IconButton,
    MainLayout,
    MenuActionButton,
    MenuBox,
    ToggleIconButton,
    useObjectManagerChange,
    useObservableChange
} from "./common";
import {GlobalState} from "./models/state";
import {HistoryChanged} from "./models/om";
import {
    AddNewCircleAction,
    AddNewPathShapeAction,
    AddNewRectAction,
    DownloadPNGAction,
    DownloadSVGAction,
    ExportCanvasJSAction,
    SavePNGJSONAction
} from "./actions";
import {LoadFileDialog} from "./LoadFileDialog";
import {SettingsDialog} from "./SettingsDialog";
import {Point} from "josh_js_util";
import {SupportedIcons} from "./icons";
import {ActionSearchBox} from "./actionsearch";

const state = new GlobalState()

function Main() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    useObjectManagerChange(state.om, HistoryChanged)
    useObservableChange(state,'selection')
    const dm = useContext(DialogContext)
    const showLoadDialog = () => dm.show(<LoadFileDialog state={state}/>)
    const pm = useContext(PopupContext)
    const showFileMenu = (e:MouseEvent<HTMLButtonElement>) => {
        const menu = <MenuBox>
            <MenuActionButton state={state} action={SavePNGJSONAction}/>
            <MenuActionButton state={state} action={DownloadPNGAction}/>
            <MenuActionButton state={state} action={DownloadSVGAction}/>
            <MenuActionButton state={state} action={ExportCanvasJSAction}/>
        </MenuBox>
        pm.show_at(menu, e.target, "left", new Point(0,0))
    }
    const showAddMenu = (e:MouseEvent<HTMLButtonElement>) => {
        const menu = <MenuBox>
            <MenuActionButton action={AddNewRectAction} state={state} />
            <MenuActionButton action={AddNewCircleAction} state={state}/>
            <MenuActionButton action={AddNewPathShapeAction} state={state}/>
        </MenuBox>
        pm.show_at(menu, e.target, "left", new Point(0,0))
    }
    return (<FillPage>
        <HBox className={'toolbar'}>
            <button onClick={showFileMenu}>File</button>
            <button onClick={showAddMenu}>Add</button>
            <IconButton icon={SupportedIcons.NewDocument} onClick={()=>{  console.log("pretending to make new document");  }}>new</IconButton>
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
            center={<PageView page={state.getCurrentPage()} state={state}/>}
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
            {/*<IconButton name={SupportedIcons.RightPanelCloseIcon}*/}
            {/*            onClick={() => setRightVisible(!rightVisible)}/>*/}
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
