# 1_dev_finish_core_api — Implementation Plan

> **数据策略变更**: 不再使用过渡内存 store，API Route 直连 Supabase + HTX 公开 API。
> `lib/store.ts` 废弃，不创建。

## 步骤

### Step 1: 确认 Supabase 连接 + 执行迁移 00002

先在终端验证 Supabase 连接：

```bash
# 在项目根目录执行（确保 pnpm-workspace.yaml 可见）
# 确认 .env.local 中 SUPABASE_URL 和 SUPABASE_ANON_KEY 已配置
pnpm --filter @resolve/db exec tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const { data } = await supabase.from('markets').select('slug');
console.log(JSON.stringify(data));
"
```

如果 Supabase 迁移 `00001_initial_schema.sql` 尚未执行 → 先去 Supabase Dashboard SQL Editor 执行。

然后执行新迁移 `00002_add_agents.sql`：
- 打开 https://supabase.com/dashboard/project/vrubfcgxxxxnbkurmoaj/sql/new
- 粘贴 `packages/db/migrations/00002_add_agents.sql` 全部内容 → 运行

### Step 2: 创建 API routes（直连 Supabase + HTX）

创建以下文件列表：

```
apps/web/app/api/markets/route.ts               → GET  /api/markets         (从 Supabase markets 表读取)
apps/web/app/api/markets/[slug]/route.ts         → GET  /api/markets/:slug   (从 Supabase markets 表读取)
apps/web/app/api/markets/[slug]/resolve/route.ts → GET  .../resolve          (返回 mock AIConsensus)
apps/web/app/api/agents/route.ts                 → GET  /api/agents          (从 Supabase agents 表读取)
apps/web/app/api/agents/[id]/route.ts            → GET  /api/agents/:id      (从 Supabase agents 表读取)
apps/web/app/api/buy/route.ts                    → POST /api/buy             (数据写入 Supabase positions)
apps/web/app/api/settle/route.ts                 → POST /api/settle          (json mock)
apps/web/app/api/price/[symbol]/route.ts         → GET  /api/price/:symbol   (HTX 公开 API 代理)
apps/web/app/api/price/[symbol]/depth/route.ts   → GET  .../depth            (HTX 订单簿深度代理)
apps/web/app/api/price/[symbol]/kline/route.ts   → GET  .../kline            (HTX K 线数据代理)
```

**路由实现方式**：

#### Markets (市场)
```ts
// apps/web/app/api/markets/route.ts
import { createServerClient } from '@/lib/supabase-server'  // 需要创建

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase.from('markets').select('*').order('created_at', { ascending: false })
  return Response.json(data || [])
}
```

需要先创建 `apps/web/lib/supabase-server.ts`（服务端 Supabase 客户端）：
```ts
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!  // 或 ANON_KEY
  return createClient(url, key)
}
```

#### Agents (Agent)
类似 markets，从 Supabase `agents` 表读取。

#### Price (价格)
```ts
// apps/web/app/api/price/[symbol]/route.ts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const res = await fetch(`https://api.htx.com/market/detail/merged?symbol=${symbol}`)
  const data = await res.json()
  return Response.json({
    symbol: symbol.toUpperCase(),
    price: data.tick?.close || 0,
    change24h: data.tick?.percentChange || 0,
    high24h: data.tick?.high || 0,
    low24h: data.tick?.low || 0,
    vol24h: data.tick?.vol || 0,
    source: 'htx',
    at: new Date().toISOString(),
  })
}
```

#### Depth (订单簿)
```ts
// apps/web/app/api/price/[symbol]/depth/route.ts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const res = await fetch(`https://api.htx.com/market/depth?symbol=${symbol}&type=step0`)
  const data = await res.json()
  return Response.json({
    symbol: symbol.toUpperCase(),
    bids: data.tick?.bids || [],
    asks: data.tick?.asks || [],
    source: 'htx',
    at: new Date().toISOString(),
  })
}
```

#### Kline (K 线)
```ts
// apps/web/app/api/price/[symbol]/kline/route.ts
const PERIOD = '1day'
const SIZE = 30
export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const url = `https://api.htx.com/market/history/kline?symbol=${symbol}&period=${PERIOD}&size=${SIZE}`
  const res = await fetch(url)
  const data = await res.json()
  return Response.json({
    symbol: symbol.toUpperCase(),
    period: PERIOD,
    klines: (data.data || []).map((k: any) => ({
      timestamp: k.id,
      open: k.open,
      close: k.close,
      high: k.high,
      low: k.low,
      volume: k.vol,
    })),
    source: 'htx',
    at: new Date().toISOString(),
  })
}
```

#### Buy (买入 — 数据真，链上 mock)
```ts
// apps/web/app/api/buy/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const { marketId, side, amount, walletAddress } = body

  // 真实写入 Supabase
  const supabase = createServerClient()
  const { data, error } = await supabase.from('positions').insert({
    market_id: marketId,
    wallet_address: walletAddress,
    side,
    amount,
    tx_hash: 'mock_tx_' + Date.now(),  // 链上签名 mock，等到 spec 4 替换
  }).select().single()

  return Response.json({
    id: data?.id,
    marketId,
    side,
    shares: amount,  // 1:1 映射，简化为 demo
    txHash: data?.tx_hash,
    status: 'confirmed',
  })
}
```

#### Resolve (mock — 等 spec 3)
在 `apps/web/app/api/markets/[slug]/resolve/route.ts` 中返回 mock AIConsensus。

#### Settle (mock — 等 spec 4)
在 `apps/web/app/api/settle/route.ts` 中返回 mock txHash。

### Step 3: 确保前端兼容

- 保留 `lib/mock/` 中现有文件不动（前端页面仍然从 mock 读取）
- API route 已能从真实数据源返回相同形状的数据
- 后续 spec 5（integration）中才会将前端切换到 API 调用

### Step 4: 验证

```bash
pnpm typecheck
pnpm build
curl http://localhost:3000/api/markets
curl http://localhost:3000/api/markets/btc-150k-eoy
curl http://localhost:3000/api/agents
curl http://localhost:3000/api/price/BTC
curl http://localhost:3000/api/price/BTC/depth
curl http://localhost:3000/api/price/BTC/kline
curl -X POST http://localhost:3000/api/buy -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","side":"YES","amount":100,"walletAddress":"TTest123"}'
curl http://localhost:3000/api/markets/btc-150k-eoy/resolve
curl -X POST http://localhost:3000/api/settle -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","outcome":"YES","winnerWallet":"TTest123"}'
```

## 注意事项

- ⚡ **Supabase 连接**：`apps/web` 使用环境变量 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`（或 `SUPABASE_ANON_KEY`）
- ⚡ **ENV 文件**：`apps/web/.env.local` 需要包含 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。如果没有 `SERVICE_ROLE_KEY`，用 `SUPABASE_ANON_KEY`
- ⚡ **URL 符号映射**：HTX API 使用 `btcusdd` 格式（小写无分隔符），前端会传 `BTC`。API Route 中拼接时注意转换
- Next.js 16 App Router 中 route handler 使用 `export async function GET()`
- `params` 在 Next.js 16 中是 Promise 类型: `{ params }: { params: Promise<{ slug: string }> }`
- 所有日期保持 ISO 字符串格式

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/supabase-server.ts` | [新建] | 服务端 Supabase 客户端 |
| `apps/web/app/api/markets/route.ts` | [新建] | 市场列表 — 从 Supabase |
| `apps/web/app/api/markets/[slug]/route.ts` | [新建] | 市场详情 — 从 Supabase |
| `apps/web/app/api/markets/[slug]/resolve/route.ts` | [新建] | 解析接口 — mock |
| `apps/web/app/api/agents/route.ts` | [新建] | Agent 列表 — 从 Supabase |
| `apps/web/app/api/agents/[id]/route.ts` | [新建] | Agent 详情 — 从 Supabase |
| `apps/web/app/api/buy/route.ts` | [新建] | 买入 — 写入 Supabase + mock tx |
| `apps/web/app/api/settle/route.ts` | [新建] | 结算 — mock |
| `apps/web/app/api/price/[symbol]/route.ts` | [新建] | 行情 — HTX 公开 API |
| `apps/web/app/api/price/[symbol]/depth/route.ts` | [新建] | 订单簿深度 — HTX 公开 API |
| `apps/web/app/api/price/[symbol]/kline/route.ts` | [新建] | K 线 — HTX 公开 API |
| `packages/db/migrations/00002_add_agents.sql` | [新增] | agents 表迁移 + 种子数据 |
