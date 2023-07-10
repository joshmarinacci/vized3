import React, {MouseEventHandler, useContext, useEffect, useState} from "react"
import './TreeView.css'
import {toClass} from "josh_react_util";
import {useObservableChange} from "./PageView";
import {GlobalState} from "./models/state";
import {DocDef, ObjectDef, ObjectProxy, PageDef} from "./models/om";

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

function TreeShapeItem(props: { shape: ObjectProxy<ObjectDef>, state:GlobalState, selected:any }) {
    const shape = props.shape
    const clsses = toClass({
        'tree-item':true,
        'selectable':true,
        selected:props.shape === props.selected,
    })
    return <div className={clsses} onClick={()=> props.state.setSelectedObject(props.shape)}>
        <b>{shape.hasPropNamed('uuid')?shape.getPropNamed("uuid"):"no uuid"}</b>
        <label>name</label>
    </div>
}

function TreePageItem(props: { page: ObjectProxy<ObjectDef>, state:GlobalState, selected:any }) {
    const {page, state} = props
    const clsses = toClass({
        'selectable':true,
        selected:page === state.getSelectedPage(),
    })
    return <div className={'tree-item'}>
        <b className={clsses} onClick={()=>props.state.setSelectedPage(props.page)}>page hi</b>
        {
            page.getListProp(PageDef.props.children).map((shape:ObjectProxy<ObjectDef>,i:number) =>
                <TreeShapeItem key={i} shape={shape}
                               state={state} selected={props.selected}/>)
        }
    </div>
}

export function TreeView(props: { state:GlobalState}) {
    useObservableChange(props.state,'selection')
    const selected = props.state.getSelectedObject()
    const doc = props.state.getCurrentDocument()
    return <div className={'panel left tree-view'}>
        <h3>document</h3>
        <h3>pages</h3>
        {doc.getListProp(DocDef.props.pages).map((pg,i) => {
            return <TreePageItem key={i} page={pg} state={props.state} selected={selected}/>
        })}
    </div>
}
