# RESOLVE — Project Submission

> **Track**: Genesis (AI × Web3 Cross-Domain)
> **Submission Date**: July 2026

---

## Project Name

**RESOLVE** — AI-Native Prediction Markets

## Team

| Member | Role | Contact |
|--------|------|---------|
| TBD | — | — |
| TBD | — | — |
| TBD | — | — |

---

## Problem

Prediction markets today rely on two flawed resolution mechanisms:

1. **Centralized oracles** (e.g., Polymarket's UMA) — human token-holder voting that takes **days**, is susceptible to manipulation, and cannot scale to handle complex or nuanced outcomes.
2. **Single-point AI oracles** — a single model's judgment with no cross-verification, no evidence transparency, and no fallback.

Both approaches create a trust bottleneck that limits prediction markets to simple binary outcomes and discourages mainstream adoption.

---

## Solution

**RESOLVE replaces human arbitration with multi-AI-agent consensus.** When a market expires, 6 independent AI agents — each specialized in a distinct analytical dimension (exchange data, technical fundamentals, news sentiment, regulation, on-chain metrics, macro economy) — gather evidence and vote in parallel. A weighted consensus algorithm aggregates their judgments to determine the outcome, which is then settled on-chain via TRON testnet.

**Key flow:** Wallet connect → Buy YES/NO → Market expires → 6 Agents deliberate (~5s) → Consensus → On-chain settlement

---

## Target Users

| User Type | Need |
|-----------|------|
| **Crypto traders & degens** | Fast, fair market resolution without waiting days for human voting |
| **Prediction market platforms** | A scalable, transparent arbitration layer to replace UMA/oracles |
| **DeFi users** | On-chain-settled markets with AI-verifiable outcomes |
| **HTX ecosystem participants** | Native integration with HTX APIs, $HTX token, and B.AI compute |

---

## Core Highlights

### 1. 6-Agent Parallel Consensus (Not a ChatGPT Wrapper)

- 6 specialized agents (Exchange, Tech, Media, Regulation, On-chain, Macro) reason independently via real LLM calls
- Weighted 6-vote consensus reaches verdict in **~5 seconds** — vs. days for UMA human voting
- Each vote links to verifiable evidence (price feeds, news sources, on-chain data)

### 2. AI-Native, Not Crypto-Wrapped

- Agents are **arbitrators**, not trading advisors — they replace UMA's human voters, not tell users which side to bet
- Fully automated resolution pipeline: evidence gathering → LLM reasoning → consensus → on-chain settlement

### 3. TRON Ecosystem Native

- Settlement via **USDD TRC-20** on TRON Shasta testnet
- Agent identity registered via **B.AI 8004 Protocol**
- Autonomous agent micropayment via **B.AI x402 Protocol**
- $HTX token utility: fee discount and buyback display

### 4. Real, Not Demo-Only

| What's Real | What's Pre-Seeded |
|-------------|-------------------|
| TronLink wallet connection + buy signing | Other markets' historical data |
| 6-agent real Claude/DeepSeek reasoning | Agent avatars & names |
| Weighted consensus calculation | Market creation history |
| TRON testnet settlement payout | — |
| HTX real-time BTC/USDD price data | — |
| B.AI 8004 identity registration | — |
| B.AI x402 micropayment | — |
