# Spec 10: 任务跟踪

| ID | 任务 | 文件 | 优先级 | 状态 |
|:--:|------|------|:-----:|:----:|
| T01 | 新建 `agents.ts`：`AgentMeta` + `AGENT_META` + `KIND_FROM_ROLE` | `packages/shared/src/agents.ts` | P0 | ⬜ |
| T02 | 从 `index.ts` 导出三个符号 | `packages/shared/src/index.ts` | P0 | ⬜ |
| T03 | 替换 `mock/agents.ts` 为 `AGENT_META.map()` | `apps/web/lib/mock/agents.ts` | P0 | ⬜ |
| T04 | 替换 `mappers.ts`：`FALLBACK_AGENTS`、删除 `agentFallback()`、删除内联 `KIND_FROM_ROLE` | `apps/web/lib/mappers.ts` | P0 | ⬜ |
| T05 | DB seeding 脚本 + `package.json` script | `packages/db/scripts/seed-agents.ts` | P1 | ⬜ |
| T06 | `pnpm typecheck && pnpm build` | — | P0 | ⬜ |

## 完成条件

- [ ] `packages/shared/src/agents.ts` — 6 个 Agent 配置完整
- [ ] `packages/shared/src/index.ts` 导出 `AGENT_META`、`KIND_FROM_ROLE`
- [ ] `mock/agents.ts` — 无硬编码 Agent 数据，全部从 `AGENT_META` 派生
- [ ] `mappers.ts` — `FALLBACK_AGENTS` 从 `AGENT_META` 派生，`agentFallback()` 已删除
- [ ] `mappers.ts` — 内联 `KIND_FROM_ROLE` 已删除，改为 import
- [ ] `pnpm typecheck && pnpm build` 通过
