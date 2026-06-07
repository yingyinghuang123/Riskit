// ─── 分包加载 ─────────────────────────────────────────────────────────────

import { getPlatform } from "../platform"

export interface SubpackageInfo {
  name: string
  root: string
}

/** 加载分包（微信小游戏支持，其他平台静默成功） */
export function loadSubpackage(name: string, onProgress?: (loaded: number, total: number) => void): Promise<void> {
  const platform = getPlatform()
  if (!platform.loadSubpackage) {
    // 平台不支持分包，静默成功
    return Promise.resolve()
  }
  return platform.loadSubpackage(name, onProgress)
}

/** 获取 game.json 中配置的分包列表 */
export function getSubpackages(): SubpackageInfo[] {
  // 实际列表应在构建时注入
  return []
}
