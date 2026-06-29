---
title: "Spec 3 — AI Oracle Reasoning Pipeline 验收方案"
version: "1.0"
date: "2026-06-28"
scope: "6 Agent 并行推理 → 6 票加权共识"
---

# ✅ Spec 3 — AI Oracle Reasoning Pipeline 验收方案

> **用途**: AI 自检 + 人工验证，确保真实 LLM 调用链（6 Agent 并行推理 → 6 票加权共识）可正确执行、可稳定复现、可容错回退。

---

## 📋 前提条件

- [ ] `.env` 中已配置 `ANTHROPIC_API_KEY`（必须）
- [ ] `.env` 中已配置 `BAI_API_KEY` + `BAI_API_ENDPOINT`（加分项，非必须）
- [ ] `packages/ai/src/prompts.ts` 已编写完整（Orchestrator + BULL-1/BEAR-1/NEUT-1 prompt）
- [ ] `packages/ai/src/evidence.ts` 已预取英雄市场证据（HTX价格/新闻/链上数据）
- [ ] `packages/ai/src/llm.ts` 已实现 Claude SDK / B.AI fetch 调用封装
- [ ] `packages/ai/src/consensus.ts` 已实现加权共识数学
- [ ] `packages/ai/src/index.ts` 的 `resolveMarket()` 已替换为真实实现
- [ ] `pnpm install` 已完成（含 `@anthropic-ai/sdk`）

---

## 🤖 AI 自检（终端执行）

```bash
# === 1. 类型检查（10秒）===
pnpm typecheck

# === 2. 构建验证（30秒）===
pnpm build

# === 3. 单元级测试（可选，如果写了测试）===
pnpm --filter @resolve/ai test 2>/dev/null || echo "单元测试未配置，跳过"

# === 4. 验证模块导入正常 ===
node -e "
const ai = require('packages/ai');
console.log('resolveMarket:', typeof ai.resolveMarket);
"

# === 5. 检查 prompt 文件完整性 ===
node -e "
import { ORCHESTRATOR_PROMPT, BULL_1_PROMPT, BEAR_1_PROMPT, NEUT_1_PROMPT, AGENT_PROFILES } from './packages/ai/src/prompts';
console.log('Prompts loaded:', !!ORCHESTRATOR_PROMPT, !!BULL_1_PROMPT, !!BEAR_1_PROMPT, !!NEUT_1_PROMPT);
console.log('Agent profiles:', AGENT_PROFILES.length);
"
```

> **AI 自检通过条件**: 1 + 2 均通过。3–5 仅做参考，不阻塞提交。

---

## 🧪 人工检查步骤

### 检查点 1 — API 调用返回完整 AIConsensus

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| **3.1** | `ANTHROPIC_API_KEY=sk-xxx pnpm --filter @resolve/ai exec tsx -e "import {resolveMarket} from './src/index'; resolveMarket({id:'btc-150k-2026',question:'Will BTC close above $150K by Dec 31, 2026?'}).then(console.log)"` | 返回 JSON 对象，包含 `status` / `consensus_score` / `votes` 字段 | — |
| **3.1b** | 检查返回的 `votes` 数组 | 数组长度为 **6**，对应 6 个 Agent 的投票 | — |
| 3.1c | 检查返回结果 | `AIConsensus` 包含 `votes`（6 条）、`outcome`、`consensus_score` | 🏆 |

### 检查点 2 — 投票结构化完整性

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 3.2a | 检查每条 vote 的字段 | 每条 vote 包含 `agentId` / `outcome`（YES/NO）/ `confidence`（0-1 数字） | — |
| 3.2b | 检查每条 vote 的 `evidence` 数组 | 至少 1 条 evidence，每条含 `source` / `url` / `snippet` / `kind` / `timestamp` | 🏆 |
| 3.2c | 检查 evidence 的 `kind` 多样性 | 6 个 Agent 的 evidence kind 类型不同（如 `price`, `news`, `onchain`, `tech`, `regulatory`, `macro`） | 🏆 |

### 检查点 3 — 共识阈值检查

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 3.3a | 检查 `consensus_score` | `consensus_score ≥ 0.65`（YES加权和 / 总加权和） | — |
| 3.3b | 检查 `status` | `status === "consensus"` | — |
| 3.3c | 手动验算: 加权和 = Σ(confidence × weight)，YES和 / 总加权和 | 与返回的 consensus_score 一致 | 🏆 |

### 检查点 4 — 3 个 Agent 投票倾向不同

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 3.4a | 检查 BULL-1 的 `outcome` 和 `confidence` | BULL-1 偏向 YES（confidence ≥ 0.60） | — |
| 3.4b | 检查 BEAR-1 的 `outcome` 和 `confidence` | BEAR-1 可能 NO 或中性（或 confidence 较低偏向 NO） | 🏆 |
| 3.4c | 检查 NEUT-1 的 `outcome` 和 `confidence` | NEUT-1 数据驱动（evidence 偏链上数据，confidence 在 0.50–0.75 之间） | 🏆 |
| 3.4d | 6 个 Agent 的 outcome 是否呈现出多样性 | 应有 BULL 偏向 YES、BEAR 偏向 NO、NEUT 数据驱动。完全一致可能说明 prompt 设计有偏差 | 🏆 |

### 检查点 5 — Mock 回退（无 API Key）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 3.5a | `ANTHROPIC_API_KEY="" pnpm --filter @resolve/ai exec tsx -e "import {resolveMarket} from './src/index'; resolveMarket({id:'btc-150k-2026'}).then(console.log)"` | 返回 mock 数据（如 `{ status: 'mock', ... }`），**不崩溃、不抛异常** | — |
| 3.5b | 控制台无 `ANTHROPIC_API_KEY` 相关报错 | 有友好提示（如 "Using mock fallback — set ANTHROPIC_API_KEY for real inference"） | 🏆 |
| 3.5c | 完全删除 `.env` 后调用 | 仍返回 mock 数据，不崩溃 | 🏆 |

### 检查点 6 — 确定性护栏（同参数多次调用一致性）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 3.6a | 同参数连续调用 2 次（间隔 30s 以上避免缓存） | 两次结果的 `consensus_score` 偏差 ≤ 0.15 | — |
| 3.6b | 两次调用的 `outcome` 一致 | 都是 YES 或都是 NO | — |
| 3.6c | 两次调用的 votes 分布基本一致（确定性护栏生效） | 6 个 Agent 的 outcome/confidence 命中率 ≥ 90% | 🏆 |

### 🏆 加分 — HTX 价格数据出现在 evidence 中

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 3.7a | 从返回的 votes 中提取所有 evidence，搜索 HTX/BTC 价格相关条目 | 至少 1 条 evidence 包含 `"HTX"` 或 `"火币"` 或 `"Huobi"` 或 BTC 价格数值，来源为 HTX | 🏆 |
| 3.7b | BULL-1（交易所预言机）的 evidence 第一条 | 应为 HTX 实时价格数据（如 `{ source: "HTX API", kind: "price" }`） | 🏆 |
| 3.7c | 检查 evidence 的 `url` | 指向 HTX 交易对页面（如 `https://www.htx.com/trade/btc_usdd`） | 🏆⭐ |

---

## ✅ 验收通过条件

| 等级 | 条件 | 说明 |
|:----:|------|------|
| **必须** | 检查点 1 + 2 + 3 + 5 全部通过 | 核心功能链完整、结构正确、容错回退正常 |
| **推荐** | 检查点 4 + 6 通过 | 投票差异性和确定性护栏生效 |
| **加分** | 检查点 3.7（HTX 证据）通过 | 展示 HTX 生态集成 |

---

## ⚡ 错误恢复 / 气囊检查

| # | 场景 | 预期行为 | 恢复方式 |
|:-:|------|----------|----------|
| E1 | Claude API 返回 429（rate limit） | `llm.ts` 重试 1 次后返回 fallback vote | 稍后重试 |
| E2 | Claude API 返回非 JSON | `llm.ts` 尝试解析 JSON 并修复，失败后返回 fallback | 检查 prompt 格式 |
| E3 | Agent 调用失败（API 错误） | 跳过失败的 Agent，其余 Agent 正常投票 | 不影响其他 Agent 推理 |
| E4 | B.AI API 不可用 | 该 Agent 自动 fallback 到 Claude API | 无需操作 |
| E5 | 所有 API 不可用 | 整个 resolveMarket 返回 mock fallback | 检查网络 + API key |
| E6 | evidence.ts 中英雄市场数据缺失 | 返回该 Agent 的默认低 confidence 投票（0.50） | 补充证据集 |

---

## 📊 预期耗时

| 阶段 | 预计时间 |
|:----:|:--------:|
| AI 自检（typecheck + build） | ≤ 20 秒 |
| 人工检查（6 个检查点全跑） | ≤ 5 分钟 |
| Orchestrator + 3 Agent LLM 调用 | ~5–8 秒（4 次 LLM 调用） |
| 2 次确定性复验 | ~10–16 秒 |
