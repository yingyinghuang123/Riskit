# WxCloud — 云开发

通过 `game.wx.cloud` 访问。在开发环境下，云开发会自动切换到 `localStorage` 模拟实现，无需配置即可测试逻辑。

## 初始化

```typescript
interface CloudConfig { env: string; traceUser?: boolean }
game.wx.cloud.init(config: CloudConfig): boolean
```

```typescript
game.wx.cloud.init({ env: 'prod-123', traceUser: true })
```

## 数据库 CRUD

所有数据库操作均返回 Promise。操作失败时 graceful fail（返回 `null`、`false`、`[]` 或 `0`），不会抛出异常。

```typescript
interface CloudQuery { 
  where?: Record<string, unknown>
  orderBy?: { field: string; direction: 'asc' | 'desc' }
  limit?: number
  skip?: number 
}

```

### 增加数据 (add)
```typescript
const id = await game.wx.cloud.add('scores', { value: 100, user: 'p1' })  // → string | null
```

### 查询列表 (get)
```typescript
const items = await game.wx.cloud.get('scores', { limit: 10 })  // → T[]
```

### 按 ID 查询 (getById)
```typescript
const item = await game.wx.cloud.getById('scores', 'doc-id')  // → T | null
```

### 更新数据 (update)
```typescript
const ok = await game.wx.cloud.update('scores', 'doc-id', { value: 200 })  // → boolean
```

### 删除数据 (remove)
```typescript
const ok = await game.wx.cloud.remove('scores', 'doc-id')  // → boolean
```

### 统计数量 (count)
```typescript
const total = await game.wx.cloud.count('scores', { where: { value: 100 } })  // → number
```

## 用户数据

便捷管理当前玩家的存档数据。

### 保存用户数据
```typescript
await game.wx.cloud.saveUserData({ level: 5, items: ['sword'] })  // → boolean
```

### 读取用户数据
```typescript
const data = await game.wx.cloud.loadUserData()  // → T | null
```

## 排行榜

获取云端存储的排行数据。

```typescript
const top50 = await game.wx.cloud.getLeaderboard('world-rank', 'score', 50)  // → T[]
```

## 实时监听

监听集合或文档的变化。

```typescript
interface CloudWatcher { close(): void }
const watcher = game.wx.cloud.watch('messages', { where: { room: '1' } }, (snapshot) => {
  console.log('收到新消息', snapshot.docs)
})
// watcher.close() // 停止监听
```

## 云函数

调用部署在云端的 Node.js 函数。

```typescript
const result = await game.wx.cloud.callFunction('pay-order', { id: '123' })  // → CloudResult<T> | null
```

## 云存储

管理云端文件。

### 上传文件
```typescript
const fileId = await game.wx.cloud.uploadFile('avatars/u1.png', tempFilePath)  // → string | null
```

### 获取文件链接
```typescript
const url = await game.wx.cloud.getFileUrl(fileId)  // → string | null
```

### 删除文件
```typescript
const ok = await game.wx.cloud.deleteFile(fileId)  // → boolean
```

## 销毁

清理云开发实例及所有监听器。

```typescript
game.wx.cloud.destroy()
```
