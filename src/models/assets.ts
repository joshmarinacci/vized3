import {Point} from "josh_js_util"

import {DefList, PropsBase, PropValues} from "./base"
import {NameDef} from "./defs"

export type BaseAssetType = {
    name:string,
    value: unknown,
}
export abstract class AssetBase<Type extends BaseAssetType> extends PropsBase<Type>{
}

export type NumberAssetType = {
    name: string,
    value: number,
}

export const NumberAssetDef: DefList<NumberAssetType> = {
    name: NameDef,
    value: {
        default: () => 0,
        readonly: false,
        base: 'number',
        hidden: false
    }
}

export class NumberAssetClass extends AssetBase<NumberAssetType> {
    constructor(opts?: PropValues<NumberAssetType>) {
        super(NumberAssetDef, opts)
    }
}


export type ColorAssetType = {
    name: string,
    value: string,
}
export const ColorAssetDef: DefList<ColorAssetType> = {
    name: NameDef,
    value: {
        base: "string",
        readonly: false,
        custom: 'css-color',
        default: () => '#000000',
        hidden: false,
    }
}

export class ColorAssetClass extends AssetBase<ColorAssetType> {
    constructor(opts?: PropValues<ColorAssetType>) {
        super(ColorAssetDef, opts)
    }
}


export type ColorStop = {
    position: number,
    color: string,
}

export class LinearColorGradient {
    start: Point
    end: Point
    stops: ColorStop[]

    constructor() {
        this.start = new Point(0, 0)
        this.end = new Point(100, 0)
        this.stops = [{
            color: '#ff0000',
            position: 0,
        }, {
            color: '#00ff00',
            position: 1.0,
        }
        ]
    }

    static fromJSON(value: unknown) {
        return new LinearColorGradient()
    }

    toJSON() {
        return {
            type: 'linear-color-gradient',
            start: this.start.toJSON(),
            end: this.end.toJSON(),
            stops: this.stops.map(stop => ({
                    position: stop.position,
                    color: stop.color
                })
            )
        }
    }
}

export type GradientAssetType = {
    name: string,
    value: object,
}
export const GradientAssetDef: DefList<GradientAssetType> = {
    name: NameDef,
    value: {
        base: 'object',
        readonly: false,
        custom: 'css-gradient',
        default: () => new LinearColorGradient(),
        hidden: false,
        fromJSON:(json) => {
            return LinearColorGradient.fromJSON(json.value)
        }
    }
}

export class GradientAssetClass extends AssetBase<GradientAssetType> {
    constructor(opts?: PropValues<GradientAssetType>) {
        super(GradientAssetDef, opts)
    }
}


export type ImageAssetType = {
    name: string,
    value: object,
}

export const ImageAssetDef: DefList<ImageAssetType> = {
    name: NameDef,
    value: {
        base: 'object',
        default: () => ({width: 1, height: 1, data: [255, 255, 255]}),
        readonly: true,
        custom: 'image-asset',
        hidden: false,
        toJSON: (v) => {
            return {
                type:'value',
                value:'some stuff'
            }
        }
    }
}

export class ImageAssetClass extends AssetBase<ImageAssetType> {
    constructor(opts?: PropValues<ImageAssetType>) {
        super(ImageAssetDef, opts)
    }
}
