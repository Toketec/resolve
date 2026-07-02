# Spec 10: 任务跟踪

| ID | 任务 | 文件 | 优先级 | 状态 |
|:--:|------|------|:-----:|:----:|
| T00 | ✅ 已定稿：规范配置 `canonical-design.md` | `spec/10_agent_config_sync/canonical-design.md` | P0 | ✅ |
| T01 | 创建 `packages/shared/src/agents.ts` — `AgentMeta` 类型 + `AGENT_META` 常量数组（含 `KIND_FROM_ROLE` 映射） | `packages/shared/src/agents.ts` | P0 | ⬜ |
| T02 | 从 `packages/shared/src/index.ts` 导出 `AgentMeta`、`AGENT_META`、`KIND_FROM_ROLE` | `packages/shared/src/index.ts` | P0 | ⬜ |
| T03 | 替换 `mock/agents.ts` — 从 `AGENT_META` map 派生 `MOCK_AGENTS`（替换硬编码的完整数组和 `agentById`） | `apps/web/lib/mock/agents.ts` | P0 | ⬜ |
| T04 | 替换 `mappers.ts` — 从 `AGENT_META` map 派生 `FALLBACK_AGENTS`（删除 `agentFallback()` 函数，改为 `agentMetaToApiAgent()`；更新 `agentRowToAgent` 引用 `KIND_FROM_ROLE`） | `apps/web/lib/mappers.ts` | P0 | ⬜ |
| T05 | 创建 DB seeding 脚本 + `package.json` script | `packages/db/scripts/seed-agents.ts` | P1 | ⬜ |
| T06 | `pnpm typecheck` 无报错 | — | P0 | ⬜ |
| T07 | `pnpm build` 无报错 | — | P0 | ⬜ |

## 完成条件

- [ ] `packages/shared/src/agents.ts` 存在，6 个 Agent 配置完整，数据与 canonical-design.md 一致
- [ ] `packages/shared/src/index.ts` 导出 `AGENT_META`、`KIND_FROM_ROLE`
- [ ] `mock/agents.ts` 的 `MOCK_AGENTS` 从 `AGENT_META` 派生，页面渲染无视觉变化
- [ ] `mappers.ts` 的 `FALLBACK_AGENTS` 从 `AGENT_META` 派生，`agentFallback()` 已删除
- [ ] `mappers.ts` 的 `KIND_FROM_ROLE` 改为引用自 `@resolve/shared`，删除内联定义
- [ ] `pnpm typecheck && pnpm build` 通过
- [ ] DB seeding 脚本可执行（`pnpm --filter @resolve/db seed:agents`）
