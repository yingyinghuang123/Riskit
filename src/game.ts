import { MiniEngine, SceneManager, createGlobalSystems, installGameSystems, hasPlatform, setPlatform } from "./engine"
import { createWxPlatform } from "./engine/platform/wx-platform"
import { setupMenuScene } from "./scenes/menu-scene"
import { setupLobbyScene } from "./scenes/lobby-scene"
import { setupGameScene } from "./scenes/game-scene"
import { setupResultScene } from "./scenes/result-scene"


console.log('[RISKIT] game.ts loading, hasPlatform:', hasPlatform())
if (!hasPlatform()) setPlatform(createWxPlatform())
const engine = new MiniEngine({ backgroundColor: "#1a2e1a" })
engine.scenes = new SceneManager(engine)
const globals = createGlobalSystems(engine)
console.log('[RISKIT] engine created, screen:', engine.screen.width, 'x', engine.screen.height)

engine.scene("menu", (scene) => {
  installGameSystems(scene, engine, globals)
  setupMenuScene(scene, engine, globals)
})

engine.scene("lobby", (scene) => {
  installGameSystems(scene, engine, globals)
  setupLobbyScene(scene, engine, globals)
})

engine.scene("game", (scene) => {
  installGameSystems(scene, engine, globals)
  setupGameScene(scene, engine, globals)
})

engine.scene("result", (scene) => {
  installGameSystems(scene, engine, globals)
  setupResultScene(scene, engine, globals)
})


console.log('[RISKIT] starting menu scene')
engine.start("menu")
