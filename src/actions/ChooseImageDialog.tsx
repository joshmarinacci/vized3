import {DialogContext, Spacer} from "josh_react_util"
import React, {ChangeEvent, useContext, useRef, useState} from "react"

import {GlobalState} from "../models/state"

function isValidImageFile(file: File) {
    if(!file) return false
    if(file.name.toLowerCase().endsWith('.png')) return true
    if(file.name.toLowerCase().endsWith('.jpg')) return true
    return false
}

export function ChooseImageDialog(props:{state:GlobalState, onComplete:(img:HTMLImageElement, fileName:string)=>Promise<void>}) {
    const { onComplete} = props
    const dm = useContext(DialogContext)
    const fileRef = useRef<HTMLInputElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [src, setSrc] = useState<unknown>("#")
    const [canLoad, setCanLoad] = useState(false)
    const [fileName, setFileName] = useState("")
    const fileChanged = (e:ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files.length === 1) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener('load',() => {
                setSrc(reader.result as unknown)
            })
            reader.readAsDataURL(file)
            setCanLoad(isValidImageFile(file))
            setFileName(file.name)
        }
    }
    const cancel = () => dm.hide()
    const load = async () => {
        if(imgRef.current) {
            await onComplete(imgRef.current, fileName)
        }
        dm.hide()
    }
    return <div className={'dialog'}>
        <header>Choose Image</header>
        <section>
            <input ref={fileRef} type={'file'} onChange={fileChanged} />
            <b>{fileName}</b>
            {!canLoad && <p>Invalid File Type</p>}
            <img alt={'preview'} ref={imgRef} src={src as string} style={{
                maxWidth:'100px',
                maxHeight:'100px',
                border:'1px solid black'
            }}/>
        </section>
        <footer>
            <Spacer/>
            <button className={'default'} onClick={cancel}>cancel</button>
            <button disabled={!canLoad} className={'primary'} onClick={load}>Open</button>
        </footer>
    </div>
}
