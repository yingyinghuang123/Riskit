/**
 * glTF/GLB 加载器 — 微信小游戏适配
 *
 * 使用 Three.js 官方 GLTFLoader 做场景构建，
 * 文件 I/O 走 Platform 适配层（getPlatform().fetch / readFile）。
 *
 * 用法：
 * ```ts
 * const gltf = await loadGLTF('assets/model.glb')
 * bridge.scene.add(gltf.scene)
 * ```
 */

// GLTFLoader 使用动态 import，避免不使用 3D 的项目被强制引入 three.js 子模块
import { getPlatform } from "../platform"

export interface GLTFResult {
  scene: any // THREE.Group
  scenes: any[] // THREE.Group[]
  cameras: any[] // THREE.Camera[]
  animations: any[] // THREE.AnimationClip[]
  asset: Record<string, unknown>
}

export interface GLTFLoadOptions {
  /** 资源基路径（用于解析 .gltf 引用的外部文件） */
  basePath?: string
  /** 加载进度回调 */
  onProgress?: (loaded: number, total: number) => void
}

/**
 * 从 URL 或本地路径加载 glTF/GLB，返回可直接 add 到场景的 Three.js 对象。
 */
export async function loadGLTF(url: string, options?: GLTFLoadOptions): Promise<GLTFResult> {
  // 先用微信文件 API 读取原始数据
  const buffer = await loadFileAsArrayBuffer(url)

  // 资源基路径（用于 .gltf 解析外部 bin/纹理引用）
  const basePath = options?.basePath ?? url.substring(0, url.lastIndexOf("/") + 1)

  // 使用 Three.js 官方 GLTFLoader.parse() 解析 ArrayBuffer → Three.js 场景对象
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
  const loader = new GLTFLoader()

  return new Promise<GLTFResult>((resolve, reject) => {
    loader.parse(
      buffer,
      basePath,
      (gltf) => {
        resolve({
          scene: gltf.scene,
          scenes: gltf.scenes,
          cameras: gltf.cameras,
          animations: gltf.animations,
          asset: gltf.asset as Record<string, unknown>,
        })
      },
      (error) => {
        reject(new Error(`glTF 解析失败: ${url} — ${error}`))
      },
    )
  })
}

// ─── 文件读取（统一 local / network） ────────────────────────────

function loadFileAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const isNetwork = url.startsWith("http://") || url.startsWith("https://")

  if (isNetwork) {
    return getPlatform()
      .fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`glTF 下载失败: ${url} — HTTP ${res.status}`)
        return res.arrayBuffer()
      })
  }

  // 本地文件（相对路径 / wxfile:// / USER_DATA_PATH）
  return getPlatform().readFile(url)
}
