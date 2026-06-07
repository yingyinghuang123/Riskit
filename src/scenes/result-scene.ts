import { Scene, MiniEngine, GlobalSystems, FxPresets } from "../engine"

export function setupResultScene(scene: Scene, engine: MiniEngine, globals: GlobalSystems): void {
  const resultData = (engine as any).__resultData as {
    players: { id: string; name: string; scores: number[]; totalScore: number; cardCount: number }[]
    winnerId: string
  }
  const W = engine.screen.width
  const H = engine.screen.height
  const cx = W / 2
  const scale = W / 750

  if (!resultData) {
    console.error("No result data found")
    engine.scenes.goto("menu")
    return
  }

  // 1. 背景
  const bg = scene.add.graphics()
  bg.fillRect(0, 0, W, H, "#0a0a12")

  // 装饰性金色点缀
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const size = Math.random() * 4 + 1
    bg.fillCircle(x, y, size, `rgba(212, 175, 55, ${Math.random() * 0.3})`)
  }

  // 2. 标题
  const title = scene.add.text("游戏结束!", cx, 60, {
    fontSize: 36,
    color: "#d4af37",
    align: "center",
    bold: true,
  })
  title.setAnchor(0.5)

  // 3. 排序玩家
  const sortedPlayers = [...resultData.players].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore
    }
    return a.cardCount - b.cardCount // 牌越少排名越前
  })

  // 4. 排名列表
  const listContainer = scene.add.container(cx, 125)
  
  sortedPlayers.forEach((player, index) => {
    const isWinner = player.id === resultData.winnerId
    const yOffset = index * 80
    
    // 排名条背景
    const itemBg = scene.add.graphics(0, yOffset)
    const bgColor = isWinner ? "#2a2a1a" : "#1a1a2e"
    const borderColor = isWinner ? "#d4af37" : "#333"
    
    itemBg.fillRoundRect(-W * 0.42, 0, W * 0.84, 70, 8, bgColor)
    itemBg.strokeRect(-W * 0.42, 0, W * 0.84, 70, borderColor, 1)
    listContainer.addChild(itemBg)

    if (isWinner) {
      // 胜者脉冲动画
      let dir = -1
      scene.onUpdate((dt) => {
        itemBg.alpha += dir * dt * 0.5
        if (itemBg.alpha <= 0.6) dir = 1
        if (itemBg.alpha >= 1) dir = -1
      })
    }

    // 排名勋章
    const medals = ["🥇", "🥈", "🥉"]
    const medalText = medals[index] || `${index + 1}`
    const medal = scene.add.text(medalText, -W * 0.37, yOffset + 35, {
      fontSize: 24,
      align: "center"
    })
    medal.setAnchor(0.5)
    listContainer.addChild(medal)

    // 玩家名字
    const name = scene.add.text(player.name, -W * 0.29, yOffset + 35, {
      fontSize: 18,
      color: isWinner ? "#d4af37" : "#fff",
      bold: isWinner
    })
    name.setAnchor(0, 0.5)
    listContainer.addChild(name)

    // 分数 (带跳动动画)
    const scoreLabel = scene.add.text("0", W * 0.24, yOffset + 27, {
      fontSize: 24,
      color: "#fff",
      bold: true,
      align: "right"
    })
    scoreLabel.setAnchor(1, 0.5)
    listContainer.addChild(scoreLabel)

    // 分数跳动逻辑
    let currentDisplayScore = 0
    const targetScore = player.totalScore
    const duration = 1.5 // 秒
    let elapsed = 0

    scene.onUpdate((dt) => {
      if (elapsed < duration) {
        elapsed += dt
        const progress = Math.min(elapsed / duration, 1)
        currentDisplayScore = Math.floor(progress * targetScore)
        scoreLabel.setText(`${currentDisplayScore}`)
      }
    })

    // 卡牌数
    const cardInfo = scene.add.text(`${player.cardCount} 张牌`, W * 0.24, yOffset + 47, {
      fontSize: 12,
      color: "#aaa",
      align: "right"
    })
    cardInfo.setAnchor(1, 0.5)
    listContainer.addChild(cardInfo)
  })

  // 5. 彩纸特效 (如果是第一名)
  if (resultData.winnerId) {
    const particleGfx = scene.add.graphics()
    const confetti = FxPresets.confetti(cx, 0)
    confetti.burst(100)
    scene.onUpdate((dt) => {
      confetti.update(dt)
      particleGfx.clear()
      confetti.renderToGraphics(particleGfx)
    })
  }

  // 6. 底部按钮
  const btnY = H - 100
  scene.ui.button("再来一局", cx, btnY, () => {
    engine.scenes.goto("lobby", { type: "fade", duration: 500 })
  }).setStyle({
    bg: "#d4af37",
    fg: "#000",
    radius: 15,
    padding: [8, 30],
    fontSize: 16,
    bold: true
  })

  scene.ui.button("返回主页", cx, btnY + 50, () => {
    engine.scenes.goto("menu", { type: "fade", duration: 500 })
  }).setStyle({
    bg: "rgba(0,0,0,0)",
    fg: "#d4af37",
    radius: 15,
    padding: [8, 30],
    fontSize: 14
  })
}
