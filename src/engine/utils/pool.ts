// ─── 泛型对象池 ──────────────────────────────────────────────────

export interface Pool<T> {
  get(): T
  release(item: T): void
  each(fn: (item: T) => void): void
  releaseAll(): void
  readonly activeCount: number
  readonly poolSize: number
}

export function createPool<T>(factory: () => T, reset?: (item: T) => void): Pool<T> {
  const available: T[] = []
  const active: T[] = []

  return {
    get(): T {
      const item = available.length > 0 ? available.pop()! : factory()
      active.push(item)
      return item
    },

    release(item: T): void {
      const idx = active.indexOf(item)
      if (idx === -1) return
      // 交换到末尾后弹出，避免数组中间 splice
      active[idx] = active[active.length - 1]
      active.pop()
      reset?.(item)
      available.push(item)
    },

    each(fn: (item: T) => void): void {
      // 倒序遍历，允许回调中 release
      for (let i = active.length - 1; i >= 0; i--) {
        fn(active[i])
      }
    },

    releaseAll(): void {
      for (let i = active.length - 1; i >= 0; i--) {
        reset?.(active[i])
        available.push(active[i])
      }
      active.length = 0
    },

    get activeCount(): number {
      return active.length
    },

    get poolSize(): number {
      return available.length
    },
  }
}
