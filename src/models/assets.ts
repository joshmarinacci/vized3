import {Point} from "josh_js_util"

import {NameDef, ObjectDef, ObjectManager, ObjectProxy} from "./om"

export const NumberAssetDef:ObjectDef = {
    name:'number-asset',
    props: {
        name: NameDef,
        value: {
            name:'value',
            defaultValue: 0,
            readonly: false,
            base:'number',
            hidden: false
        }
    }
}
export class NumberAssetClass extends ObjectProxy<typeof NumberAssetDef>{
    constructor(om:ObjectManager, opts: Record<keyof typeof NumberAssetDef.props, any>) {
        super(om, NumberAssetDef, opts)
    }
}


export const ColorAssetDef:ObjectDef = {
    name:'color-asset',
    props: {
        name: NameDef,
        value: {
            name:'value',
            base:"string",
            readonly:false,
            custom:'css-color',
            defaultValue:'#000000',
            hidden:false,
        }
    }
}
export class ColorAssetClass extends ObjectProxy<typeof ColorAssetDef> {
    constructor(om:ObjectManager, opts: Record<keyof typeof ColorAssetDef.props, any>) {
        super(om, ColorAssetDef, opts)
    }
}



export type ColorStop = {
    position:number,
    color:string,
}
export class LinearColorGradient {
    start:Point
    end:Point
    stops:ColorStop[]
    constructor() {
        this.start = new Point(0,0)
        this.end = new Point(100,0)
        this.stops = [{
            color:'#ff0000',
            position:0,
        },{
            color: '#00ff00',
            position: 1.0,
        }
        ]
    }
    toJSON() {
        return {
            type:'linear-color-gradient',
            start: this.start.toJSON(),
            end: this.end.toJSON(),
            stops: this.stops.map(stop => ({
                position: stop.position,
                color: stop.color})
            )
        }
    }

    static fromJSON(value: unknown) {
        return new LinearColorGradient()
    }
}

export const GradientAssetDef:ObjectDef = {
    name:'gradient-asset',
    props: {
        name: NameDef,
        value: {
            name:'value',
            base:'object',
            readonly:false,
            custom:'css-gradient',
            defaultValue:new LinearColorGradient(),
            hidden:false,
        }
    }
}


export class GradientAssetClass extends ObjectProxy<typeof GradientAssetDef> {
    constructor(om:ObjectManager, opts: Record<keyof typeof GradientAssetDef.props, any>) {
        super(om, GradientAssetDef, opts)
    }
}
