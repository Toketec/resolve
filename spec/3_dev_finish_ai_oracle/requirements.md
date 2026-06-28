# 3_dev_finish_ai_oracle — Real AI Oracle Reasoning Pipeline

## 解决的问题

当前 AI 推理是硬编码的 mock（`packages/ai/src/index.ts` 中返回固定预设值的 `resolveMarket`）。
英雄镜头的核心卖点是"多个 AI Agent 基于真实证据独立推理，达成共识"——必须是真的。
此规格将 mock 替换为真实 LLM 调用链，实现 **Orchestrator 调度 → 动态选 Agent → 并行推理 → 加权共识**。

## 工作边界

- ✅ **Orchestrator 调度层** — 多一层 LLM 调用，分析市场问题 → 从 6 个 Agent 中智能选出最优 3 个
- ✅ **Prompt 工程** — 设计 3 个 ACTIVE Agent 角色 prompt（交易所/媒体/链上）+ 3 个 STANDBY 定义
- ✅ **Orchestrator prompt** — 设计调度层的 prompt：给定市场+6 Agent 档案 → 输出选择+理由
- ✅ **精选证据集** — 针对英雄市场预取证据（HTX 价格/新闻/链上数据），避免实时抓取脆弱性
- ✅ 实现真实 Claude API 调用 → parse 为结构化 {outcome, confidence, evidence}
- ✅ 3 个 Agent 并行调用（Promise.all）→ 收集所有投票
- ✅ 加权共识数学 + 确定性护栏
- ✅ 更新 `packages/ai` 的 `resolveMarket()`
- ✅ 支持多环境变量配置（`ANTHROPIC_API_KEY` / 未来 `BAI_API_KEY`）
- ✅ **HTX 价格+订单簿数据作为 Agent 证据源**
- ❌ 不实现实时网页抓取（用精选证据集代替）
- ❌ 不实现 B.AI 8004/x402 集成（那是 spec 4 的范围）

## 完整 resolve 流程

```
resolveMarket(market)
  │
  ├── Step 1: orchestrator.selectAgents()
  │     └── LLM 调用: 分析市场问题 + 6 个 Agent 能力档案
  │     └── 返回: { selected: ["bull-1","bear-1","neut-1"], reasoning: "..." }
  │
  ├── Step 2: parallelAgentInference(selected)
  │     └── 3 个并行 LLM 调用（每个 Agent 各自的角色 prompt + 证据集）
  │     └── 每个返回: { outcome, confidence, evidence[] }
  │
  ├── Step 3: computeConsensus(votes)
  │     └── 加权平均 → { outcome, consensus_score, votes[] }
  │
  └── Step 4: store results (Supabase) + return
```

## 依赖项

- 前置: 英雄市场问题已选定（建议: BTC $150K EOY?）
- 前置: Claude API key 可用（`.env` 中 `ANTHROPIC_API_KEY`）
- 前置: B.AI API key（如已注册，`.env` 中 `BAI_API_KEY` + `BAI_API_ENDPOINT`）
- 后置: spec 5（integration）接入真实 resolve
- 外部依赖: `@anthropic-ai/sdk` npm 包

## 验收标准

1. `orchestrator.selectAgents(market, agents)` 返回包含 selected[] + reasoning 的 JSON
2. 对于 BTC 市场，orchestrator 选择 BULL-1/BEAR-1/NEUT-1 并给出合理理由
3. `resolveMarket(heroMarket)` 返回 3 个 Agent 的投票，各有不同 outcome/confidence
4. 多次调用同一市场 → consensus 稳定（确定性护栏生效）
5. 每次投票携带至少 1 条 evidence
6. 加权共识输出 outcome + consensus_score（≥0.65）
7. API key 不硬编码，从 `.env` 读取
8. B.AI API key 配了之后，至少 1 个 Agent 走 B.AI API
9. `pnpm typecheck` + `pnpm build` 通过
10. 总调用耗时不超过 15 秒（1 次 selector + 3 次并行推理）

## 边界与约束

- Claude 模型使用 `claude-sonnet-4`（平衡速度/质量）
- B.AI API 假设兼容 OpenAI Chat Completion 格式（若不兼容需加适配层）
- Orchestrator 的 LLM 调用可以用 Claude 或 B.AI（取决于谁更便宜/快）
- 精选证据集需要由 Dev B 提前准备
- 证据集中不要放实时 API 调用——只放预取数据
- **HTX生态证据**: BULL-1 Agent 证据中包含 HTX 实时价格和订单簿深度
