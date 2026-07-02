# Spec 10: 执行计划

## 核心架构

```
旧 (5 份拷贝)                       新 (单源真理 + DB 持久化)
────────────                         ────────────────────────────
prompts.ts (AI)  ─┐                  prompts.ts (AI) ───→ 引用 metadata
mock/agents.ts ───┤
mappers.ts ───────┤→ 各自维护         @resolve/shared/agents.ts ←── 唯一编辑点
migration SQL ────┤                  mock/agents.ts ───┐
shared/types ─────┘                  mappers.ts ───────┤→ import from shared
                                     seeding script ──→ Supabase agents 表
```

## 步骤

### Step 1: 创建 `packages/shared/src/agents.ts`（规范配置）

**文件路径**: `packages/shared/src/agents.ts`

定义 `AgentMeta` 类型和 `AGENT_META` 常量数组。这是**唯一编辑点**——未来改 Agent 的名字、描述、模型、权重，只改这里。

```typescript
import type { Agent } from "./index";

/** Agent 元数据 — 与 AI 层 prompts.ts 同步 */
export interface AgentMeta {
  id: string;             // "bull-1"
  callsign: string;       // "BULL-1"
  name: string;           // "Exchange Oracle"
  role: string;           // "exchange-oracle"
  roleLabel: string;      // "Exchange Oracle"
  tier: "active" | "standby";
  stance: "BULL" | "BEAR" | "NEUT";
  description: string;    // 同义词描述（给 UI/API 用）
  provider: string;       // 默认 LLM 提供商
  modelHint: string;      // UI 展示用（如 "Claude 4.7 · B.AI"）
  weight: number;         // 共识权重
  sortOrder: number;
}

/** 6 个 Agent 元数据 — 架构级常量。改 Agent 描述/名字/模型只改这里。 */
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
    provider: "openai",
    modelHint: "Claude 4.7 · B.AI",
    weight: 1.0,
    sortOrder: 1,
  },
  // ... 5 more (same data from prompts.ts + mock)
];
```

**注意事项**：
- `description` 字段保持与 `prompts.ts` 的 system prompt 中的身份描述**语义一致**，但不需要拷贝完整 prompt（prompt 是给 LLM 的指令）
- `weight` 值和 `packages/ai/src/consensus.ts` 或共识逻辑保持一致
- `AGENT_META` 数组顺序按 sortOrder 排列

### Step 2: 导出 `AgentMeta` 和 `AGENT_META`

**文件路径**: `packages/shared/src/index.ts`

在文件末尾追加：
```typescript
export type { AgentMeta } from "./agents";
export { AGENT_META } from "./agents";
```

### Step 3: 创建 DB seeding 脚本

**文件路径**: `packages/db/scripts/seed-agents.ts`

功能：
- 从 `@resolve/shared` 导入 `AGENT_META`
- 对每个 agent，执行 `INSERT INTO agents (...) VALUES (...) ON CONFLICT (agent_id) DO UPDATE SET ...`
- 支持 `--dry-run` 参数只打印 SQL 不执行
- 如果 Supabase 不可用，打印清晰提示

```typescript
// packages/db/scripts/seed-agents.ts
import { AGENT_META } from "@resolve/shared";
import { getDb } from "../src/client";

async function seed() {
  const db = getDb();
  if (!db) { console.error("Supabase not configured"); process.exit(1); }
  
  for (const agent of AGENT_META) {
    const { error } = await db.rpc("upsert_agent", {
      p_agent_id: agent.id,
      p_name: agent.callsign,
      p_role: agent.role,
      p_role_label: agent.roleLabel,
      p_tier: agent.tier,
      p_description: agent.description,
      p_provider: agent.provider,
      p_powered_by: agent.modelHint,
      p_sort_order: agent.sortOrder,
    });
    if (error) console.error(`Failed to upsert ${agent.id}:`, error);
    else console.log(`✅ ${agent.callsign} (${agent.name}) synced`);
  }
}
seed();
```

**可选**：如果不想新增 RPC，可以直接在脚本中用 `db.from('agents').upsert()`。

在 `packages/db/package.json` 中添加：
```json
{
  "scripts": {
    "seed:agents": "tsx scripts/seed-agents.ts"
  }
}
```

### Step 4: 替换 `mock/agents.ts`

**文件路径**: `apps/web/lib/mock/agents.ts`

整个文件内容替换为：
```typescript
import { AGENT_META } from "@resolve/shared";

export const MOCK_AGENTS = AGENT_META.map((a) => ({
  id: a.id,
  callsign: a.callsign,
  name: a.name,
  kind: a.role,
  description: a.description,
  modelHint: a.modelHint,
  region: a.role === "exchange-oracle" ? "ap-south-1" : /* deterministic per agent */,
  uptimePct: /* calculated per agent */,
  resolutions: /* calculated per agent */,
  accuracyPct: /* calculated per agent */,
  avgConfidence: /* calculated per agent */,
  status: "online" as const,
  tier: a.stance,
  weight: a.weight,
}));
```

统计字段（uptimePct/resolutions/accuracyPct/avgConfidence/region）保持各 Agent 的确定性值不变（从旧 mock 数据直接搬过来）。不改变 UI 显示。

### Step 5: 替换 `mappers.ts` 中的 `FALLBACK_AGENTS`

**文件路径**: `apps/web/lib/mappers.ts`

将 `FALLBACK_AGENTS` 数组和 `agentFallback()` 函数替换为：
```typescript
import { AGENT_META } from "@resolve/shared";

// 将规范配置转为 DB 行格式 + 派生统计字段
export function agentMetaToApiAgent(meta: typeof AGENT_META[number]): ApiAgent {
  const seed = hashString(meta.id);
  const stance = meta.stance;
  return {
    id: meta.id,
    name: meta.callsign,
    callsign: meta.callsign,
    kind: KIND_FROM_ROLE[meta.role] ?? "exchange-oracle",
    description: meta.description,
    modelHint: meta.modelHint,
    region: REGIONS[seed % REGIONS.length],
    uptimePct: UPTIME[meta.id] ?? 0.997 + (seed % 25) / 10000,
    resolutions: RESOLUTIONS[meta.id] ?? 700 + (seed % 60) * 90,
    accuracyPct: ACCURACY[meta.id] ?? 0.96 + (seed % 35) / 1000,
    avgConfidence: CONFIDENCE[meta.id] ?? 0.88 + (seed % 10) / 100,
    status: "online",
    agentId: meta.id,
    roleLabel: meta.roleLabel,
    tier: meta.tier,
    stance,
    poweredBy: meta.modelHint,
    ba8004Id: derive8004Id(meta.id),
  };
}

export const FALLBACK_AGENTS: ApiAgent[] = AGENT_META.map(agentMetaToApiAgent);
```

保留已有的 `KIND_FROM_ROLE`、`derive8004Id()`、`deriveStance()` 等函数不动。

**注意**：统计字段（uptimePct/resolutions/accuracyPct/avgConfidence）的确定性值需从当前 `FALLBACK_AGENTS` 中提取，确保 UI 数字不变。建议用 `hashString(agentId)` 匹配实现，但为保稳定，可以定义一个 `AGENT_STATS` 常量直接抄当前数值。

### Step 6: 验证

```bash
pnpm typecheck
pnpm build
```

### Step 7: 执行 DB seeding（可选，配置 Supabase 后执行）

```bash
pnpm --filter @resolve/db seed:agents
```

## API 路由现状（不需改）

当前 API 路由已经是对的降级模式：
```
/api/agents → DB → FALLBACK_AGENTS（从规范配置生成）
/api/agents/[id] → DB → FALLBACK_AGENTS
```
规范配置更新后，`FALLBACK_AGENTS` 自动从 `AGENT_META` 生成，API 层自动同步。

## 注意事项

- `packages/shared/src/index.ts` 的 `Agent` 接口不变（已有 id/name/callsign/kind/description/modelHint 等字段）
- `packages/db/migrations/00002_add_agents.sql` 保留不动。脚本是运行时同步机制，不依赖 migration
- `packages/db/src/types.ts` 的 `AgentRow` 保留不动（DB 查询仍然用这个类型）
- `packages/db/src/data.ts` 的 `listAgents()` / `getAgentById()` 保留不动（API 路由还在用）
- AI 层 `prompts.ts` 的 `AGENT_PROFILES` 保留不动。需要保持 description 语义一致但不是代码层面耦合
