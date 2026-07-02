# Spec 10: 删除 Mock Agents，统一 Agent 定义到 @resolve/shared

## 解决什么问题

当前 Agent 的定义存在 **4 份冗余**：

```
packages/ai/src/prompts.ts     ← AI 层权威（但只有 prompt 相关字段）
apps/web/lib/mock/agents.ts    ← UI 层 mock（重复描述/名字）
apps/web/lib/mappers.ts        ← API 层 FALLBACK_AGENTS（三分拷贝）
Supabase agent 表              ← DB 层（从未写入，仅占位）
```

每次修改 Agent 的设计（描述、名字、角色）需要同步 4 个地方，极易遗漏。且 Agent 是**架构级常量**，不是用户产生的动态数据，不应放入数据库。

## 依赖项

- `packages/shared/src/index.ts` — 新增 `AGENT_KINDS` 常量
- `packages/ai/src/prompts.ts` — 保持现有 `AGENT_PROFILES`，但不改动
- `apps/web/lib/types.ts` — 确认与 shared 类型是否可合并
- `packages/db/` — 删除 `listAgents()` / `getAgentById()` / `AgentRow` 类型。SQL migration `00002_add_agents.sql` 保留不动（已提交的 migration 文件不删，仅标记为废弃）

## 边界说明

- **不做**：修改 AI 层的 `AGENT_PROFILES` 或 prompt 内容
- **不做**：重写 pages 的视觉样式
- **不做**：删除 `mock/markets.ts`（市场 mock 数据仍需存在，只改其对 Agent 的引用）
