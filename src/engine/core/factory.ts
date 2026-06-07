// ─── scene.add.* 节点工厂 ────────────────────────────────────────

import { Node } from "../nodes/node"
import { Sprite } from "../nodes/sprite"
import { TextNode, type TextStyle } from "../nodes/text"
import { Container } from "../nodes/container"
import { Graphics } from "../nodes/graphics"
import type { Scene } from "./scene"
import { loadImage } from "../assets/loader-image"

export class NodeFactory {
  private _scene: Scene

  constructor(scene: Scene) {
    this._scene = scene
  }

  /** 创建精灵节点（支持传入图片路径字符串，引擎自动异步加载） */
  sprite(texture?: CanvasImageSource | string, x = 0, y = 0): Sprite {
    let img: CanvasImageSource | undefined
    let pendingSrc: string | undefined
    if (typeof texture === "string") {
      pendingSrc = texture
      img = undefined
    } else {
      img = texture
    }
    const sprite = new Sprite(img, x, y)
    this._scene.addChild(sprite)

    // 字符串路径：异步加载图片，完成后自动设置纹理
    if (pendingSrc) {
      loadImage(pendingSrc)
        .then((result) => {
          sprite.setTexture(result.image)
        })
        .catch((err) => {
          console.warn(`[Factory] sprite 图片加载失败: ${pendingSrc}`, err)
        })
    }

    return sprite
  }

  /** 创建文本节点 */
  text(content: string, x = 0, y = 0, style?: TextStyle): TextNode {
    const text = new TextNode(content, x, y, style)
    this._scene.addChild(text)
    return text
  }

  /** 创建容器 */
  container(x = 0, y = 0): Container {
    const container = new Container()
    container.x = x
    container.y = y
    this._scene.addChild(container)
    return container
  }

  /** 创建程序化绘制节点 */
  graphics(x = 0, y = 0): Graphics {
    const gfx = new Graphics()
    gfx.x = x
    gfx.y = y
    this._scene.addChild(gfx)
    return gfx
  }

  /** 创建通用节点 */
  node(x = 0, y = 0): Node {
    const node = new Node()
    node.x = x
    node.y = y
    this._scene.addChild(node)
    return node
  }

  // ── 以下为占位方法，由其他子系统扩展 ──────────────────────────

  /** 创建粒子发射器（粒子系统提供） */
  particles(x: number, y: number, _config?: any): any {
    return this._placeholder("particles", x, y)
  }

  /** 创建瓦片地图（扩展提供） */
  tilemap(_data: any, _options?: any): any {
    return this._placeholder("tilemap", 0, 0)
  }

  /** 创建 3D 网格（Three.js 模块提供） */
  mesh(_geometry?: any, _material?: any): any {
    return this._placeholder("mesh", 0, 0)
  }

  private _placeholder(type: string, x: number, y: number): Node {
    const node = new Node()
    node.x = x
    node.y = y
    node.tag = `placeholder:${type}`
    this._scene.addChild(node)
    console.warn(`[Factory] ${type} 尚未注入实现，返回占位节点`)
    return node
  }
}
