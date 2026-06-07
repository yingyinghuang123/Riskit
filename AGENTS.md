# 微信小游戏项目

> **CRITICAL**: 运行环境**不是浏览器**。没有 DOM/BOM，全局对象是 `GameGlobal`。

## 项目结构

```
src/
├── game.ts          # 入口（初始化引擎、注册场景、启动）
├── engine/          # 引擎核心（尽量不改，修 bug 除外）
├── scenes/          # 游戏场景（按需创建）
├── entities/        # 游戏实体（按需创建）
└── types/           # 类型定义
assets/              # 静态资源（图片/音频/模型）
docs/pitfalls/       # 踩坑知识库
```

> `scenes/`、`entities/` 初始不存在，开发时按需创建。

| 可修改                                                      | 谨慎修改                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/game.ts`, `src/scenes/*`, `src/entities/*`, `assets/*` | `src/engine/*`（修 bug 可改，改后记录 pitfall）, `game.json`, `project.config.json` |

## 引擎文档

引擎 API 和使用方式详见 `src/engine/README.md`，各模块文档在 `src/engine/docs/`。

**编写代码前必须先阅读引擎 README。**

## 关键约束

- 无 `window`/`document`/`navigator`，无 `eval()`/`new Function()`
- 主包限制 4MB，资源路径以 `assets/` 开头
- 单文件控制在 300 行以内，复杂逻辑拆分到多个文件

## 踩坑知识库（`docs/pitfalls/`）

修改代码前，**先搜索 `docs/pitfalls/` 查找相关坑点**。

满足任一条时记录新坑点：

1. 用户纠正了做法
2. 同类问题第二次出现
3. 自修复中发现非显而易见的根因

格式见 `docs/pitfalls/_template.md`。
