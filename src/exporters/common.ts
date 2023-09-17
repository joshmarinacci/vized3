import {PropsBase} from "../models/base"
import {DocClass} from "../models/doc"

export const DAWNBRINGER32 = [
    '#000000',
    '#222034',
    '#45283c',
    '#663931',
    '#8f563b',
    '#df7126',
    '#d9a066',
    '#eec39a',
    '#fbf236',
    '#99e550',
    '#6abe30',
    '#37946e',
    '#4b692f',
    '#524b24',
    '#323c39',
    '#3f3f74',
    '#306082',
    '#5b6ee1',
    '#639bff',
    '#5fcde4',
    '#cbdbfc',
    '#ffffff',
    '#9badb7',
    '#847e87',
    '#696a6a',
    '#595652',
    '#76428a',
    '#ac3232',
    '#d95763',
    '#d77bba',
    '#8f974a',
    '#8a6f30',
]
export const PICO8 = [
    '#000000',
    '#1D2B53',
    '#7E2553',
    '#008751',
    '#AB5236',
    '#5F574F',
    '#C2C3C7',
    '#FFF1E8',
    '#FF004D',
    '#FFA300',
    '#FFEC27',
    '#00E436',
    '#29ADFF',
    '#83769C',
    '#FF77A8',
    '#FFCCAA',
    'transparent',
]
export const MINECRAFT = [
    '#ffffff',
    '#999999',
    '#4c4c4c',
    '#191919',
    '#664c33',
    '#993333',
    '#d87f33',
    '#e5e533',
    '#7fcc19',
    '#667f33',
    '#4c7f99',
    '#6699d8',
    '#334cb2',
    '#7f3fb2',
    '#b24cd8',
    '#f27fa5',
]

export function traverse(doc: DocClass, cb: (item: any) => void) {
    cb(doc)
    doc.getPropValue('pages').forEach(page => {
        cb(page)
        page.getPropValue('children').forEach((shape) => {
            cb(shape)
        })
    })
}
