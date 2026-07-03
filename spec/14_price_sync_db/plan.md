# 14_price_sync_db — Implementation Plan

## 策略

分 5 步实施，采用"DB 层 → API 层 → 页面层 → 清理旧代码"的自底向上策略。每完成一步都验证 `pnpm typecheck` 不崩，确保增量安全。

核心原则：
- **Buy/Sell API 只做 DB 持久化**（现状不变），额外异步刷新池状态
- **Market API 直接 JOIN 返回**，不再需要客户端二次轮询
- **详情页优先读 DB**，冷启动 fallback 到链

---

## Step 1: 数据库迁移 — 新增 `market_pool_states` 表

**文件**: `packages/db/migrations/00004_pool_state_sync.sql`（新建）

```sql
-- 市场池状态快照表
-- 每个市场一行，UPSERT 更新，UNIQUE(market_id)
CREATE TABLE IF NOT EXISTS market_pool_states (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id   UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  yes_price   NUMERIC(10, 8) NOT NULL,
  no_price    NUMERIC(10, 8) NOT NULL,
  yes_supply  NUMERIC(40, 0) NOT NULL,
  no_supply   NUMERIC(40, 0) NOT NULL,
  liquidity   NUMERIC(40, 0) NOT NULL,
  fee_pool    NUMERIC(40, 0) NOT NULL,
  source      TEXT NOT NULL DEFAULT 'chain',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_id)
);

CREATE INDEX idx_pool_states_market ON market_pool_states (market_id);
CREATE INDEX idx_pool_states_updated ON market_pool_states (updated_at);
```

> **注意**：`market_id` 通过 UNIQUE 约束保证一个市场只有一行最新状态，后续用 upsert 原地更新，不产生历史行。

---

## Step 2: DB 数据层 — 新增池状态操作函数

**文件**: `packages/db/src/types.ts`（追加）

新增类型：
```typescript
export interface PoolStateRow {
  id: string;
  market_id: string;
  yes_price: number;
  no_price: number;
  yes_supply: string;
  no_supply: string;
  liquidity: string;
  fee_pool: string;
  source: string;
  updated_at: string;
}
```

**文件**: `packages/db/src/data.ts`（追加）

新增函数：
```typescript
// upsertPoolState — 插入或更新某个市场的池状态
export async function upsertPoolState(input: {
  market_id: string;
  yes_price: number;
  no_price: number;
  yes_supply: string;
  no_supply: string;
  liquidity: string;
  fee_pool: string;
  source?: string;
}): Promise<PoolStateRow>

// getPoolStateByMarketId — 获取某个市场的池状态
export async function getPoolStateByMarketId(
  marketId: string,
): Promise<PoolStateRow | null>

// listLatestPoolStates — 批量获取池状态（用于 JOIN 市场列表）
export async function listLatestPoolStates(
  marketIds: string[],
): Promise<Map<string, PoolStateRow>>
```

实现要点：
- `upsertPoolState` 使用 Supabase `upsert()` 基于 `market_id` 冲突原地更新
- `listLatestPoolStates` 接受 market_id 数组，一次 `SELECT WHERE market_id IN (...)` 返回，减少 DB roundtrip

---

## Step 3: 工具函数 — 池状态格式转换

**文件**: `apps/web/lib/contract/settlement.ts`（追加）

新增纯函数，将 `getPoolState()` 的链上返回值归一化为 DB 行格式：
```typescript
export interface NormalizedPoolState {
  yesPrice: number;
  noPrice: number;
  yesSupply: string;
  noSupply: string;
  liquidity: string;
  feePool: string;
}

export function normalizePoolState(
  pool: Awaited<ReturnType<typeof getPoolState>>,
): NormalizedPoolState
```

> `getPoolState` 返回 BigInt（`1e18` 精度价格、Sun 单位供应量），归一化函数做精度转换。

---

## Step 4: API 路由改造

### 4a. 刷新池状态端点（新）

**文件**: `apps/web/app/api/cron/refresh-pools/route.ts`（新建）

```typescript
// GET /api/cron/refresh-pools
// 遍历所有 active 市场 → getPoolState() → upsert market_pool_states
// 单次刷新，逐个处理，失败跳过不影响其他市场
```

### 4b. Buy API — 交易后触发刷新

**文件**: `apps/web/app/api/buy/route.ts`（修改）

在 `return Response.json(...)` 之前，增加**异步 fire-and-forget** 刷新：
```typescript
// 异步刷新池状态（不阻塞响应）
const marketSlug = findMarketSlugById(marketId);
if (marketSlug) {
  refreshPoolStateInBackground(marketId, marketSlug).catch(() => {});
}
```

> `refreshPoolStateInBackground` 是一个轻量 async 函数：调用 `getPoolState(slug)` → `normalizePoolState()` → `db.upsertPoolState()`。

### 4c. Sell API — 交易后触发刷新

**文件**: `apps/web/app/api/sell/route.ts`（修改）

与 Buy 同理，在返回前异步刷新池状态。

### 4d. 改造 `GET /api/markets` — JOIN 池状态

**文件**: `apps/web/app/api/markets/route.ts`（修改）

当前流程：
```
db.listMarkets() → marketRowToMarket() → 返回（yesPrice 为 mock 派生值）
```

改造后：
```
db.listMarkets() 
  → 提取所有 market_id 
  → db.listLatestPoolStates(ids) 
  → marketRowToMarket(row, poolState?) → 返回（yesPrice 为真实链上值）
```

`marketRowToMarket()` 签名需要改为支持可选的 `poolState` 参数：

**文件**: `apps/web/lib/mappers.ts`（修改）

```typescript
export function marketRowToMarket(
  row: MarketRow, 
  poolState?: PoolStateRow | null,
): Market {
  // ...
  const yesPrice = poolState 
    ? Number(poolState.yes_price) 
    : (fromMock?.yesPrice ?? 0.5 + ...);
  const liquidityUSD = poolState
    ? Number(poolState.liquidity) / 1e6
    : (fromMock?.liquidityUSD ?? ...);
  // ...
}
```

### 4e. 改造详情页 `GET /api/markets/[slug]`

**文件**: `apps/web/app/api/markets/[slug]/route.ts`（需确认是否存在，否则需新建）

详情页目前可能在 SSR 中直接调用 `getPoolState()`。改造后：
- 优先从 `market_pool_states` 读取（毫秒级）
- 如果 DB 无数据（新市场 / 冷启动），fallback 到 `getPoolState()` 并顺手写入 DB
- 详情页返回的 Market 对象附加 `_poolState` 字段

---

## Step 5: 前端清理

### 5a. 删除客户端轮询相关代码

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/hooks/useChainPrices.ts` | **删除** | 不再需要客户端轮询 |
| `apps/web/app/api/prices/route.ts` | **删除** | 不再需要批量查价 API |
| `apps/web/app/api/pool-state/[slug]/route.ts` | **删除** | 不再需要单市场查价 API |

### 5b. 修改列表页 — 移除 useChainPrices 调用

**文件**: `apps/web/app/markets/page.tsx`（修改）

- 删除 `import { useChainPrices, applyChainPrices } from "@/lib/hooks/useChainPrices"`
- 删除 `useChainPrices(slugs)` 调用
- 删除 `applyChainPrices(markets, prices)` 调用
- 直接使用 `fetchMarkets()` 返回的数据（已含真实池状态）

### 5c. 修改首页（如有引用）

**文件**: `apps/web/app/page.tsx`（检查并修改）

如果首页也使用了 `useChainPrices`，同样移除。

---

## Step 6: 类型检查 + 构建验证

```bash
pnpm typecheck
pnpm build
```

确保所有修改通过编译，无类型错误。

---

## 关键文件变更汇总

| 文件 | 操作 | 说明 |
|------|:----:|------|
| `packages/db/migrations/00004_pool_state_sync.sql` | 新建 | 新增 market_pool_states 表 |
| `packages/db/src/types.ts` | 修改 | 追加 PoolStateRow 类型 |
| `packages/db/src/data.ts` | 修改 | 追加 upsertPoolState / getPoolStateByMarketId / listLatestPoolStates |
| `apps/web/lib/contract/settlement.ts` | 修改 | 追加 normalizePoolState() |
| `apps/web/lib/mappers.ts` | 修改 | marketRowToMarket 支持 poolState 参数 |
| `apps/web/app/api/cron/refresh-pools/route.ts` | 新建 | 周期性刷新端点 |
| `apps/web/app/api/buy/route.ts` | 修改 | 交易后异步刷新池状态 |
| `apps/web/app/api/sell/route.ts` | 修改 | 交易后异步刷新池状态 |
| `apps/web/app/api/markets/route.ts` | 修改 | GET 时 JOIN pool_states |
| `apps/web/app/api/markets/[slug]/route.ts` | 修改/新建 | 详情优先读 DB |
| `apps/web/lib/hooks/useChainPrices.ts` | 删除 | 不再需要客户端轮询 |
| `apps/web/app/api/prices/route.ts` | 删除 | 不再需要批量查价 |
| `apps/web/app/api/pool-state/[slug]/route.ts` | 删除 | 不再需要单市场查价 |
| `apps/web/app/markets/page.tsx` | 修改 | 移除 useChainPrices 引用 |
| `apps/web/app/page.tsx` | 检查 | 移除可能的 useChainPrices 引用 |

---

## 数据流对比

### 改造前（T3 — 客户端各自轮询）
```
用户A → useChainPrices(15s循环) → /api/prices → N×getPoolState() → Trongrid
用户B → useChainPrices(15s循环) → /api/prices → N×getPoolState() → Trongrid
用户C → useChainPrices(15s循环) → /api/prices → N×getPoolState() → Trongrid
                        ↑ N个用户 × M个市场 = N×M次RPC ↑
```

### 改造后（T2 — DB 同步 + 共享缓存）
```
任何人交易 → buy/sell API → 异步写 DB（1次 RPC）
Cron(60s) → refresh-pools → N次 RPC → upsert DB
所有用户 → GET /api/markets → Supabase JOIN（0 次 RPC）
                        ↑ DB 是单一共享真相源 ↑
```

### 赛后扩展路径（T1 — 事件驱动）
```
合约 emit TradeExecuted 事件 → 索引器监听 → 直接写 DB
（无需 API 触发，替换 Step 4b/4c/4d 的"链上查询→写DB"为"监听事件→写DB"）
表结构不变，只需换数据写入方式，零破坏性升级。
```

---

## 注意事项

1. **Buy/Sell API 的池状态刷新是 fire-and-forget**：不能阻塞交易响应，失败静默丢弃
2. **`marketRowToMarket()` 需要兼容旧调用**：原参数量只有 1 个，新增可选的第二个参数 `poolState?`，未传时行为与改造前一致
3. **有 slug 但没有 market_id 的映射问题**：`getPoolState(slug)` 用 slug 查链，但 DB 表用 market_id。需要先用 `getMarketBySlug(slug)` 转换为 market_id
4. **Supabase upsert 依赖 `market_id` UNIQUE 约束**：Migration SQL 中已声明 `UNIQUE(market_id)`
5. **Vercel Hobby 计划 Cron 限制**：每天最多执行一次。对于 Demo 用途，可手动调用 `/api/cron/refresh-pools` 或在前端触发。生产环境可升级到 Pro 或改用外部 Cron（如 GitHub Actions）
6. **不要忘记同时更新 `packages/db/src/index.ts`** 导出新增的函数和类型
