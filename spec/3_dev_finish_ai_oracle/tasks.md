# 3_dev_finish_ai_oracle — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 3.1 | 安装 LLM SDK 依赖到 `@resolve/ai` | ☑ | 5min | 用 `openai`（OpenAI 兼容端点 gpt-5.5）替代 Anthropic SDK，见计划决策 |
| **3.2** | **Prompt 工程 — 6 个 Agent role prompt** 设计：6 个独立 prompt（交易所/媒体/链上/技术/监管/宏观） | ☑ | **3h** | `prompts.ts`：6 人设+温度+统一 JSON 契约+护栏 |
| 3.3 | **精选证据集** — 英雄市场预取证据（HTX价格/新闻/链上/宏观） | ☑ | **1h** | `evidence.ts`：BTC $150K 按 6 角色分组 |
| **3.4** | **Prompt 工程 — BEAR-1 媒体预言机** | ☑ | **1h** | 偏保守，含新闻/宏观风险视角 |
| **3.5** | **Prompt 工程 — NEUT-1 链上预言机** | ☑ | **1h** | 中性，含链上流向/巨鲸数据 |
| 3.6 | 编写 `evidence.ts` — 精选证据集结构 + 英雄市场预取数据 | ☑ | 1h | |
| 3.7 | 编写 `llm.ts` — 通用 LLM 调用 + retry | ☑ | 2h | OpenAI 兼容；JSON mode；UA 覆盖绕过 Cloudflare WAF；无 key→mock |
| 3.8 | 编写 `consensus.ts` — 加权共识数学（可独立测试） | ☑ | 45min | 角色权重 交易所1.0/链上0.9/媒体0.8…阈值0.65 |
| **3.9** | **编写 resolveMarket()** — 6 Agent 并行推理（Promise.all），无 selector | ☑ | **2h** | `index.ts` 重写，无 orchestrator |
| 3.10 | 修改 `index.ts` — resolveMarket 真实实现 + 接入 API resolve 路由 | ☑ | 30min | `app/api/markets/[slug]/resolve` 已接真实 resolveMarket |
| 3.11 | 创建 `.env.example` — 环境变量模板 | ☑ | 5min | `packages/ai/.env.example`（OPENAI_*） |
| 3.12 | 验证: typecheck + build + resolve 全流程 | ☑ | 30min | 真实 gpt-5.5 跑通：6 票各异、consensus YES~72%、二次稳定、无 key 不崩 |

> 决策：用 OpenAI 兼容端点（gpt-5.5 @ relay）而非 Anthropic，因用户提供该端点。`llm.ts` provider 无关，未来可切回 Claude/B.AI。

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
