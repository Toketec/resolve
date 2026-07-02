# Spec 9: 任务跟踪

| ID | 任务 | 文件 | 优先级 | 状态 |
|:--:|------|------|:-----:|:----:|
| T01 | 更新 EN 文案（7 个 key） | `messages.ts` EN | P0 | ⏳ |
| T02 | 同步更新中文文案 | `messages.ts` zh | P0 | ⏳ |
| T03 | 同步更新西班牙语文案 | `messages.ts` es | P0 | ⏳ |
| T04 | 同步更新法语文案 | `messages.ts` fr | P0 | ⏳ |
| T05 | 同步更新德语文案 | `messages.ts` de | P0 | ⏳ |
| T06 | 同步更新日语文案（3→6 修正） | `messages.ts` ja | P0 | ⏳ |
| T07 | 同步更新韩语文案（3→6 修正） | `messages.ts` ko | P0 | ⏳ |
| T08 | 同步更新葡萄牙语文案 | `messages.ts` pt | P0 | ⏳ |
| T09 | 同步更新阿拉伯语文案 | `messages.ts` ar | P0 | ⏳ |
| T10 | 同步更新印地语文案 | `messages.ts` hi | P0 | ⏳ |
| T11 | 同步更新意大利语文案 | `messages.ts` it | P0 | ⏳ |
| T12 | 重写 mock agents 为 2+2+2 设计 | `mock/agents.ts` | P0 | ⏳ |
| T13 | 更新 shared AgentKind/Agent/AgentVote 类型 | `packages/shared/src/index.ts` | P1 | ⏳ |
| T14 | 同步更新 web AgentKind/Agent/AgentVote 类型 | `lib/types.ts` | P1 | ⏳ |
| T15 | 更新 mappers.ts（stance 字段 + FALLBACK_AGENTS） | `lib/mappers.ts` | P1 | ⏳ |
| T16 | 修复 mock markets: 4→6 票 + 阈值 0.75→0.65 | `mock/markets.ts` | P0 | ⏳ |
| T17 | Agent 页面: /4→/6 + 分组标签 | `app/agents/page.tsx` | P1 | ⏳ |
| T18 | 共识 meter: grid-cols 4→3 | `components/consensus-meter.tsx` | P2 | ⏳ |
| T19 | 市场详情页阈值默认值 0.75→0.65 | `app/markets/[slug]/page.tsx` | P1 | ⏳ |
| T20 | README.md Agent 表格 + 架构图更新 | `README.md` | P2 | ⏳ |
| T21 | 首页 Pillar 卡片图标（可选调整） | `app/page.tsx` | P2 | ⏳ |

## 完成条件

- [ ] 所有 P0 任务 Done Check 通过
- [ ] `pnpm typecheck` 无报错
- [ ] `pnpm build` 无报错
- [ ] 首页 Hero 文案不再出现 "Three"
- [ ] Agent 页面显示 6 个正确命名的 Agent
- [ ] 共识显示 6 票而非 4 票
