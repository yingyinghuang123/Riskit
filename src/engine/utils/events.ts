// ─── 泛型事件发射器 ──────────────────────────────────────────────

export type EventHandler<T = any> = (data: T) => void

export interface IEventEmitter<EventMap extends Record<string, any> = Record<string, any>> {
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): this
  once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): this
  off<K extends keyof EventMap>(event: K, handler?: EventHandler<EventMap[K]>): this
  emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): this
}

export class EventEmitter<EventMap extends Record<string, any> = Record<string, any>>
  implements IEventEmitter<EventMap>
{
  private _listeners = new Map<keyof EventMap, Set<EventHandler>>()
  private _onceSet = new WeakSet<EventHandler>()

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event)!.add(handler)
    return this
  }

  once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): this {
    this._onceSet.add(handler)
    return this.on(event, handler)
  }

  off<K extends keyof EventMap>(event: K, handler?: EventHandler<EventMap[K]>): this {
    if (!handler) {
      this._listeners.delete(event)
      return this
    }
    const set = this._listeners.get(event)
    if (set) {
      set.delete(handler)
      if (set.size === 0) this._listeners.delete(event)
    }
    return this
  }

  emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): this {
    const set = this._listeners.get(event)
    if (!set) return this
    for (const handler of Array.from(set)) {
      handler(data)
      if (this._onceSet.has(handler)) {
        set.delete(handler)
        this._onceSet.delete(handler)
      }
    }
    if (set.size === 0) this._listeners.delete(event)
    return this
  }

  removeAllListeners(): this {
    this._listeners.clear()
    return this
  }

  listenerCount<K extends keyof EventMap>(event: K): number {
    return this._listeners.get(event)?.size ?? 0
  }
}
