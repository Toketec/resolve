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
**🛑 提交规则**：禁止自动 `git commit` 或 `git push`。任何提交前必须向用户展示改动内容并**明确询问**（"可以提交了吗？"），获得用户口头确认后方可执行。包括但不限于：代码改动、文档更新、spec 状态更新、配置文件修改。

## Architecture

See [docs/architecture-overview.md](docs/architecture-overview.md) for full system architecture.

**Key architecture decisions**:
- Deploy: Vercel Serverless only (free Hobby plan, no ICP filing)
- Backend: Next.js API Routes (no separate server)
- Data: JSON + in-memory (no database needed for demo)
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
├── AGENTS.md, CLAUDE.md, docs/
├── apps/
│   ├── web/           # @resolve/web — Next.js 16
│   └── contracts/     # @resolve/contracts — Solidity
├── packages/
│   ├── shared/        # @resolve/shared — Types + API contracts
│   └── ai/            # @resolve/ai — Oracle logic
```

## Hero Market

**Will Bitcoin close above $150,000 by Dec 31, 2026?**

- 3 real AI agents (Claude), 3 historical mock agents shown in UI
- Consensus threshold: 0.65
- All original project history preserved under apps/web/
