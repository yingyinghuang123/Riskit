// ─── MiniEngine 统一导出 ─────────────────────────────────────────

// 必须在 Three.js 等库加载前执行（副作用 import，打包器保证顺序）
import "./platform/polyfills"

// ── Core ──
export { MiniEngine } from "./core/engine"
export type { EngineConfig, EngineEvents } from "./core/engine"

export { EventEmitter } from "./utils/events"
export type { EventHandler, IEventEmitter } from "./utils/events"

export { GameLoop } from "./utils/loop"
export type { TimeInfo, TickFn } from "./utils/loop"

export { getPlatform, setPlatform, hasPlatform } from "./platform"
export type {
  ScreenInfo,
  Platform,
  PlatformAudioContext,
  PlatformTouchEvent,
  PlatformTouchCallback,
  PlatformKeyCallback,
  PlatformSensorCallback,
  PlatformKeyboardOptions,
} from "./platform"

export { createWxPlatform } from "./platform/wx-platform"
export { createWebPlatform } from "./platform/web-platform"

export { FSM } from "./utils/fsm"
export type { FSMConfig } from "./utils/fsm"

export { createPool } from "./utils/pool"
export type { Pool } from "./utils/pool"

export {
  clamp,
  lerp,
  inverseLerp,
  remap,
  distance,
  distanceSq,
  degToRad,
  radToDeg,
  angleBetween,
  wrap,
  approxEqual,
  Easing,
  resolveEasing,
  Vec2,
  Random,
} from "./utils/math"
export type { EasingFn } from "./utils/math"

export { parseCssColor, cssColorToNumber } from "./utils/color"
export type { ParsedColor } from "./utils/color"

// ── Scene ──
export { Node } from "./nodes/node"
export type { NodeEvents, TouchData, Bounds, TweenOptions } from "./nodes/node"

export { Scene } from "./core/scene"
export type {
  SceneSetupFn,
  InputProxy,
  PhysicsProxy,
  AudioProxy,
  TimerProxy,
  CameraProxy,
  FxProxy,
  TweenProxy,
} from "./core/scene"

export { SceneManager } from "./core/scene-manager"
export type { TransitionType, TransitionConfig } from "./core/scene-manager"

export { Sprite } from "./nodes/sprite"
export type { SpriteFrame, SpriteAnimation } from "./nodes/sprite"

export { TextNode } from "./nodes/text"
export type { TextStyle } from "./nodes/text"

export { Container } from "./nodes/container"

export { Graphics } from "./nodes/graphics"

export { NodeFactory } from "./core/factory"

// ── Render ──

export { createCamera2D } from "./render/camera2d"
export type { Camera2D, Camera2DConfig, Camera2DBounds, Camera2DFollowOptions } from "./render/camera2d"

export { createSpriteSheet, createSpriteAnimator } from "./render/sprite-sheet"
export type { SpriteSheet, SpriteAnimator } from "./render/sprite-sheet"

export { RenderLayer, layerName } from "./render/layers"

export { createCamera3DState, enableOrbit, follow3D, updateCamera3D } from "./render/camera3d"
export type { Camera3DState, Camera3DConfig, Vec3, OrbitConfig } from "./render/camera3d"

export { createWebGLBridge } from "./render/webgl-renderer"
export type { WebGLRendererBridge } from "./render/webgl-renderer"

export { createPixiBridge } from "./render/pixi-bridge"
export type { PixiBridge, PixiBridgeOptions } from "./render/pixi-bridge"

export { createRTTSprite } from "./render/rtt-sprite"
export type { RTTSprite } from "./render/rtt-sprite"
export { installPixiAdapter } from "./render/pixi-adapter"
// ── Three.js（独立入口：import { ... } from './engine/three'） ──
// Three.js 相关导出不在核心 barrel 中，避免纯 2D 项目被强制引入 three 依赖。
// 3D 游戏应直接 import: import { installAdapter, loadGLTF, ... } from './engine/three'

// ── Wx Platform ──
export { WxPlatform } from "./platform/wx"
export {
  WxShare,
  WxSocial,
  WxAds,
  WxAuth,
  WxStorage,
  WxPayment,
  WxHttp,
  WxWebSocket,
  WxCloud,
  WxLifecycle,
  WxAI,
  WxRecorder,
  WxVibrate,
} from "./platform/wx"
export type {
  ShareOptions,
  ShareReceiveCallback,
  FriendData,
  BannerPosition,
  LoginResult,
  StorageInfo,
  PurchaseOptions,
  HttpOptions,
  HttpResponse,
  WebSocketClient,
  CloudConfig,
  CloudQuery,
  CloudResult,
  CloudWatcher,
  InferenceSession,
  RecorderOptions,
  RecorderResult,
  VibrateType,
  PlatformStorage,
  PlatformHttp,
  PlatformWebSocket,
  PlatformLifecycle,
  PlatformVibrate,
  PlatformShare,
  PlatformAuth,
  PlatformPayment,
  PlatformAds,
  PlatformCloud,
  PlatformSocial,
  PlatformRecorder,
  PlatformAI,
} from "./platform"

// ── UI ──
export { UINode } from "./ui/ui-node"
export type { UIStyle } from "./ui/ui-node"

export { Button } from "./ui/button"
export type { ButtonStyle } from "./ui/button"

export { Label } from "./ui/label"
export type { LabelStyle } from "./ui/label"

export { Panel } from "./ui/panel"
export type { PanelStyle } from "./ui/panel"

export { ProgressBar } from "./ui/progress-bar"
export type { ProgressBarStyle } from "./ui/progress-bar"

export { Slider } from "./ui/slider"
export type { SliderStyle } from "./ui/slider"

export { Toggle } from "./ui/toggle"
export type { ToggleStyle } from "./ui/toggle"

export { ScrollView } from "./ui/scroll-view"
export type { ScrollViewOptions } from "./ui/scroll-view"

export { Dialog } from "./ui/dialog"
export type { DialogConfig } from "./ui/dialog"

export { Toast } from "./ui/toast"

export { VirtualList } from "./ui/virtual-list"
export type { VirtualListConfig } from "./ui/virtual-list"

export { vbox, hbox, grid } from "./ui/layout"
export type { LayoutOptions, GridOptions } from "./ui/layout"

export { UIFactory } from "./ui/factory"

// ── Assets ──
export { AssetManager } from "./assets/asset-manager"
export type { LoadConfig } from "./assets/asset-manager"

export { AssetCache } from "./assets/cache"
export type { CacheEntry } from "./assets/cache"

export { loadImage } from "./assets/loader-image"
export type { ImageLoadResult } from "./assets/loader-image"

export { loadAudio } from "./assets/loader-audio"
export type { AudioAsset } from "./assets/loader-audio"

export { loadFont } from "./assets/loader-font"
export type { FontAsset } from "./assets/loader-font"

export { loadAtlas } from "./assets/loader-atlas"
export type { AtlasFrame, AtlasAsset } from "./assets/loader-atlas"

// loadModel 依赖 three.js（通过 gltf-loader），3D 游戏应直接 import:
// import { loadModel } from './engine/assets/loader-model'

export { loadSubpackage } from "./assets/subpackage"
export type { SubpackageInfo } from "./assets/subpackage"

// ── Input ──
export { InputManager } from "./input/input-manager"
export { TouchSystem } from "./input/touch"
export type { PointerState, TouchPoint } from "./input/touch"
export { GestureRecognizer } from "./input/gesture"
export type { SwipeDirection, GestureConfig } from "./input/gesture"
export { Keyboard } from "./input/keyboard"
export type { KeyState } from "./input/keyboard"
export { GamepadInput } from "./input/gamepad"
export type { StickState, GamepadButtonState } from "./input/gamepad"
export { Sensors } from "./input/sensors"
export type { SensorVec3 } from "./input/sensors"
export { SoftKeyboard } from "./input/soft-keyboard"
export type { TextInputOptions } from "./input/soft-keyboard"

// ── Physics ──
export { PhysicsWorld, PPM } from "./physics/physics-world"
export { PhysicsBody } from "./physics/body"
export type { BodyType } from "./physics/body"
export { testShapes, aabbOverlap } from "./physics/collision"
export type { CollisionResult } from "./physics/collision"
export { separateBodies } from "./physics/response"
export type { Shape, ShapeType, RectShape, CircleShape } from "./physics/shapes"
export { createRectShape, createCircleShape } from "./physics/shapes"

// ── Audio ──
export { AudioManager } from "./audio/audio-manager"
export { BGMManager } from "./audio/bgm"
export type { BGMOptions } from "./audio/bgm"
export { SFXPool } from "./audio/sfx"
export type { SFXOptions } from "./audio/sfx"

// ── Animation ──
export { TweenSystem } from "./animation/tween"
export type { TweenConfig, TweenHandle } from "./animation/tween"
export { SpriteAnimPlayer, expandFramePattern, createAnimFramesFromSheet, addAnimations } from "./animation/sprite-anim"
export type { SpriteAnimConfig } from "./animation/sprite-anim"
export { AnimFSM, createAnimFSM } from "./animation/anim-fsm"
export type { AnimState, AnimFSMConfig } from "./animation/anim-fsm"

// ── Particle ──
export { ParticleEmitter } from "./particle/emitter"
export type { ParticleConfig, EmitShape, BlendMode as ParticleBlendMode } from "./particle/emitter"
export { FxPresets } from "./particle/presets"

// ── Game Systems ──
export { createGlobalSystems, installGameSystems } from "./core/game-systems"
export type { GlobalSystems, SceneSystemsConfig, SceneSystems } from "./core/game-systems"

// ── Debug Tools ──
export { FpsMeter } from "./debug/fps-meter"
export { Stats } from "./debug/stats"
export type { StatsSnapshot } from "./debug/stats"
export { Inspector } from "./debug/inspector"
