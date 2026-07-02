# Spec 10: 执行计划

## 核心架构

```
旧 (5 份拷贝各自维护)                 新 (单源真理 + DB 持久化)
────────────────────                  ────────────────────────────
prompts.ts (AI 人设) ──→ 不动          prompts.ts ──→ 保留完整 system prompt
mock/agents.ts ────────→ 冗余拷贝      mock/agents.ts ──→ import AGENT_META 派生
mappers.ts ────────────→ 冗余拷贝      mappers.ts ──→ import AGENT_META 派生
SQL migration ─────────→ 过期不执行    SQL migration ──→ 保留不动
                                      @resolve/shared/agents.ts ←── 唯一编辑点
                                      packages/db/scripts/seed-agents.ts → DB
```

## 规范配置完整数据

以下 6 个 Agent 的规范数据来自 `spec/10_agent_config_sync/canonical-design.md`（引用自 docs/）：

### 核心标识 + 模型

| Agent ID | Callsign | Name | Role | Stance | Weight | modelHint | sortOrder |
|:--------:|:--------:|:----:|:----:|:-----:|:------:|-----------|:---------:|
| bull-1 | BULL-1 | Exchange Oracle | exchange-oracle | BULL | 1.0 | Claude Sonnet 4 | 1 |
| bull-2 | BULL-2 | Tech Oracle | tech-oracle | BULL | 0.8 | Claude Sonnet 4 | 2 |
| bear-1 | BEAR-1 | Media Oracle | media-oracle | BEAR | 0.8 | Claude Sonnet 4 | 3 |
| bear-2 | BEAR-2 | Regulation Oracle | regulation-oracle | BEAR | 0.8 | Claude Sonnet 4 | 4 |
| neut-1 | NEUT-1 | Onchain Oracle | onchain-oracle | NEUT | 0.9 | B.AI（主推） | 5 |
| neut-2 | NEUT-2 | Macro Oracle | macro-oracle | NEUT | 0.9 | Claude Sonnet 4 | 6 |

### Canonical Description（UI 展示用，来自 whitepaper analytical lens）

```
bull-1: "Technical analysis agent specializing in BTC price trends, trading volume, and HTX order book signals. Provisioned with real-time HTX market data."
bull-2: "Fundamentals agent tracking TEE adoption, L2 scaling, blockchain fundamentals, and protocol upgrades for a technology-driven bullish read."
bear-1: "Fundamental analysis agent focusing on news sentiment, regulatory announcements, and social media signals for FUD detection and balanced assessment."
bear-2: "Global regulatory agent monitoring SEC, EU MiCA, and cross-border policy for downside risk assessment and compliance threat detection."
neut-1: "Data-driven neutral analysis agent examining on-chain metrics, whale positions, exchange flows, and DeFi TVL for impartial assessment."
neut-2: "Macro agent weighing interest rates, GDP forecasts, geopolitical risk, and global liquidity for a probabilistic neutral stance."
```

### 统计字段（保持 mock/agents.ts 现有精确值不变）

| Agent | uptimePct | resolutions | accuracyPct | avgConfidence | region |
|:-----:|:---------:|:-----------:|:-----------:|:-------------:|:------:|
| bull-1 | 0.9994 | 4181 | 0.987 | 0.94 | ap-south-1 |
| bull-2 | 0.9981 | 3240 | 0.964 | 0.89 | eu-west-2 |
| bear-1 | 0.9999 | 3722 | 0.961 | 0.88 | us-east-1 |
| bear-2 | 0.9978 | 2890 | 0.974 | 0.91 | eu-central-1 |
| neut-1 | 0.9967 | 6204 | 0.994 | 0.97 | us-west-2 |
| neut-2 | 0.9991 | 2114 | 0.981 | 0.93 | ap-northeast-1 |

### KIND_FROM_ROLE 映射（明确设计意图）

```
exchange-oracle  → "exchange-oracle"  图标 (BULL-1)
tech-oracle      → "exchange-oracle"  图标 (BULL-2, 同族共用, 看多阵营)
media-oracle     → "media-oracle"     图标 (BEAR-1)
regulation-oracle → "media-oracle"    图标 (BEAR-2, 同族共用, 看空阵营)
onchain-oracle   → "onchain-oracle"   图标 (NEUT-1)
macro-oracle     → "onchain-oracle"   图标 (NEUT-2, 同族共用, 中性阵营)
```

## 步骤

### Step 0: 确认 canonical design 已定稿 ✅

`spec/10_agent_config_sync/canonical-design.md` 已创建。

### Step 1: 创建 `packages/shared/src/agents.ts`

定义 `AgentMeta` 类型 + `AGENT_META` 常量数组。包含 6 个 Agent 的所有规范字段。

```typescript
// packages/shared/src/agents.ts
import type { Agent, AgentKind } from "./index";

export interface AgentMeta {
  id: string;
  callsign: string;
  name: string;
  role: string;
  roleLabel: string;
  tier: "active" | "standby";
  stance: "BULL" | "BEAR" | "NEUT";
  description: string;
  provider: string;
  modelHint: string;
  weight: number;
  sortOrder: number;
  // 统计字段（保持现有精确值）
  uptimePct: number;
  resolutions: number;
  accuracyPct: number;
  avgConfidence: number;
  region: string;
}

export const AGENT_META: AgentMeta[] = [
  {
    id: "bull-1",
    callsign: "BULL-1",
    name: "Exchange Oracle",
    role: "exchange-oracle",
    roleLabel: "Exchange Oracle",
    tier: "active",
    stance: "BULL",
    description: "Technical analysis agent specializing in BTC price trends, trading volume, and HTX order book signals. Provisioned with real-time HTX market data.",
    provider: "claude",
    modelHint: "Claude Sonnet 4",
    weight: 1.0,
    sortOrder: 1,
    uptimePct: 0.9994,
    resolutions: 4181,
    accuracyPct: 0.987,
    avgConfidence: 0.94,
    region: "ap-south-1",
  },
  // ... 5 more with actual data from canonical table
];

// 明确设计意图：同stance阵营共用图标
export const KIND_FROM_ROLE: Record<string, AgentKind> = {
  "exchange-oracle": "exchange-oracle",   // BULL-1
  "tech-oracle":     "exchange-oracle",   // BULL-2 (BULL family share icon)
  "media-oracle":    "media-oracle",      // BEAR-1
  "regulation-oracle": "media-oracle",   // BEAR-2 (BEAR family share icon)
  "onchain-oracle":  "onchain-oracle",   // NEUT-1
  "macro-oracle":    "onchain-oracle",   // NEUT-2 (NEUT family share icon)
};
```

### Step 2: 导出 `AgentMeta` 和 `AGENT_META`

`packages/shared/src/index.ts` 末尾追加：
```typescript
export type { AgentMeta } from "./agents";
export { AGENT_META, KIND_FROM_ROLE } from "./agents";
```

### Step 3: 替换 `mock/agents.ts`

整个替换为从 `AGENT_META` 派生：

```typescript
import { AGENT_META, KIND_FROM_ROLE } from "@resolve/shared";
import type { Agent } from "@/lib/types";

export const MOCK_AGENTS: Agent[] = AGENT_META.map((a) => ({
  id: a.id,
  callsign: a.callsign,
  name: a.name,
  kind: KIND_FROM_ROLE[a.role],
  description: a.description,
  modelHint: a.modelHint,
  region: a.region,
  uptimePct: a.uptimePct,
  resolutions: a.resolutions,
  accuracyPct: a.accuracyPct,
  avgConfidence: a.avgConfidence,
  status: "online" as const,
  tier: a.stance,
  weight: a.weight,
}));

export function agentById(id: string) {
  return MOCK_AGENTS.find((a) => a.id === id);
}
```

### Step 4: 替换 `mappers.ts` 中的 `FALLBACK_AGENTS`

将 `FALLBACK_AGENTS` 数组 + `agentFallback()` 函数替换为一个从 `AGENT_META` 派生的 `agentMetaToApiAgent()` 函数：

```typescript
import { AGENT_META, KIND_FROM_ROLE } from "@resolve/shared";
// ... keep existing: marketRowToMarket, normalizeSlug, derive8004Id, ApiAgent ...

function agentMetaToApiAgent(meta: typeof AGENT_META[number]): ApiAgent {
  return {
    id: meta.id,
    name: meta.callsign,
    callsign: meta.callsign,
    kind: KIND_FROM_ROLE[meta.role],
    description: meta.description,
    modelHint: meta.modelHint,
    region: meta.region,
    uptimePct: meta.uptimePct,
    resolutions: meta.resolutions,
    accuracyPct: meta.accuracyPct,
    avgConfidence: meta.avgConfidence,
    status: "online",
    agentId: meta.id,
    roleLabel: meta.roleLabel,
    tier: meta.tier,
    stance: meta.stance,
    poweredBy: meta.modelHint,
    ba8004Id: derive8004Id(meta.id),
  };
}

export const FALLBACK_AGENTS: ApiAgent[] = AGENT_META.map(agentMetaToApiAgent);

// 注意：删除旧的 agentFallback() 函数和 hashString-based stats 逻辑
// 保留 derive8004Id(), deriveStance(), hashString()（其他映射可能还在用）
```

同时更新 mappers.ts 中的 `agentRowToAgent()` 函数，使其从 `KIND_FROM_ROLE` 读取映射（而不是内联映射对象）。

### Step 5: 创建 DB seeding 脚本

`packages/db/scripts/seed-agents.ts`：
```typescript
import { AGENT_META } from "@resolve/shared";
import { getDb } from "../src/client";

async function seed() {
  const db = getDb();
  if (!db) {
    console.error("❌ Supabase not configured. Skipping DB seeding.");
    process.exit(0);
  }
  
  for (const agent of AGENT_META) {
    const { error } = await db
      .from("agents")
      .upsert({
        agent_id: agent.id,
        name: agent.callsign,
        role: agent.role,
        role_label: agent.roleLabel,
        tier: agent.tier,
        description: agent.description,
        provider: agent.provider,
        powered_by: agent.modelHint,
        sort_order: agent.sortOrder,
      }, { onConflict: "agent_id" });
    
    if (error) console.error(`❌ ${agent.callsign}: ${error.message}`);
    else console.log(`✅ ${agent.callsign} (${agent.name}) synced`);
  }
}
seed();
```

在 `packages/db/package.json` 中添加：
```json
{
  "scripts": {
    "seed:agents": "tsx scripts/seed-agents.ts"
  }
}

### Step 6: 验证

```bash
pnpm typecheck
pnpm build
pnpm --filter @resolve/db seed:agents  # 如果 Supabase 已配置
```

## 不需要改的

- `packages/ai/src/prompts.ts` — system prompt 保留完整人设
- `apps/web/app/api/agents/route.ts` — 已经是 DB → FALLBACK_AGENTS 降级模式，FALLBACK_AGENTS 更新后自动生效
- `apps/web/app/api/agents/[id]/route.ts` — 同上
- `packages/db/migrations/00002_add_agents.sql` — 保留不动
- `packages/db/src/data.ts` / `types.ts` / `index.ts` — `AgentRow`、`listAgents()`、`getAgentById()` 保留（API 路由还在用）
