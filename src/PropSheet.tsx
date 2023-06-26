import React, {useEffect, useState} from "react";
import {Observable} from "./models/model";

interface PropSchema {
    name:string,
    base:'number'|"string",
    set(name:string, value:any): void
    get(name:string):any
}

class NumberPropSchema implements  PropSchema {
    base: "number";
    name: string;
    private target: any;

    constructor(name:string, target:any) {
        this.base = "number"
        this.name = name
        this.target = target
    }

    set(name:string, value:any) {
        this.target.setProperty(name,value)
    }
    get(name:string) {
        return this.target.getProperty(name)
    }
}
class StringPropSchema implements PropSchema {
    base: "string";
    name: string;
    private target: any;

    constructor(name:string, target:any) {
        this.base = "string"
        this.name = name
        this.target = target
    }

    set(name:string, value:any) {
        this.target.setProperty(name,value)
    }
    get(name:string) {
        return this.target.getProperty(name)
    }
}

function NumberEditor(props: { schema: PropSchema }) {
    const value = props.schema.get(props.schema.name)
    return <div className={'prop-editor'}>
        <label>{props.schema.name}</label>
        <input type={"number"} value={value} onChange={(e)=>{
            let num = parseInt(e.target.value)
            props.schema.set(props.schema.name,num)
        }}/>
    </div>
}


function StringEditor(props: { schema: PropSchema }) {
    const value = props.schema.get(props.schema.name)
    return <div className={'prop-editor'}>
        <label>{props.schema.name}</label>
        <input type={"text"} value={value} onChange={(e)=>{
            props.schema.set(props.schema.name,e.target.value)
        }}/>
    </div>
}

function PropEditor(props: { schema: PropSchema }) {
    const { schema } = props
    if(schema.base === 'number') return <NumberEditor schema={schema}/>
    if(schema.base === 'string') return <StringEditor schema={schema}/>
    return <div className={'prop-editor'}>unknown property type {schema.name}</div>
}

export function PropSheet(props:{selected:any}) {
    const {selected} = props
    console.log("selected is",selected)
    const [count, setCount] = useState(0)
    useEffect(() => {
        if(selected) {
            let ob = selected as Observable
            const hand = () => setCount(count + 1)
            ob.addEventListener('changed',hand)
            return () => {
                ob.removeEventListener('changed',hand)
            }
        }
    })
    const schemas:PropSchema[] = [
        new NumberPropSchema('x',selected),
        new NumberPropSchema('y',selected),
        new StringPropSchema('name',selected),
    ]
    return <div className={'prop-sheet panel'}>{schemas.map((schema) => {
        return <PropEditor key={schema.name} schema={schema}/>
    })}</div>
}
