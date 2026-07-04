# 14_price_sync_db — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 14.1 | 新建 Migration `00004_pool_state_sync.sql` — 创建 `market_pool_states` 表 | ☑ | 15min | UNIQUE(market_id), 索引 market_id + updated_at |
| 14.2 | 追加 `PoolStateRow` 类型到 `packages/db/src/types.ts` | ☑ | 5min | 对齐 SQL 列定义 |
| 14.3 | 追加数据层函数到 `packages/db/src/data.ts` — upsertPoolState / getPoolStateByMarketId / listLatestPoolStates / getMarketById | ☑ | 30min | upsert 用 supabase.upsert()；listLatestPoolStates 用 .in() 批量查询；额外追加 getMarketById 用于 UUID→slug 转换 |
| 14.4 | 更新 `packages/db/src/index.ts` 导出新类型和新函数 | ☑ | 5min | 保证外部 import 可用 |
| 14.5 | 追加 `normalizePoolState()` 到 `apps/web/lib/contract/settlement.ts` | ☑ | 15min | BigInt→number/String 精度转换 |
| 14.6 | 改造 `apps/web/lib/mappers.ts` — `marketRowToMarket()` 接受可选 poolState 参数，有链上数据时覆盖 mock 派生值 | ☑ | 20min | yesPrice / liquidityUSD 优先用真实数据 |
| 14.7 | 新建 `apps/web/app/api/cron/refresh-pools/route.ts` — 遍历所有 active 市场，刷新池状态到 DB | ☑ | 20min | 逐个处理，失败跳过 |
| 14.8 | 改造 `apps/web/app/api/buy/route.ts` — 交易成功后异步刷新该市场池状态 | ☑ | 20min | fire-and-forget，不影响响应 |
| 14.9 | 改造 `apps/web/app/api/sell/route.ts` — 交易成功后异步刷新该市场池状态 | ☑ | 20min | 同 buy |
| 14.10 | 改造 `apps/web/app/api/markets/route.ts` — GET 时 JOIN pool_states 表，返回含真实价格的市场列表 | ☑ | 25min | 先查 markets，再批量查 pool_states，合并后返回 |
| 14.11 | 改造 `apps/web/app/api/markets/[slug]/route.ts` — 详情优先读 DB 池状态，fallback 返回 mock | ☑ | 25min | getPoolStateByMarketId 优先读 DB |
| 14.12 | 删除 `apps/web/lib/hooks/useChainPrices.ts` | ☑ | 5min | 不再需要客户端轮询 |
| 14.13 | 删除 `apps/web/app/api/prices/route.ts` | ☑ | 5min | 不再需要批量查价 API |
| 14.14 | 删除 `apps/web/app/api/pool-state/[slug]/route.ts` | ☑ | 5min | 不再需要单市场查价 API |
| 14.15 | 修改 `apps/web/app/markets/page.tsx` — 移除 useChainPrices/applyChainPrices 引用 | ☑ | 15min | 直接使用 fetchMarkets() 返回数据 |
| 14.16 | 修改 `apps/web/app/page.tsx` — 移除 useChainPrices 引用，清理 unused useMemo | ☑ | 15min | 首页不再客户端轮询价格 |
| 14.17 | 验证: `pnpm typecheck` + `pnpm build` 通过 | ☑ | 15min | ✓ 全部通过 |
| 14.18 | 验证: `next dev` 下所有页面可访问，列表页/详情页展示真实价格（非 mock 伪随机） | ☐ | 15min | 需手动启动 dev server 后在浏览器验证 + 执行 Migration + 调用 refresh-pools 灌入初始数据 |

## 任务依赖关系

```
14.1 (Migration) ──┬──→ 14.3 (数据层函数) ──→ 14.4 (导出) ──→ 14.7, 14.8, 14.9, 14.10 (API改造)
14.2 (类型) ───────┘
14.5 (normalizePoolState) ─────────────────────────────→ 14.7, 14.8, 14.9 (API 层)
14.6 (mappers 改造) ────────────────────────────────────→ 14.10, 14.11 (API 层)
14.10, 14.11 (API 改完) ──→ 14.12-14.16 (前端清理)
14.12-14.16 (前端清理完) ──→ 14.17 (typecheck+build) ──→ 14.18 (手动验证)
```

## 验证清单

- [x] `pnpm typecheck` 通过
- [x] `pnpm build` 通过
- [x] 代码检查确认: 全部 17 项代码任务已完成（2026-07-04 公孙离确认）
- [ ] Supabase 中 `market_pool_states` 表存在（需手动执行 Migration）
- [ ] `GET /api/markets` 返回的市场包含真实链上 `yesPrice`（非 mock 派生值，需先调用 refresh-pools 灌数据）
- [ ] `/markets` 列表页正常加载，显示 8 个市场 + 真实价格
- [ ] `/markets/btc-150k-2026` 详情页正常加载
- [ ] Buy 操作后池状态即时刷新（`market_pool_states` 表 `updated_at` 更新）
- [ ] Sell 操作后池状态即时刷新
- [ ] `GET /api/cron/refresh-pools` 可手动触发全量刷新
- [ ] 首页正常加载（无 useChainPrices 残留引用）
- [x] `useChainPrices.ts` 文件已删除
- [x] `/api/prices` 路由已删除
- [x] `/api/pool-state/[slug]` 路由已删除
- [ ] 页面视觉效果与改造前一致
