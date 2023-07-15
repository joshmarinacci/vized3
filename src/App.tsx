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
    Spacer
} from "josh_react_util"
import './App.css';
import {TreeView} from "./TreeView";
import {PageView,} from "./PageView";
import {PropSheet} from "./PropSheet";
import {exportSVG} from "./exporters/svg";
import {exportPNG} from "./exporters/png";
import {exportCanvasJS} from "./exporters/canvas";
import {
    IconButton,
    MainLayout,
    SupportedIcons,
    ToggleIconButton,
    useObjectManagerChange,
    useObservableChange
} from "./common";
import {GlobalState} from "./models/state";
import {savePNGJSON} from "./exporters/json";
import {HistoryChanged} from "./models/om";
import {AddNewCircleAction, AddNewRectAction} from "./actions";
import {LoadFileDialog} from "./LoadFileDialog";
import {SettingsDialog} from "./SettingsDialog";

const state = new GlobalState()

function Main() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    useObjectManagerChange(state.om, HistoryChanged)
    useObservableChange(state,'selection')
    const dm = useContext(DialogContext)
    const showLoadDialog = () => dm.show(<LoadFileDialog state={state}/>)
    return (<FillPage>
        <HBox className={'toolbar'}>
            <IconButton icon={SupportedIcons.NewDocument} onClick={()=>{
                console.log("pretending to make new document");
            }}>new</IconButton>
            <IconButton icon={SupportedIcons.SaveDocument} onClick={async () => await savePNGJSON(state)}>save</IconButton>
            <IconButton icon={SupportedIcons.UploadDocument} onClick={async () => showLoadDialog()}>load</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportPNG(state)}>PNG</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportSVG(state)}>SVG</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportCanvasJS(state)}>Canvas JS</IconButton>
            <IconButton icon={SupportedIcons.Undo} disabled={!state.om.canUndo()} onClick={() => state.om.performUndo()}>Undo</IconButton>
            <IconButton icon={SupportedIcons.Redo} disabled={!state.om.canRedo()} onClick={() => state.om.performRedo()}>Redo</IconButton>
            <IconButton icon={SupportedIcons.Add} onClick={()=>AddNewRectAction.perform(state)}>Add Rect</IconButton>
            <IconButton icon={SupportedIcons.Add} onClick={()=>AddNewCircleAction.perform(state)}>Add Circle</IconButton>
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
