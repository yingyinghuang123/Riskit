/**
 * 渲染层 / Z 排序
 * 预定义层：Background(0) / World(100) / Foreground(200) / UI(300) / Overlay(400)
 * 映射到 PixiJS Container.zIndex，需配合 sortableChildren = true 使用
 */

export enum RenderLayer {
  Background = 0,
  World = 100,
  Foreground = 200,
  UI = 300,
  Overlay = 400,
}

/** 获取默认渲染层名称（用于调试） */
export function layerName(layer: number): string {
  switch (layer) {
    case RenderLayer.Background:
      return "Background"
    case RenderLayer.World:
      return "World"
    case RenderLayer.Foreground:
      return "Foreground"
    case RenderLayer.UI:
      return "UI"
    case RenderLayer.Overlay:
      return "Overlay"
    default:
      return `Custom(${layer})`
  }
}
