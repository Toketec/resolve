# 7_dev_finish_portfolio_api — Implementation Plan

## 策略

三阶段：① 创建 API 读取路由（有 mock 兜底）② 添加到 api-client ③ 修改 portfolio 页面

---

## Step 1: 创建 GET /api/positions

**文件**: `apps/web/app/api/positions/route.ts`

```
GET /api/positions?wallet=TTest123
```

逻辑：
1. 从 query 读取 `wallet` 参数
2. 无 wallet → 返回空数组 `[]`
3. 有 wallet → 从 Supabase `positions` 表按 `wallet_address` 查询
4. 每条 position 需要 join market 数据获取 marketTitle/marketCategory/current(yesPrice)
5. Supabase 不可达或有任何错误 → 返回 `MOCK_POSITIONS`（mock 兜底）

返回形状（`@resolve/shared` 的 `Position[]`）：
```ts
interface Position {
  id: string; marketId: string; marketTitle: string;
  marketCategory: Category; side: Outcome; shares: number;
  avgPrice: number; currentPrice: number; status: MarketStatus;
}
```

Supabase 查询参考 `POST /api/buy` 的写法：
```ts
const db = getDb()
if (db) {
  const rows = await db.listPositionsByWallet(wallet)
  // 用 mappers 做行→Position 映射
}
```

需要先在 `packages/db/src/data.ts` 添加 `listPositionsByWallet(wallet)`，或在 route 中直接用 raw supabase query。

> 简单做法：route 中直接用 supabase query（`from('positions').select('*, markets(*)').eq('wallet_address', wallet)`），不经过 db 包——跟 Spec 1 的路由风格一致。

### 兜底实现

```ts
import { MOCK_POSITIONS, portfolioStats } from "@/lib/mock";

const FALLBACK = MOCK_POSITIONS;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get('wallet')
  if (!wallet) return Response.json([])

  const db = getDb()
  if (db) {
    try {
      // 从 Supabase 查询 + join markets
      const rows = await db.from('positions')
        .select('*, markets!inner(*)')
        .eq('wallet_address', wallet)
      if (rows.length > 0) return Response.json(rows.map(rowToPosition))
    } catch { /* fall through */ }
  }

  return Response.json(FALLBACK)  // mock 兜底
}
```

---

## Step 2: 创建 GET /api/trades

**文件**: `apps/web/app/api/trades/route.ts`

```
GET /api/trades?wallet=TTest123
```

逻辑与 positions 基本一致，只是返回 Trade 形状（多了 `at` 时间戳和 `user` 字段）。

Supabase 版本：从 `positions` 表按 `created_at` 排序取记录，映射为 Trade（at = created_at, user.address = wallet_address）。

兜底：从 `MOCK_TRADES` 过滤或返回全部。

---

## Step 3: 添加到 api-client.ts

**文件**: `apps/web/lib/api-client.ts`

新增方法：
```ts
export async function fetchPositions(wallet: string): Promise<Position[]>
export async function fetchTrades(wallet: string): Promise<Trade[]>
```

实现：
```ts
export async function fetchPositions(wallet: string): Promise<Position[]> {
  return apiGet<Position[]>(`/api/positions?wallet=${encodeURIComponent(wallet)}`)
}
```

---

## Step 4: 修改 portfolio/page.tsx

**文件**: `apps/web/app/portfolio/page.tsx`

### 改动要点

1. **添加 import**:
```ts
import { useEffect, useState } from "react"
import { useWallet } from "@/components/wallet-provider"
import { fetchPositions, fetchTrades } from "@/lib/api-client"
import { portfolioStats } from "@/lib/mock"  // portfolioStats 是纯计算函数，保留
```

2. **状态管理**（客户端组件化）：
```ts
"use client"  // 需要加在顶部
export default function PortfolioPage() {
  const wallet = useWallet()
  const [positions, setPositions] = useState<Position[]>(MOCK_POSITIONS)
  const [trades, setTrades] = useState<Trade[]>(MOCK_TRADES.slice(0, 12))

  useEffect(() => {
    if (wallet?.address) {
      fetchPositions(wallet.address).then(setPositions).catch(() => {})
      fetchTrades(wallet.address).then(setTrades).catch(() => {})
    }
  }, [wallet?.address])

  const stats = portfolioStats(positions)
  // ... 其余 JSX 不变
```

3. **Wallet 卡片**（右侧面板）：
```
Mock wallet → connect a real wallet in the next phase.
↓ 替换为
{wallet.connected ? 真实地址+余额 : "未连接"}
```

---

## Step 5: 验证

```bash
pnpm typecheck
pnpm build
# 手动:
curl http://localhost:3000/api/positions?wallet=TTest123
curl http://localhost:3000/api/trades?wallet=TTest123
# 浏览器打开 /portfolio 确认显示正常
```

## 注意事项

- ⚡ 页面现在是 server component，改成 "use client" 后确保不影响 SSR
- ⚡ 使用 `useWallet()` 前确认 `page.tsx` 在 WalletProvider 内（layout.tsx 已包裹）
- ⚡ Supabase `positions` 表中 `market_id` 和 `markets` 表的 `id` 需要对应
- mock 文件不删除——它是 supabase 不可达时的兜底
- `portfolioStats()` 函数接收 positions 数组参数，改为从 API 数据实时计算

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/app/api/positions/route.ts` | [新建] | 持仓查询 — Supabase 查+兜底 |
| `apps/web/app/api/trades/route.ts` | [新建] | 交易记录 — Supabase 查+兜底 |
| `apps/web/lib/api-client.ts` | [修改] | 添加 fetchPositions/fetchTrades |
| `apps/web/app/portfolio/page.tsx` | [修改] | 改为客户端组件+API数据+钱包联动 |
