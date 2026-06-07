import { Scene, MiniEngine, GlobalSystems } from '../engine';
import { RenderLayer } from '../engine/render/layers';
import { GameState, ThreatStack, CardInstance } from '../shared/types';
import { GameSync } from '../net/game-sync';
import { GameHost } from '../net/game-host';
import { AIPlayer } from '../net/ai-player';
import { DangerZoneView } from '../entities/danger-zone-view';
import { PlayerAreaView } from '../entities/player-area-view';
import { GameFX } from '../entities/game-fx';
import { getDangerZoneStacks } from '../shared/game-rules';
import { CardView } from '../entities/card-view';

const CARD_DESC: Record<string, { name: string; desc: string }> = {
  crocodile: { name: '鳄鱼', desc: '威胁卡：叠加到危险区域' },
  spider: { name: '蜘蛛', desc: '威胁卡：叠加到危险区域' },
  scorpion: { name: '蝎子', desc: '威胁卡：叠加到危险区域' },
  piranha: { name: '食人鱼', desc: '威胁卡：叠加到危险区域' },
  snake: { name: '蛇', desc: '威胁卡：叠加到危险区域' },
  chupacabra: { name: '卓柏卡布拉', desc: '吞噬一叠威胁卡' },
  split: { name: '分割卡', desc: '选择一种威胁类型归入' },
  bribe: { name: '贿赂', desc: '偷取他人的危险区域卡牌' },
  backpack: { name: '背包', desc: '额外收集一次宝藏' },
  panther_juice: { name: '黑豹汁', desc: '目标玩家无法退出本轮' },
  statue: { name: '诅咒神像', desc: '宝藏卡，退出时获得分数' },
  machete: { name: '砍刀', desc: '可抵消一张威胁卡' },
};

export function setupGameScene(scene: Scene, engine: MiniEngine, globals: GlobalSystems): void {
  const W = engine.screen.width;
  const H = engine.screen.height;
  const cx = W / 2;
  const scale = W / 750;
  // Enable z-index sorting so overlay containers render on top
  scene._pixiObj.sortableChildren = true;

  scene.add.sprite('assets/ui/jungle_bg.png', cx, H / 2)
    .setAnchor(0.5, 0.5)
    .setSize(W, H);

  const roomData = (engine as any).__roomData;
  if (!roomData) {
    scene.ui.toast('Room data missing');
    engine.scenes.goto('menu');
    return;
  }

  const sync = new GameSync(engine);
  let host: GameHost | null = null;
  const aiPlayers: AIPlayer[] = [];
  const myId = roomData.playerId;
  const roomId = roomData.roomId;

  let dangerZoneView: DangerZoneView;
  let localPlayerView: PlayerAreaView;
  const opponentViews: Map<string, PlayerAreaView> = new Map();
  let currentInputRequestId: string | null = null;
  const fx = new GameFX(scene, engine);
  let prevState: GameState | null = null;
  let pendingReveal: Promise<void> | null = null;

  async function showCardReveal(card: CardInstance): Promise<void> {
    return new Promise<void>((resolve) => {
      // Top-level container to keep everything above other scene elements
      const revealContainer = scene.add.container(0, 0);
      revealContainer.layer = 9999 as RenderLayer;

      // Dark overlay — must set size for hitTest
      const overlay = scene.add.graphics(0, 0);
      overlay.fillRect(0, 0, W, H, 'rgba(0,0,0,0.7)');
      overlay.setSize(W, H);
      overlay.interactive = true;
      revealContainer.addChild(overlay);

      // Card (face down initially) — scale up from small to ~1.7x for dramatic reveal
      const cardView = new CardView(scene, card, { faceDown: true });
      // CardView internal size is 70x98; center it at cx, H*0.35
      const cardBaseW = 70;
      const cardBaseH = 98;
      cardView.node.setSize(cardBaseW, cardBaseH);
      cardView.node.setAnchor(0.5, 0.5);
      cardView.node.setPosition(cx, H * 0.35);
      cardView.node.setScale(0.2, 0.2);
      revealContainer.addChild(cardView.node);

      // Card name + description text (hidden initially)
      const type: string = card.assignedType || card.def.threatType || card.def.type;
      const info = CARD_DESC[type] || { name: type, desc: '' };
      const nameText = scene.add.text(info.name, cx, H * 0.60, { fontSize: 24, color: '#FFD700', align: 'center', bold: true });
      nameText.setVisible(false);
      revealContainer.addChild(nameText);
      const descText = scene.add.text(info.desc, cx, H * 0.66, { fontSize: 16, color: '#fff', align: 'center' });
      descText.setVisible(false);
      revealContainer.addChild(descText);
      const hintText = scene.add.text('点击继续', cx, H * 0.78, { fontSize: 14, color: '#aaa', align: 'center' });
      hintText.setVisible(false);
      revealContainer.addChild(hintText);

      // Animation: pop-in → wait → flip → show text
      const targetScale = 1.7;
      let animDone = false;
      scene.tween!.async(cardView.node, { scaleX: targetScale, scaleY: targetScale }, { duration: 300, easing: 'easeOutBack' }).then(async () => {
        await scene.timer!.wait(400);
        // Flip: scaleX → 0
        await scene.tween!.async(cardView.node, { scaleX: 0.01 }, { duration: 200, easing: 'linear' });
        // Switch to front
        cardView.setFaceDown(false);
        // Flip: scaleX → targetScale
        await scene.tween!.async(cardView.node, { scaleX: targetScale }, { duration: 200, easing: 'linear' });
        // Show text
        nameText.setVisible(true);
        descText.setVisible(true);
        hintText.setVisible(true);
        animDone = true;
      });

      // Tap to dismiss (only after animation completes)
      overlay.onTap(() => {
        if (!animDone) return;
        revealContainer.destroy();
        resolve();
      });
    });
  }

  const statusBar = scene.add.container(0, 0);
  const statusBg = scene.add.graphics(0, 0);
  statusBg.fillRect(0, 0, W, 50, 'rgba(10, 31, 28, 0.8)');
  statusBar.addChild(statusBg);
  
  const logoText = scene.add.text('RISKiT', 15, 25, { fontSize: 20, color: '#ffffff', bold: true, align: 'left' });
  logoText.setAnchor(0, 0.5);
  statusBar.addChild(logoText);
  
  const roundText = scene.add.text('第 1 回合 / 共 5 回合', W - 15, 25, { fontSize: 12, color: '#34d399', align: 'right' });
  roundText.setAnchor(1, 0.5);
  statusBar.addChild(roundText);

  const statusMsg = scene.add.text('', cx, H * 0.88, { fontSize: 18, color: '#fff', align: 'center' });
  
  const drawBtn = scene.ui.button('继续探索', W * 0.73, H - 40, () => {
    fx.vibrateMedium();
    sync.sendAction(roomId, { type: 'draw', playerId: myId });
  });
  drawBtn.setStyle({ bg: '#11332D', fg: '#ffffff', radius: 12, padding: [12, 24], fontSize: 16, bold: true });
  drawBtn.setVisible(false);
  
  const exitBtn = scene.ui.button('扎营结算', W * 0.27, H - 40, () => {
    fx.vibrateLight();
    sync.sendAction(roomId, { type: 'exit', playerId: myId });
  });
  exitBtn.setStyle({ bg: '#10b981', fg: '#050F0D', radius: 12, padding: [12, 24], fontSize: 16, bold: true });
  exitBtn.setVisible(false);

  async function handleInputRequest(request: any) {
    if (request.playerId !== myId) return;
    const requestId = `${request.type}_${request.playerId}`;
    if (currentInputRequestId === requestId) return;
    currentInputRequestId = requestId;

    const idx = await scene.ui.dialog({
      title: '请选择',
      content: `请选择 ${request.type}`,
      buttons: request.options
    });

    if (idx !== -1) {
      const opt = request.options[idx];
      let actionType = '';
      switch (request.type) {
        case 'choose_split_type': actionType = 'choose_split'; break;
        case 'choose_bribe_response': actionType = 'choose_bribe_response'; break;
        case 'choose_panther_target': actionType = 'choose_panther_target'; break;
        case 'choose_machete_use': actionType = 'choose_machete'; break;
        case 'choose_collect_target': actionType = 'choose_collect_target'; break;
        case 'choose_backpack_use': actionType = 'choose_backpack_use'; break;
      }
      sync.sendAction(roomId, { type: actionType, playerId: myId, data: opt });
    }
    currentInputRequestId = null;
  }

  function updateUI(state: GameState) {
    const round = state.currentRound;
    if (!round) return;

    roundText.setText(`Round ${round.roundNumber}/5`);
    const me = state.players.find(p => p.id === myId);
    if (me) {
      const score = me.scorePile.reduce((sum, c) => sum + c.def.treasureValue, 0);
      // Score is now handled by PlayerAreaView
    }

    if (!dangerZoneView) dangerZoneView = new DangerZoneView(scene, W * 0.05, 150, W * 0.9, 100);
    const stacks = getDangerZoneStacks(round);
    dangerZoneView.update(stacks, null);

    if (!localPlayerView) localPlayerView = new PlayerAreaView(scene, W * 0.05, H - 160, { isLocalPlayer: true, width: W * 0.9, height: 150 });
    const myState = round.players.find(p => p.id === myId);
    if (myState) localPlayerView.update(myState);

    const opponents = round.players.filter(p => p.id !== myId);
    const oppW = (W - 40) / 3;
    opponents.forEach((p, i) => {
      let view = opponentViews.get(p.id);
      if (!view) {
        view = new PlayerAreaView(scene, 10 + i * (oppW + 10), 60, { isLocalPlayer: false, width: oppW, height: 80 });
        opponentViews.set(p.id, view);
      }
      view.update(p);
    });

    const isMyTurn = round.players[round.currentPlayerIndex].id === myId;
    const isRevealing = pendingReveal !== null;
    drawBtn.setVisible(isMyTurn && (round.phase === 'draw' || round.phase === 'exit_window') && !isRevealing);
    exitBtn.setVisible(round.phase === 'exit_window' && !!myState?.isActive && !myState.isPantherJuiced && !isRevealing);

    if (round.inputRequest) handleInputRequest(round.inputRequest);

    if (round.phase === 'collecting') {
      const sortedPlayers = round.players
        .filter(p => p.exitToken && !p.exitToken.isCoffin)
        .sort((a, b) => a.exitToken!.number - b.exitToken!.number);
      const currentCollector = sortedPlayers[round.collectingPlayerIndex];
      if (currentCollector && currentCollector.id === myId) {
        statusMsg.setText('你的收集回合 — 请选择目标');
        const targets: { text: string, id: string }[] = [];
        // 可以选择任何玩家（包括自己）面前有危险区牌的
        round.players.forEach(p => {
          if (p.dangerZoneCards.length > 0) {
            targets.push({ text: `${p.name} 的卡牌`, id: p.id });
          }
        });
        if (round.centerCards.length > 0) {
          targets.push({ text: '中央卡牌', id: 'center' });
        }
        if (targets.length > 0) {
          const requestId = `collect_${round.roundNumber}_${round.collectingPlayerIndex}`;
          if (currentInputRequestId !== requestId) {
            currentInputRequestId = requestId;
            (async () => {
              const idx = await scene.ui.dialog({
                title: '收集宝藏',
                content: '请选择要收集的目标：',
                buttons: targets.map(t => t.text)
              });
              if (idx !== -1) {
                sync.sendAction(roomId, { type: 'collect_treasure', playerId: myId, data: targets[idx].id });
              }
              currentInputRequestId = null;
            })();
          }
        }
      } else if (currentCollector) {
        statusMsg.setText(`${currentCollector.name} 正在收集宝藏...`);
      }
    } else {
      dangerZoneView.setNonInteractive();
      statusMsg.setText(isMyTurn ? '你的回合 — 点击抽牌' : `${round.players[round.currentPlayerIndex].name} 正在思考...`);
    }
    if (round.phase === 'round_end') {
      statusMsg.setText('本轮结束，正在结算...');
    }

    if (prevState && state.currentRound) {
      const prevRound = prevState.currentRound;
      const currRound = state.currentRound;
      if (prevRound) {
        if (currRound.roundNumber !== prevRound.roundNumber) {
          fx.animateRoundStart(currRound.roundNumber);
        }
        const prevStacks = prevRound ? getDangerZoneStacks(prevRound) : [];
        const currStacks = getDangerZoneStacks(currRound);
        const prevCards = prevStacks.reduce((sum: number, s: ThreatStack) => sum + s.cards.length, 0);
        const currCards = currStacks.reduce((sum: number, s: ThreatStack) => sum + s.cards.length, 0);
        if (currCards > prevCards) {
          const newCardStack = currStacks.find((s: ThreatStack, i: number) => s.cards.length > (prevStacks[i]?.cards.length || 0));
          if (newCardStack) {
            const targetPos = dangerZoneView.getStackPosition(newCardStack.threatType);
            const tempCard = scene.add.sprite('assets/cards/card_back.png', W * 0.86, H * 0.22);
            tempCard.setSize(30, 45).setAnchor(0.5, 0.5).setVisible(false);
            fx.animateCardDraw(W * 0.86, H * 0.22, targetPos.x, targetPos.y, tempCard).then(() => tempCard.destroy());
          }
        }
        currRound.players.forEach((p, i) => {
          const prevP = prevRound.players.find(pp => pp.id === p.id);
          if (p.exitToken?.isCoffin && !prevP?.exitToken?.isCoffin) fx.animateBust(cx, H * 0.3);
          if (p.exitToken && !p.exitToken.isCoffin && !prevP?.exitToken) fx.animateSafeExit(cx, H * 0.3);
        });
        const maxStack = Math.max(...currStacks.map((s: ThreatStack) => s.totalValue), 0);
        fx.startDangerPulse(dangerZoneView.node, maxStack / 12);

        // Detect new card drawn by local player
        if (currRound.lastDrawnCard && 
            currRound.lastDrawnCard.ownerId === myId &&
            (!prevRound.lastDrawnCard || prevRound.lastDrawnCard.id !== currRound.lastDrawnCard.id)) {
          // Queue the card reveal (don't await in updateUI directly)
          const drawnCard = currRound.lastDrawnCard;
          pendingReveal = showCardReveal(drawnCard).then(() => { pendingReveal = null; });
        }
      }
      if (round.phase === 'collecting' && prevState.currentRound?.phase !== 'collecting') {
        const me = state.players.find(p => p.id === myId);
        const prevMe = prevState.players.find(p => p.id === myId);
        if (me && prevMe) {
          const score = me.scorePile.reduce((sum, c) => sum + c.def.treasureValue, 0);
          const prevScore = prevMe.scorePile.reduce((sum, c) => sum + c.def.treasureValue, 0);
          if (score !== prevScore) {
            // fx.animateScoreChange(totalScoreText, prevScore, score);
          }
        }
      }
    }
    prevState = JSON.parse(JSON.stringify(state));

    if (state.phase === 'game_over') {
      const resultData = {
        players: state.players.map(p => ({
          id: p.id,
          name: p.name,
          scores: [],
          totalScore: p.scorePile.reduce((sum, c) => sum + c.def.treasureValue, 0),
          cardCount: p.scorePile.length
        })),
        winnerId: ''
      };
      const sorted = [...resultData.players].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.cardCount - b.cardCount;
      });
      resultData.winnerId = sorted[0]?.id || '';
      (engine as any).__resultData = resultData;
      engine.scenes.goto('result', { type: 'fade', duration: 1000 });
      return;
    }
  }

  if (roomData.isHost) {
    host = new GameHost(engine, sync, roomId);
    host.initGame(roomData.playerIds, roomData.includeOptionalCards ?? true).then(() => {
      if (roomData.isSoloMode) {
        const state = host!.getState();
        if (state) {
          const nameMap: Record<string, string> = {
            [myId]: '你',
            'ai_xiaoming': 'AI 小明',
            'ai_xiaohong': 'AI 小红'
          };
          state.players.forEach(p => { if (nameMap[p.id]) p.name = nameMap[p.id]; });
          if (state.currentRound) {
            state.currentRound.players.forEach(p => { if (nameMap[p.id]) p.name = nameMap[p.id]; });
          }
        }
      }
      host!.start();
    });
  }

  if (roomData.isSoloMode && roomData.aiPlayerIds) {
    const aiNames = ['AI 小明', 'AI 小红'];
    roomData.aiPlayerIds.forEach((aiId: string, i: number) => {
      const ai = new AIPlayer(aiId, sync, roomId, aiNames[i] || `AI ${i + 1}`);
      aiPlayers.push(ai);
    });
  }

  sync.watchState(roomId, (state) => {
    updateUI(state);
    aiPlayers.forEach(ai => ai.onStateUpdate(state));
  });

  scene.on('destroy', () => {
    sync.destroy();
    if (host) host.destroy();
    aiPlayers.forEach(ai => ai.destroy());
  });
}
