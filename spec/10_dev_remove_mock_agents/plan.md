# Spec 10: 执行计划

## 步骤

### Step 1: `packages/shared/src/index.ts` 新增 `AGENT_KINDS` 常量

**文件路径**: `packages/shared/src/index.ts`

在文件末尾追加 `AGENT_KINDS` 常量数组，6 个 Agent 的 display 数据。

数据来源：`packages/ai/src/prompts.ts` 中 `persona()` 的 identity 描述，同步到 description 字段。

```typescript
export const AGENT_KINDS: AgentMeta[] = [
  {
    id: "bull-1", callsign: "BULL-1", name: "Exchange Oracle",
    kind: "exchange-oracle" as AgentKind,
    description: "Technical analysis oracle reading price trends, trading volume, and HTX order-book signals. Data-driven and constructive — trusts momentum and market structure.",
    modelHint: "Claude 4.7 · B.AI", region: "ap-south-1",
    uptimePct: 0.9994, resolutions: 4181, accuracyPct: 0.987,
    avgConfidence: 0.94, status: "online" as const,
    tier: "BULL", weight: 1.0,
  },
  // ... 5 more
];
```

### Step 2: 删除 `apps/web/lib/mock/agents.ts`

整个文件删除。`MOCK_AGENTS` 不再存在。

需要先确认只有以下文件引用了它：
- `apps/web/app/page.tsx` — 修改引用
- `apps/web/app/agents/page.tsx` — 删除 import
- `apps/web/lib/mock/markets.ts` — 改为引用 `@resolve/shared`

### Step 3: 清理 `packages/db` 的 Agent 相关代码

- **`packages/db/src/data.ts`**: 删除 `listAgents()` 和 `getAgentById()` 函数
- **`packages/db/src/index.ts`**: 删除 `listAgents`、`getAgentById` 的 export，删除 `AgentRow` 类型的 export
- **`packages/db/src/types.ts`**: 删除 `AgentRow` 接口定义
- **`packages/db/migrations/00002_add_agents.sql`**: 保留不动（已提交的 migration 文件不删，标记为废弃即可；SQL 仅当 Supabase 初始化时手动执行，不再使用）

### Step 4: 修改引用 `MOCK_AGENTS` 的文件

- **`apps/web/lib/mock/markets.ts`**: `import { MOCK_AGENTS } from "./agents"` → `import { AGENT_KINDS } from "@resolve/shared"`，`MOCK_AGENTS` 替换为 `AGENT_KINDS`
- **`apps/web/app/agents/page.tsx`**: 删除 `MOCK_AGENTS` 的 import，API 结果不再需要 mock 兜底
- **`apps/web/app/page.tsx`**: 可能参考 `MOCK_AGENTS` 的 callsign 列表，改为引用 `AGENT_KINDS`

### Step 5: 简化 `apps/web/lib/mappers.ts`

- 删除 `ApiAgent` 接口（不再需要 DB→API 的 Agent 映射）
- 删除 `KIND_FROM_ROLE` 映射（已解决）
- 删除 `derive8004Id()` 函数
- 删除 `agentRowToAgent()` 函数
- 删除 `FALLBACK_AGENTS` 数组
- 删除 `agentFallback()` 函数
- 删除 `import type { AgentRow } from "@resolve/db"`
- 删除 `ApiAgent` 的 export
- 保留 `Market` 相关的映射（`marketRowToMarket`、`fallbackMarketBySlug`、`normalizeSlug`）

### Step 6: 简化 `apps/web/app/api/agents/route.ts`

- 删除 `getDb()` / Supabase 查询
- `import { AGENT_KINDS } from "@resolve/shared"`
- 直接返回 `AGENT_KINDS`

### Step 7: 简化 `apps/web/app/api/agents/[id]/route.ts`

- 删除 `getDb()` / Supabase 查询
- `import { AGENT_KINDS } from "@resolve/shared"`
- 直接 `AGENT_KINDS.find(a => a.id === id)`

### Step 8: 类型清理（可选）

- 删除 `apps/web/lib/types.ts` 中的 `Agent`、`AgentKind` 等类型，全局统一走 `@resolve/shared`
- 或者保留，只确认无冲突
