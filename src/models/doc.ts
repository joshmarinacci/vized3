import {AssetBase} from "./assets"
import {DefList, PropsBase, PropValues} from "./base"
import {NameDef, UnitDef} from "./defs"
import {PageClass} from "./page"
import {Unit} from "./unit"

export type DocType = {
    name:string,
    unit:Unit,
    pages:PageClass[],
    assets:AssetBase<any>[],
}
export const DocDefs:DefList<DocType> = {
    name: NameDef,
    unit: UnitDef,
    pages: {
        base:'list',
        readonly:true,
        hidden:true,
        default: () => [],
    },
    assets: {
        base:'list',
        readonly:true,
        hidden:true,
        default: () => [],
    }
}
export class DocClass extends PropsBase<DocType>{
    constructor(opts?: PropValues<DocType>) {
        super(DocDefs, opts)
    }
}
