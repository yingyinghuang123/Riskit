// ─── 3D 模型加载器 ──────────────────────────────────────────────

import { loadGLTF, type GLTFResult, type GLTFLoadOptions } from "../three/gltf-loader"

export interface ModelAsset {
  result: GLTFResult
  src: string
}

/** 加载 glTF/GLB 模型（通过 Three.js 适配层） */
export async function loadModel(src: string, options?: GLTFLoadOptions): Promise<ModelAsset> {
  try {
    const result = await loadGLTF(src, options)
    return { result, src }
  } catch (e) {
    throw new Error(`模型加载失败: ${src} — ${e}`)
  }
}
