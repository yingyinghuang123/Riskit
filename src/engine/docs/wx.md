# Wx — 微信平台集成

通过 `game.wx` 访问（需初始化 `WxPlatform`）。

```typescript
import { WxPlatform } from './engine'

const wxp = new WxPlatform()
wxp.init(engine)   // 挂载到 engine.wx
```

## 分享 (game.wx.share)

```typescript
game.wx.share.enable()                               // 开启分享菜单
game.wx.share.setDefault({ title, imageUrl, query })  // 被动分享内容
game.wx.share.send({ title, imageUrl, query })         // 主动分享
game.wx.share.onReceive(callback)                       // 收到分享消息
```

## 社交 (game.wx.social)

```typescript
const friends = await game.wx.social.getFriendData()  // → FriendData[]
await game.wx.social.setUserData({ key: 'score', value: '100' })
game.wx.social.showRankList()
```

## 广告 (game.wx.ads)

```typescript
// 激励视频
const result = await game.wx.ads.showRewardedAd('adUnitId')
if (result) { /* 用户看完了 */ }

// Banner
game.wx.ads.showBanner('adUnitId', { bottom: 0 })
game.wx.ads.hideBanner()

// 插屏
await game.wx.ads.showInterstitial('adUnitId')
```

## 登录 (game.wx.auth)

```typescript
const { code, userInfo } = await game.wx.auth.login()
const settings = await game.wx.auth.getSetting()
```

## 存储 (game.wx.storage)

```typescript
game.wx.storage.set('key', value)     // 同步写入
const v = game.wx.storage.get('key')  // 同步读取
game.wx.storage.remove('key')
game.wx.storage.clear()
const info = game.wx.storage.info()   // 存储信息
```

## 支付 (game.wx.pay)

```typescript
await game.wx.pay.purchase({
  offerId: '...',
  currencyType: 'CNY',
  buyQuantity: 10,
})
```

## 网络 (game.wx.http / game.wx.ws)

```typescript
// HTTP
const res = await game.wx.http.request({
  url: 'https://api.example.com/data',
  method: 'POST',
  data: { key: 'value' },
})
// res: { statusCode, data, header }

// WebSocket
const ws = game.wx.ws.connect('wss://example.com')
ws.onMessage((data) => {})
ws.send(data)
ws.close()
```

## 云开发 (game.wx.cloud)

云数据库 / 云函数 / 云存储 / 实时监听。详见 [cloud.md](cloud.md)。

```typescript
// 初始化
game.wx.cloud.init({ env: 'your-env-id' })

// 存取用户数据
await game.wx.cloud.saveUserData({ score: 100, level: 5 })
const data = await game.wx.cloud.loadUserData()

// 排行榜
const top10 = await game.wx.cloud.getLeaderboard('scores', 'score', 10)

// 云函数
const result = await game.wx.cloud.callFunction('checkScore', { score: 100 })
```

## AI 推理 (game.wx.ai)

```typescript
const session = await game.wx.ai.createSession('model_path')
const output = await session.run({ input: tensor })
session.destroy()
```

## 录屏 (game.wx.recorder)

```typescript
game.wx.recorder.start({ duration: 60 })
const result = await game.wx.recorder.stop()
// result: { videoPath, duration, width, height }
```

## 振动 (game.wx.vibrate)

```typescript
game.wx.vibrate.short('medium')   // 'light' | 'medium' | 'heavy'
game.wx.vibrate.long()
```

## 生命周期 (自动管理)

`WxLifecycle` 自动处理 `wx.onShow/onHide/onError`，连接引擎的 pause/resume。
