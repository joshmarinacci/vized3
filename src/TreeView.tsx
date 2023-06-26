import React, {MouseEventHandler, useContext, useEffect, useState} from "react"
import {GlobalState, VDocument, VPage, VShape} from "./models/model"
import './TreeView.css'
import {toClass} from "josh_react_util";
import {useObservableChange} from "./PageView";

//
// function AddChildMenu(props: { node: TreeNode, state:GlobalState }) {
//     let pc = useContext(PopupContext) as PopupContextImpl
//     let actions:Action[] = props.state.powerups.map(pow => pow.child_options(props.node)).flat()
//     if(!props.node.has_component(DocName)) {
//         actions.push(delete_node)
//         actions.push(move_to_bottom)
//         actions.push(move_down)
//         actions.push(move_up)
//         actions.push(move_to_top)
//     }
//     if(actions.length === 0) actions.push(nothing)
//     return <ul className={'menu'}>
//         {actions.map((act,i)=>{
//             return <li className={'menu-item'} key={i} onClick={()=>{
//                 act.fun(props.node,props.state)
//                 pc.hide()
//             }
//             }>{act.title}</li>
//         })}
//     </ul>
// }
//
// function TreeParentItem(props: { node: TreeNode, state:GlobalState }) {
//     let klass = "tree-parent"
//     if (props.state.selection.has(props.node)) {
//         klass += " selected"
//     }
//     let pc = useContext(PopupContext)
//     const on_click = () => {
//         props.state.selection.set([props.node])
//         props.state.dispatch('selection-change', {})
//     }
//     const show_menu:MouseEventHandler<HTMLDivElement> = (e) => {
//         let container:JSX.Element = <AddChildMenu node={props.node} state={props.state}/>
//         pc.show(container,e)
//     }
//     return <div className={klass}>
//         <div className={"tree-item-info"} onClick={on_click} onContextMenu={show_menu}>{props.node.title}</div>
//         <ul className={'tree-children'}>
//             {props.node.children.map((ch, i) => {
//                 return <TreeParentItem key={i} node={ch} state={props.state}/>
//             })}
//         </ul>
//     </div>
// }

function TreeShapeItem(props: { shape: VShape, state:GlobalState, selected:any }) {
    const clsses = toClass({
        'tree-item':true,
        'selectable':true,
        selected:props.shape === props.selected,
    })
    return <div className={clsses} onClick={()=>props.state.setSelectedObject(props.shape)}>
        <b>{props.shape.uuid}</b> <label>{props.shape.name}</label>
    </div>
}

function TreePageItem(props: { page: VPage, state:GlobalState, selected:any }) {
    const {page, state} = props
    return <div className={'tree-item'}>
        <b>page: name</b>
        {
            page.children.map(shape => <TreeShapeItem key={shape.uuid} shape={shape}
                                                            state={state} selected={props.selected}/>)
        }
    </div>
}

export function TreeView(props: { document:VDocument, state:GlobalState}) {
    const {document} = props
    useObservableChange(props.state,'selection')
    const selected = props.state.getSelectedObject()
    return <div className={'panel left tree-view'}>
        <h3>document</h3>
        <h3>pages</h3>
        {document.pages.map(pg => <TreePageItem key={pg.uuid} page={pg} state={props.state} selected={selected}/>)}
    </div>
}
