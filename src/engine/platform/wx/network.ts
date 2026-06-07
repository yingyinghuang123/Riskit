// ─── 网络模块 ──────────────────────────────────────────────────────

import type { HttpOptions, HttpResponse, WebSocketClient, PlatformHttp, PlatformWebSocket } from "../services"

export class WxHttp implements PlatformHttp {
  /** GET 请求 */
  async get<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("GET", url, undefined, options)
  }

  /** POST 请求 */
  async post<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("POST", url, data, options)
  }

  /** PUT 请求 */
  async put<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("PUT", url, data, options)
  }

  /** DELETE 请求 */
  async delete<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("DELETE", url, undefined, options)
  }

  private async _request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    data?: unknown,
    options?: HttpOptions,
  ): Promise<HttpResponse<T> | null> {
    return new Promise((resolve) => {
      try {
        wx.request({
          url,
          method,
          data: data as string | Record<string, unknown> | ArrayBuffer,
          header: options?.header,
          timeout: options?.timeout,
          responseType: options?.responseType,
          success: (res) =>
            resolve({
              data: res.data as T,
              statusCode: res.statusCode,
              header: res.header,
            }),
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  destroy(): void {
    // 无需清理
  }
}

export class WxWebSocket implements PlatformWebSocket {
  /** 连接 WebSocket */
  connect(url: string, options?: { header?: Record<string, string>; protocols?: string[] }): WebSocketClient {
    let task: WxSocketTask | null = null
    const messageHandlers: Array<(data: string | ArrayBuffer) => void> = []
    const closeHandlers: Array<(code: number, reason: string) => void> = []
    const errorHandlers: Array<(msg: string) => void> = []

    try {
      task = wx.connectSocket({
        url,
        header: options?.header,
        protocols: options?.protocols,
      })

      task.onMessage((res) => {
        for (const fn of messageHandlers) {
          try {
            fn(res.data)
          } catch {
            /* 静默 */
          }
        }
      })

      task.onClose((res) => {
        for (const fn of closeHandlers) {
          try {
            fn(res.code, res.reason)
          } catch {
            /* 静默 */
          }
        }
      })

      task.onError((res) => {
        for (const fn of errorHandlers) {
          try {
            fn(res.errMsg)
          } catch {
            /* 静默 */
          }
        }
      })
    } catch {
      /* 静默 */
    }

    const client: WebSocketClient = {
      send(data: string | ArrayBuffer) {
        try {
          task?.send({ data })
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
          task?.close({ code, reason })
        } catch {
          /* 静默 */
        }
      },
    }

    return client
  }

  destroy(): void {
    // 无需清理
  }
}
