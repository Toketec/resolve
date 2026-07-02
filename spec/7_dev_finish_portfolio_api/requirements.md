# 7_dev_finish_portfolio_api — Portfolio Page Data Integration

## 解决的问题

Portfolio 页面目前完全依赖 `lib/mock/positions.ts` 中的硬编码 mock 数据——用户的持仓、交易记录和统计数据全部是假的。而 `POST /api/buy` 已经在把买入记录写入 Supabase `positions` 表了，只是没有对应的 GET 接口来读取这些数据。

此规格创建持仓/交易读取 API，让 Portfolio 页面展示真实或兜底数据。

## 工作边界

- ✅ 新建 `GET /api/positions?wallet=<address>` — 从 Supabase `positions` 表读取某钱包的持仓
- ✅ 新建 `GET /api/trades?wallet=<address>` — 从 Supabase `positions` 表派生交易记录（每笔 buy=一条 trade）
- ✅ 两个路由都有 mock 兜底（Supabase 不可达时不崩，返回 `MOCK_POSITIONS` / `MOCK_TRADES`）
- ✅ 修改 `api-client.ts` — 添加 `fetchPositions(wallet)` / `fetchTrades(wallet)`
- ✅ 修改 `portfolio/page.tsx` — 从 API 读取 + wallet 状态联动
- ✅ 保留 mock/positions.ts 作为兜底数据源（mappers 依赖，不删除）
- ❌ 不修改 Position/Trade 类型（`@resolve/shared` 已有）
- ❌ 不修改 POST /api/buy 的写入逻辑
- ❌ 不实现交易历史筛选/分页

## 依赖项

- 前置: `@resolve/shared` 中 `Position` / `Trade` 类型 ✅ 已有
- 前置: `POST /api/buy` 写入 Supabase `positions` 表 ✅ 已有
- 前置: `lib/types.ts` 中 Position/Trade 类型 ✅ 已有
- 前置: wallet-provider（Spec 2） — portfolio 需要钱包地址做查询参数
- 后置: 钱包连接后 portfolio 自动刷新

## 验收标准

1. `GET /api/positions?wallet=TTest123` 返回 Position 数组（来自 Supabase || mock）
2. `GET /api/trades?wallet=TTest123` 返回 Trade 数组（来自 Supabase || mock）
3. Supabase 不可达时 → 返回 mock 数据，HTTP 200（不返回 500）
4. 缺少 wallet 参数时 → 返回空数组 []
5. Portfolio 页面默认使用 mock 数据渲染（SSR 初始）
6. 钱包地址可用时 → 自动调用 API → 替换真实数据
7. 统计面板（value/cost/pnl/open）跟随 API 数据重新计算
8. Wallet 卡片接入 TronLink 真实地址/余额（无 TronLink 时显示 mock）
9. `pnpm typecheck` + `pnpm build` 通过

## 边界与约束

- 持仓数据来源：Supabase `positions` 表（`POST /api/buy` 的写入目标）
- 交易记录 = `positions` 表按 `created_at` 排序派生（每行 = 一次买入）
- 统计值（value/cost/pnl）完全由 positions 实时计算，不在 DB 存派生字段
- 无未登录/无钱包状态 → 页面显示 mock 数据（兜底，不强制要求连接钱包才能看页面）
- 钱包地址从 `useWallet()` 获取（依赖 wallet-provider）
