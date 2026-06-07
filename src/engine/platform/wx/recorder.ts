// ─── 游戏录屏 ──────────────────────────────────────────────────────

import type { RecorderOptions, RecorderResult, PlatformRecorder } from "../services"
export class WxRecorder implements PlatformRecorder {
  private _recorder: WxGameRecorder | null = null
  private _recording = false

  private _getRecorder(): WxGameRecorder {
    if (!this._recorder) {
      this._recorder = wx.createGameRecorder()
    }
    return this._recorder
  }

  /** 开始录屏 */
  start(options?: RecorderOptions): boolean {
    if (this._recording) return false
    try {
      this._getRecorder().start({
        duration: options?.duration ?? 300,
        bitrate: options?.bitrate,
        fps: options?.fps,
        gop: options?.gop,
      })
      this._recording = true
      return true
    } catch {
      return false
    }
  }

  /** 停止录屏 */
  async stop(): Promise<RecorderResult | null> {
    if (!this._recording || !this._recorder) return null
    try {
      const result = await this._recorder.stop()
      this._recording = false
      return { duration: result.duration }
    } catch {
      this._recording = false
      return null
    }
  }

  /** 暂停录屏 */
  pause(): boolean {
    if (!this._recording || !this._recorder) return false
    try {
      this._recorder.pause()
      return true
    } catch {
      return false
    }
  }

  /** 恢复录屏 */
  resume(): boolean {
    if (!this._recorder) return false
    try {
      this._recorder.resume()
      return true
    } catch {
      return false
    }
  }

  /** 中止录屏 */
  abort(): void {
    if (this._recorder) {
      try {
        this._recorder.abort()
      } catch {
        /* 静默 */
      }
      this._recording = false
    }
  }

  /** 是否正在录屏 */
  get isRecording(): boolean {
    return this._recording
  }

  destroy(): void {
    this.abort()
    this._recorder = null
  }
}
