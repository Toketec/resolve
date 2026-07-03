# 14_price_sync_db — 链上池状态同步到数据库

## 解决的问题

当前市场列表页（`/markets`）和详情页（`/markets/[slug]`）的价格数据通过以下方式获取：

| 页面 | 当前做法 | 问题 |
|------|----------|------|
| 列表页 | 客户端 `useChainPrices` 每 15s 轮询 `/api/prices?slugs=a,b,c,...` | 每个用户打开页面 = M 个市场 × 1 次 Trongrid RPC 调用，N 个用户 = N×M 次调用，无共享缓存 |
| 详情页 | SSR 直接调 `getPoolState()` | 每次请求实时上链查询，延迟 1-3s，同样不共享缓存 |
| `/api/prices` | 遍历 slugs 逐个调 `getPoolState()` | 每次被轮询都打 N 次 RPC |
| `/api/pool-state/[slug]` | 实时调 `getPoolState()` | 无缓存，每次都是新鲜 RPC |

**核心矛盾**：每次页面访问都直接打到 Trongrid RPC 上，没有共享缓存层。Shasta 测试网虽不限流，但大量并发 RPC 调用造成明显延迟，且架构不可扩展。

**解决方案**：将链上池状态（Pool State）周期性同步到 Supabase 数据库，前端统一从 DB 读取。与项目 ADR-005/006 的 Hybrid 架构原则完全一致。

## 行业基准

Polymarket 的数据管道：`合约事件 → 索引器 → PostgreSQL + TimescaleDB → API 层 + Redis 缓存 → 前端`。前端绝不直接读合约。中小型 DeFi dApp 常用"定时快照 + DB 同步"模式。本 spec 采用后者（适合当前 Hackathon 阶段），并为事件驱动索引器留好扩展路径。

## 工作边界

- ✅ 新增 `market_pool_states` 表到 Supabase（Migration `00004_pool_state_sync.sql`）
- ✅ DB 数据层新增 `upsertPoolState()` / `getPoolState()` / `listLatestPoolStates()` 函数
- ✅ 改造 `GET /api/markets` — JOIN `market_pool_states`，返回含真实价格的完整数据
- ✅ 改造 `GET /api/markets/[slug]` — 详情页优先读 DB 池状态，无则 fallback 实时查询
- ✅ Buy / Sell API 成功后触发即时池状态刷新（异步，不影响主流程）
- ✅ `marketRowToMarket()` 映射函数中 `yesPrice` 优先使用 DB 池状态覆盖 mock 派生值
- ✅ 添加 `GET /api/cron/refresh-pools` 周期性兜底刷新端点
- ❌ 不引入 Redis / WebSocket / 索引器等新基础设施
- ❌ 不修改合约端逻辑
- ❌ 不修改仪表盘/Portfolio 页面（它们不需要实时价格）

## 依赖项

- 前置: spec 5（API routes + 数据层已建立）✅ 已完成
- 前置: spec 8（真实合约连接）✅ 已完成
- 前置: spec 12（AMM + Sell）✅ 已完成
- Supabase 可用（免费 500MB 内）
- Trongrid RPC 可访问（只读查询，不依赖服务端私钥）

## 验收标准

1. 新增 `market_pool_states` 表在 Supabase 中成功创建
2. `GET /api/markets` 返回的每个市场包含真实链上 `yesPrice`（非 mock 派生值）
3. 列表页 `/markets` 不再使用客户端 `useChainPrices` 轮询，页面加载速度显著提升
4. 详情页优先从 DB 读取池状态，无数据时 fallback 到实时链上查询并写入 DB
5. 用户买入/卖出后，对应市场池状态即时刷新到 DB
6. `GET /api/cron/refresh-pools` 可手动触发全量刷新
7. 前端代码清理：删除 `useChainPrices` hook、`applyChainPrices` 函数、`/api/prices` 路由、`/api/pool-state/[slug]` 路由
8. `pnpm typecheck` + `pnpm build` 通过
9. 所有页面视觉效果与改造前一致（价格来源变了但数值合理）
