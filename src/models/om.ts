// export type EnumSchema<T> = PropDef<T> & {
//     base:'enum'
//     possibleValues:T[]
//     renderer:PropRenderer,
//     fromJSONValue:PropLoader,
// }


// export type ObjectDef<Type> = {
//     name: string,
//     props: Record<keyof Type, PropDef<Type[keyof Type]>>,
// };



export const PropChanged = 'PropChanged'
export const FamilyPropChanged = 'FamilyPropChanged'
// export type EventTypes = typeof PropChanged | typeof FamilyPropChanged
// export type EventHandler = (evt:any) => void
export const HistoryChanged = 'HistoryChanged'
// export type OMEventTypes = typeof HistoryChanged

// export class ObjectProxy<Type extends ObjectDef<any>> {
//     private listeners: Map<EventTypes, WrapperCallback<any>[]>
//     parent: ObjectProxy<ObjectDef<any>> | null
//     def: ObjectDef<any>
//     private uuid: string
//     props:Record<keyof Type['props'], Type['props'][keyof Type['props']]>
//     private proxies: Map<keyof Type['props'], ObjectProxy<any>>
//     private om: ObjectManager
//
//     constructor(om: ObjectManager, def: Type, opts: Record<keyof Type['props'],any>) {
//         this.om = om
//         this.uuid = genId('object')
//         this.def = def
//         this.listeners = new Map()
//         this.parent = null
//         this.props = {} as Record<keyof Type['props'], Type['props'][keyof Type['props']]>
//         Object.keys(def.props).forEach(name => {
//             const key = name as keyof Type['props']
//             const prop = def.props[key]
//             let val = prop.default
//             if(prop.default instanceof Function) val = val()
//             if(opts[prop.name]) val = opts[prop.name]
//             this.props[prop.name] = val
//         })
//         this.proxies = new Map()
//     }
//
//     getPropValue<Key extends keyof Type['props']>(key: Key):Type['props'][Key] {
//         if(this.proxies.has(key)) {
//             return this.proxies.get(key).getPropValue('value')
//         }
//         return this.props[key]
//     }
//
//     async setPropValue<Key extends keyof Type['props']>(prop: Key, value: Type['props'][Key]) {
//         const evt = new PropChangeEvent<Type>(this, this.def.props[prop], value)
//         this._fire(PropChanged, evt)
//         if (this.parent) this.parent._fire(FamilyPropChanged, evt)
//     }
//
//     getListProp<Key extends keyof Type['props']>(prop: Key):Type['props'][Key][] {
//         if(this.def.props[prop].base !== 'list') throw new Error(`prop not a list: ${new String(prop)}`)
//         return this.props[prop]
//     }
//     appendListProp<Key extends keyof Type['props']>(prop: Key, obj: any) {
//         const evt:AppendListEvent<Type> = new AppendListEvent<Type>(this, this.def.props[prop], obj)
//         this._fire(PropChanged, evt)
//         if (this.parent) this.parent._fire(FamilyPropChanged, evt)
//     }
//     async removeListPropByValue<Key extends keyof Type['props']>(prop: Key, obj: any) {
//         const evt:DeleteListEvent<Type> = new DeleteListEvent<Type>(this, this.def.props[prop], obj)
//         this._fire(PropChanged, evt)
//         if (this.parent) this.parent._fire(FamilyPropChanged, evt)
//     }
//     getListPropAt<Key extends keyof Type['props']>(prop: Key, index: number):Type['props'][Key] {
//         return this.props[prop][index]
//     }
//     async setListPropAt<Key extends keyof Type['props']>(prop: Key, index: number, value:any) {
//         const evt:SetListItemEvent<Type> = new SetListItemEvent<Type>(this, this.def.props[prop], index, value)
//         this._fire(PropChanged, evt)
//         if (this.parent) this.parent._fire(FamilyPropChanged, evt)
//     }
//     async insertListPropAt<K extends keyof Type['props']>(prop: K, index: number, value: any) {
//         const evt:InsertListItemEvent<Type> = new InsertListItemEvent<Type>(this, this.def.props[prop], index, value)
//         this._fire(PropChanged, evt)
//         if (this.parent) this.parent._fire(FamilyPropChanged, evt)
//     }
//     async removeListPropAt<K extends keyof Type['props']>(prop: K, index: number) {
//         const evt:RemoveListItemEvent<Type> = new RemoveListItemEvent<Type>(this, this.def.props[prop], index)
//         this._fire(PropChanged, evt)
//         if (this.parent) this.parent._fire(FamilyPropChanged, evt)
//     }
//
//     private _get_listeners(type: EventTypes):EventHandler[] {
//         if(!this.listeners.has(type)) this.listeners.set(type,[])
//         return this.listeners.get(type) as EventHandler[]
//     }
//     addEventListener(type: EventTypes, handler: EventHandler) {
//         this._get_listeners(type).push(handler)
//     }
//     removeEventListener(type: EventTypes, handler: EventHandler) {
//         this.listeners.set(type, this._get_listeners(type).filter(h => h !== handler))
//     }
//     private _fire(type: EventTypes, value: any) {
//         if (!this.listeners.get(type)) this.listeners.set(type, [])
//         this.listeners.get(type).forEach(cb => cb(value))
//     }
//
//     setParent(parent: ObjectProxy<any>|null) {
//         this.parent = parent
//     }
//
//     getPropSchemas() {
//         return Object.values(this.def.props)
//     }
//     getPropSchemaNamed(name:string) {
//         return this.def.props[name]
//     }
//     hasPropNamed(uuid: string) {
//         return this.def.props.hasOwnProperty(uuid)
//     }
//     setPropProxySource(name:string, source:ObjectProxy<any>) {
//         this.proxies.set(name,source)
//     }
//     getPropProxySource(name: string):ObjectProxy<any> {
//         return this.proxies.get(name)
//     }
//     removePropProxySource<K extends keyof Type['props']>(key:K) {
//         if(this.proxies.has(key)) {
//             const value =  this.proxies.get(key).getPropValue('value')
//             this.props[key] = value
//             this.proxies.delete(key)
//         }
//     }
//     isPropProxySource<Key extends keyof Type['props']>(key:Key) {
//         return this.proxies.has(key)
//     }
//     getUUID() {
//         return this.uuid
//     }
//     refresh(prop:PropDef){}
//
//     _setUUID(uuid: string) {
//         this.uuid = uuid
//     }
// }






/// history log events
// interface HistoryEvent {
//     uuid:string
//     desc: string
//     compressable: boolean
//     undo():Promise<void>
//     redo():Promise<void>
// }
// class AppendListEvent<T> implements HistoryEvent {
//     target: ObjectProxy<ObjectDef>
//     def: ObjectDef
//     prop: PropDef
//     oldValue:any
//     newValue:any
//     obj: ObjectProxy<ObjectDef>
//     desc: string
//     uuid: string
//     compressable: boolean
//     constructor(target:ObjectProxy<ObjectDef>, prop: PropDef, obj: ObjectProxy<ObjectDef>) {
//         this.uuid = genId('event:appendlist')
//         this.target = target
//         this.def = target.def
//         this.prop = prop
//         this.obj = obj
//
//         const list = this.target.getPropValue(this.prop.name)
//         const oldList = list.slice()
//         list.push(this.obj)
//         if(this.obj.setParent) this.obj.setParent(this.target)
//         const newList = list.slice()
//         this.oldValue = oldList
//         this.newValue = newList
//         this.desc = `added element`
//         this.compressable = false
//     }
//
//
//     async redo(): Promise<void> {
//         const list = this.target.getListProp(this.prop.name)
//         list.push(this.obj)
//         this.obj.setParent(this.target)
//     }
//
//     async undo(): Promise<void> {
//         const list = this.target.getListProp(this.prop.name)
//         list.splice(list.length-1,1)
//         this.obj.setParent(null)
//     }
// }
// class SetListItemEvent<T> implements HistoryEvent {
//     uuid: string
//     private target: ObjectProxy<ObjectDef>
//     private prop: PropDef
//     compressable: boolean
//     desc: string
//     constructor(target:ObjectProxy<ObjectDef>, prop: PropDef, index:number, value:ObjectProxy<ObjectDef>) {
//         this.uuid = genId('event:setlistelement')
//         this.target = target
//         this.prop = prop
//         const list = this.target.getPropValue(this.prop.name)
//         const oldList = list.slice()
//         const newList = list.slice()
//         list[index] = value
//         this.desc = `set element`
//         this.compressable = false
//     }
//
//     redo(): Promise<void> {
//         return Promise.resolve(undefined)
//     }
//
//     undo(): Promise<void> {
//         return Promise.resolve(undefined)
//     }
// }
// class InsertListItemEvent<T> implements HistoryEvent {
//     uuid: string
//     private target: ObjectProxy<ObjectDef>
//     private prop: PropDef
//     compressable: boolean
//     desc: string
//     constructor(target:ObjectProxy<ObjectDef>, prop: PropDef, index:number, value:ObjectProxy<ObjectDef>) {
//         this.uuid = genId('event:setlistelement')
//         this.target = target
//         this.prop = prop
//         const list = this.target.getPropValue(this.prop.name)
//         console.log("inserting at", index)
//         const oldList = list.slice()
//         const newList = list.slice()
//         list.splice(index,0,value)
//         this.desc = `set element`
//         this.compressable = false
//     }
//     redo(): Promise<void> {
//         return Promise.resolve(undefined)
//     }
//     undo(): Promise<void> {
//         return Promise.resolve(undefined)
//     }
// }
// class RemoveListItemEvent<T> implements HistoryEvent {
//     uuid: string
//     private target: ObjectProxy<ObjectDef>
//     private prop: PropDef
//     compressable: boolean
//     desc: string
//     constructor(target:ObjectProxy<ObjectDef>, prop: PropDef, index:number) {
//         this.uuid = genId('event:dellistelement')
//         this.target = target
//         this.prop = prop
//         const list = this.target.getPropValue(this.prop.name)
//         console.log("deleting at", index)
//         const oldList = list.slice()
//         const newList = list.slice()
//         list.splice(index,1)
//         this.desc = `del element`
//         this.compressable = false
//     }
//
//     redo(): Promise<void> {
//         return Promise.resolve(undefined)
//     }
//
//     undo(): Promise<void> {
//         return Promise.resolve(undefined)
//     }
// }
// class DeleteListEvent<T> implements HistoryEvent {
//     target: ObjectProxy<any>
//     def: ObjectDef
//     prop: PropDef
//     oldValue:any
//     newValue:any
//     desc: string
//     uuid: string
//     index: number
//     obj: ObjectProxy<any>
//     compressable: boolean
//     constructor(target:ObjectProxy<any>, prop:PropDef, obj:ObjectProxy<any>) {
//         this.uuid = genId('event:deletelist')
//         this.target = target
//         this.def = target.def
//         this.prop = prop
//         this.desc = `deleted element`
//
//         const list = target.getPropValue(prop.name)
//         const oldList = list.slice()
//         this.obj = obj
//         this.index = list.indexOf(this.obj)
//         if(this.index >= 0) {
//             list.splice(this.index,1)
//         }
//         const newList = list.slice()
//         this.oldValue = oldList
//         this.newValue = newList
//         if(this.obj.setParent) this.obj.setParent(null)
//         this.compressable = false
//     }
//
//     async redo(): Promise<void> {
//         const list = this.target.getPropValue(this.prop.name)
//         list.splice(this.index,1)
//         this.obj.setParent(null)
//     }
//
//     async undo(): Promise<void> {
//         const list = this.target.getPropValue(this.prop.name)
//         list.splice(this.index,0,this.obj)
//         this.obj.setParent(this.target)
//     }
// }
// class CreateObjectEvent<T extends ObjectDef> implements HistoryEvent {
//     desc: string
//     uuid: string
//     target: ObjectProxy<T>
//     private om: ObjectManager
//     compressable: boolean
//
//     constructor(om: ObjectManager, obj:ObjectProxy<any>) {
//         this.om = om
//         this.om.addObject(obj)
//         this.uuid = genId('event:createobject')
//         this.desc = 'not implemented'
//         this.target = obj
//         this.desc = `created object from def ${this.target.def.name}`
//         this.compressable = false
//     }
//
//     async redo(): Promise<void> {
//         await this.om.addObject(this.target)
//     }
//     async undo(): Promise<void> {
//         await this.om.removeObject(this.target)
//     }
// }
// class DeleteObjectEvent<T> implements HistoryEvent {
//     desc: string
//     uuid: string
//     compressable: boolean
//     constructor() {
//         this.uuid = genId('event:deleteobject')
//         this.desc = 'not implemented'
//         this.compressable = false
//     }
//
//     redo(): Promise<void> {
//         throw new Error("not implemented")
//     }
//
//     undo(): Promise<void> {
//         throw new Error("not implemented")
//     }
//
// }
// class PropChangeEvent<T extends ObjectDef> implements HistoryEvent {
//     target: ObjectProxy<T>
//     def: ObjectDef
//     prop: PropDef
//     oldValue:any
//     newValue:any
//     desc: string
//     uuid: string
//     compressable: boolean
//     constructor(target:ObjectProxy<T>, prop:PropDef, value:any) {
//         this.uuid = genId('event:propchange')
//         this.target = target
//         this.def = target.def
//         this.prop = prop
//         this.oldValue = target.getPropValue(prop.name)
//         this.newValue = value
//         this.desc = `${prop.name} ${this.oldValue} => ${value}`
//         // @ts-ignore
//         this.target.props[prop.name] = value
//         if(target.refresh) target.refresh(prop)
//         this.compressable = true
//     }
//
//     async redo(): Promise<void> {
//         await this.target.setPropValue(this.prop.name as keyof T['props'], this.newValue)
//     }
//
//     async undo(): Promise<void> {
//         await this.target.setPropValue(this.prop.name as keyof T['props'], this.oldValue)
//     }
//
//     compressWithSelf(recent: PropChangeEvent<T>) {
//         this.newValue = recent.newValue
//     }
// }
//
// export class ObjectManager {
//     private defs: Map<string, ObjectDef>
//     private classes: Map<string, any>
//     private _proxies: Map<string, ObjectProxy<ObjectDef>>
//     private global_prop_change_handler: (e:any) => void
//     private changes: HistoryEvent[]
//     private _undoing: boolean
//     private current_change_index: number
//     private listeners:Map<OMEventTypes,[]>
//     private compressing: boolean
//
//     constructor() {
//         this.listeners = new Map()
//         this.defs = new Map()
//         this.classes = new Map()
//         this._proxies = new Map()
//         this.changes = []
//         this._undoing = false
//         this.current_change_index = -1
//         this.compressing = false
//         this.global_prop_change_handler = (evt:PropChangeEvent<any>) => {
//             if(this._undoing) return
//             if(this.changes.length > this.current_change_index+1) {
//                 this.changes = this.changes.slice(0,this.current_change_index+1)
//             }
//             this.changes.push(evt)
//             this.current_change_index++
//             this._fire(HistoryChanged, {})
//         }
//     }
//     addEventListener(type: OMEventTypes, cb: (evt: any) => void) {
//         if (!this.listeners.get(type)) this.listeners.set(type, [])
//         this.listeners.get(type).push(cb)
//     }
//     removeEventListener(type: OMEventTypes, cb: any) {
//         if (!this.listeners.get(type)) this.listeners.set(type, [])
//         this.listeners.set(type, this.listeners.get(type).filter(c => c !== cb))
//     }
//     private _fire(type: OMEventTypes, value: any) {
//         if (!this.listeners.get(type)) this.listeners.set(type, [])
//         this.listeners.get(type).forEach(cb => cb(value))
//     }
//     make(def: ObjectDef, props: any, uuid?:string) {
//         const cons = this.lookupConstructor(def.name)
//         const obj:ObjectProxy<any> = new cons(def,props)
//         const evt = new CreateObjectEvent(this,obj)
//         this.changes.push(evt)
//         this.current_change_index++
//         evt.target.addEventListener(PropChanged, this.global_prop_change_handler)
//         if(uuid) obj._setUUID(uuid)
//         return evt.target
//     }
//
//     lookupDef(name: string) {
//         if (!this.defs.has(name)) throw new Error(`cannot restore without def for ${name}`)
//         return this.defs.get(name)
//     }
//     lookupConstructor(name: string) {
//         if (!this.classes.has(name)) throw new Error(`cannot restore without class for ${name}`)
//         return this.classes.get(name)
//     }
//
//     registerDef(def: ObjectDef, clazz:any) {
//         this.defs.set(def.name, def)
//         this.classes.set(def.name, clazz)
//     }
//
//     canUndo() {
//         if(this.current_change_index >= 0) return true
//         return false
//     }
//
//     canRedo() {
//         if(this.current_change_index < this.changes.length-1) return true
//         return false
//     }
//
//     async performUndo() {
//         if(!this.canUndo()) return
//         const recent = this.changes[this.current_change_index]
//         this._undoing = true
//         await recent.undo()
//         this._undoing = false
//         this.current_change_index--
//         this._fire(HistoryChanged, {})
//     }
//
//     async performRedo() {
//         if(!this.canRedo()) return
//         this.current_change_index++
//         const recent = this.changes[this.current_change_index]
//         this._undoing = true
//         await recent.redo()
//         this._undoing = false
//         this._fire(HistoryChanged, {})
//     }
//
//     dumpHistory() {
//         console.log("len",this.changes.length, "current",this.current_change_index)
//         const changes = this.changes.map((ch,i) => {
//             const active = (i === this.current_change_index)
//             return `${active?'*':' '} ${ch.uuid}: ${ch.desc} ${ch.compressable?'!':'_'}`
//         }).join("\n")
//
//         console.log(`history
// ${changes}`)
//         // console.log('can undo',this.canUndo(), 'can redo', this.canRedo())
//     }
//
//     history() {
//         return this.changes
//     }
//
//     hasObject(uuid: string) {
//         return this._proxies.has(uuid)
//     }
//     getObject(uuid:string) {
//         return this._proxies.get(uuid)
//     }
//
//     async removeObject<O extends ObjectDef<any>>(target: ObjectProxy<O>) {
//         this._proxies.delete(target.getUUID())
//     }
//
//     addObject(proxy: ObjectProxy<any>) {
//         this._proxies.set(proxy.getUUID(),proxy)
//     }
//
//     setCompressingHistory(compressing: boolean) {
//         this.compressing = compressing
//         if(!compressing) {
//             while(this.compressHistory()) { }
//             // console.log("compressing")
//             const last = this.changes[this.current_change_index]
//             if(last instanceof PropChangeEvent) {
//                 last.compressable = false
//             }
//             // this.dumpHistory()
//         }
//     }
//
//     private compressHistory() {
//         const recent = this.changes[this.current_change_index]
//         if(recent instanceof PropChangeEvent) {
//             if(this.current_change_index-1 > 0) {
//                 const prev = this.changes[this.current_change_index - 1]
//                 if(prev instanceof PropChangeEvent && (prev as PropChangeEvent<any>).compressable) {
//                     if(prev.prop.name === recent.prop.name) {
//                         prev.compressWithSelf(recent)
//                         this.changes.splice(this.current_change_index, 1)
//                         this.current_change_index -= 1
//                         return true
//                     }
//                 }
//             }
//         }
//         return false
//     }
// }
//
// export type OO = ObjectProxy<ObjectDef>
