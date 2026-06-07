// ─── 浏览器 HTTP 实现（fetch） ────────────────────────────────────

import type { HttpOptions, HttpResponse, PlatformHttp } from "../services"

export class WebHttp implements PlatformHttp {
  async get<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("GET", url, undefined, options)
  }

  async post<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("POST", url, data, options)
  }

  async put<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("PUT", url, data, options)
  }

  async delete<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T> | null> {
    return this._request<T>("DELETE", url, undefined, options)
  }

  private async _request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    data?: unknown,
    options?: HttpOptions,
  ): Promise<HttpResponse<T> | null> {
    try {
      const ctrl = new AbortController()
      if (options?.timeout) {
        setTimeout(() => ctrl.abort(), options.timeout)
      }

      const headers: Record<string, string> = { ...options?.header }
      if (method !== "GET" && data && !headers["content-type"]) {
        headers["content-type"] = "application/json"
      }

      const resp = await fetch(url, {
        method,
        headers,
        body: method !== "GET" && data ? (typeof data === "string" ? data : JSON.stringify(data)) : undefined,
        signal: ctrl.signal,
      })

      const respHeaders: Record<string, string> = {}
      resp.headers.forEach((v, k) => {
        respHeaders[k] = v
      })

      let responseData: unknown
      if (options?.responseType === "arraybuffer") {
        responseData = await resp.arrayBuffer()
      } else {
        responseData = await resp.json().catch(() => resp.text())
      }

      return {
        data: responseData as T,
        statusCode: resp.status,
        header: respHeaders,
      }
    } catch {
      return null
    }
  }

  destroy(): void {}
}
