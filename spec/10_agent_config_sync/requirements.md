# Spec 10: Agent 配置同步机制

## 问题

6 个 Agent 的定义散落在 5 份拷贝中，已出现信息不对齐：

```
packages/ai/src/prompts.ts           ← AI 层 — AGENT_PROFILES
apps/web/lib/mock/agents.ts          ← UI 层 — MOCK_AGENTS
apps/web/lib/mappers.ts              ← API 层 — FALLBACK_AGENTS
packages/db/migrations/00002_add_agents.sql  ← DB 层 — SQL INSERT
packages/shared/src/index.ts         ← 类型层 — 只有接口无实例
```

修改一个 Agent 的名字/描述/模型配置需要改 5 处，已发生实际漂移。

## 方案

**SQL migration 作为唯一编辑点**，TypeScript 侧只保留一份兜底镜像：

```
packages/db/migrations/00002_add_agents.sql  ←── 唯一编辑点 (INSERT 语句)
                       │
                       ▼
packages/shared/src/agents.ts          ←── 兜底镜像 (mirror SQL 数据)
  ├── apps/web/lib/mock/agents.ts     ──→ import 派生
  ├── apps/web/lib/mappers.ts         ──→ import 派生
  └── packages/db/scripts/seed-agents.ts  ←── 现读去 DB 或 fallback，不再重复定义
```

**工作流**：改 Agent 名字/描述/模型 → 只改 migration SQL → 同步更新 agents.ts 兜底 → 其他层自动。

**兜底策略**：API 层和 UI 层优先查询 `agents` 表，DB 不可用时回退到 `@resolve/shared/agents.ts` 的镜像数据（与 SQL 一致）。

## 执行步骤

| # | 任务 | 文件 |
|:-:|------|------|
| 1 | 新建 `AgentMeta` 类型 + `AGENT_META` 常量（兜底镜像，mirror SQL 数据） | `packages/shared/src/agents.ts` |
| 2 | 导出 `AgentMeta`、`AGENT_META`、`KIND_FROM_ROLE` | `packages/shared/src/index.ts` |
| 3 | 替换 `mock/agents.ts` 为从 `AGENT_META` 派生 | `apps/web/lib/mock/agents.ts` |
| 4 | 替换 `FALLBACK_AGENTS` 为从 `AGENT_META` 派生，删除 `agentFallback()` | `apps/web/lib/mappers.ts` |
| 5 | 更新 DB seeding 脚本：直接 upsert AGENT_META，不再重复定义 | `packages/db/scripts/seed-agents.ts` |
| 6 | `pnpm typecheck && pnpm build` 验证 | — |

## 不涉及的

- AI 层 `prompts.ts` 的 system prompt（保留不动）
- DB migration 文件结构（保留不动，内容为规范数据）
- API 路由逻辑（FALLBACK_AGENTS 自动更新后即生效）
- `packages/db/src/data.ts`/`types.ts` 的 `AgentRow`（API 路由还在用）
