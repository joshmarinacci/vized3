import {Size} from "josh_js_util";

export enum Unit {
    Inch="Inch",
    Centimeter="Centimeter",
}
console.log(Unit)

export function lookup_name(name:string):Unit {
    console.log("looking up",name,'in',Unit)
    if(!(name in Unit))throw new Error(`cannot lookup unnit for name ${name}`)
    // @ts-ignore
    return Unit[name]
}

export function size_to_pixels(size:Size, unit:Unit):Size {
    if(unit === Unit.Inch) {
        return size.scale(96)
    }
    if(unit === Unit.Centimeter) {
        return size.scale(40)
    }
    throw new Error(`cannot convert unit ${unit}`)
}
