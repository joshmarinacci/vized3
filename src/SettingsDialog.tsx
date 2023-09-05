import {DialogContext, Spacer} from "josh_react_util"
import React, {useContext} from "react"

import {GlobalState} from "./models/state"

export function SettingsDialog(props: { state: GlobalState }) {
    const dm = useContext(DialogContext)
    return <div className={'dialog'}>
        <header>settings</header>
        <section>
            <a href={'https://github.com/joshmarinacci/vized3/releases/latest'}>release notes.</a>
        </section>
        <footer><Spacer/>
            <button onClick={() => dm.hide()}>close</button>
        </footer>
    </div>
}
