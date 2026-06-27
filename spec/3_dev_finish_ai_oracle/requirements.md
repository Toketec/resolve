# 3_dev_finish_ai_oracle — Real AI Oracle Reasoning Pipeline

## 解决的问题

当前 AI 推理是硬编码的 mock（`packages/ai/src/index.ts` 中返回固定预设值的 `resolveMarket`）。
英雄镜头的核心卖点是"多个 AI Agent 基于真实证据独立推理，达成共识"——必须是真的。
此规格将 mock 替换为真实 Claude API 调用，实现 3 个角色化 Agent 的并行推理 → 加权共识。

## 工作边界

- ✅ 设计 3 个 Agent 角色 prompt（交易所/媒体/链上）— **外加 3 个 STANDBY agent 定义（UI 展示用，不写 prompt）**
- ✅ 实现真实 Claude API 调用 → parse 为结构化 {outcome, confidence, evidence}
- ✅ 3 个 Agent 并行调用（Promise.all）→ 收集所有投票
- ✅ 加权共识数学（已有草图，需微调）
- ✅ 确定性护栏——英雄市场预演确保每次通过阈值
- ✅ 精选证据集——针对英雄市场预取证据，避免实时抓取的脆弱性
- ✅ 更新 `packages/ai` 的 `resolveMarket()`
- ✅ 支持环境变量配置 API key
- ✅ **HTX价格数据作为Agent证据源**: BULL-1(交易所Agent)消费HTX公开API的BTC/USDT价格作为推理依据
- ❌ 不实现实时网页抓取（用精选证据集代替）
- ❌ 不实现 B.AI 8004/x402 集成（那是 spec 4 的范围）
- ❌ 不处理 API rate limit — 英雄镜头最多 3 次调用

## 依赖项

- 前置: 英雄市场问题已选定（建议: BTC $150K EOY?）
- 前置: Claude API key 可用（放在 `apps/web/.env` 或 `/packages/ai/.env`）
- 后置: spec 5（integration）接入真实 resolve
- 外部依赖: `@anthropic-ai/sdk` npm 包

## 验收标准

1. `resolveMarket(heroMarket)` 返回 3 个 Agent 的投票，每个有不同 outcome/confidence
2. 多次调用同一市场 → consensus 稳定（确定性护栏生效）
3. 每次投票携带至少 1 条 evidence（含 source, url, snippet, kind, timestamp）
4. 加权共识算法输出 outcome + confidence（≈ 预期 YES ≥0.70）
5. API key 不硬编码，从 `.env` 读取
6. `pnpm typecheck` + `pnpm build` 通过
7. 调用耗时不超过 10 秒（3 次并行 Claude 调用）

## 边界与约束

- API key 走 `ANTHROPIC_API_KEY` 环境变量
- Claude 模型使用 `claude-sonnet-4`（平衡速度/质量）
- 不处理 token 计费/用量追踪
- 精选证据集需要由 Dev B 提前准备（此 spec 提供模板）
- **HTX生态证据**: BULL-1 Agent 的证据集中应当包含来自 HTX 公开API的实时BTC价格数据。代理路径: `GET /api/price/btcusdt`（由 spec 1 实现）
