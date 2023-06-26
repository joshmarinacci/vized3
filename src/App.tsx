import React from 'react';
import {HBox, VBox} from "josh_react_util"
import './App.css';
import {TreeView} from "./TreeView";
import {PageView} from "./PageView";
import {PropSheet} from "./PropSheet";
import {GlobalState} from "./models/model";

function App() {
    const state = new GlobalState()
  return (
      <VBox>
        <HBox>
          <button>new</button>
          <button>save</button>
          <button>export</button>
        </HBox>
        <div className={'main-view'}>
          <TreeView document={state.getCurrentDocument()}/>
          <PageView page={state.getCurrentPage()}/>
          <PropSheet selected={state.getSelectedObject()}/>
        </div>
      </VBox>
  );
}

export default App;
