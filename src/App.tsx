import React, {ChangeEvent, useContext, useRef, useState} from 'react';
import {
    DialogContainer, DialogContext, DialogContextImpl,
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
    useObjectManagerChange, useObservableChange
} from "./common";
import {GlobalState} from "./models/state";
import {loadPNGJSON, savePNGJSON} from "./exporters/json";
import {HistoryChanged} from "./models/om";
import {AddNewCircleAction, AddNewRectAction} from "./actions";


const state = new GlobalState()

function LoadFileDialog(props:{state:GlobalState}) {
    const [canLoad, setCanLoad] = useState(false)
    const dm = useContext(DialogContext)
    const input = useRef<HTMLInputElement>(null)
    const load = async () => {
        console.log("loading")
        if (input && input.current && input.current.files) {
            const file = input.current.files[0]
            console.log("file is", file)
            const doc_proxy = await loadPNGJSON(state, file)
            console.log("loaded doc is",doc_proxy)
            state.swapDoc(doc_proxy)
        }
        dm.hide()
    }
    const cancel = () => {
        dm.hide()
    }
    const fileChanged = (e:ChangeEvent<HTMLInputElement>) => {
        // console.log("file changed",e.target.files)
        if(e.target.files && e.target.files.length === 1) {
            // console.log("single file chosen")
            let file = e.target.files[0]
            // console.log("file is",file)
            if(file.name.toLowerCase().endsWith('.png') && file.name.toLowerCase().includes('.json')) {
                // console.log("is the right kind")
                setCanLoad(true)
            } else {
                // console.log("its the wrong kind")
            }
        }
    }
    return <div className={'dialog'}>
        <header>Choose JSON.PNG file to load</header>
        <section>
            <input ref={input}
                   type={'file'}
                   onChange={e=> fileChanged(e)}/>
        </section>
        <footer>
            <Spacer/>
            <button className={'default'} onClick={() => cancel()}>Cancel</button>
            <button disabled={!canLoad} className={'primary'} onClick={() => load()}>Load</button>
        </footer>
    </div>
}

function Main() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    useObjectManagerChange(state.om, HistoryChanged)
    useObservableChange(state,'selection')
    console.log("using doc",state.getCurrentDocument().getUUID())
    console.log("using page",state.getSelectedPage()?.getUUID())
    const dm = useContext(DialogContext)
    const showDialog = () => {
        dm.show(<LoadFileDialog state={state}/>)
    }
    return (<FillPage>
        <HBox>
            <IconButton icon={SupportedIcons.NewDocument} onClick={()=>{
                console.log("pretending to make new document");
            }}>new</IconButton>
            <IconButton icon={SupportedIcons.SaveDocument} onClick={async () => await savePNGJSON(state)}>save</IconButton>
            <IconButton icon={SupportedIcons.SaveDocument} onClick={async () => showDialog()}>load</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportPNG(state)}>PNG</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportSVG(state)}>SVG</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportCanvasJS(state)}>Canvas JS</IconButton>
            <IconButton icon={SupportedIcons.Undo} disabled={!state.om.canUndo()} onClick={() => state.om.performUndo()}>Undo</IconButton>
            <IconButton icon={SupportedIcons.Redo} disabled={!state.om.canRedo()} onClick={() => state.om.performRedo()}>Redo</IconButton>
            <IconButton icon={SupportedIcons.Add} onClick={()=>AddNewRectAction.perform(state)}>Add Rect</IconButton>
            <IconButton icon={SupportedIcons.Add} onClick={()=>AddNewCircleAction.perform(state)}>Add Circle</IconButton>
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
