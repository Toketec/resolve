# 3_dev_finish_ai_oracle — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 3.1 | 安装 `@anthropic-ai/sdk` 依赖到 `@resolve/ai` | ☐ | 5min | |
| **3.2** | **Prompt 工程 — 6 个 Agent role prompt** 设计：6 个独立 prompt（交易所/媒体/链上/技术/监管/宏观） | ☐ | **3h** | 每个 prompt 含独立人设和证据集 |
| 3.3 | **精选证据集** — 英雄市场预取证据（HTX价格/新闻/链上/宏观） | ☐ | **1h** | 证据质量决定 Agent 质量 |
| **3.4** | **Prompt 工程 — BEAR-1 媒体预言机** prompt：人设+推理规则+证据集成+JSON schema | ☐ | **1h** | 偏保守，含新闻预取数据 |
| **3.5** | **Prompt 工程 — NEUT-1 链上预言机** prompt：人设+推理规则+证据集成+JSON schema | ☐ | **1h** | 中性，含链上数据 |
| 3.6 | 编写 `evidence.ts` — 精选证据集结构 + 英雄市场预取数据 | ☐ | 1h | |
| 3.7 | 编写 `llm.ts` — 通用 LLM 调用（Claude SDK + B.AI fetch）+ retry | ☐ | 2h | 支持 provider 切换 |
| 3.8 | 编写 `consensus.ts` — 加权共识数学（可独立测试） | ☐ | 45min | |
| **3.9** | **编写 resolveMarket()** — 6 Agent 并行推理（Promise.all），无 selector | ☐ | **2h** | 核心重写，去掉了 orchestrator.selectAgents() |
| 3.10 | 修改 `index.ts` — resolveMarket 真实实现（6 Agent 并行 → consensus） | ☐ | 30min | 组装全部 |
| 3.11 | 创建 `.env.example` — 环境变量模板（ANTHROPIC_KEY + BAI_KEY） | ☐ | 5min | |
| 3.12 | 验证: typecheck + build + select + resolve 全流程 | ☐ | 30min | |

## 验证清单

### AI 自检
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过

### 人工检查
- [ ] `ANTHROPIC_API_KEY=*** npx tsx packages/ai/src/index.ts` 返回完整 AIConsensus
- [ ] **resolveMarket()** 返回 6 条 votes，每票包含 outcome/confidence/evidence
- [ ] 6 票加权后，consensus_score >= 0.65 | < 0.65 均有产出
- [ ] **BULL-1/BEAR-1/NEUT-1** 返回不同的 vote（BULL-1 偏 YES，BEAR-1 可能中性/NO，NEUT-1 数据驱动）
- [ ] **BULL-2 / BEAR-2 / NEUT-2** 也有独立判断（6 个 Agent 票数各异）
- [ ] 所有 votes 有 evidence.snippet，且指向真实数据源
- [ ] consensus.status 为 "consensus"（score > threshold 0.65）
- [ ] **B.AI 集成**: 配了 `BAI_API_KEY` + `BAI_API_ENDPOINT` 后，NEUT-1 走 B.AI API（兼容 OpenAI 格式时）
- [ ] 无 API key 时有 mock fallback 不崩溃
- [ ] 第二次调用结果在合理范围内一致（确定性护栏）
