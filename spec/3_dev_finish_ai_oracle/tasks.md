# 3_dev_finish_ai_oracle — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 3.1 | 安装 `@anthropic-ai/sdk` 依赖到 `@resolve/ai` | ☐ | 5min | |
| 3.2 | 设计并编写 `prompts.ts` — 3 个 ACTIVE Agent prompt + 3 个 STANDBY 定义 | ☐ | 1.5h | 需 Dev B 提供证据素材 |
| 3.3 | 编写 `evidence.ts` — 精选证据集结构 + 英雄市场预取数据 | ☐ | 1h | 需选定英雄市场问题 |
| 3.4 | 编写 `claude.ts` — askAgent() Claude API 调用 + retry | ☐ | 1.5h | |
| 3.5 | 编写 `consensus.ts` — 加权共识数学（可独立测试） | ☐ | 45min | |
| 3.6 | 修改 `index.ts` — resolveMarket 真实实现 | ☐ | 30min | 组装全部 |
| 3.7 | 创建 `.env.example` — 环境变量模板 | ☐ | 5min | |
| 3.8 | 验证: typecheck + build + 不带 API key 回退 mock | ☐ | 30min | |

## 验证清单

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] `ANTHROPIC_API_KEY=xxx npx tsx packages/ai/src/index.ts` 返回 AIConsensus
- [ ] UI 展示 6 个 Agent（3 ACTIVE + 3 STANDBY）
- [ ] 返回 3 个不同的 ACTIVE AgentVote（vary by role）
- [ ] STANDBY agent 显示 💤 状态标记
- [ ] 每条 vote 有 evidence（source, url, snippet, kind, timestamp）
- [ ] consensus.status 为 "consensus"（confidence > threshold 0.65）
- [ ] 无 API key 时有 mock fallback 不崩溃
- [ ] 第二次调用结果在合理范围内一致（确定性护栏）
