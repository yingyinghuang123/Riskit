import { MiniEngine, Scene, createGlobalSystems } from '../engine'
import { RoomManager } from '../net/room-manager'

export function setupMenuScene(scene: Scene, engine: MiniEngine, globals: ReturnType<typeof createGlobalSystems>): void {
  console.log('[RISKIT] setupMenuScene called, screen:', engine.screen.width, 'x', engine.screen.height)
  const roomManager = new RoomManager(engine)
  const playerId = roomManager.getPlayerId()

  const W = engine.screen.width
  const H = engine.screen.height
  const cx = W / 2
  const scale = W / 750

  scene.add.sprite('assets/ui/bg_table.png', cx, H / 2)
    .setSize(W, H)
    .setAnchor(0.5, 0.5)

  const cardAssets = [
    'assets/cards/crocodile.png',
    'assets/cards/spider.png',
    'assets/cards/snake.png',
    'assets/cards/chupacabra.png'
  ]

  cardAssets.forEach((path, i) => {
    const angle = -20 + i * 12 + (Math.random() * 10 - 5)
    const offsetX = (i - 1.5) * 100 * scale
    const offsetY = (Math.random() - 0.5) * 40 * scale
    scene.add.sprite(path, cx + offsetX, H * 0.22 + offsetY)
      .setSize(140 * scale, 200 * scale)
      .setAnchor(0.5, 0.5)
      .setRotation(angle)
      .setAlpha(0.3)
  })
  scene.add.text('RISKIT', cx, H * 0.22, {
    fontSize: 80 * scale,
    color: '#FFD700',
    align: 'center',
    bold: true,
    shadow: { color: 'rgba(0,0,0,0.8)', blur: 15, offsetX: 6, offsetY: 6 },
    stroke: { color: '#4a3200', width: 4 * scale }
  })

  scene.add.text('丛林冒险桌游', cx, H * 0.32, {
    fontSize: 24 * scale,
    color: '#FFD700',
    align: 'center',
    bold: true,
    shadow: { color: 'rgba(0,0,0,0.5)', blur: 5, offsetX: 2, offsetY: 2 }
  }).setAlpha(0.9)

  const btnContainer = scene.add.container(cx, H * 0.56)

  const createBtn = scene.ui.button('创建房间', 0, 0, async () => {
    try {
      const roomId = await roomManager.createRoom('玩家' + playerId.substring(0, 4))
      ;(engine as any).__roomData = { roomId, playerId, roomManager, isHost: true }
      engine.scenes.goto('lobby', { type: 'fade', duration: 300 })
    } catch (e: any) {
      scene.ui.toast('创建失败: ' + e.message)
    }
  })
  createBtn.setStyle({
    bg: '#4CAF50',
    fg: '#ffffff',
    radius: 25,
    fontSize: 22 * scale,
    padding: [12, 50],
    bold: true
  })
  btnContainer.addChild(createBtn)

  const soloBtn = scene.ui.button('单人模式', 0, 70 * scale, async () => {
    const aiPlayerIds = ['ai_xiaoming', 'ai_xiaohong'];
    const allPlayerIds = [playerId, ...aiPlayerIds];
    (engine as any).__roomData = {
      roomId: 'solo_' + Date.now(),
      playerId,
      roomManager,
      isHost: true,
      playerIds: allPlayerIds,
      includeOptionalCards: false,
      isSoloMode: true,
      aiPlayerIds
    };
    engine.scenes.goto('game', { type: 'fade', duration: 300 });
  })
  soloBtn.setStyle({
    bg: '#FF9800',
    fg: '#ffffff',
    radius: 25,
    fontSize: 22 * scale,
    padding: [12, 50],
    bold: true
  })
  btnContainer.addChild(soloBtn)

  const joinBtn = scene.ui.button('加入房间', 0, 140 * scale, async () => {
    const roomId = await (scene.input as any).textInput({
      defaultValue: '',
      maxLength: 20,
      confirmType: 'done'
    })

    if (!roomId) return

    try {
      await roomManager.joinRoom(roomId, '玩家' + playerId.substring(0, 4))
      ;(engine as any).__roomData = { roomId, playerId, roomManager, isHost: false }
      engine.scenes.goto('lobby', { type: 'fade', duration: 300 })
    } catch (e: any) {
      scene.ui.toast('加入失败: ' + e.message)
    }
  })
  joinBtn.setStyle({
    bg: '#2196F3',
    fg: '#ffffff',
    radius: 25,
    fontSize: 22 * scale,
    padding: [12, 50],
    bold: true
  })
  btnContainer.addChild(joinBtn)

  scene.add.text('v1.0.0', cx, H - 30, {
    fontSize: 12,
    color: '#ffffff',
    align: 'center'
  }).setAlpha(0.5)
}
