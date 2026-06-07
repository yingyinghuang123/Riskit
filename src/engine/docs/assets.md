# Assets — 资源管理

## AssetManager

```typescript
import { AssetManager } from "./engine"

const assets = new AssetManager()

// 加载
await assets.load({
  images: {
    hero: "assets/hero.png",
    enemy: "assets/enemy.png",
  },
  atlas: {
    sprites: "assets/sprites.json", // TexturePacker JSON
  },
  audio: {
    bgm: "assets/bgm.mp3",
    hit: "assets/hit.mp3",
  },
  fonts: {
    pixel: "assets/pixel.ttf",
  },
  subpackages: ["assets"], // 分包名
  onProgress: (loaded, total) => {
    console.log(`${loaded}/${total}`)
  },
})

// 获取
const img = assets.getImage("hero") // → WxImage
const atlas = assets.getAtlas("sprites") // → AtlasAsset
const aud = assets.getAudio("bgm") // → AudioContext

// 卸载
assets.unload("hero") // 卸载单个
assets.unloadScene("level1") // 卸载前缀匹配
assets.clear() // 清空全部
```

## 缓存（AssetCache）

引用计数 + `wx.onMemoryWarning` 自动清理。

```typescript
assets.cache.set(id, data, type, priority?, memSize?)
assets.cache.get<T>(id)
assets.cache.retain(id)    // +1 引用
assets.cache.release(id)   // -1 引用
assets.cache.purge()       // 清理零引用
assets.cache.clear()       // 全部清除
```

## 单独加载器

```typescript
import { loadImage, loadAudio, loadFont, loadAtlas, loadSubpackage } from "./engine"

const { image, width, height } = await loadImage("assets/hero.png")
const audioAsset = await loadAudio("assets/bgm.mp3")
const fontAsset = await loadFont("assets/pixel.ttf", "PixelFont")
const atlasAsset = await loadAtlas("assets/sprites.json")
await loadSubpackage("assets")
```

## 分包

资源较多时在 `game.json` 添加：

```json
"subpackages": [{ "name": "assets", "root": "assets/" }]
```

在 `loadConfig.subpackages` 中列出分包名，`AssetManager` 自动处理。
