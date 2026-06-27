<div align="center">

# ⟁ RESOLVE

### *AI-Native Prediction Markets — Where Oracles Think*

**Genesis · AI x Web3 · HTX Ecosystem**

<br>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TRON](https://img.shields.io/badge/TRON-FF0013?style=flat-square&logo=tron&logoColor=white)](https://tron.network/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white)](https://soliditylang.org/)

<br>

</div>

---

## The Idea

**Prediction markets are truth machines — but their oracles are not.**

Today's prediction markets rely on either:
- **Centralized oracles** (one source of truth → single point of failure)
- **Human juries** (slow, expensive, manipulable)
- **Community votes** (mob rule, no expertise)

**RESOLVE replaces all three with AI-native consensus.**

Multiple specialized AI agents independently gather real-world evidence, form judgments, and reach a weighted consensus — all deterministically recorded on-chain. No human in the loop. No single oracle to corrupt.

### How it works

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  Market      │    │  AI Oracle       │    │  Settlement  │
│  Created     │───→│  Deliberation    │───→│  Executed    │
│  (TronLink)  │    │  (3 Agents)      │    │  (TRC-20)    │
└──────────────┘    └──────────────────┘    └──────────────┘
                          │
                    ┌─────┼─────┐
                    │     │     │
               Exchange  Media  On-chain
               Oracle   Oracle  Oracle
                   │       │       │
              HTX Price  News    Wallet
                Data    Feeds  Activity
```

### The Agent Trinity

| Agent | Role | Evidence Source | Temperament |
|-------|------|----------------|-------------|
| **BULL-1** | Exchange Oracle | HTX price data, volume trends, orderbook signals | Bullish, data-driven |
| **BEAR-1** | Media Oracle | News sentiment, regulatory landscape, macro risk | Conservative, context-aware |
| **NEUT-1** | On-chain Oracle | Wallet activity, whale movements, network stats | Neutral, probabilistic |

Three agents, three perspectives, one consensus. Each vote is transparent, each evidence trail auditable.

---

## ✦ Architecture

```
resolve/
│
├── apps/
│   ├── web/                # Next.js 16 — Frontend & API routes
│   │   ├── app/            # Pages: markets, agents, portfolio, create
│   │   ├── components/     # UI: TradePanel, ConsensusMeter, PriceChart
│   │   └── lib/            # API client, store, hooks, mock data
│   │
│   └── contracts/          # Solidity — Settlement contract (TRON Shasta)
│       └── ResolveSettlement.sol
│
├── packages/
│   ├── shared/             # @resolve/shared — Domain types & API contracts
│   │   └── src/index.ts    # Market, AgentVote, AIConsensus, Position, ...
│   │
│   └── ai/                 # @resolve/ai — Oracle reasoning engine
│       └── src/
│           ├── index.ts    # resolveMarket() — entry point
│           ├── claude.ts   # Anthropic SDK wrapper
│           ├── prompts.ts  # Agent prompts & personas
│           ├── evidence.ts # Curated evidence sets
│           └── consensus.ts# Weighted consensus math
│
├── docs/                   # Design docs & specifications
└── spec/                   # Granular dev execution specs
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| **AI Oracle** | Anthropic Claude 4 Sonnet, 3-agent parallel inference |
| **Smart Contract** | Solidity ^0.8.24, TRON Shasta Testnet |
| **Wallet** | TronLink browser extension |
| **Data** | In-memory store (dev) → TRC-20 on-chain (production) |
| **Build** | pnpm workspaces, TypeScript 5 |

---

## 🚀 Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm, TronLink extension
git clone https://github.com/Toketec/resolve.git
cd resolve
pnpm install

# Start dev server
pnpm dev

# Type-check & build
pnpm typecheck
pnpm build
```

### Environment

```bash
# Required for AI oracle
ANTHROPIC_API_KEY=sk-ant-...    # Claude API key
```

---

## Demo Walkthrough

1. **Connect** — TronLink wallet connects to Shasta testnet
2. **Browse** — Explore live prediction markets (BTC $150K, ETH ETF staking, etc.)
3. **Trade** — Buy YES on a market with testnet USDD
4. **Expire** — Market reaches end date → triggers AI deliberation
5. **Deliberate** — 3 AI agents independently gather evidence & vote
6. **Consensus** — Weighted outcome emerges, confidence crosses threshold
7. **Settle** — Smart contract auto-pays winners on TRON testnet

> Full demo: ~45 seconds, one fluid shot from wallet to payout.

---

## ✦ Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **Genesis** | AI oracle MVP, testnet settlement, walking skeleton demo | 🔨 In progress |
| **Horizon** | Full order book, multi-chain deployment, LP incentives | 📋 Planned |
| **Nexus** | B.AI compute integration, 8004 agent registry, x402 micro-payments | 📋 Planned |
| **Singularity** | Community dispute voting ($HTX), cross-chain settlement | 🌌 Future |

---

## Team

| Role | Focus |
|------|-------|
| **Dev A** | TRON contracts, TronLink integration, settlement, B.AI/x402 |
| **Dev B** | AI oracle pipeline, Claude reasoning, consensus math, pitch |
| **Dev C** | Next.js app, API routes, data layer, integration seams, demo |

---

<div align="center">
<br>

**RESOLVE** — *Let the truth be decided by many minds, not one.*

<br>
<br>

<sub>Built on TRON · Powered by Claude · Fueled by B.AI</sub>

</div>
