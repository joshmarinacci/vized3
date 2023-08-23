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
