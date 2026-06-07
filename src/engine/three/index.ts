/**
 * Three.js r183 — 统一导出 + 平台适配层
 *
 * Three.js 作为 npm 依赖安装（three@0.183.2），
 * esbuild 打包时自动 tree-shake，只包含实际引用的模块。
 *
 * 使用方式：
 *   import { Scene, PerspectiveCamera, WebGLRenderer } from '../engine/three'
 *
 * 重要：在使用任何 Three.js 功能前必须先调用 installAdapter()
 */

export { installAdapter } from "./adapter"
export { loadGLTF, type GLTFResult, type GLTFLoadOptions } from "./gltf-loader"
export { createBillboard, screenToWorld } from "./billboard"
export type { Billboard, BillboardOptions } from "./billboard"

// ─── 从 three 包重导出 ─────────────────────────────────────────
export {
  // 核心
  Scene,
  Group,
  Object3D,
  Raycaster,
  Clock,

  // 相机
  PerspectiveCamera,
  OrthographicCamera,

  // 渲染
  WebGLRenderer,
  WebGLRenderTarget,

  // 几何
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  ConeGeometry,
  TorusGeometry,
  RingGeometry,
  CircleGeometry,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,

  // 材质
  MeshStandardMaterial,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshLambertMaterial,
  MeshNormalMaterial,
  LineBasicMaterial,
  PointsMaterial,
  SpriteMaterial,
  ShaderMaterial,

  // 网格 & 对象
  Mesh,
  Line,
  LineSegments,
  Points,
  Sprite as ThreeSprite,
  InstancedMesh,
  SkinnedMesh,

  // 灯光
  AmbientLight,
  DirectionalLight,
  PointLight,
  SpotLight,
  HemisphereLight,

  // 纹理
  TextureLoader,
  Texture,
  CanvasTexture,
  DataTexture,
  CubeTextureLoader,
  RepeatWrapping,
  ClampToEdgeWrapping,
  MirroredRepeatWrapping,
  NearestFilter,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  LinearSRGBColorSpace,

  // 数学
  Vector2,
  Vector3,
  Vector4,
  Color,
  Matrix3,
  Matrix4,
  Quaternion,
  Euler,
  Box2,
  Box3,
  Sphere,
  Ray,
  MathUtils,

  // 动画
  AnimationMixer,
  AnimationClip,
  AnimationAction,

  // 加载器
  FileLoader,
  ImageLoader,
  LoadingManager,
  Loader,

  // 辅助
  AxesHelper,
  GridHelper,
  BoxHelper,

  // 常量
  FrontSide,
  BackSide,
  DoubleSide,
  AdditiveBlending,
  NormalBlending,
  MultiplyBlending,
  NoToneMapping,
  ACESFilmicToneMapping,
  LinearToneMapping,
  PCFSoftShadowMap,
  BasicShadowMap,
  RGBAFormat,

  // 版本
  REVISION,
} from "three"
