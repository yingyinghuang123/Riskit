// ─── 浏览器 WebSocket 实现 ────────────────────────────────────────

import type { WebSocketClient, PlatformWebSocket } from "../services"

export class WebWebSocket implements PlatformWebSocket {
  connect(url: string, options?: { header?: Record<string, string>; protocols?: string[] }): WebSocketClient {
    const ws = new WebSocket(url, options?.protocols)
    const messageHandlers: Array<(data: string | ArrayBuffer) => void> = []
    const closeHandlers: Array<(code: number, reason: string) => void> = []
    const errorHandlers: Array<(msg: string) => void> = []

    ws.addEventListener("message", (e) => {
      for (const fn of messageHandlers) {
        try {
          fn(e.data)
        } catch {
          /* 静默 */
        }
      }
    })
    ws.addEventListener("close", (e) => {
      for (const fn of closeHandlers) {
        try {
          fn(e.code, e.reason)
        } catch {
          /* 静默 */
        }
      }
    })
    ws.addEventListener("error", () => {
      for (const fn of errorHandlers) {
        try {
          fn("WebSocket error")
        } catch {
          /* 静默 */
        }
      }
    })

    const client: WebSocketClient = {
      send(data: string | ArrayBuffer) {
        try {
          ws.send(data)
        } catch {
          /* 静默 */
        }
      },
      onMessage(fn) {
        messageHandlers.push(fn)
        return client
      },
      onClose(fn) {
        closeHandlers.push(fn)
        return client
      },
      onError(fn) {
        errorHandlers.push(fn)
        return client
      },
      close(code?: number, reason?: string) {
        try {
          ws.close(code, reason)
        } catch {
          /* 静默 */
        }
      },
    }

    return client
  }

  destroy(): void {}
}
