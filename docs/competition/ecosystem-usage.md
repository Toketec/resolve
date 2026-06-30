# Ecosystem Resource Usage — RESOLVE

> This document describes how RESOLVE integrates with the HTX ecosystem resources, as required by the HTX Genesis Hackathon submission guidelines.

---

## Overview

RESOLVE integrates **3 HTX ecosystem resources** across its architecture: HTX Public API (market data), B.AI 8004 Protocol (agent identity), and B.AI x402 Protocol (autonomous micropayment). Additionally, the project uses TRON Shasta testnet for on-chain settlement and incorporates $HTX token economics into its UI.

---

## 1. HTX Public API — BTC/USDD Real-Time Price Feed

| Field | Detail |
|-------|--------|
| **Resource** | HTX REST API (Public Market Data) |
| **Endpoint** | `GET https://api.htx.com/market/detail/merged?symbol=btcusdd` |
| **Type** | Read-only HTTP (no authentication required) |
| **Used in** | BULL-1 (Exchange Agent) — price, orderbook depth, 24h volume as evidence for bullish/bearish analysis |
| **Why it matters** | Provides **real-time, verifiable market data** that the AI agent uses as primary evidence, not simulated price feeds |
| **Scoring dimension** | Ecosystem Fit — demonstrates direct HTX API consumption |

### Data Used

| Data Point | Agent Usage |
|------------|-------------|
| `close` (last price) | vs. target price threshold → directional signal |
| `high` / `low` (24h range) | Volatility assessment → confidence adjustment |
| `amount` (24h volume) | Market participation → strength of signal |

---

## 2. B.AI 8004 Protocol — On-Chain Agent Identity

| Field | Detail |
|-------|--------|
| **Resource** | B.AI 8004 Agent Identity Protocol |
| **Interaction** | Register each AI Agent on TRON with a verified 8004-compliant identity |
| **Type** | On-chain transaction (TRON testnet) |
| **Used in** | Agent pool initialization — each of the 6 agents (BULL-1/2, BEAR-1/2, NEUT-1/2) gets a unique 8004 identity |
| **Why it matters** | Moves agents from "anonymous LLM calls" to **on-chain verifiable entities** — a core AI×Web3 fusion element |
| **Scoring dimension** | AI/Web3 Application — real on-chain agent identity, not a database entry |

### Implementation

```
┌─────────────────────────────────────────────────┐
│  Agent Pool Initialization                       │
│                                                  │
│  bull-1 → register 8004 identity → 0x...a1f2    │
│  bull-2 → register 8004 identity → 0x...b3c4    │
│  bear-1 → register 8004 identity → 0x...d5e6    │
│  bear-2 → register 8004 identity → 0x...f7g8    │
│  neut-1 → register 8004 identity → 0x...h9i0    │
│  neut-2 → register 8004 identity → 0x...j1k2    │
└─────────────────────────────────────────────────┘
```

Each agent's 8004 ID is displayed on its card in the UI, visible during the demo.

---

## 3. B.AI x402 Protocol — Autonomous Agent Settlement Fee Payment

| Field | Detail |
|-------|--------|
| **Resource** | B.AI x402 Micropayment Protocol |
| **Interaction** | Agent wallet autonomously pays a micro-fee when settlement is triggered |
| **Type** | On-chain transaction (TRON testnet) |
| **Used in** | Settlement pipeline — after consensus is reached and before on-chain payout, the agent wallet fires a x402 micropayment |
| **Why it matters** | Demonstrates **agent economic autonomy**: the agent pays for its own compute/settlement costs, not subsidized by a central entity |
| **Scoring dimension** | AI/Web3 Application + Innovation — autonomous agent economy |

### Flow

```
Consensus reached
     ↓
Agent wallet checks fee balance
     ↓
x402 micropayment sent to settlement contract
     ↓
Settlement contract verifies payment → releases payout
```

---

## 4. TRON Shasta Testnet — On-Chain Settlement

| Field | Detail |
|-------|--------|
| **Resource** | TRON Shasta testnet (via TronGrid public node) |
| **Interaction** | Deploy settlement contract, process buy orders, execute payout transactions |
| **Type** | Smart contract deployment & execution |
| **Used in** | Entire settlement layer — wallet connect, buy shares, settle market |
| **Why it matters** | All value transfer happens on a real TRON testnet, not simulated — judges can verify transactions on ShastaScan |
| **Scoring dimension** | Product Completeness + Web3 Application |

---

## 5. $HTX Token Utility (UI Display)

| Field | Detail |
|-------|--------|
| **Resource** | $HTX token economics (display layer, no real swap) |
| **Interaction** | Trade panel shows $HTX fee discount; dashboard shows total $HTX buyback counter |
| **Type** | UI display (no on-chain interaction in demo) |
| **Used in** | Trade panel, KPI dashboard card |
| **Why it matters** | Demonstrates understanding of token-economy design — $HTX as fee utility token, aligned with HTX DAO ecosystem |
| **Scoring dimension** | Commercial Potential — token-economic model design |

### Economic Model

| Mechanism | Description | UI Visibility |
|-----------|-------------|---------------|
| **$HTX Fee Discount** | Trading fee reduced from 0.5% to 0.3% when staking $HTX | TradePanel shows both rates |
| **$HTX Buyback Pool** | 0.1% of each trade's fee flows to buyback → raises floor demand | KPI dashboard card |
| **$HTX Earned** | Agent cards display $HTX earned from resolving markets | Agent detail panel |

---

## Summary of Ecosystem Integration

| Resource | Integration Depth | Judge Visibility | Scores On |
|----------|:-----------------:|:----------------:|:---------:|
| HTX Public API | Real-time price data in agent evidence | Evidence panel shows live HTX data | Ecosystem Fit |
| B.AI 8004 Protocol | On-chain agent identity registration | Agent cards show 8004 ID | AI/Web3 Fusion |
| B.AI x402 Protocol | Autonomous micropayment on resolve | Transaction shown in settlement flow | AI/Web3 Fusion |
| TRON Shasta testnet | Full contract deployment & execution | Wallet + transaction history | Product Completeness |
| $HTX Token Utility | Fee discount & buyback display | Trade panel + KPI card | Commercial Potential |

> **Narrative**: "We didn't just bolt on APIs. RESOLVE is built **on** the HTX ecosystem — agents live on-chain via 8004, pay via x402, and reason using HTX market data. Every layer of the product consumes an ecosystem resource."
