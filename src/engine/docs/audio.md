# Audio — 音频系统

通过 `scene.audio` 访问。音频系统是全局单例，由 `createGlobalSystems(engine)` 统一创建，场景切换时自动 rebind 到当前场景。

## 基本用法

```typescript
// 播放音效
scene.audio.play('explosion')
scene.audio.play('explosion', { volume: 0.5 })

// 播放 BGM（loop）
scene.audio.play('bgm', { loop: true, volume: 0.8 })

// 停止
scene.audio.stop()           // 停止所有
scene.audio.pauseAll()       // 暂停所有
scene.audio.resumeAll()      // 恢复所有
```

## AudioManager

全局音量控制。由 `createGlobalSystems` 自动创建，不需要手动实例化。

```typescript
// 通过 globals 访问（在 game.ts 中）
const globals = createGlobalSystems(engine)
globals.audioManager.masterVolume = 0.8    // 主音量 (0-1)
globals.audioManager.bgmVolume = 0.6       // BGM 音量
globals.audioManager.sfxVolume = 1.0        // 音效音量
globals.audioManager.muted = true           // 静音
```

## BGMManager

背景音乐播放，支持交叉淡入淡出。由 `createGlobalSystems` 自动创建。

```typescript
// 通过 globals 访问
globals.bgm.play('bgm_path', { loop: true, volume: 0.8 })
globals.bgm.stop()
globals.bgm.pause()
globals.bgm.resume()
```

## SFXPool

音效池，支持并发限制。由 `createGlobalSystems` 自动创建。

```typescript
// 通过 globals 访问
globals.sfx.play('explosion_path', 0.8)  // 路径, 音量
globals.sfx.stopAll()
```

## 架构说明

音频系统属于全局层，跨场景共享。`scene.audio` 是一个代理，内部根据 `loop` 参数自动路由到 BGMManager 或 SFXPool：

- `scene.audio.play(id, { loop: true })` → BGMManager
- `scene.audio.play(id)` / `scene.audio.play(id, { volume })` → SFXPool
