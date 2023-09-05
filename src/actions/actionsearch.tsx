import {Point} from "josh_js_util"
import {PopupContext} from "josh_react_util"
import React, {useContext, useRef, useState} from "react"

import {IconButton, MenuBox} from "../common"
import {SupportedIcons} from "../icons"
import {GlobalState} from "../models/state"
import {ALL_ACTIONS, MenuAction} from "./actions"

function actionMatches(action: MenuAction, query: string) {
    query = query.toLowerCase()
    if (action.title.toLowerCase().includes(query)) return true
    if (action.tags) {
        for (const tag of action.tags) {
            if(tag.toLowerCase().includes(query)) return true
        }
    }
    if (action.description?.toLowerCase().includes(query)) return true
    return false
}

function MenuActionDescription(props: { action: MenuAction, state: GlobalState }) {
    const {action, state} = props
    return <div className={'menu-action-description'}>
        <b>{action.title}</b>
        <p>{action.description}</p>
        <button onClick={async () => {
            console.log("doing",action)
            await action.perform(state)
        }}>perform</button>
    </div>
}

export const compare_strings = (a: string, b: string) => {
    if (a < b) return -1
    if (a > b) return 1
    return 0
}

export function ActionSearchBox(props: { state: GlobalState }) {
    const [query, setQuery] = useState("")
    const pm = useContext(PopupContext)
    const ref = useRef(null)
    return <div className={'action-search-box'} ref={ref}>
        <input type={'text'}
               value={query}
               // onBlur={() => pm.hide()}
               onChange={(e => {
                   setQuery(e.target.value)
                   if (query.length >= 1) {
                       const acts = ALL_ACTIONS.filter((a) => actionMatches(a, query))
                       acts.sort((a, b) => compare_strings(a.title, b.title))
                       const menu = <MenuBox>{acts.map((a, i) => <MenuActionDescription
                           key={'action' + i} action={a} state={props.state}/>)}</MenuBox>
                       pm.show_at(menu, ref.current, 'left', new Point(0, 0))
                   }
               })}
               placeholder={'search actions'}
        />
        <IconButton icon={SupportedIcons.Search}>&nbsp;</IconButton>
    </div>
}
