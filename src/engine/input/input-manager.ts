// ─── 输入管理器 — scene.input 统一入口 ──────────────────────────

import { TouchSystem, type PointerState } from "./touch"
import { GestureRecognizer, type SwipeDirection, type GestureConfig } from "./gesture"
import { Keyboard, type KeyState } from "./keyboard"
import { GamepadInput, type StickState, type GamepadButtonState } from "./gamepad"
import { Sensors, type SensorVec3 } from "./sensors"
import { SoftKeyboard, type TextInputOptions } from "./soft-keyboard"
import type { Node, TouchData } from "../nodes/node"

export class InputManager {
  readonly touch: TouchSystem
  readonly gesture: GestureRecognizer
  readonly keyboard: Keyboard
  readonly gamepad: GamepadInput
  readonly sensors: Sensors
  readonly softKeyboard: SoftKeyboard

  private _root: Node | null = null
  private _initialized = false
  private _touchStartTarget: Node | null = null
  constructor(config?: GestureConfig) {
    this.touch = new TouchSystem()
    this.gesture = new GestureRecognizer(this.touch, config)
    this.keyboard = new Keyboard()
    this.gamepad = new GamepadInput()
    this.sensors = new Sensors()
    this.softKeyboard = new SoftKeyboard()
  }

  /** 初始化并绑定事件到节点树根节点 */
  init(root: Node): void {
    this._root = root
    // 场景切换时清空触摸追踪和上一场景注册的手势/键盘回调
    this._touchStartTarget = null
    this.gesture.clearCallbacks()
    this.keyboard.clearCallbacks()
    if (!this._initialized) {
      this._initialized = true
      this.touch.bind()
      this.keyboard.bind()
      this._setupNodeDispatch()
    }
  }

  // ── 指针快捷 ──────────────────────────────────────────────────

  get x(): number {
    return this.touch.pointer.x
  }
  get y(): number {
    return this.touch.pointer.y
  }
  get isDown(): boolean {
    return this.touch.pointer.isDown
  }
  justPressed(): boolean {
    return this.touch.pointer.justPressed
  }
  justReleased(): boolean {
    return this.touch.pointer.justReleased
  }
  get pointer(): PointerState {
    return this.touch.pointer
  }

  // ── 手势快捷 ──────────────────────────────────────────────────

  onTap(callback: (x: number, y: number) => void): void {
    this.gesture.onTap(callback)
  }

  onSwipe(direction: SwipeDirection | "any", callback: (() => void) | ((dir: SwipeDirection) => void)): void {
    this.gesture.onSwipe(direction, callback)
  }

  onDrag(node: Node, callback: (dx: number, dy: number, x: number, y: number) => void, onEnd?: () => void): void {
    node.interactive = true
    this.gesture.onDrag(node, callback, onEnd)
  }

  onPinch(callback: (scale: number, cx: number, cy: number) => void): void {
    this.gesture.onPinch(callback)
  }

  onLongPress(node: Node, callback: () => void): void {
    node.interactive = true
    this.gesture.onLongPress(node, callback)
  }

  onDoubleTap(callback: (x: number, y: number) => void): void {
    this.gesture.onDoubleTap(callback)
  }

  // ── 键盘快捷 ──────────────────────────────────────────────────

  key(code: string): KeyState {
    return this.keyboard.key(code)
  }

  onKey(code: string, callback: (down: boolean) => void): void {
    this.keyboard.onKey(code, callback)
  }

  // ── 手柄快捷 ──────────────────────────────────────────────────

  get leftStick(): StickState {
    return this.gamepad.leftStick
  }
  get rightStick(): StickState {
    return this.gamepad.rightStick
  }

  button(name: string): GamepadButtonState {
    return this.gamepad.button(name)
  }

  // ── 传感器快捷 ────────────────────────────────────────────────

  get accelerometer(): SensorVec3 {
    return this.sensors.accelerometer
  }
  get gyroscope(): SensorVec3 {
    return this.sensors.gyroscope
  }

  enableAccelerometer(interval?: "game" | "ui" | "normal"): void {
    this.sensors.enableAccelerometer(interval)
  }

  enableGyroscope(interval?: "game" | "ui" | "normal"): void {
    this.sensors.enableGyroscope(interval)
  }

  // ── 软键盘 ────────────────────────────────────────────────────

  textInput(options?: TextInputOptions): Promise<string> {
    return this.softKeyboard.textInput(options)
  }

  // ── 每帧更新 ──────────────────────────────────────────────────

  update(_dt: number): void {
    this.gamepad.update()
  }

  endFrame(): void {
    this.touch.endFrame()
    this.keyboard.endFrame()
    this.gamepad.endFrame()
  }

  // ── 节点事件分发 ──────────────────────────────────────────────

  private _setupNodeDispatch(): void {
    this.touch.onTouchStart((x, y, id) => {
      if (!this._root) return
      const data: TouchData = { x, y, id }

      // 场景级触摸事件（始终触发，与节点 hit-test 无关）
      this._root.emit("touchbegin" as any, data)

      // 节点级事件分发（仅 hit-test 命中的交互节点）
      const targets: Node[] = []
      this._root._collectInteractiveAt(x, y, targets)
      if (targets.length > 0) {
        this._touchStartTarget = targets[0]
        targets[0].emit("touchbegin", data)
      }
    })

    this.touch.onTouchMove((x, y, id) => {
      const data: TouchData = { x, y, id }

      if (this._root) {
        this._root.emit("touchmove" as any, data)
      }

      if (this._touchStartTarget) {
        this._touchStartTarget.emit("touchmove", data)
      }
    })

    this.touch.onTouchEnd((x, y, id) => {
      const data: TouchData = { x, y, id }

      if (this._root) {
        this._root.emit("touchend" as any, data)
      }

      if (this._touchStartTarget) {
        this._touchStartTarget.emit("touchend", data)

        // tap 判定: 抬起时仍在同一节点上
        if (this._touchStartTarget.hitTest(x, y)) {
          this._touchStartTarget.emit("tap", data)
        }
        this._touchStartTarget = null
      }
    })
  }

  destroy(): void {
    this.touch.destroy()
    this.gesture.destroy()
    this.keyboard.destroy()
    this.gamepad.destroy()
    this.sensors.destroy()
    this.softKeyboard.destroy()
    this._touchStartTarget = null
    this._root = null
  }
}
