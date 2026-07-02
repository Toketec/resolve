# Spec 10: 执行计划

## 架构

```
packages/shared/src/agents.ts  ←── 唯一编辑点
  ├── apps/web/lib/mock/agents.ts    ← import AGENT_META 派生 MOCK_AGENTS
  ├── apps/web/lib/mappers.ts        ← import AGENT_META 派生 FALLBACK_AGENTS
  └── packages/db/scripts/seed-agents.ts  ← upsert 至 Supabase agents 表
```

## Agent 规范数据

6 个 Agent 的设计已确定，数据来源：whitepaper (tier/role/weight)、judge-qa (model)、dev-execution-spec (role taxonomy)。直接写入 `agents.ts`：

| ID | callsign | name | role | roleLabel | stance | weight | modelHint |
|:--:|:--------:|:----:|:----:|:---------:|:-----:|:------:|-----------|
| bull-1 | BULL-1 | Exchange Oracle | exchange-oracle | Exchange Oracle | BULL | 1.0 | Claude Sonnet 4 |
| bull-2 | BULL-2 | Tech Oracle | tech-oracle | Tech Oracle | BULL | 0.8 | Claude Sonnet 4 |
| bear-1 | BEAR-1 | Media Oracle | media-oracle | Media Oracle | BEAR | 0.8 | Claude Sonnet 4 |
| bear-2 | BEAR-2 | Regulation Oracle | regulation-oracle | Regulation Oracle | BEAR | 0.8 | Claude Sonnet 4 |
| neut-1 | NEUT-1 | Onchain Oracle | onchain-oracle | Onchain Oracle | NEUT | 0.9 | B.AI（主推） |
| neut-2 | NEUT-2 | Macro Oracle | macro-oracle | Macro Oracle | NEUT | 0.9 | Claude Sonnet 4 |

## 步骤

### Step 1: `packages/shared/src/agents.ts`

定义 `AgentMeta` 类型 + `AGENT_META` 常量数组：

```typescript
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
  // 展示用统计字段
  uptimePct: number;
  resolutions: number;
  accuracyPct: number;
  avgConfidence: number;
  region: string;
}

export const AGENT_META: AgentMeta[] = [
  // 6 个 Agent 的完整数据
];

// 同阵营共用图标
export const KIND_FROM_ROLE: Record<string, AgentKind> = {
  "exchange-oracle": "exchange-oracle",
  "tech-oracle": "exchange-oracle",
  "media-oracle": "media-oracle",
  "regulation-oracle": "media-oracle",
  "onchain-oracle": "onchain-oracle",
  "macro-oracle": "onchain-oracle",
};
```

### Step 2: `packages/shared/src/index.ts`

末尾追加导出：
```typescript
export type { AgentMeta } from "./agents";
export { AGENT_META, KIND_FROM_ROLE } from "./agents";
```

### Step 3: `apps/web/lib/mock/agents.ts`

整体替换为：
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

### Step 4: `apps/web/lib/mappers.ts`

替换 `FALLBACK_AGENTS` 数组和 `agentFallback()` 函数：
```typescript
import { AGENT_META, KIND_FROM_ROLE } from "@resolve/shared";

function agentMetaToApiAgent(meta: AgentMeta): ApiAgent {
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
```

同时：删除内联的 `KIND_FROM_ROLE` 定义（改为 import）、删除 `agentFallback()` 函数、删除 `deriveStance()`（已由 `AGENT_META.stance` 替代）、删除基于 `hashString` 的统计派生逻辑。

保留：`derive8004Id()`、`hashString()`（其他映射场景还在用）。

### Step 5: `packages/db/scripts/seed-agents.ts`

```typescript
import { AGENT_META } from "@resolve/shared";
import { getDb } from "../src/client";

async function seed() {
  const db = getDb();
  if (!db) {
    console.error("❌ Supabase not configured. Skipping.");
    process.exit(0);
  }
  for (const agent of AGENT_META) {
    const { error } = await db.from("agents").upsert({
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
    else console.log(`✅ ${agent.callsign} synced`);
  }
}
seed();
```

`packages/db/package.json` 添加：
```json
{ "scripts": { "seed:agents": "tsx scripts/seed-agents.ts" } }
```

### Step 6: 验证

```bash
pnpm typecheck
pnpm build
pnpm --filter @resolve/db seed:agents  # Supabase 已配置时
```
