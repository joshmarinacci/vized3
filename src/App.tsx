import React from 'react';
import {HBox, VBox} from "josh_react_util"
import './App.css';
import {TreeView} from "./TreeView";
import {PageView} from "./PageView";
import {PropSheet} from "./PropSheet";
import {GlobalState} from "./models/model";
import {exportSVG} from "./exporters/svg";
import {exportPNG} from "./exporters/png";
import {exportCanvasJS} from "./exporters/canvas";


function App() {
    const state = new GlobalState()
  return (
      <VBox>
        <HBox>
          <button>new</button>
          <button>save</button>
            <button onClick={() => exportPNG(state)}>to PNG</button>
            <button onClick={() => exportSVG(state)}>to SVG</button>
            <button onClick={() => exportCanvasJS(state)}>to Canvas JS</button>
        </HBox>
        <div className={'main-view'}>
          <TreeView document={state.getCurrentDocument()} state={state}/>
          <PageView page={state.getCurrentPage()} state={state}/>
          <PropSheet state={state}/>
        </div>
      </VBox>
  );
}

export default App;
