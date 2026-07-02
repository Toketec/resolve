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

在 `@resolve/shared` 中创建 **`agents.ts`**，作为 6 个 Agent 规范配置的唯一编辑点。

```
@resolve/shared/agents.ts  ←── 唯一编辑点
  ├── mock/agents.ts       ──→ import 派生（不再硬编码）
  ├── mappers.ts           ──→ import 派生（不再硬编码）
  └── DB seeding 脚本      ──→ pnpm seed:agents 推送至 Supabase
```

工作流：改 Agent 名字/描述/模型 → 只改 `agents.ts` → 其他层自动同步。

## 执行步骤

| # | 任务 | 文件 |
|:-:|------|------|
| 1 | 新建 `AgentMeta` 类型 + `AGENT_META` 常量（6 Agent 规范配置） | `packages/shared/src/agents.ts` |
| 2 | 导出 `AgentMeta`、`AGENT_META`、`KIND_FROM_ROLE` | `packages/shared/src/index.ts` |
| 3 | 替换 `mock/agents.ts` 为从 `AGENT_META` 派生 | `apps/web/lib/mock/agents.ts` |
| 4 | 替换 `FALLBACK_AGENTS` 为从 `AGENT_META` 派生，删除 `agentFallback()` | `apps/web/lib/mappers.ts` |
| 5 | 创建 DB seeding 脚本 + `package.json` script | `packages/db/scripts/seed-agents.ts` |
| 6 | `pnpm typecheck && pnpm build` 验证 | — |

## 不涉及的

- AI 层 `prompts.ts` 的 system prompt（保留不动）
- DB migration 文件（保留不动）
- API 路由逻辑（FALLBACK_AGENTS 自动更新后即生效）
- `packages/db/src/data.ts`/`types.ts` 的 `AgentRow`（API 路由还在用）
