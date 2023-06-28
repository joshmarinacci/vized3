import React, {useState} from 'react';
import {FillPage, HBox, Spacer} from "josh_react_util"
import './App.css';
import {TreeView} from "./TreeView";
import {PageView} from "./PageView";
import {PropSheet} from "./PropSheet";
import {GlobalState} from "./models/model";
import {exportSVG} from "./exporters/svg";
import {exportPNG} from "./exporters/png";
import {exportCanvasJS} from "./exporters/canvas";
import {MainLayout} from "./common";


function App() {
    const state = new GlobalState()
    const [leftVisible, setLeftVisible] = useState(true)
    const [rightVisible, setRightVisible] = useState(true)

  return (
      <FillPage>
        <HBox>
          <button>new</button>
          <button>save</button>
            <button onClick={() => exportPNG(state)}>to PNG</button>
            <button onClick={() => exportSVG(state)}>to SVG</button>
            <button onClick={() => exportCanvasJS(state)}>to Canvas JS</button>
        </HBox>
          <MainLayout
              rightVisible={rightVisible}
              leftVisible={leftVisible}
              left={<TreeView document={state.getCurrentDocument()} state={state}/>}
              center={<PageView page={state.getCurrentPage()} state={state}/>}
              right={<PropSheet state={state}/>}
          />
          <HBox>
              <button onClick={() => setLeftVisible(!leftVisible)}>left</button>
              <Spacer/>
              <button onClick={() => setRightVisible(!rightVisible)}>right</button>
          </HBox>
      </FillPage>
  );
}

export default App;
