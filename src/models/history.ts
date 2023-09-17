export interface HistoryEvent {
    // uuid:string
    // desc: string
    // compressable: boolean
    undo(): Promise<void>

    redo(): Promise<void>
}

export class HistoryBuffer {
    private changes: HistoryEvent[]
    _undoing: boolean
    private current_change_index: number

    constructor() {
        this.changes = []
        this._undoing = false
        this.current_change_index = -1
    }

    get length() {
        return this.changes.length
    }

    push(evt: HistoryEvent) {
        if (this._undoing) return
        if (this.changes.length > this.current_change_index + 1) {
            this.changes = this.changes.slice(0, this.current_change_index + 1)
        }
        this.changes.push(evt)
        this.current_change_index++
    }

    dumpHistory() {
        console.log("len", this.changes.length, "current", this.current_change_index)
        const changes = this.changes.map((ch, i) => {
            const active = (i === this.current_change_index)
            return `${active ? '*' : ' '} ${ch.constructor.name}`
            // return `${active ? '*' : ' '} ${ch.uuid}: ${ch.desc} ${ch.compressable ? '!' : '_'}`
        }).join("\n")

        console.log(`history
${changes}`)
        // console.log('can undo',this.canUndo(), 'can redo', this.canRedo())
    }

    canUndo() {
        if (this.current_change_index >= 0) return true
        return false
    }

    canRedo() {
        if (this.current_change_index < this.changes.length - 1) return true
        return false
    }

    async performUndo() {
        console.log('perform undo')
        if (!this.canUndo()) return
        console.log("really doing it")
        const recent = this.changes[this.current_change_index]
        console.log("undoing", recent)
        this._undoing = true
        await recent.undo()
        this._undoing = false
        this.current_change_index--
    }

    async performRedo() {
        if (!this.canRedo()) return
        this.current_change_index++
        const recent = this.changes[this.current_change_index]
        this._undoing = true
        await recent.redo()
        this._undoing = false
        // this._fire(HistoryChanged, {})
    }
    // setCompressingHistory(compressing: boolean) {
    //     this.compressing = compressing
    //     if(!compressing) {
    //         while(this.compressHistory()) { }
    //         // console.log("compressing")
    //         const last = this.changes[this.current_change_index]
    //         if(last instanceof PropChangeEvent) {
    //             last.compressable = false
    //         }
    //         // this.dumpHistory()
    //     }
    // }
    //
    // private compressHistory() {
    //     const recent = this.changes[this.current_change_index]
    //     if(recent instanceof PropChangeEvent) {
    //         if(this.current_change_index-1 > 0) {
    //             const prev = this.changes[this.current_change_index - 1]
    //             if(prev instanceof PropChangeEvent && (prev as PropChangeEvent<any>).compressable) {
    //                 if(prev.prop.name === recent.prop.name) {
    //                     prev.compressWithSelf(recent)
    //                     this.changes.splice(this.current_change_index, 1)
    //                     this.current_change_index -= 1
    //                     return true
    //                 }
    //             }
    //         }
    //     }
    //     return false
    // }
}
