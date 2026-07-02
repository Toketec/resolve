# Spec 10: 任务跟踪

| ID | 任务 | 文件 | 优先级 | 状态 |
|:--:|------|------|:-----:|:----:|
| T01 | 新增 `AGENT_KINDS` 常量（含 `AgentMeta` 类型） | `packages/shared/src/index.ts` | P0 | ⬜ |
| T02 | 删除 `mock/agents.ts` | `apps/web/lib/mock/agents.ts` | P0 | ⬜ |
| T03 | 从 `packages/db/src/data.ts` 删除 `listAgents()` / `getAgentById()` | `packages/db/src/data.ts` | P0 | ⬜ |
| T04 | 从 `packages/db/src/index.ts` 删除 agent export | `packages/db/src/index.ts` | P0 | ⬜ |
| T05 | 从 `packages/db/src/types.ts` 删除 `AgentRow` | `packages/db/src/types.ts` | P0 | ⬜ |
| T06 | 修改 `mock/markets.ts` 引用到 `@resolve/shared` | `apps/web/lib/mock/markets.ts` | P0 | ⬜ |
| T07 | 删除 `mappers.ts` 中的 Agent 相关函数 | `apps/web/lib/mappers.ts` | P0 | ⬜ |
| T08 | 简化 `/api/agents` 路由 | `apps/web/app/api/agents/route.ts` | P0 | ⬜ |
| T09 | 简化 `/api/agents/[id]` 路由 | `apps/web/app/api/agents/[id]/route.ts` | P0 | ⬜ |
| T10 | 修改 agents 页面（删除 mock import） | `apps/web/app/agents/page.tsx` | P0 | ⬜ |
| T11 | 修改首页引用（如有） | `apps/web/app/page.tsx` | P1 | ⬜ |
| T12 | `pnpm typecheck` 无报错 | — | P0 | ⬜ |
| T13 | `pnpm build` 无报错 | — | P0 | ⬜ |

## 完成条件

- [ ] `mock/agents.ts` 已删除且无引用残留
- [ ] `mappers.ts` 不再包含 Agent 映射代码
- [ ] Agent 页面在无 Supabase 时正常渲染（API 路由直接返回常量）
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
