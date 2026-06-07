/**
 * Three.js 渲染器桥接
 * 将 Three.js 渲染器与引擎主循环同步
 *
 * 引擎主 canvas 始终优先获取 WebGL context，因此 bridge.init 时
 * 主 canvas 已是 WebGL 状态，直接复用（isPrimary=true）。
 * 仅在极少数 WebGL 不可用的设备上才会创建独立 WebGL canvas（兼容模式）。
 *
 * 2D overlay 采用原生 GL blit（不经过 Three.js 材质/shader 管线），
 * 避免 Three.js 的 colorSpace / toneMapping 对 2D 像素产生偏色。
 *
 * 纹理上传策略（自动检测）：
 * - 快速路径：gl.texImage2D(canvas) — 大部分设备支持
 * - 安全路径：getImageData() → gl.texImage2D(Uint8Array) — 全设备兼容
 */

import { getPlatform, type ScreenInfo } from "../platform/platform"
import type { Camera3DState } from "./camera3d"

export interface WebGLRendererBridge {
  /** Three.js 场景 */
  readonly scene: any
  /** Three.js 相机 */
  readonly camera: any
  /** Three.js 渲染器 */
  readonly threeRenderer: any
  /** 是否已初始化 */
  readonly ready: boolean
  /** WebGL 使用的 canvas */
  readonly glCanvas: WxCanvas | null
  /** 是否占用了主 canvas（3D 优先模式） */
  readonly isPrimary: boolean

  /** 初始化 Three.js 渲染器，THREE 传入完整模块（import * as THREE from 'three'） */
  init(canvas: WxCanvas, screen: ScreenInfo, THREE: Record<string, any>): void
  /** 同步 Camera3DState 到 Three.js 相机 */
  syncCamera(state: Camera3DState): void
  /** 渲染一帧 3D 场景 */
  render(): void
  /** 在指定视口区域渲染一帧 3D 场景（坐标系原点为左上角） */
  /** @deprecated Use renderToTexture() + PixiJS Sprite for embedded 3D viewports. */
  renderViewport(x: number, y: number, width: number, height: number): void
  /** 将 2D canvas 叠加到 WebGL 画面上（opaque=true 时不混合，直接覆盖） */
  compositeOverlay(canvas2d: WxCanvas, opaque?: boolean): void
  /** 将 WebGL 画面合成到 2D canvas（兼容模式，真机不可靠） */
  composite(ctx: CanvasRenderingContext2D, width: number, height: number): void
  /** Create or resize the internal render target */
  ensureRenderTarget(width: number, height: number): void
  /**
   * Render 3D scene to internal FBO instead of screen.
   * @param width - Optional pixel width override (defaults to canvas size)
   * @param height - Optional pixel height override (defaults to canvas size)
   */
  renderToTexture(width?: number, height?: number): void
  /** Get the internal WebGLRenderTarget (for Three.js material usage) */
  getRenderTarget(): any | null
  /** Get raw RGBA pixel data from last renderToTexture call */
  getRenderTargetPixels(): Uint8Array | null
  /** Get the dimensions of the last RTT render */
  getRenderTargetSize(): { width: number; height: number } | null
  /** 更新尺寸 */
  resize(screen: ScreenInfo): void
  /** 销毁 */
  dispose(): void
}

/**
 * 检测 texImage2D(canvas) 是否在当前设备上可用。
 * 在 offscreen canvas 上画红色像素 → 上传到 GL 纹理 → readPixels 回读验证。
 */
function testCanvasUpload(gl: WebGLRenderingContext): boolean {
  try {
    const c = getPlatform().createCanvas()
    c.width = c.height = 2
    const ctx = c.getContext("2d") as CanvasRenderingContext2D
    ctx.fillStyle = "#ff0000"
    ctx.fillRect(0, 0, 2, 2)

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c as any)

    if (gl.getError() !== gl.NO_ERROR) {
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.deleteTexture(tex)
      return false
    }

    // readPixels 回读验证像素确实上传成功
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)

    const pixel = new Uint8Array(4)
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.deleteFramebuffer(fb)
    gl.deleteTexture(tex)

    // 期望红色像素 (R>200, G<50, B<50, A>200)
    return pixel[0] > 200 && pixel[1] < 50 && pixel[2] < 50 && pixel[3] > 200
  } catch {
    return false
  }
}

export function createWebGLBridge(): WebGLRendererBridge {
  let scene: any = null
  let camera: any = null
  let threeRenderer: any = null
  let _ready = false
  let _glCanvas: WxCanvas | null = null
  let _isPrimary = false
  let _gl: WebGLRenderingContext | null = null
  let _screenWidth = 1
  let _screenHeight = 1
  let _pixelRatio = 1

  // 纹理上传策略
  let _useCanvasUpload = false

  let _THREE: Record<string, any> | null = null
  let _renderTarget: any = null
  let _renderTargetPixels: Uint8Array | null = null
  // 2D 叠加层 GL 资源（原生 GL blit，不走 Three.js 管线）
  let _glTexture: WebGLTexture | null = null
  let _2dCtx: CanvasRenderingContext2D | null = null
  let _blitProgram: WebGLProgram | null = null
  let _blitBuf: WebGLBuffer | null = null
  let _blitPosLoc = -1
  let _blitTexLoc: WebGLUniformLocation | null = null

  /** 初始化 blit shader 和顶点缓冲（仅首次调用） */
  function initBlit(gl: WebGLRenderingContext): void {
    // 顶点着色器：全屏四边形 + UV 翻转（补偿 UNPACK_FLIP_Y=0）
    const vsSource = [
      "attribute vec2 a_pos;",
      "varying vec2 v_uv;",
      "void main() {",
      "  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);",
      "  gl_Position = vec4(a_pos, 0.0, 1.0);",
      "}",
    ].join("\n")

    // 片元着色器：直接输出纹理颜色（无 colorSpace / toneMapping 转换）
    const fsSource = [
      "precision mediump float;",
      "uniform sampler2D u_tex;",
      "varying vec2 v_uv;",
      "void main() {",
      "  gl_FragColor = texture2D(u_tex, v_uv);",
      "}",
    ].join("\n")

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, vsSource)
    gl.compileShader(vs)

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, fsSource)
    gl.compileShader(fs)

    _blitProgram = gl.createProgram()!
    gl.attachShader(_blitProgram, vs)
    gl.attachShader(_blitProgram, fs)
    gl.linkProgram(_blitProgram)

    gl.deleteShader(vs)
    gl.deleteShader(fs)

    _blitPosLoc = gl.getAttribLocation(_blitProgram, "a_pos")
    _blitTexLoc = gl.getUniformLocation(_blitProgram, "u_tex")

    _blitBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, _blitBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  return {
    get scene() {
      return scene
    },
    get camera() {
      return camera
    },
    get threeRenderer() {
      return threeRenderer
    },
    get ready() {
      return _ready
    },
    get glCanvas() {
      return _glCanvas
    },
    get isPrimary() {
      return _isPrimary
    },

    init(canvas: WxCanvas, screen: ScreenInfo, THREE: Record<string, any>) {
      const { width, height, pixelRatio } = screen
      _screenWidth = width
      _screenHeight = height
      _pixelRatio = pixelRatio

      _THREE = THREE
      // 引擎已在主 canvas 上获取 WebGL context，此处复用（同一 canvas 返回相同 context）
      _glCanvas = canvas
      let gl = canvas.getContext("webgl2") || canvas.getContext("webgl")

      if (gl) {
        _isPrimary = true
        console.log("[WebGLBridge] 主 canvas WebGL 模式")
      } else {
        // 极少数设备 WebGL 不可用：创建独立 canvas 尝试
        _isPrimary = false
        console.warn("[WebGLBridge] 兼容模式：创建独立 WebGL canvas（真机显示可能异常）")
        _glCanvas = getPlatform().createCanvas()
        _glCanvas.width = width * pixelRatio
        _glCanvas.height = height * pixelRatio
        gl = _glCanvas.getContext("webgl2") || _glCanvas.getContext("webgl")
      }

      if (!gl) {
        console.error("[WebGLBridge] 无法获取 WebGL context")
        return
      }

      _gl = gl as WebGLRenderingContext

      // 微信 canvas 没有 addEventListener，Three.js WebGLRenderer 构造函数需要
      const c = _glCanvas as any
      if (!c.addEventListener) c.addEventListener = () => {}
      if (!c.removeEventListener) c.removeEventListener = () => {}
      if (!c.remove) c.remove = () => {}
      if (!c.style) c.style = {}

      // 在 Three.js 初始化前检测纹理上传策略
      _useCanvasUpload = testCanvasUpload(_gl)
      console.log(`[WebGLBridge] 纹理上传策略: ${_useCanvasUpload ? "canvas 直传（快速）" : "ImageData 降级（安全）"}`)

      // 创建 Three.js 渲染器
      threeRenderer = new THREE.WebGLRenderer({
        canvas: _glCanvas as any,
        context: gl as any,
        antialias: false,
        // 3D 优先模式不需要保留缓冲区；兼容模式需要（drawImage 要读）
        preserveDrawingBuffer: !_isPrimary,
      })
      threeRenderer.setPixelRatio(pixelRatio)
      threeRenderer.setSize(width, height, false)

      // 创建场景（不设默认背景，由各游戏场景自行设定）
      scene = new THREE.Scene()

      // 创建相机
      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
      camera.position.set(0, 5, 10)
      camera.lookAt(0, 0, 0)

      // 默认灯光
      const ambient = new THREE.AmbientLight(0x404040)
      scene.add(ambient)
      const directional = new THREE.DirectionalLight(0xffffff, 0.8)
      directional.position.set(5, 10, 5)
      scene.add(directional)

      _ready = true
    },

    ensureRenderTarget(width: number, height: number) {
      if (!threeRenderer || !_THREE) return
      const targetWidth = Math.max(1, Math.round(width))
      const targetHeight = Math.max(1, Math.round(height))
      if (_renderTarget) {
        if (_renderTarget.width !== targetWidth || _renderTarget.height !== targetHeight) {
          _renderTarget.setSize(targetWidth, targetHeight)
          _renderTargetPixels = null
        }
        return
      }
      _renderTarget = new _THREE.WebGLRenderTarget(targetWidth, targetHeight)
      _renderTarget.texture.minFilter = _THREE.LinearFilter
      _renderTarget.texture.magFilter = _THREE.LinearFilter
      _renderTargetPixels = null
    },

    syncCamera(state: Camera3DState) {
      if (!camera) return

      camera.position.set(state.position.x, state.position.y, state.position.z)
      camera.lookAt(state.lookAt.x, state.lookAt.y, state.lookAt.z)

      if (camera.fov !== state.fov) {
        camera.fov = state.fov
        camera.updateProjectionMatrix()
      }
      if (camera.aspect !== state.aspect) {
        camera.aspect = state.aspect
        camera.updateProjectionMatrix()
      }
    },

    render() {
      if (!_ready || !threeRenderer || !scene || !camera) return
      threeRenderer.render(scene, camera)
    },

    renderToTexture(width?: number, height?: number) {
      if (!_ready || !threeRenderer || !scene || !camera) return
      const targetWidth = width ?? _glCanvas?.width ?? Math.max(1, Math.round(_screenWidth * _pixelRatio))
      const targetHeight = height ?? _glCanvas?.height ?? Math.max(1, Math.round(_screenHeight * _pixelRatio))
      this.ensureRenderTarget(targetWidth, targetHeight)
      if (!_renderTarget) return
      threeRenderer.setRenderTarget(_renderTarget)
      threeRenderer.render(scene, camera)
      threeRenderer.setRenderTarget(null)
    },

    getRenderTarget() {
      return _renderTarget
    },

    getRenderTargetPixels() {
      if (!threeRenderer || !_renderTarget || !_gl) return null
      const width = Math.max(1, Math.round(_renderTarget.width))
      const height = Math.max(1, Math.round(_renderTarget.height))
      const size = width * height * 4
      if (!_renderTargetPixels || _renderTargetPixels.length !== size) {
        _renderTargetPixels = new Uint8Array(size)
      }

      // 手动绑定 Three.js FBO 并 readPixels，绕过 Three.js 内部 format 映射
      // 在共享 GL context 场景下，Three.js readRenderTargetPixels 可能因
      // PixiJS resetState 导致内部 format 映射失效（format=null）
      const gl = _gl
      const rtProps = threeRenderer.properties?.get(_renderTarget)
      const fbo = rtProps?.__webglFramebuffer
      if (!fbo) {
        // 降级到 Three.js 方法
        threeRenderer.readRenderTargetPixels(_renderTarget, 0, 0, width, height, _renderTargetPixels)
        return _renderTargetPixels
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, _renderTargetPixels)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      return _renderTargetPixels
    },

    getRenderTargetSize() {
      if (!_renderTarget) return null
      return { width: _renderTarget.width as number, height: _renderTarget.height as number }
    },

    renderViewport(x: number, y: number, width: number, height: number) {
      if (!_ready || !threeRenderer || !scene || !camera) return

      const canvasWidth = _glCanvas?.width ?? Math.max(1, Math.round(_screenWidth * _pixelRatio))
      const canvasHeight = _glCanvas?.height ?? Math.max(1, Math.round(_screenHeight * _pixelRatio))

      const rawX = Math.round(x * _pixelRatio)
      const rawY = canvasHeight - Math.round((y + height) * _pixelRatio)
      const rawWidth = Math.round(width * _pixelRatio)
      const rawHeight = Math.round(height * _pixelRatio)

      if (rawWidth <= 0 || rawHeight <= 0) return

      const left = Math.max(0, Math.min(canvasWidth, rawX))
      const bottom = Math.max(0, Math.min(canvasHeight, rawY))
      const right = Math.max(left, Math.min(canvasWidth, rawX + rawWidth))
      const top = Math.max(bottom, Math.min(canvasHeight, rawY + rawHeight))
      const viewportWidth = right - left
      const viewportHeight = top - bottom

      if (viewportWidth <= 0 || viewportHeight <= 0) return

      threeRenderer.setScissorTest(true)
      threeRenderer.setViewport(left, bottom, viewportWidth, viewportHeight)
      threeRenderer.setScissor(left, bottom, viewportWidth, viewportHeight)
      threeRenderer.render(scene, camera)

      threeRenderer.setViewport(0, 0, canvasWidth, canvasHeight)
      threeRenderer.setScissor(0, 0, canvasWidth, canvasHeight)
      threeRenderer.setScissorTest(false)
    },

    compositeOverlay(canvas2d: WxCanvas, opaque = false) {
      if (!_ready || !_isPrimary || !_gl) return

      const gl = _gl

      // 延迟创建 GL 资源（首次调用时）
      if (!_glTexture) {
        _glTexture = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, _glTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas2d.width, canvas2d.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.bindTexture(gl.TEXTURE_2D, null)

        initBlit(gl)
      }

      // ── 上传 2D canvas 到 GL 纹理 ──
      gl.bindTexture(gl.TEXTURE_2D, _glTexture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)

      if (_useCanvasUpload) {
        // 快速路径：直接传 canvas 对象
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d as any)
      } else {
        // 安全路径：读取像素数据再上传
        if (!_2dCtx) _2dCtx = canvas2d.getContext("2d") as CanvasRenderingContext2D
        const imgData = _2dCtx.getImageData(0, 0, canvas2d.width, canvas2d.height)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          canvas2d.width,
          canvas2d.height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array(imgData.data.buffer),
        )
      }

      // ── 原生 GL blit（绕过 Three.js 着色器管线，不做 colorSpace 转换） ──
      gl.useProgram(_blitProgram)
      gl.bindBuffer(gl.ARRAY_BUFFER, _blitBuf)
      gl.enableVertexAttribArray(_blitPosLoc)
      gl.vertexAttribPointer(_blitPosLoc, 2, gl.FLOAT, false, 0, 0)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, _glTexture)
      gl.uniform1i(_blitTexLoc, 0)

      gl.disable(gl.DEPTH_TEST)
      gl.depthMask(false)

      if (opaque) {
        // 纯 2D 场景：不需要与 3D 画面混合，直接覆盖
        gl.disable(gl.BLEND)
      } else {
        // 3D + 2D 混合：预乘 alpha 混合（src 已由 UNPACK_PREMULTIPLY_ALPHA 预乘）
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // 还原 GL 状态
      gl.disableVertexAttribArray(_blitPosLoc)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.depthMask(true)

      // 重置 Three.js GL 状态缓存（手动操作了 GL，需要让 Three.js 重新同步）
      if (threeRenderer) threeRenderer.resetState()
    },

    composite(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // 仅兼容模式使用（真机不可靠）
      if (!_ready || !_glCanvas || _isPrimary) return
      ctx.drawImage(_glCanvas as any, 0, 0, width, height)
    },

    resize(screen: ScreenInfo) {
      if (!threeRenderer || !camera) return
      const { width, height, pixelRatio } = screen
      _screenWidth = width
      _screenHeight = height
      _pixelRatio = pixelRatio
      if (_glCanvas) {
        _glCanvas.width = width * pixelRatio
        _glCanvas.height = height * pixelRatio
      }
      threeRenderer.setPixelRatio(pixelRatio)
      threeRenderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()

      // 重建叠加层纹理（尺寸变了需要重新分配）
      if (_glTexture && _gl) {
        const gl = _gl
        gl.bindTexture(gl.TEXTURE_2D, _glTexture)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          width * pixelRatio,
          height * pixelRatio,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        )
        gl.bindTexture(gl.TEXTURE_2D, null)
      }

      if (_renderTarget) {
        const targetWidth = Math.max(1, Math.round(width * pixelRatio))
        const targetHeight = Math.max(1, Math.round(height * pixelRatio))
        this.ensureRenderTarget(targetWidth, targetHeight)
      }
    },

    dispose() {
      if (threeRenderer) {
        threeRenderer.dispose()
        threeRenderer = null
      }
      if (_renderTarget) {
        _renderTarget.dispose()
        _renderTarget = null
      }
      _renderTargetPixels = null
      _THREE = null
      if (_gl) {
        if (_glTexture) {
          _gl.deleteTexture(_glTexture)
          _glTexture = null
        }
        if (_blitProgram) {
          _gl.deleteProgram(_blitProgram)
          _blitProgram = null
        }
        if (_blitBuf) {
          _gl.deleteBuffer(_blitBuf)
          _blitBuf = null
        }
      }
      _blitPosLoc = -1
      _blitTexLoc = null
      _gl = null
      _2dCtx = null
      scene = null
      camera = null
      _glCanvas = null
      _ready = false
      _isPrimary = false
      _useCanvasUpload = false
    },
  }
}
