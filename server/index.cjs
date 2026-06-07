'use strict';

const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  createGame, startRound, drawCard, playerExit,
  collectTreasure, resolveInput, getScores, aiDecide,
  THREAT_TYPES
} = require('./game-logic.cjs');

const PORT = process.env.PORT || 8080;
const STATIC_DIR = path.join(__dirname, '..');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

const httpServer = http.createServer((req, res) => {
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'home.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not Found'); return; }
  if (fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime + (mime.startsWith('text') ? '; charset=utf-8' : '') });
  fs.createReadStream(filePath).pipe(res);
});

const wss = new WebSocketServer({ server: httpServer });

const rooms = new Map();

function genRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(id) ? genRoomId() : id;
}

function genPlayerId() {
  return 'p_' + Math.random().toString(36).slice(2, 8);
}

function broadcast(room, msg, excludeWs) {
  const data = JSON.stringify(msg);
  room.clients.forEach((info, ws) => {
    if (ws !== excludeWs && ws.readyState === 1) ws.send(data);
  });
}

function sendTo(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function getPlayerList(room) {
  return Array.from(room.clients.values()).map(c => ({
    id: c.playerId,
    name: c.playerName,
    isHost: c.isHost
  }));
}

function sanitizeState(state, forPlayerId) {
  if (!state) return null;
  const s = JSON.parse(JSON.stringify(state));
  if (s.currentRound && s.currentRound.deck) {
    s.currentRound.deckCount = s.currentRound.deck.length;
    delete s.currentRound.deck;
  }
  return s;
}

function advanceGame(room) {
  const st = room.gameState;
  if (!st || !st.currentRound) return;
  const rd = st.currentRound;

  if (rd.phase === 'round_end') {
    if (st.roundNumber >= 5) {
      st.phase = 'game_over';
      broadcast(room, { type: 'game_over', scores: getScores(st) });
      return;
    }
    room.gameState = startRound(st);
    broadcast(room, { type: 'state_update', state: sanitizeState(room.gameState) });
    setTimeout(() => advanceGame(room), 500);
    return;
  }


  broadcast(room, { type: 'state_update', state: sanitizeState(room.gameState) });
}

function processAction(room, action) {
  const st = room.gameState;
  if (!st || !st.currentRound) return false;
  const rd = st.currentRound;

  switch (action.type) {
    case 'draw': {
      if (rd.phase !== 'draw' && rd.phase !== 'exit_window') return false;
      if (rd.players[rd.currentPlayerIndex]?.id !== action.playerId) return false;
      if (rd.phase === 'exit_window') rd.phase = 'draw';
      const result = drawCard(st);
      room.gameState = result.state;
      if (result.drawnCard) {
        broadcast(room, {
          type: 'card_drawn',
          card: result.drawnCard,
          playerId: action.playerId
        });
      }
      if (result.needsInput) {
        broadcast(room, { type: 'input_required', request: result.needsInput });
        return true;
      }
      advanceGame(room);
      return true;
    }
    case 'exit': {
      if (rd.phase !== 'exit_window') return false;
      const p = rd.players.find(x => x.id === action.playerId);
      if (!p || !p.isActive) return false;
      room.gameState = playerExit(st, action.playerId);
      broadcast(room, { type: 'player_exited', playerId: action.playerId });
      advanceGame(room);
      return true;
    }
    case 'choose_split': {
      if (!rd.inputRequest || rd.inputRequest.playerId !== action.playerId) return false;
      if (!THREAT_TYPES.includes(action.data)) return false;
      room.gameState = resolveInput(st, { playerId: action.playerId, type: 'choose_split_type', value: action.data });
      advanceGame(room);
      return true;
    }
    case 'collect_treasure': {
      if (rd.phase !== 'collecting') return false;
      room.gameState = collectTreasure(st, action.playerId, action.data);
      advanceGame(room);
      return true;
    }
    default:
      return false;
  }
}

wss.on('connection', (ws) => {
  let currentRoom = null;
  let playerId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'create_room': {
        const roomId = genRoomId();
        playerId = genPlayerId();
        const room = {
          id: roomId,
          clients: new Map(),
          gameState: null,
          maxPlayers: msg.maxPlayers || 4,
          started: false
        };
        room.clients.set(ws, { playerId, playerName: msg.playerName || '玩家', isHost: true });
        rooms.set(roomId, room);
        currentRoom = room;
        sendTo(ws, {
          type: 'room_created',
          roomId,
          playerId,
          players: getPlayerList(room)
        });
        break;
      }

      case 'join_room': {
        const room = rooms.get(msg.roomId?.toUpperCase());
        if (!room) { sendTo(ws, { type: 'error', message: '房间不存在' }); break; }
        if (room.started) { sendTo(ws, { type: 'error', message: '游戏已开始' }); break; }
        if (room.clients.size >= room.maxPlayers) { sendTo(ws, { type: 'error', message: '房间已满' }); break; }
        playerId = genPlayerId();
        room.clients.set(ws, { playerId, playerName: msg.playerName || '玩家', isHost: false });
        currentRoom = room;
        sendTo(ws, {
          type: 'room_joined',
          roomId: room.id,
          playerId,
          players: getPlayerList(room)
        });
        broadcast(room, { type: 'player_joined', players: getPlayerList(room) }, ws);
        break;
      }

      case 'start_game': {
        if (!currentRoom) break;
        const info = currentRoom.clients.get(ws);
        if (!info || !info.isHost) { sendTo(ws, { type: 'error', message: '只有房主可以开始游戏' }); break; }
        if (currentRoom.clients.size < 2) { sendTo(ws, { type: 'error', message: '至少需要2名玩家' }); break; }
        currentRoom.started = true;
        const playerIds = [];
        const playerNames = {};
        currentRoom.clients.forEach(c => {
          playerIds.push(c.playerId);
          playerNames[c.playerId] = c.playerName;
        });
        let state = createGame(playerIds, playerNames);
        state = startRound(state);
        currentRoom.gameState = state;
        broadcast(currentRoom, {
          type: 'game_started',
          state: sanitizeState(state)
        });
        break;
      }

      case 'action': {
        if (!currentRoom || !currentRoom.started) break;
        if (!playerId) break;
        processAction(currentRoom, { ...msg.action, playerId });
        break;
      }

      case 'reconnect': {
        const room = rooms.get(msg.roomId);
        if (!room) { sendTo(ws, { type: 'error', message: '房间不存在' }); break; }
        let found = false;
        room.clients.forEach((info, oldWs) => {
          if (info.playerId === msg.playerId) {
            room.clients.delete(oldWs);
            room.clients.set(ws, info);
            currentRoom = room;
            playerId = msg.playerId;
            found = true;
          }
        });
        if (found) {
          sendTo(ws, {
            type: 'reconnected',
            roomId: room.id,
            playerId,
            players: getPlayerList(room),
            state: room.gameState ? sanitizeState(room.gameState) : null,
            started: room.started
          });
        } else {
          sendTo(ws, { type: 'error', message: '玩家不在房间中' });
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!currentRoom) return;
    const info = currentRoom.clients.get(ws);
    if (!info) return;
    currentRoom.clients.delete(ws);
    if (currentRoom.clients.size === 0) {
      rooms.delete(currentRoom.id);
    } else {
      broadcast(currentRoom, {
        type: 'player_left',
        playerId: info.playerId,
        players: getPlayerList(currentRoom)
      });
      if (info.isHost) {
        const first = currentRoom.clients.entries().next().value;
        if (first) {
          first[1].isHost = true;
          broadcast(currentRoom, { type: 'host_changed', players: getPlayerList(currentRoom) });
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`RISKiT server running at http://localhost:${PORT}`);
  console.log(`WebSocket + static files on single port`);
});
