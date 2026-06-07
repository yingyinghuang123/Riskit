// ─── 传感器 — 加速计 & 陀螺仪 ───────────────────────────────────

import { getPlatform } from "../platform/platform"

export interface SensorVec3 {
  x: number
  y: number
  z: number
}

export class Sensors {
  readonly accelerometer: SensorVec3 = { x: 0, y: 0, z: 0 }
  readonly gyroscope: SensorVec3 = { x: 0, y: 0, z: 0 }

  private _accelEnabled = false
  private _gyroEnabled = false
  private _accelHandlers: Array<(data: SensorVec3) => void> = []
  private _gyroHandlers: Array<(data: SensorVec3) => void> = []

  enableAccelerometer(interval: "game" | "ui" | "normal" = "game"): void {
    if (this._accelEnabled) return
    this._accelEnabled = true
    try {
      const platform = getPlatform()
      platform.startAccelerometer(interval)
      platform.onAccelerometerChange((res) => {
        this.accelerometer.x = res.x
        this.accelerometer.y = res.y
        this.accelerometer.z = res.z
        for (const fn of this._accelHandlers) fn(this.accelerometer)
      })
    } catch {
      /* 平台不支持 */
    }
  }

  disableAccelerometer(): void {
    if (!this._accelEnabled) return
    this._accelEnabled = false
    try {
      getPlatform().stopAccelerometer()
    } catch {
      /* ignore */
    }
  }

  enableGyroscope(interval: "game" | "ui" | "normal" = "game"): void {
    if (this._gyroEnabled) return
    this._gyroEnabled = true
    try {
      const platform = getPlatform()
      platform.startGyroscope(interval)
      platform.onGyroscopeChange((res) => {
        this.gyroscope.x = res.x
        this.gyroscope.y = res.y
        this.gyroscope.z = res.z
        for (const fn of this._gyroHandlers) fn(this.gyroscope)
      })
    } catch {
      /* 平台不支持 */
    }
  }

  disableGyroscope(): void {
    if (!this._gyroEnabled) return
    this._gyroEnabled = false
    try {
      getPlatform().stopGyroscope()
    } catch {
      /* ignore */
    }
  }

  onAccelChange(handler: (data: SensorVec3) => void): void {
    this._accelHandlers.push(handler)
  }

  onGyroChange(handler: (data: SensorVec3) => void): void {
    this._gyroHandlers.push(handler)
  }

  destroy(): void {
    this.disableAccelerometer()
    this.disableGyroscope()
    this._accelHandlers.length = 0
    this._gyroHandlers.length = 0
  }
}
