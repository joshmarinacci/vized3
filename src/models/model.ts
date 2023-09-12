export type OEventType = string
export type OEventPayload = object
export type OEvent = {
    type:OEventType,
    payload?:OEventPayload
}
export type ObservableListener = (type: OEvent) => Promise<void>

export interface Observable {
    addEventListener(type: OEventType, cb: ObservableListener):void
    removeEventListener(type: OEventType, cb: ObservableListener):void
}

export class ObservableBase implements Observable {
    private listeners: Map<OEventType, Array<ObservableListener>>

    constructor() {
        this.listeners = new Map<OEventType, Array<ObservableListener>>()
    }

    protected _get_listeners(type: OEventType): ObservableListener[] {
        if (!this.listeners.has(type)) this.listeners.set(type, new Array<ObservableListener>())
        return this.listeners.get(type) as ObservableListener[]
    }

    public addEventListener(type: OEventType, cb: ObservableListener) {
        this._get_listeners(type).push(cb)
    }

    public removeEventListener(type: OEventType, cb: ObservableListener) {
        let list = this._get_listeners(type)
        list = list.filter(l => l !== cb)
        this.listeners.set(type, list)
    }

    protected async fire(type: OEventType, payload: OEventPayload) {
        const evt: OEvent = {
            type: type,
            payload: payload
        }
        for (const cb of this._get_listeners(type)) {
            await cb(evt)
        }
    }
}


