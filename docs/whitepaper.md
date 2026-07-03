# ⟁ RESOLVE: AI-Native Prediction Markets

## Where Oracles Think — Replacing Human Arbitration with Multi-Agent AI Consensus

> **Version**: 1.0 · **Date**: July 2026
> **Track**: HTX Genesis Hackathon — AI × Web3 Cross-Domain

---

## Abstract

RESOLVE is an **AI-native arbitration layer for decentralized prediction markets**, replacing traditional human-based oracle mechanisms (e.g., UMA's token-holder voting) with a **parallel multi-agent AI consensus** system. When a prediction market expires, six independent AI agents — each specialized in a distinct analytical dimension — simultaneously analyze real-time evidence, cast structured votes, and converge into a weighted consensus verdict. The result is then executed on-chain via the TRON network for trust-minimized settlement.

Unlike existing solutions that take **days** to resolve (UMA) or rely on a single oracle point of failure (Chainlink), RESOLVE delivers a **comprehensive, transparent verdict in approximately 5 seconds** — accelerating prediction market resolution from human timescales to machine timescales while maintaining multi-stakeholder integrity through agent diversity.

The system is built on a hybrid Web2 + Web3 architecture: Supabase PostgreSQL for fast data operations, TRON blockchain for asset settlement, and six specialized LLM-powered agents for evidence-based reasoning. It integrates deeply with the HTX ecosystem through HTX APIs, B.AI 8004 on-chain agent identity, B.AI x402 autonomous micropayments, and \$HTX token utility mechanisms.

---

## 1. The Problem: Resolution Is the Bottleneck

### 1.1 The Current State

Prediction markets (Polymarket, Kalshi, Augur) have demonstrated product-market fit for binary-outcome event trading, yet they remain constrained by a single unsolved problem: **how to determine the outcome fairly, quickly, and scalably**.

| Mechanism | Resolution Time | Transparency | Scalability | Manipulation Resistance |
|:-----------|:----------------:|:------------:|:------------:|:------------------------:|
| **UMA Human Voting** | 2-3 days | Medium | Low | Medium |
| **Centralized Oracle** | Minutes-Hours | Low | Medium | Low |
| **Single AI Oracle** | Seconds | Medium | High | Low |
| **RESOLVE Multi-Agent** | **~5 seconds** | **High** | **High** | **High** |

### 1.2 The UMA Problem

Polymarket uses UMA's Optimistic Oracle: token holders vote on outcomes through a dispute-and-challenge mechanism. This design has three fundamental flaws:

1. **Speed**: A resolution cycle takes 2-3 days. For fast-moving events (crypto price swings, breaking news, sports outcomes), this lag makes markets feel like settled past rather than live instruments.

2. **Scalability**: Each market requires human attention to resolve. As prediction markets grow to thousands of simultaneous events, human-based arbitration becomes the bottleneck.

3. **Nounce & Nuance**: Human voters handle simple binary outcomes well but struggle with complex resolution criteria — "Did the Fed raise rates by exactly 25bps in their September meeting?" requires parsing official documents, not just checking a ticker.

### 1.3 The Single-AI Problem

A single AI model serving as an oracle (even a capable one like GPT-4 or Claude) introduces:

- **No cross-verification**: One model's hallucination or bias is the final word
- **No evidence transparency**: The reasoning behind a verdict is opaque
- **No perspective diversity**: Every oracle sees the same data the same way
- **No fallback**: If the single model fails or is attacked, the market is stuck

### 1.4 The Design Requirement

An ideal resolution mechanism must be:

| Requirement | Why It Matters |
|:------------|:---------------|
| **Fast** | Markets should settle at machine speed, not human speed |
| **Transparent** | Every vote should link to verifiable evidence |
| **Multi-perspective** | No single point of bias or failure |
| **On-chain verifiable** | Payouts are trust-minimized, not authority-dependent |
| **Scalable** | Thousands of markets, zero marginal human cost |

RESOLVE is designed from the ground up to meet all five requirements simultaneously.

---

## 2. Solution Overview: The 4-Layer Model

RESOLVE divides the prediction market lifecycle into four distinct layers, each with a clear owner and responsibility boundary:

```
┌─────────────────────────────────────────────────────────────┐
│                   USER / WALLET LAYER                       │
│  TronLink Connect • Sign Transactions • Own Funds           │
├─────────────────────────────────────────────────────────────┤
│                   AGENT / REASONING LAYER                    │
│  6 Independent AI Oracles • Evidence Harness • Voting       │
├─────────────────────────────────────────────────────────────┤
│                   SYSTEM / ORCHESTRATION LAYER               │
│  Evidence Collection • Consensus Math • UI Animation        │
├─────────────────────────────────────────────────────────────┤
│                   CONTRACT / ASSET LAYER                     │
│  Settlement Contract • 8004 Identity • x402 Micropayment    │
└─────────────────────────────────────────────────────────────┘
```

**The user journey** involves only 3-4 clicks:

| Step | Action | Layer | Duration |
|:----:|:--------|:-----:|:--------:|
| ① | Connect TronLink + sign | Wallet | 5s |
| ② | Pick YES/NO side + amount + sign — **OR sell existing shares** | Wallet | 10s |
| ③ | (Automatic) Market expires → 6 Agents deliberate | Agent | ~5s |
| ④ | Owner signs settlement → On-chain payout | Contract | 5s |
| ⑤ | Owner claims accumulated fees (any time) | Contract | 5s |

**Total user operations**: 3-4 clicks. **Total resolution time**: ~5 seconds.

**AMM fee summary per trade**:
```
User buys $100 YES @ 55¢ → receives $100 / 0.55 = 181.8 shares
Fee: $100 × 0.1% = $0.10 → LP gets $0.05, platform gets $0.05
```

### 2.1 Critical Distinction: Agent ≠ Trading Advisor

This is the single most misunderstood aspect of the architecture and worth stating explicitly:

> **RESOLVE's AI agents are ARBITRATORS, not trading advisors.**

They do not analyze markets to tell users which side to bet on. They do not provide price predictions, trade signals, or investment advice. Their only job begins **after a market expires**: to examine evidence and determine which outcome occurred. This replaces the role of UMA token-holder voters, not the role of a user's own judgment in selecting trades.

This distinction matters because:
- It avoids securities regulation issues around automated trading advice
- It cleanly separates user agency from agent function
- It makes the system a **replacement for oracles**, not a replacement for traders

---

## 3. System Architecture

### 3.1 Technology Stack

| Component | Technology | Purpose |
|:----------|:-----------|:--------|
| **Frontend** | Next.js 16 (App Router) | UI, SSR, API Routes |
| **Monorepo** | pnpm workspace | 4 packages: web, ai, shared, db |
| **Database** | Supabase PostgreSQL | Markets, positions, consensus logs |
| **Blockchain** | TRON (Shasta testnet) | Asset settlement, 8004 identity, x402 |
| **AI Provider** | Claude / DeepSeek via OpenRouter | Agent reasoning (6 parallel calls) |
| **Deployment** | Vercel (Serverless) | Zero-ops, global CDN |
| **Identity** | B.AI 8004 Protocol | On-chain agent registration |
| **Micropayment** | B.AI x402 Protocol | Autonomous agent fee payment |

### 3.2 Hybrid Data Architecture

RESOLVE uses a deliberate **Web2 + Web3 hybrid** storage strategy. The question is never "how can we put everything on-chain" but rather "what belongs where":

| Data Type | Store | Rationale |
|:----------|:-----:|:----------|
| Market metadata, positions, consensus logs | **Supabase PostgreSQL** | Need <10ms reads for search, filtering, portfolio display |
| Asset settlement, \$HTX staking | **TRON chain** | Trust-minimized value transfer requires immutability |
| Agent inference logs | **Supabase** + `tx_hash` link | Fast query with on-chain audit trail via tx hash |

**Core principle**: *"Web2 speed where you need it, Web3 trust where it matters."* The two systems connect via `tx_hash` (links a Supabase record to its TRON transaction for public verification) and `wallet_address` (the foreign key between Web2 identity and on-chain value).

### 3.3 Package Structure

```
resolve/
├── apps/
│   ├── web/          # Next.js — UI + API Routes
│   └── contracts/    # Solidity — Settlement contract
├── packages/
│   ├── shared/       # Types: Market, Agent, AIConsensus, Position
│   ├── ai/           # Agent prompts, LLM calls, consensus math
│   └── db/           # Supabase client + data access layer
└── docs/             # Bilingual documentation
```

---

## 4. The 6-Agent Oracle Pool

### 4.1 Design Philosophy

Traditional oracle design asks: *"What is the truth?"* RESOLVE asks: *"If six independent experts each examined the evidence from their own domain, what would they collectively decide?"*

This shift from **single-truth-seeking** to **multi-perspective consensus** is the core architectural insight. Instead of building a better truth-finder, we build a fairer truth-assembler.

### 4.2 Agent Taxonomy

The six agents are organized along three axes (Bullish, Bearish, Neutral) with two specialized perspectives each, ensuring no analytical dimension goes unreviewed:

| Agent | Callsign | Role | Analytical Lens | Weight |
|:------|:---------|:-----|:----------------|:------:|
| **BULL-1** | Exchange Oracle | Bullish primary | HTX price data, orderbook depth, K-line trends, volume analysis | 1.0 |
| **BULL-2** | Tech Oracle | Bullish supplement | TEE adoption, L2 scaling, blockchain fundamentals, protocol upgrades | 0.8 |
| **BEAR-1** | Media Oracle | Bearish primary | News sentiment, regulatory announcements, social media signals, FUD detection | 0.8 |
| **BEAR-2** | Regulation Oracle | Bearish supplement | Global policy landscape (SEC, EU MiCA, Asia), compliance risk, legal precedent | 0.8 |
| **NEUT-1** | Onchain Oracle | Neutral primary | On-chain metrics, whale positions, exchange flows, DeFi TVL, wallet activity | 0.9 |
| **NEUT-2** | Macro Oracle | Neutral supplement | Interest rates, GDP forecasts, geopolitical risk, macro indicators, correlation analysis | 0.9 |

**Weight rationale**: BULL-1 (Exchange Oracle) receives 1.0 as the primary data oracle — its evidence base is the most direct and least inferential. NEUT agents (0.9) rank second because on-chain and macro data are harder to spin than media/regulation narratives. BULL-2, BEAR-1, BEAR-2 (0.8) provide important supplementary perspectives but carry slightly less weight in the final tally.

**The naming convention** (BULL/BEAR/NEUT prefix + -1/-2 suffix) is intentionally borrowed from traditional finance's long/sideways/short tripartite classification — enabling any observer to understand the architecture in under 15 seconds.

### 4.3 Prompt Engineering — A Deeper Look

Each agent receives:

1. **A system prompt** defining its role, temperament, and analytical lens
2. **A shared evidence harness** — curated, pre-fetched data from live sources (HTX API for BULL-1, news feeds for BEAR-1, on-chain metrics for NEUT-1, etc.)
3. **A structured output contract** requiring JSON with `{ outcome, confidence, rationale, evidenceRefs }`

**Key prompt constraints:**
- `confidence ∈ [0, 1]` — forces calibrated certainty
- At least 1 evidence citation required — prevents groundless voting
- Evidence insufficient → confidence defaults to 0.5 — **conservatism guardrail**
- All 6 agents run simultaneously with no visibility into each other's votes — **independence guarantee**

**Why independence matters**: By preventing agents from seeing each other's votes before casting their own, we eliminate groupthink, anchoring bias, and cascade effects that plague human committee-based arbitration.

### 4.4 The Evidence Harness

Before agents reason, the system pre-fetches evidence from multiple live sources, organized by role:

| Role | Data Sources |
|:-----|:-------------|
| **exchange-oracle** | HTX BTC/USDD price ticker, 24h orderbook depth, K-line (1h/4h/1d), volume profile |
| **tech-oracle** | TEE protocol status, L2 TVL, recent blockchain upgrade calendars |
| **media-oracle** | Aggregated crypto news headlines, social media sentiment indicators, regulatory news |
| **regulation-oracle** | SEC filing calendar, EU MiCA timeline, Asia regulatory tracker |
| **onchain-oracle** | Whale wallet movements, exchange net flows, stablecoin supply changes, DeFi TVL trends |
| **macro-oracle** | Fed rate expectations, US CPI data, global PMI indices, geopolitical risk indices |

This evidence is pre-fetched so agents can reason within the same context window without waiting for external API calls — keeping total resolve time under 5-6 seconds.

---

## 5. Consensus Mechanism

### 5.1 Weighted Majority Voting

After all six agents have voted, the consensus math is straightforward and transparent:

```
yesWeight = Σ(confidence_i) for votes where outcome_i = "YES"
noWeight  = Σ(confidence_i) for votes where outcome_i = "NO"

outcome    = yesWeight >= noWeight ? "YES" : "NO"
confidence = max(yesWeight, noWeight) / (yesWeight + noWeight)
status     = confidence >= 0.65 ? "consensus" : "dispute"
```

**Threshold (0.65)**: Calibrated such that at least 4 of 6 agents must agree at moderate confidence, or 3 agents must agree at high confidence (>0.87), for a verdict to pass without dispute. This prevents thin majorities from triggering irreversible on-chain payouts.

### 5.2 Consensus States

| State | Meaning | Action |
|:------|:--------|:-------|
| **consensus** | Confidence ≥ 0.65 | Proceed to on-chain settlement |
| **dispute** | Confidence < 0.65 | Flag for human review (future: escalation to \$HTX staker voting) |
| **pending** | Resolution not yet triggered | Market still live |
| **deliberating** | Agents currently reasoning | UI shows progress animation |

### 5.3 Comparison: RESOLVE vs UMA Consensus

| Dimension | UMA (Human Voters) | RESOLVE (AI Agents) |
|:----------|:------------------:|:-------------------:|
| Voter count | Variable (open to all DVM token holders) | Fixed (6 pre-registered agents) |
| Voter expertise | General crypto community | Specialized (each agent owns a domain) |
| Resolution time | 2-3 days | ~5 seconds |
| Evidence transparency | None (voters decide off-chain) | Full (every vote cites sources) |
| Cost per resolution | \$100-$500+ in gas + voter incentive | ~\$0.30-$0.60 (6 LLM calls + 1 x402) |
| Outcome granularity | Binary only | Binary with calibrated confidence |
| Manipulation resistance | Token-weight based (whales dominate) | Evidence-weighted (data dominates) |

---

## 6. Smart Contract — AMM & On-Chain Settlement

The settlement contract is deployed on TRON Shasta testnet. It implements a **linear bonding curve AMM** for both buy and sell operations, replacing the previous single-direction (buy-only) model.

### 6.1 AMM Pricing Model

Each market is an independent liquidity pool. The creator (single LP) deposits initial USDD at creation. All trading prices are derived from the pool state:

```
YES_price = 0.5 + net / (2 * L)
NO_price  = 1 - YES_price

net: cumulative YES volume bought - cumulative NO volume bought (in USDD)
L:   initial liquidity deposited by market creator (in USDD)
Price clamped to [0.01, 0.99]
```

**Example** (market with L = 1,000 USDD):

| Action | net change | YES price | NO price |
|:-------|:----------:|:---------:|:--------:|
| Initial | net = 0 | 50% | 50% |
| Buy $100 YES | net += 100 | **55%** | 45% |
| Buy $200 NO | net -= 200 | **45%** | 55% |
| Sell 50 YES shares (net ~55) | net -= 55 | **~43%** | 57% |

### 6.2 Fees

| Fee | Rate | Allocation |
|:----|:----|:-----------|
| Trading fee | 0.1% (buy AND sell) | 50% → LP, 50% → platform `feePool` |
| Creation fee | 10 USDD (fixed) | 100% → platform `feePool` |
| Settlement fee | 0 (post-hackathon: 1 USDD optional) | — |

### 6.3 Contract Functions

1. **createMarket()**: Creator deposits L USDD + pays 10 USDD creation fee
2. **buyShares()**: User sends USDD → receives shares at AMM price + pays 0.1% fee
3. **sellShares()**: User sends shares → receives USDD at AMM price + pays 0.1% fee
4. **settle()**: After AI consensus, transfers USDD from pool to winning wallets
5. **claimFees()**: Owner withdraws accumulated feePool
6. **getPoolState()**: Read-only query returning pool state (yesSupply, noSupply, prices, liquidity, feePool)
7. **Airbag mode**: When testnet is unstable, returns `{ simulated: true }` to keep the demo flowing

### 6.2 B.AI 8004 — On-Chain Agent Identity

Each AI agent is registered on the TRON network via the **B.AI 8004 Protocol**, giving it an on-chain verifiable identity. This serves:

- **Trust**: Users can verify an agent's identity, resolution history, and accuracy on-chain
- **Accountability**: Registered agents cannot dispute their past votes — the on-chain record is immutable
- **HTX ecosystem integration**: Demonstrates usage of B.AI infrastructure, a scoring factor in the Genesis track

### 6.3 B.AI x402 — Autonomous Agent Micropayment

When consensus is reached, the system triggers an **x402 micropayment** — the agent autonomously pays its resolution fee from its on-chain wallet. This is the economic completion of a resolve cycle:

- Agent reasons → consensus reached → agent pays x402 fee → settlement authorized
- Fee: ~0.001 TRX per resolution (negligible, demonstrating economic autonomy rather than revenue)
- Visible on-chain: each x402 transaction is verifiable on Tronscan

This makes RESOLVE's agents **economically autonomous** — they earn, spend, and operate on-chain without human intermediation.

---

## 7. HTX Ecosystem Integration

RESOLVE integrates with three distinct HTX ecosystem resources, exceeding the program's minimum requirement:

| Integration | Type | Depth | Scoring Impact |
|:------------|:----:|:-----:|:--------------:|
| **HTX Public API** | Read-only HTTP | Live price feed, orderbook depth, K-line data for BULL-1 agent | 商业与生态潜力 |
| **B.AI 8004 Protocol** | TRON on-chain | Agent identity registration — each AI agent gets a verified on-chain ID | AI/Web3技术应用程度 |
| **B.AI x402 Protocol** | TRON on-chain | Autonomous micropayment for agent resolution fees | AI/Web3技术应用程度 |
| **\$HTX Token** | Economy display | Fee discount display, buyback counter, agent incentive mechanism | 商业与生态潜力 |

### 7.1 \$HTX Token Economy

| Layer | Mechanism | Demo Visibility |
|:------|:-----------|:---------------|
| **① Settlement** | USDD TRC-20 transfer on Shasta testnet | Buy: pay USDD → Win: receive USDD |
| **② \$HTX Fee Utility** | Buy shares with \$HTX fee discount display | TradePanel shows "\$HTX 0.5% base fee → 0.3% with staking" |
| **③ \$HTX Buyback Display** | Dashboard KPI showing "Total \$HTX Buyback: X" | Visible in 45s demo walkthrough |

**Ecosystem alignment thesis**: We use **USDD** (TRON-native decentralized stablecoin) rather than generic USDT/USDC — this is a deliberate ecosystem-alignment decision that differentiates RESOLVE from projects that bolt onto TRON without participating in its economic infrastructure.

---

## 8. Comparison: RESOLVE vs. Alternatives

### 8.1 vs. Polymarket (UMA)

| Aspect | Polymarket | RESOLVE |
|:-------|:-----------|:--------|
| Resolution | UMA human token-holder voting (2-3 days) | AI multi-agent consensus (~5 seconds) |
| Oracle type | Optimistic (dispute-based) | Active (evidence-based) |
| Settlement | On-chain after dispute window | On-chain immediately after consensus |
| Scalability | Human attention is the bottleneck | Zero marginal human cost per market |
| Transparency | Voters decide off-chain | Every vote links to verifiable evidence |
| Cost per resolution | \$100-500+ | ~\$0.30-0.60 |

### 8.2 vs. Chainlink Oracles

| Aspect | Chainlink | RESOLVE |
|:-------|:----------|:--------|
| Data type | Price feeds, sports scores | Arbitrary resolution criteria |
| Reasoning | Stateless data relay | Stateful evidence-based deliberation |
| Consensus | Multi-node data aggregation | Multi-perspective AI reasoning |
| Customization | Pre-built adapters only | Prompt-engineered per market category |

### 8.3 vs. Single AI Oracle

| Aspect | Single AI | RESOLVE Multi-Agent |
|:-------|:----------|:-------------------|
| Bias | Single model's inherent bias | 6 diverse perspectives average out bias |
| Error mode | One hallucination = wrong verdict | One hallucination = diluted by 5 other votes |
| Evidence | Opaque reasoning | Each vote cites specific sources |
| Fallback | None (single point of failure) | 5 remaining agents still vote if 1 fails |
| Verifiability | Black box | Full vote audit trail |

---

## 9. Security Model & Trust Assumptions

### 9.1 Trust Minimization

RESOLVE's trust model is designed to minimize the number of parties any single user must trust:

1. **User trusts**: Their own TronLink wallet, the settlement contract on TRON, and the aggregate of 6 independent AI agents
2. **User does NOT need to trust**: A centralized operator, any single oracle, or human voters
3. **The system relies on**: Agent diversity (not any single agent's correctness), on-chain immutability for settlement, and evidence transparency for audit

### 9.2 Threat Model

| Threat | Mitigation | Residual Risk |
|:-------|:-----------|:-------------|
| Single agent compromised/biased | 6-agent pool + weighted consensus | Collusion of 4+ agents |
| LLM hallucination | Evidence harness + source requirement + conservatism guardrail | Subtle hallucination undetected |
| TRON testnet instability | Airbag (simulated payout mode) | Live demo disruption |
| API key exposure | Server-side only, never in client bundle | — |
| Frontend tampering | Settlement requires signed transaction | UI-only manipulation cannot steal funds |

### 9.3 Future Security Enhancements

- **Dispute window**: A 24-hour window after resolution where \$HTX stakers can challenge the verdict
- **Agent slashing**: Staked \$HTX lost if an agent's vote is systematically overturned
- **Reputation system**: Long-term accuracy tracking per agent, weighted into consensus over time

---

## 10. The Hero Market

**"Will Bitcoin close above \$150,000 by December 31, 2026?"**

This market is the walking skeleton demo that exercises the entire RESOLVE pipeline end-to-end:

- **Wallet**: User connects TronLink on Shasta testnet
- **Trade**: User buys YES for a fixed USDD amount
- **Resolution**: Market expiry triggered → 6 agents deliberate in parallel (~5s)
- **Consensus**: 6-vote weighted tally → outcome determined
- **Settlement**: USDD TRC-20 transfer from contract pool to winning wallet

**Demo duration**: ~30 seconds (including 5-second agent deliberation)

---

## 11. Roadmap

### Phase 1 — Hackathon (July 2026)

- ✅ 6-agent prompt engineering and parallel reasoning pipeline
- ✅ TRON testnet settlement with USDD
- ✅ AMM linear bonding curve (buy + sell + fee)
- ✅ B.AI 8004 agent identity registration
- ✅ B.AI x402 autonomous micropayment
- ✅ HTX ecosystem integrations (HTX API, \$HTX economy display)
- ✅ Walking skeleton end-to-end demo with real trades

### Phase 2 — Post-Hackathon (Q3-Q4 2026)

| Feature | Priority | Rationale |
|:--------|:--------:|:----------|
| Multi-chain support (Ethereum, Solana, BSC) | High | Expand market universe |
| Full order book + LP mechanics | High | Real market depth, not just demo |
| Dispute window with \$HTX staker voting | High | Community-governed appeal mechanism |
| Market creation UI | Medium | Currently pre-seeded; enable user-created markets |
| Agent reputation tracking | Medium | Long-term accuracy-weighted consensus |

### Phase 3 — Production (2027)

- **Cross-chain oracle network**: RESOLVE agents become a general-purpose arbitration layer for any dApp needing dispute resolution
- **Agent marketplace**: Users stake \$HTX to sponsor their preferred agent types, earning a share of resolution fees
- **Real \$HTX buyback**: On-chain buy-and-burn mechanism funded by resolution fees

---

## 12. Team

The RESOLVE team is organized along three parallel workstreams, enabling simultaneous progress on chain integration, AI reasoning, and application layer:

| Role | Focus | Responsibilities |
|:-----|:------|:-----------------|
| **Dev A** | Chain & Asset Layer | TronLink integration, buy signing, settlement contract, testnet payouts, 8004/x402, \$HTX economy UI |
| **Dev B** | AI & Pitch | Agent reasoning pipeline, evidence harness, consensus math, pitch deck, demo script |
| **Dev C** | Application & Integration | Next.js UI, API routes, Supabase data layer, HTX price feed, walking skeleton assembly, deployment |

---

## 13. Conclusion

RESOLVE addresses the fundamental bottleneck in prediction markets — resolution speed and trust — by introducing a new primitive: **multi-agent AI consensus as an arbitration layer**.

The key insight is not that AI can determine truth; it's that **six independent AI perspectives, combined through transparent weighted voting, produce verdicts that are faster, cheaper, and more auditable than any alternative** — human voting, centralized oracle, or single AI.

By building on TRON within the HTX ecosystem, using USDD for settlement, registering agents via B.AI 8004, enabling autonomous payments via x402, and integrating \$HTX token utility, RESOLVE demonstrates not just a technical prototype but a complete economic model for autonomous AI agents operating within decentralized markets.

---

## References

- Polymarket & UMA: https://polymarket.com / https://uma.xyz
- B.AI Protocol: [B.AI Developer Docs]
- HTX API: https://www.htx.com/en-us/rest-api-doc/
- TRON Shasta Testnet: https://www.trongrid.io/shasta
- Claude API: https://docs.anthropic.com
- OpenRouter: https://openrouter.ai
