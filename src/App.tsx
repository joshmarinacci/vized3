import React, {useState} from 'react';
import {FillPage, HBox, Spacer} from "josh_react_util"
import './App.css';
import {TreeView} from "./TreeView";
import {
    PageView,
    useObjectManagerChange,
} from "./PageView";
import {PropSheet} from "./PropSheet";
import {exportSVG} from "./exporters/svg";
import {exportPNG} from "./exporters/png";
import {exportCanvasJS} from "./exporters/canvas";
import {IconButton, MainLayout, SupportedIcons, ToggleIconButton} from "./common";
import {GlobalState} from "./models/state";
import {saveJSON} from "./exporters/json";
import {HistoryChanged} from "./models/om";


const state = new GlobalState()
function App() {
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)
    useObjectManagerChange(state.om, HistoryChanged)
      return (
      <FillPage>
        <HBox>
          <IconButton icon={SupportedIcons.NewDocument} onClick={()=>{
              console.log("pretending to make new");
          }}>new</IconButton>
            <IconButton icon={SupportedIcons.SaveDocument} onClick={() => saveJSON(state)}>save</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportPNG(state)}>PNG</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportSVG(state)}>SVG</IconButton>
            <IconButton icon={SupportedIcons.Download} onClick={() => exportCanvasJS(state)}>Canvas JS</IconButton>
            <IconButton icon={SupportedIcons.Undo} disabled={!state.om.canUndo()} onClick={() => state.om.performUndo()}>Undo</IconButton>
            <IconButton icon={SupportedIcons.Redo} disabled={!state.om.canRedo()} onClick={() => state.om.performRedo()}>Redo</IconButton>
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
      </FillPage>
  );
}

export default App;
