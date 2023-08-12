export type OEvent = string
type ObservableListener = (type: OEvent) => void

export interface Observable {
    addEventListener(type: OEvent, cb: ObservableListener):void
    removeEventListener(type: OEvent, cb: ObservableListener):void
}

export class ObservableBase implements Observable {
    private listeners: Map<OEvent, Array<ObservableListener>>

    constructor() {
        this.listeners = new Map<OEvent, Array<ObservableListener>>();
    }

    protected _get_listeners(type: OEvent): ObservableListener[] {
        if (!this.listeners.has(type)) this.listeners.set(type, new Array<ObservableListener>())
        return this.listeners.get(type) as ObservableListener[]
    }

    public addEventListener(type: OEvent, cb: ObservableListener) {
        this._get_listeners(type).push(cb)
    }

    public removeEventListener(type: OEvent, cb: ObservableListener) {
        let list = this._get_listeners(type)
        list = list.filter(l => l !== cb)
        this.listeners.set(type, list)
    }

    protected fire(type: OEvent, payload: any) {
        this._get_listeners(type).forEach(cb => cb(payload))
    }
}


