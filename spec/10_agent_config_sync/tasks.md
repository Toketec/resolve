# Spec 10: 任务跟踪

| ID | 任务 | 文件 | 优先级 | 状态 |
|:--:|------|------|:-----:|:----:|
| T01 | 补全 SQL migration 字段（weight/stance/region/model_hint/统计字段），与 mock 对齐 | `packages/db/migrations/00002_add_agents.sql` | P0 | ✅ |
| T02 | 删除 mappers.ts 中的 FALLBACK_AGENTS + agentFallback() + deriveStance() + 内联 KIND_FROM_ROLE | `apps/web/lib/mappers.ts` | P0 | ⬜ |
| T03 | 检查 mock/agents.ts 数据与 SQL 一致 | `apps/web/lib/mock/agents.ts` | P1 | ⬜ |
| T04 | 检查 API 路由中 FALLBACK_AGENTS 引用，改为查 DB | `apps/web/app/api/` | P0 | ⬜ |
| T05 | `pnpm typecheck && pnpm build` | — | P0 | ✅ |

## 完成条件

- [x] SQL migration 包含 6 个 Agent 完整数据（新增 stance、weight 字段）
- [x] `mappers.ts` 无 `FALLBACK_AGENTS`、`agentFallback()`、`deriveStance()`
- [x] `mappers.ts` 无内联 `KIND_FROM_ROLE`
- [x] mock/agents.ts 与 SQL 数据一致
- [x] API 路由不引用任何兜底常量
- [x] `pnpm typecheck && pnpm build` 通过
