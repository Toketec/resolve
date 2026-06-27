# RESOLVE — AI-native Prediction Markets

> **Hackathon**: HTX GENESIS × B.AI
> **Deadline**: Submit July 5, 2026
> **Final**: Shanghai WAIC July 17–18
> **Monorepo**: `@resolve/web` (Next.js) + `@resolve/ai` (oracle logic) + `@resolve/shared` (types)

## Project Overview

Polymarket-like prediction markets where AI agents (not humans or centralized oracles) resolve outcomes. Users create markets, trade YES/NO positions, and when a market expires, multiple AI agents independently gather evidence and reach consensus to auto-settle.

**Hero Demo**: Connect TronLink → buy YES on a testnet market → market expires → AI agents deliberate → consensus reached → testnet payout.

## Team

| Role | Focus | Owner |
|------|-------|-------|
| **Dev A** (链/钱) | TronLink, buy signatures, settlement contract, testnet payouts | 主角 |
| **Dev B** (AI/路演) | Real Claude reasoning, curated evidence, consensus math, then pitch deck | 主角 |
| **Dev C** (应用/接缝) | Next.js, API routes, data layer, HTX price data, buy UI, live demo, deploy | 公孙离 |

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
