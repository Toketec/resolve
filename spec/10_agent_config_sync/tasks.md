# Spec 10: 任务跟踪

| ID | 任务 | 文件 | 优先级 | 状态 |
|:--:|------|------|:-----:|:----:|
| T01 | 创建 `packages/shared/src/agents.ts`，定义 `AgentMeta` 类型和 `AGENT_META` 常量数组（6 个 Agent 的规范配置） | `packages/shared/src/agents.ts` | P0 | ⬜ |
| T02 | 从 `packages/shared/src/index.ts` 导出 `AgentMeta` 和 `AGENT_META` | `packages/shared/src/index.ts` | P0 | ⬜ |
| T03 | 替换 `mock/agents.ts` 的 `MOCK_AGENTS` 为从 `AGENT_META` 派生（保留原有统计字段的确定性值） | `apps/web/lib/mock/agents.ts` | P0 | ⬜ |
| T04 | 替换 `mappers.ts` 的 `FALLBACK_AGENTS` 和 `agentFallback()` 为从 `AGENT_META` 派生 | `apps/web/lib/mappers.ts` | P0 | ⬜ |
| T05 | 创建 DB seeding 脚本 `packages/db/scripts/seed-agents.ts` + `package.json` script | `packages/db/scripts/seed-agents.ts` | P1 | ⬜ |
| T06 | `pnpm typecheck` 无报错 | — | P0 | ⬜ |
| T07 | `pnpm build` 无报错 | — | P0 | ⬜ |

## 完成条件

- [ ] `packages/shared/src/agents.ts` 存在，6 个 Agent 配置完整
- [ ] `packages/shared/src/index.ts` 导出 `AGENT_META`
- [ ] `mock/agents.ts` 的 `MOCK_AGENTS` 从 `AGENT_META` 派生，原页面渲染无视觉变化
- [ ] `mappers.ts` 的 `FALLBACK_AGENTS` 从 `AGENT_META` 派生，API 返回数据无变化
- [ ] `pnpm typecheck && pnpm build` 通过
- [ ] DB seeding 脚本可执行（`pnpm --filter @resolve/db seed:agents`）

## 未来优化（赛后）

- 自动化 CI：agent 规范配置变更时自动触发 DB seeding
- 管理 UI：在后台面板中直接编辑 Agent 配置（API 写入 DB）
