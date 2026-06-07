// ─── 设备端 AI 推理 ────────────────────────────────────────────────────

import type { InferenceSession, PlatformAI } from "../services"

export class WxAI implements PlatformAI {
  private _sessions: any[] = []

  /** 创建推理会话 */
  async createSession(modelPath: string): Promise<InferenceSession | null> {
    try {
      const session = await new Promise<any>((resolve, reject) => {
        try {
          const s = (wx as any).createInferenceSession({
            model: modelPath,
            precisionLevel: 4,
          })
          s.onLoad(() => resolve(s))
          s.onError((err: any) => reject(err))
        } catch (e) {
          reject(e)
        }
      })

      this._sessions.push(session)

      return {
        async run(input: Record<string, unknown>): Promise<Record<string, unknown> | null> {
          try {
            return await session.run(input)
          } catch {
            return null
          }
        },
        destroy() {
          try {
            session.destroy()
          } catch {
            /* 静默 */
          }
        },
      }
    } catch {
      return null
    }
  }

  destroy(): void {
    for (const s of this._sessions) {
      try {
        s.destroy()
      } catch {
        /* 静默 */
      }
    }
    this._sessions.length = 0
  }
}
