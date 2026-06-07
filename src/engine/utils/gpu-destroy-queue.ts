// ─── GPU 资源延迟销毁队列 ─────────────────────────────────────────
//
// 问题：PixiJS 对象的 destroy() 会触发 GL 操作（glDeleteTexture 等），
// 如果在 update 阶段（非渲染阶段）执行，GL context 的 texture unit 绑定
// 可能残留 Three.js 的状态，导致微信开发者工具报
// "RENDER WARNING: there is no texture bound to the unit N"。
//
// 方案：游戏逻辑层只做标记，GPU 资源的实际销毁延迟到渲染阶段
// （resetState 之后、render 之前），此时 GL 状态已被正确初始化。
//
// 额外收益：零散的 glDeleteTexture 合并为批量操作，减少 GL 状态切换。

type DestroyFn = () => void

const _queue: DestroyFn[] = []

/**
 * 将一个 GPU 资源销毁操作放入延迟队列。
 * 实际执行时机：下一帧渲染前，GL 状态被 resetState 清理之后。
 *
 * @example
 * // 在 node.destroy() 中，替代直接调用 pixiObj.destroy()
 * deferGpuDestroy(() => pixiObj.destroy({ children: true }))
 *
 * // 在 sprite.onDestroy() 中，替代直接调用 texture.destroy(true)
 * deferGpuDestroy(() => texture.destroy(true))
 */
export function deferGpuDestroy(fn: DestroyFn): void {
  _queue.push(fn)
}

/**
 * 批量执行队列中所有待销毁操作，然后清空队列。
 * 由 engine._render() 在 resetState 之后、render 之前调用。
 */
export function flushGpuDestroyQueue(): void {
  if (_queue.length === 0) return
  const len = _queue.length
  for (let i = 0; i < len; i++) {
    try {
      _queue[i]()
    } catch {
      // GPU 资源可能已被释放（如 context lost），静默跳过
    }
  }
  _queue.length = 0
}
