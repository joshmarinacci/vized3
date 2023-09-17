import {describe, expect, it} from "vitest"

import {GlobalState} from "../models/state"
import {saveJSON} from "./json"
import {deleteLocalDoc, listLocalDocs, loadLocalDoc, saveLocalStorage} from "./local"

class FakeLocalStorage implements Storage{
    // [name: string]: any

    readonly length: number
    private items:Map<string,string>
    constructor() {
        this.length = 0
        this.items = new Map()
    }
    clear(): void {
        this.items.clear()
    }

    getItem(key: string): string | null {
        if(!this.items.has(key)) return null
        return this.items.get(key) as string
    }

    key(index: number): string | null {
        return undefined
    }

    removeItem(key: string): void {
        this.items.delete(key)
    }

    setItem(key: string, value: string): void {
        this.items.set(key,value)
    }
}

describe('json', () => {
    it('should have empty local storage', async () => {
        const state = new GlobalState({
            localStorage:new FakeLocalStorage()
        })
        const index = await listLocalDocs(state)
        expect(index.length).toBe(0)
    })
    it('should save to local storage', async () => {
        const state = new GlobalState({
            localStorage:new FakeLocalStorage()
        })

        expect(state).toBeTruthy()
        await saveLocalStorage(state,false)
    })
    it('should list from local storage', async () => {
        const state = new GlobalState({
            localStorage:new FakeLocalStorage()
        })
        const uuid = state.getCurrentDocument().getUUID()
        console.log("original uuid is",uuid)
        await saveLocalStorage(state,false)

        const list = await listLocalDocs(state)
        console.log("list is",list)
        const found = list.filter(jd => jd.uuid === uuid)
        expect(found.length).toBe(1)
    })

    it('should save and update using local storage', async () => {
        const state = new GlobalState({
            localStorage:new FakeLocalStorage()
        })
        const uuid = state.getCurrentDocument().getUUID()
        console.log("original uuid is",uuid)
        {
            const json_doc = saveJSON(state)
            expect(json_doc.root.uuid).toEqual(uuid)
        }
        {
            await saveLocalStorage(state, false)
            const list = await listLocalDocs(state)
            console.log("list is", list)
            const found = list.filter(jd => jd.uuid === uuid)
            expect(found.length).toBe(1)
        }
        {
            const new_doc = await loadLocalDoc(state, uuid)
            // console.log("new doc is",new_doc)
            expect(new_doc.getUUID()).toEqual(uuid)
            const page = new_doc.getPropValue('pages')[0]
            expect(page.getPropValue('children').length).toBe(4)
        }

    })

    it('shoudl delete from storage', async () => {
        const state = new GlobalState({
            localStorage:new FakeLocalStorage()
        })
        const uuid = state.getCurrentDocument().getUUID()
        await saveLocalStorage(state, false)
        {
            const list = await listLocalDocs(state)
            expect(list.length).toBe(1)
        }
        await deleteLocalDoc(state,uuid)
        {
            const list = await listLocalDocs(state)
            expect(list.length).toBe(0)
        }
    })
})
