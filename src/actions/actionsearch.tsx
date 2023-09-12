import {Point} from "josh_js_util"
import React, {useContext, useRef, useState} from "react"

import {IconButton, MenuBox, useObservableChange} from "../common"
import {SupportedIcons} from "../icons"
import {GlobalState} from "../models/state"
import {PopupContext} from "../propsheet/popup"
import {ALL_ACTIONS, MenuAction, Shortcut} from "./actions"

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

function ShortcutView(props: {shortcut?: Shortcut}) {
    if(!props.shortcut) return <p></p>
    return <p>
        {props.shortcut.shift?'shift +':''}
        {props.shortcut.meta?'meta +':''}
        {props.shortcut.key}
    </p>
}
function MenuActionDescription(props: { action: MenuAction, state: GlobalState }) {
    const {action, state} = props
    return <div className={'menu-action-description'}>
        <b>{action.title}</b>
        <p>{action.description}</p>
        <ShortcutView shortcut={action.shortcut}/>
        <button onClick={async () => await action.perform(state)}>perform</button>
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
    const ref = useRef<HTMLDivElement>(null)
    const input = useRef<HTMLInputElement>(null)
    const showSearch = async (text:string) => {
        setQuery(text)
        if (query.length >= 1) {
            const acts = ALL_ACTIONS.filter((a) => actionMatches(a, query))
            acts.sort((a, b) => compare_strings(a.title, b.title))
            const menu = <MenuBox>{acts.map((a, i) => <MenuActionDescription
                key={'action' + i} action={a} state={props.state}/>)}</MenuBox>
            if(ref.current) pm.show_at(menu, ref.current, 'left', new Point(0, 0))
        }
    }
    useObservableChange(props.state,'open-search', async (e) => {
        if (input.current) input.current.focus()
        await showSearch("")
    })
    return <div className={'action-search-box'} ref={ref}>
        <input type={'text'}
               ref={input}
               value={query}
               // onBlur={() => pm.hide()}
               onChange={(async e => await showSearch(e.target.value))}
               placeholder={'search actions'}
        />
        <IconButton icon={SupportedIcons.Search}>&nbsp;</IconButton>
    </div>
}
