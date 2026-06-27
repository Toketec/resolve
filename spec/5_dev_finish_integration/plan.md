# 5_dev_finish_integration — Implementation Plan

## 策略

分阶段替换，每完成一步都验证页面不崩:

1. 先替换「只读数据」页面（首页、markets、agents）→ 它们从 API 读取但看起来一样
2. 再替换「交互操作」（buy、resolve、settle）→ 从 UI 事件 → API 调用

## Step 1: 创建通用 API 客户端

**文件**: `apps/web/lib/api-client.ts`

```typescript
// 一层薄封装，使前端可以调用 API 路由
export async function apiGet<T>(path: string): Promise<T>
export async function apiPost<T>(path: string, body: unknown): Promise<T>

// 以下是对 api-contracts 的具体封装
export async function fetchMarkets(): Promise<Market[]>
export async function fetchMarket(slug: string): Promise<Market>
export async function fetchAgents(): Promise<Agent[]>
export async function fetchAgent(id: string): Promise<Agent>
export async function resolveMarket(slug: string): Promise<AIConsensus>
export async function buyShares(req: BuyRequest): Promise<BuyResult>
export async function settle(req: SettleRequest): Promise<SettleResult>
export async function fetchPrice(symbol: string): Promise<PriceSnapshot>
```

## Step 2: 替换首页（landing page）

**文件**: `apps/web/app/page.tsx`

替换:
```
import { MOCK_MARKETS, MOCK_AGENTS } from "@/lib/mock"
→ 
const [markets, setMarkets] = useState<Market[]>([])
const [agents, setAgents] = useState<Agent[]>([])
useEffect(() => { fetchMarkets().then(setMarkets); fetchAgents().then(setAgents) }, [])
```

注意首页是 "use client" — 已经是客户端组件，可直接加 hooks。

## Step 3: 替换市场列表页

**文件**: `apps/web/app/markets/page.tsx`

同样从 API 获取数据。

## Step 4: 替换市场详情页

**文件**: `apps/web/app/markets/[slug]/page.tsx`

此页面是服务端组件 — 需要在服务端 fetch:
```typescript
const market = await fetch(`http://localhost:3000/api/markets/${slug}`).then(r => r.json())
```
注意 Next.js 服务端组件 fetch 用绝对 URL（或相对的 rewrite）。

## Step 5: 替换 Agents 页面

**文件**: `apps/web/app/agents/page.tsx`

## Step 6: TradePanel + Buy 集成

**文件**: `apps/web/components/trade-panel.tsx`

- "Place YES/NO order" 按钮 → 调用 `buyShares()` API
- 成功后更新 UI 显示仓位信息
- 集成钱包连接状态（spec 2）— 未连接时提示连接

## Step 7: Resolve + Settle 集成

**文件**: `apps/web/app/markets/[slug]/page.tsx`（修改）

- 市场 `resolving` 状态 → 自动调用 `resolveMarket()` 
- 显示共识结果
- "Settle" 按钮 → 调用 `settle()` API

## Step 8: 验证

```
pnpm typecheck
pnpm build
# 浏览器手动测试所有页面
```

## 注意事项

- 注意 Next.js 渲染模式: 客户端组件用 fetch + useEffect，服务端组件用 async fetch
- 现有的 `marketBySlug()` 等 mock 函数在切换过程中保留作为 fallback
- 所有 API 调用要有 loading 和 error 状态
- TradePanel 中连接钱包的流程需要和 spec 2 的 wallet-provider 配合
- settle 成功后刷新页面数据

## 关键文件

| 文件 | 操作 |
|------|------|
| `apps/web/lib/api-client.ts` | [新建] API 客户端封装 |
| `apps/web/app/page.tsx` | [修改] 切换到 API 数据 |
| `apps/web/app/markets/page.tsx` | [修改] 切换到 API 数据 |
| `apps/web/app/markets/[slug]/page.tsx` | [修改] 切换到 API + resolve/settle |
| `apps/web/app/agents/page.tsx` | [修改] 切换到 API 数据 |
| `apps/web/components/trade-panel.tsx` | [修改] 接入 buy API |
