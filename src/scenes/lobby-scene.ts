import { MiniEngine, Scene, createGlobalSystems } from '../engine'
import { RoomManager, Room } from '../net/room-manager'

export function setupLobbyScene(scene: Scene, engine: MiniEngine, globals: ReturnType<typeof createGlobalSystems>): void {
  const roomData = (engine as any).__roomData
  if (!roomData) {
    engine.scenes.goto('menu')
    return
  }

  const { roomId, playerId, roomManager, isHost } = roomData as {
    roomId: string
    playerId: string
    roomManager: RoomManager
    isHost: boolean
  }

  const W = engine.screen.width
  const H = engine.screen.height
  const cx = W / 2
  const scale = W / 750

  const bg = scene.add.graphics()
  bg.fillRect(0, 0, W, H, '#1a1a2e')

  scene.add.text(`房间: ${roomId}`, cx, 40, {
    fontSize: 20,
    color: '#ffffff',
    align: 'center',
    bold: true
  })

  const copyBtn = scene.ui.button('复制ID', W - 60, 40, () => {
    if ((engine as any).wx) {
      (engine as any).wx.setClipboardData({
        data: roomId,
        success: () => scene.ui.toast('已复制到剪贴板')
      })
    }
  })
  copyBtn.setStyle({ fontSize: 10, padding: [5, 10], bg: '#444' })

  const playerListContainer = scene.add.container(cx, 80)
  const optionsArea = scene.add.container(cx, H * 0.62)
  const bottomArea = scene.add.container(cx, H * 0.75)
  
  let lastPlayersJSON = ''
  let lastIncludeOptional: boolean | null = null

  const refreshPlayerList = (room: Room) => {
    // Only rebuild player list if players actually changed
    const playersJSON = JSON.stringify(room.players)
    if (playersJSON !== lastPlayersJSON) {
      lastPlayersJSON = playersJSON
      playerListContainer.removeAllChildren()
      
      const slots = 4
      const itemHeight = Math.min(50, (H * 0.45) / 4)
      const gap = 10
      const panelWidth = W * 0.85

      for (let i = 0; i < slots; i++) {
        const player = room.players[i]
        const y = i * (itemHeight + gap)
        
        const panel = scene.ui.panel(-panelWidth / 2, y, panelWidth, itemHeight, {
          bg: player ? '#2a2a4e' : '#1a1a3e',
          radius: 6,
          borderWidth: player ? 1 : 0.5,
          borderColor: player ? '#4CAF50' : '#444'
        })
        playerListContainer.addChild(panel)
        if (player) {
          const nameText = player.name + (player.id === room.hostId ? ' 👑' : '')
          panel.addChild(scene.ui.label(nameText, 10, itemHeight * 0.3, { fontSize: 16, color: '#fff' }))
          
          const statusText = player.ready ? '已准备' : '等待中...'
          const statusColor = player.ready ? '#4CAF50' : '#888'
          panel.addChild(scene.ui.label(statusText, panelWidth * 0.7, itemHeight * 0.35, { fontSize: 12, color: statusColor }))
        } else {
          panel.addChild(scene.ui.label('等待加入...', 10, itemHeight * 0.35, { fontSize: 14, color: '#555' }))
        }
      }

      updateButtons(room)
    }

    if (room.status === 'playing') {
      ;(engine as any).__roomData = {
        ...roomData,
        playerIds: room.players.map(p => p.id),
        includeOptionalCards: room.includeOptionalCards
      }
      engine.scenes.goto('game', { type: 'fade', duration: 500 })
    }

    // Only rebuild options if includeOptionalCards changed
    if (room.includeOptionalCards !== lastIncludeOptional) {
      lastIncludeOptional = room.includeOptionalCards
      updateOptions(room)
    }
  }


  const updateOptions = (room: Room) => {
    optionsArea.removeAllChildren()
    if (isHost) {
      const label = scene.ui.label('包含可选卡', -100, 0, { fontSize: 14, color: '#fff' })
      const toggle = scene.ui.toggle(60, -10, room.includeOptionalCards).onChange(async (val: boolean) => {
        try {
          await roomManager.updateRoomOptions(roomId, { includeOptionalCards: val })
        } catch (e: any) {
          scene.ui.toast('更新失败: ' + e.message)
        }
      })
      optionsArea.addChild(label)
      optionsArea.addChild(toggle)
    } else {
      const text = room.includeOptionalCards ? '包含可选卡: 是' : '包含可选卡: 否'
      optionsArea.addChild(scene.ui.label(text, 0, 0, { fontSize: 14, color: '#888', align: 'center' }))
    }
  }

  let actionBtn: any = null
  let leaveBtn: any = null

  const updateButtons = (room: Room) => {
    if (actionBtn) actionBtn.removeFromParent()
    if (leaveBtn) leaveBtn.removeFromParent()

    const me = room.players.find(p => p.id === playerId)
    const allReady = room.players.length >= 2 && room.players.every(p => p.ready)

    if (isHost) {
      actionBtn = scene.ui.button('开始游戏', 0, 0, async () => {
        if (!allReady) {
          scene.ui.toast('等待所有玩家准备')
          return
        }
        try {
          await roomManager.startGame(roomId)
        } catch (e: any) {
          scene.ui.toast('启动失败: ' + e.message)
        }
      })
      actionBtn.setDisabled(!allReady)
    } else {
      const ready = me?.ready || false
      actionBtn = scene.ui.button(ready ? '取消准备' : '准备', 0, 0, async () => {
        try {
          await roomManager.setReady(roomId, playerId, !ready)
        } catch (e: any) {
          scene.ui.toast('操作失败: ' + e.message)
        }
      })
    }

    actionBtn.setStyle({
      bg: allReady || (!isHost && me?.ready) ? '#4CAF50' : '#2196F3',
      fg: '#fff',
      radius: 20,
      fontSize: 16,
      padding: [10, 30]
    })
    bottomArea.addChild(actionBtn)

    leaveBtn = scene.ui.button('离开房间', 0, H * 0.1, async () => {
      try {
        await roomManager.leaveRoom(roomId, playerId)
        engine.scenes.goto('menu')
      } catch (e: any) {
        scene.ui.toast('离开失败: ' + e.message)
      }
    })
    leaveBtn.setStyle({ bg: '#f44336', fg: '#fff', radius: 20, fontSize: 12, padding: [5, 20] })
    bottomArea.addChild(leaveBtn)
  }

  roomManager.watchRoom(roomId, (room) => {
    refreshPlayerList(room)
  })

  scene.on('destroy', () => {
    roomManager.stopWatching()
  })
}
