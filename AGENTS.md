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

所有开发规格以「一组三文档」形式存放在 `spec/N_phase_name/` 目录下：

| 文件 | 内容 |
|------|------|
| `requirements.md` | 解决什么问题、依赖项、验收标准、边界说明 |
| `plan.md` | 实现执行计划——步骤、顺序、依赖、文件路径、注意事项 |
| `tasks.md` | 任务项跟踪——每项 ID/描述/状态/Done 检查条件 |

**粒度原则**：事物边界清晰、能独立解决的中等任务单位。一个规格组应可在 4-8 小时内由单人或子 agent 完整完成。

**AI 使用规则**：Hermes Agent（公孙离）按 `plan.md` 执行任务，完成后更新 `tasks.md` 状态。每完成一项打勾。

**验收流程**：每个 spec 完成后，按 [check.md](../check.md) 执行验收（先 AI 自检 `pnpm typecheck + pnpm build`，再罗列人工检查步骤等待用户操作验证）。

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
│   ├── ENG/                 # English (7 files)
│   ├── CHI/                 # 中文文档 (7 files)
│   └── archive/             # Superseded documents
├── apps/
│   ├── web/           # @resolve/web — Next.js 16
│   └── contracts/     # @resolve/contracts — Solidity
├── packages/
│   ├── shared/        # @resolve/shared — Types + API contracts
│   ├── ai/            # @resolve/ai — Oracle logic
│   └── db/            # @resolve/db — Supabase client + data layer
```

## Hero Market

**Will Bitcoin close above $150,000 by Dec 31, 2026?**

**Orchestrator + 6-Agent Pool**: Orchestrator 先选最优3个 → 并行推理 → 共识

| Tier | Agents | What they do |
|:----|--------|-------------|
| ⚡ **Orchestrator** (selector) | agent-selector | 1 LLM call: analyze market → pick best 3 agents + reasoning |
| ⚡ **ACTIVE** (selected by orchestrator) | BULL-1(Exchange) / BEAR-1(Media) / NEUT-1(Onchain) | 3 parallel LLM calls with role prompts → independent votes |
| 💤 **STANDBY** (not selected for this market) | BULL-2(Tech) / BEAR-2(Regulation) / NEUT-2(Macro) | Shown in Agent Pool with STANDBY + "Not selected for this market" badge |

**Full resolve flow**:
```
  → orchestrator.selectAgents()        (1 LLM call, ~2s)
  → parallel inference on selected 3    (3 LLM calls in parallel, ~5s)
  → weighted consensus
  → UI: selection reasoning → votes 1-by-1
```

- Consensus threshold: 0.65
- All original project history preserved under apps/web/
