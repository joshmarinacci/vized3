import {Point, Size} from "josh_js_util"

export enum Unit {
    Inch="Inch",
    Centimeter="Centimeter",
    Pixel="Pixel",
}
console.log(Unit)

export function lookup_name(name:string):Unit {
    // console.log("looking up",name,'in',Unit)
    if(!(name in Unit))throw new Error(`cannot lookup unnit for name ${name}`)
    // @ts-ignore
    return Unit[name]
}

export function point_to_pixels(pt:Point, unit:Unit):Point {
    if(unit === Unit.Inch) {
        return pt.scale(96)
    }
    if(unit === Unit.Centimeter) {
        return pt.scale(40)
    }
    if(unit === Unit.Pixel) {
        return pt.scale(1)
    }
    throw new Error(`cannot convert unit ${unit}`)
}
export function size_to_pixels(size:Size, unit:Unit):Size {
    if(unit === Unit.Inch) {
        return size.scale(96)
    }
    if(unit === Unit.Centimeter) {
        return size.scale(40)
    }
    if(unit == Unit.Pixel) {
        return size.scale(1)
    }
    throw new Error(`cannot convert unit ${unit}`)
}
export function distance_to_pixels(value:number, unit:Unit):number {
    if(unit === Unit.Inch) {
        return value * 96
    }
    if(unit === Unit.Centimeter) {
        return value * 40
    }
    if(unit === Unit.Pixel) {
        return value * 1
    }
    throw new Error(`cannot convert unit ${unit}`)
}
export function lookup_dpi(unit: Unit) {
    if(unit === Unit.Inch) {
        return 96
    }
    if(unit === Unit.Centimeter) {
        return 40
    }
    if(unit === Unit.Pixel) {
        return 1
    }
    throw new Error(`cannot convert unit ${unit}`)
}
export function lookup_pdf_dpi(unit:Unit) {
    if(unit === Unit.Inch) {
        return 72
    }
    if(unit === Unit.Centimeter) {
        return 72.0/2.54
    }
    throw new Error(`cannot convert unit ${unit}`)
}
