# 1_dev_finish_core_api — Implementation Plan

## 步骤

### Step 1: 创建内存数据层 `apps/web/lib/store.ts`

将 `lib/mock/markets.ts`、`lib/mock/agents.ts`、`lib/mock/positions.ts`、`lib/mock/index.ts` 中的数据迁移到一个单一 store 中。

**store 结构**:
```
class AppStore (singleton)
  markets: Map<string, Market>
  agents: Map<string, Agent>
  trades: Trade[]
  positions: Position[]
  initialized: boolean

  getMarket(slug): Market
  listMarkets(): Market[]
  getAgent(id): Agent
  listAgents(): Agent[]
  addPosition(p): void
  getPositions(): Position[]
```

### Step 2: 创建 API routes

创建以下文件列表:

```
apps/web/app/api/markets/route.ts              → GET /api/markets (list all)
apps/web/app/api/markets/[slug]/route.ts        → GET /api/markets/:slug (detail)
apps/web/app/api/markets/[slug]/resolve/route.ts → GET /api/markets/:slug/resolve
apps/web/app/api/agents/route.ts                → GET /api/agents
apps/web/app/api/agents/[id]/route.ts           → GET /api/agents/:id
apps/web/app/api/buy/route.ts                   → POST /api/buy
apps/web/app/api/settle/route.ts                → POST /api/settle
apps/web/app/api/price/[symbol]/route.ts        → GET /api/price/:symbol
```

每个 route handler 从 store 读取/写入数据，返回 JSON。

### Step 3: 确保 mock 迁移后前端仍能工作

- 保留 `lib/mock/` 中现有文件暂时不动（前端仍 import 它们）
- 但 API route 能返回同样的数据
- 后续 spec 5（integration）中才会将前端切换到 API 调用

### Step 4: 验证

```bash
pnpm typecheck
pnpm build
curl http://localhost:3000/api/markets
curl http://localhost:3000/api/markets/btc-150k-2026
```

## 注意事项

- Next.js Route Handlers 会自动处理 CORS
- Next.js 16 App Router 中 route handler 使用 `export async function GET()`
- `params` 在 Next.js 16 中是 Promise 类型: `{ params }: { params: Promise<{ slug: string }> }`
- 所有日期保持 ISO 字符串格式，不做序列化转换
- store 在 module scope 中初始化（单例模式在 Node.js module 中自然成立）

## 关键文件

| 文件 | 操作 |
|------|------|
| `apps/web/lib/store.ts` | [新建] 内存数据层 |
| `apps/web/app/api/markets/route.ts` | [新建] 市场列表 |
| `apps/web/app/api/markets/[slug]/route.ts` | [新建] 市场详情 |
| `apps/web/app/api/markets/[slug]/resolve/route.ts` | [新建] 解析接口 |
| `apps/web/app/api/agents/route.ts` | [新建] Agent 列表 |
| `apps/web/app/api/agents/[id]/route.ts` | [新建] Agent 详情 |
| `apps/web/app/api/buy/route.ts` | [新建] 买入接口 |
| `apps/web/app/api/settle/route.ts` | [新建] 结算接口 |
| `apps/web/app/api/price/[symbol]/route.ts` | [新建] 行情接口 |
