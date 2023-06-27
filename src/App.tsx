import React from 'react';
import {HBox, VBox} from "josh_react_util"
import {canvas_to_blob, forceDownloadBlob} from "josh_web_util"
import './App.css';
import {TreeView} from "./TreeView";
import {PageView} from "./PageView";
import {PropSheet} from "./PropSheet";
import {GlobalState, VCircle, VDocument, VPage, VSquare} from "./models/model";

function traverse(doc: VDocument, cb: (item: any) => void) {
    cb(doc)
    doc.pages.forEach(page => {
        cb(page)
        page.children.forEach(shape => {
            cb(shape)
        })
    })
}

async function exportDocument(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    traverse(state.getCurrentDocument(), (item: any) => {
        if (item.type === 'document') {
            const doc = item as VDocument
        }
        if (item.type === 'page') {
            const page = item as VPage
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        if (item.type === 'square') {
            const sq = item as VSquare
            sq.drawSelf(ctx)
        }
        if (item.type === 'circle') {
            const circle = item as VCircle
            circle.drawSelf(ctx)
        }
    })
    const blob = await canvas_to_blob(canvas)
    forceDownloadBlob('demo.png',blob)
}

function App() {
    const state = new GlobalState()
  return (
      <VBox>
        <HBox>
          <button>new</button>
          <button>save</button>
          <button onClick={() => exportDocument(state)}>export</button>
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
