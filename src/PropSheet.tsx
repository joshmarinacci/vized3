import React, {useEffect, useState} from "react";
import {GlobalState, Observable, RealCircle, RealShape, RealSquare} from "./models/model";
import {useObservableChange} from "./PageView";

interface PropSchema {
    name:string,
    base:'number'|"string",
    set(name:string, value:any): void
    get(name:string):any
}

class NumberPropSchema implements  PropSchema {
    base: "number";
    name: string;
    private target: RealShape;

    constructor(name:string, target:RealShape) {
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
    return <>
        <label>{props.schema.name}</label>
        <input type={"number"} value={value} onChange={(e)=>{
            let num = parseInt(e.target.value)
            props.schema.set(props.schema.name,num)
        }}/>
    </>
}

function StringEditor(props: { schema: PropSchema }) {
    const value = props.schema.get(props.schema.name)
    return <>
        <label>{props.schema.name}</label>
        <input type={"text"} value={value} onChange={(e)=>{
            props.schema.set(props.schema.name,e.target.value)
        }}/>
    </>
}

function PropEditor(props: { schema: PropSchema }) {
    const { schema } = props
    if(schema.base === 'number') return <NumberEditor schema={schema}/>
    if(schema.base === 'string') return <StringEditor schema={schema}/>
    return <label>unknown property type {schema.name}</label>
}

export function PropSheet(props:{state:GlobalState}) {
    const selected = props.state.getSelectedObject()
    useObservableChange(selected,'changed')
    useObservableChange(props.state,'selection')
    const schemas:PropSchema[] = []
    if(selected instanceof RealSquare) {
        schemas.push(new NumberPropSchema('x',selected))
        schemas.push(new NumberPropSchema('y',selected))
        schemas.push(new StringPropSchema('name',selected))
    }
    if(selected instanceof RealCircle) {
        schemas.push(new NumberPropSchema('x',selected))
        schemas.push(new NumberPropSchema('y',selected))
        schemas.push(new NumberPropSchema('radius',selected))
        schemas.push(new StringPropSchema('name',selected))
    }

    return <div className={'prop-sheet panel'}>{schemas.map((schema) => {
        return <PropEditor key={schema.name} schema={schema}/>
    })}</div>
}
