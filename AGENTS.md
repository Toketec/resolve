# RESOLVE — AI-native Prediction Markets

> **Monorepo**: `@resolve/web` (Next.js) + `@resolve/ai` (oracle logic) + `@resolve/shared` (types)

## Project Overview

Polymarket-like prediction markets where AI agents (not humans or centralized oracles) resolve outcomes. Users create markets, trade YES/NO positions, and when a market expires, multiple AI agents independently gather evidence and reach consensus to auto-settle.

**Demo Flow**: Connect TronLink → buy YES on a testnet market → market expires → AI agents deliberate → consensus reached → testnet payout.

## Team

| Role | Focus | Owner |
|------|-------|-------|
| **Dev A** (链/钱) | TronLink, buy signatures, settlement contract, testnet payouts | 主角 |
| **Dev B** (AI/路演) | Real Claude reasoning, curated evidence, consensus math, then pitch deck | 主角 |
| **Dev C** (应用/接缝) | Next.js, API routes, data layer, HTX price data, buy UI, live demo, deploy | 公孙离 |

## Spec Convention

所有开发规格以「一组四文档」形式存放在 `spec/N_phase_name/` 目录下：

| 文件 | 内容 |
|------|------|
| `requirements.md` | 解决什么问题、依赖项、边界说明 |
| `plan.md` | 实现执行计划——步骤、顺序、依赖、文件路径、注意事项 |
| `tasks.md` | 任务项跟踪——每项 ID/描述/状态/Done 检查条件 |
| **`check.md`** | **专项验收方案——AI 自检步骤 + 人工检查点 + 错误恢复预案 + 加分项清单** |

**粒度原则**：事物边界清晰、能独立解决的中等任务单位。一个规格组应可在 4-8 小时内由单人或子 agent 完整完成。

**AI 使用规则**：Hermes Agent（公孙离）按 `plan.md` 执行任务，完成后更新 `tasks.md` 状态。每完成一项打勾。

**验收流程**：每个 spec 完成后，按 [docs/ENG/check.md](docs/ENG/check.md)（或中文版 [docs/CHI/check.zh.md](docs/CHI/check.zh.md)）执行**总验收**，或参考 `spec/N/check.md` 做**专项验收**：
1. AI 自检：`pnpm typecheck + pnpm build` + 安全扫描等自动化脚本
2. 人工检查：罗列具体操作步骤（curl 命令、浏览器操作等），每步标注预期结果和加分项

**🛑 提交规则**：禁止自动 `git commit` 或 `git push`。任何提交前必须向用户展示改动内容并**明确询问**（"可以提交了吗？"），获得用户口头确认后方可执行。包括但不限于：代码改动、文档更新、spec 状态更新、配置文件修改。

## Architecture

See [docs/ENG/architecture-overview.md](docs/ENG/architecture-overview.md) (EN) or [docs/CHI/architecture-overview.zh.md](docs/CHI/architecture-overview.zh.md) (中文) for full system architecture. Other design docs are also bilingual under `docs/ENG/` and `docs/CHI/`.

**Key architecture decisions**:
- Deploy: Vercel Serverless only (free Hobby plan, no ICP filing)
- Backend: Next.js API Routes (no separate server)
- Data: Supabase PostgreSQL (via @resolve/db package)
- HTX ecosystem: 3 integrations (HTX API price data + B.AI 8004 + B.AI x402)
- Agent identity: Register AI Agent on TRON via B.AI 8004 protocol
- Agent payment: x402 micropayment on consensus reached
- Domain: `resolve-prediction.vercel.app` (default Vercel subdomain)

## Commands

```bash
pnpm install           # Install all deps
pnpm --filter @resolve/web dev  # Run dev server
pnpm build             # Build all
pnpm typecheck         # Type-check all
```

## Structure

```
resolve/
├── docs/                    # Bilingual docs: ENG/ + CHI/ + archive/
│   ├── ENG/                 # English (7 files: architecture, strategy, judge QA, etc.)
│   ├── CHI/                 # 中文文档 (7 files, mirroring ENG/)
│   └── archive/             # Superseded historical documents
├── apps/
│   ├── web/            # @resolve/web — Next.js 16 (pages, API routes, components)
│   └── contracts/      # @resolve/contracts — Solidity settlement contract
├── packages/
│   ├── shared/         # @resolve/shared — Types + API contracts
│   ├── ai/             # @resolve/ai — Agent prompts, LLM calls, consensus math
│   └── db/             # @resolve/db — Supabase client + data layer
├── spec/               # Development specs, one dir per phase
│   ├── 1_dev_finish_core_api/
│   ├── 2_dev_finish_wallet/
│   ├── 3_dev_finish_ai_oracle/
│   ├── 4_dev_finish_contract/
│   ├── 5_dev_finish_integration/
│   └── 6_dev_finish_demo_ux/
├── AGENTS.md           # This file — project overview for AI agents
├── CLAUDE.md           # Claude Code entry point
└── pnpm-workspace.yaml # Monorepo workspace config
```

Each spec dir (`spec/N/`) contains 4 files:
- `requirements.md` — Problem, dependencies, scope boundaries
- `plan.md` — Step-by-step execution plan
- `tasks.md` — Task tracking with status checkboxes
- **`check.md`** — **Dedicated verification plan** with AI self-check commands, manual test steps (curl/browser), error recovery scenarios, and bonus point checklist

## Hero Market

**Will Bitcoin close above $150,000 by Dec 31, 2026?**

**Orchestrator + 6-Agent Pool**: 6 个 Agent 全部 ACTIVE，市场到期后并行 LLM 推理 → 6 票加权共识

| Tier | Agents | What they do |
|:----|--------|-------------|
| ⚡ **BULL-1** (Exchange oracle) | bull-1 | HTX price/orderbook → bullish technical analysis |
| ⚡ **BULL-2** (Tech oracle) | bull-2 | TEE/L2 fundamentals → bullish supplement |
| ⚡ **BEAR-1** (Media oracle) | bear-1 | News sentiment/regulation → bearish/cautious analysis |
| ⚡ **BEAR-2** (Regulation oracle) | bear-2 | Global regulatory policy → bearish supplement |
| ⚡ **NEUT-1** (Onchain oracle) | neut-1 | On-chain data/whale positions → data-driven neutral |
| ⚡ **NEUT-2** (Macro oracle) | neut-2 | Macro economy/geopolitics → neutral supplement |

**Full resolve flow**:
```
  → all 6 receive evidence in parallel (6 LLM calls, ~5s)
  → weighted 6-vote consensus
  → UI: votes 1-by-1 reveal animation
```

- Consensus threshold: 0.65
- All 6 Agents are ACTIVE — no STANDBY tier

### Agent 命名说明

| 前缀 | 含义 | 偏向量级 |
|:----:|:----:|:--------:|
| **BULL** | 看多（bullish） → 倾向 YES | 2 票 |
| **BEAR** | 看空（bearish） → 倾向 NO | 2 票 |
| **NEUT** | 中性（neutral）  → 数据驱动 | 2 票 |

命名直接借用传统金融的多/空/中三分法，让评委和用户 15 秒理解架构 —— 每个前缀有 -1/-2 两个 Agent，保证 6 票各有独立推理视角，而非单一 Agent 代表全部分析。
