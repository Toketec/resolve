# Spec 10: 清理 Agent 数据重复定义

## 问题

6 个 Agent 的信息散落在多处，修改需改多处：

```
apps/web/lib/mock/agents.ts          ← UI 层 — MOCK_AGENTS（硬编码）
apps/web/lib/mappers.ts              ← API 层 — FALLBACK_AGENTS（硬编码）
packages/db/migrations/00002_add_agents.sql  ← DB 层 — INSERT
packages/shared/src/index.ts         ← 类型层 — 只有接口
packages/ai/src/prompts.ts           ← AI 层 — AGENT_PROFILES
```

## 方案

**SQL migration 是唯一编辑点**，TypeScript 侧只保留最接近渲染层的一处定义。

```
packages/db/migrations/00002_add_agents.sql  ←── 唯一编辑点 (规范数据)
                                │
                                ├── 运行时：API 查 DB → mappers 映射 → 返回给前端
                                │
                                └── 开发/预览：mock/agents.ts (最接近渲染层，仅一处)
```

**删除**：
- `packages/shared/src/agents.ts` → 不创建（无中间层）
- `packages/db/scripts/seed-agents.ts` → 不需要（SQL migration 本身就是种子）
- `apps/web/lib/mappers.ts` 中的 `FALLBACK_AGENTS` 常量 → 只保留映射函数

**保留**：
- `apps/web/lib/mock/agents.ts` → 唯一的 TypeScript agent 数据定义，最接近渲染层
- `apps/web/lib/mappers.ts` → 只保留 `derive8004Id()` 等纯映射函数
- `packages/ai/src/prompts.ts` → AI 层的 system prompt，属于不同维度，不动

## 执行步骤

| # | 任务 | 文件 |
|:-:|------|------|
| T01 | 检查 SQL migration 中 agent INSERT 是否完整 | `packages/db/migrations/00002_add_agents.sql` |
| T02 | 删除 `mappers.ts` 中的 `FALLBACK_AGENTS` 兜底数组 | `apps/web/lib/mappers.ts` |
| T03 | 检查 mock/agents.ts 数据是否与 SQL 一致 | `apps/web/lib/mock/agents.ts` |
| T04 | 检查所有引用 `FALLBACK_AGENTS` 的 API 路由，改为查 DB | `apps/web/app/api/` |
| T05 | `pnpm typecheck && pnpm build` | — |

## 不涉及的

- `packages/ai/src/prompts.ts` — AI 层 system prompt，保留不动
- `packages/shared/` — 不新增 agents.ts，不修改导出
- `packages/db/migrations/` 结构 — 保留不动
