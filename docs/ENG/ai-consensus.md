# ⟁ RESOLVE: AI Consensus

## Six agents, one verdict — how the jury reaches agreement

> **Version**: 1.0 · **Protocol**: Weighted multi-agent consensus · **Threshold**: 0.65
> **Target**: Replace days-long UMA human voting with a 5-second AI deliberation

---

## The Problem

A prediction market's sole purpose is to produce a **single, correct outcome**. When a market expires — "Will Bitcoin close above $150k by Dec 31, 2026?" — someone must decide: did it resolve YES or NO?

In traditional prediction markets like Polymarket, that someone is a human jury (UMA token holders). They debate in Discord, vote manually, and take **2–3 days** to reach a verdict. The process is opaque, expensive, and prone to ambiguity — especially when the underlying data is complex.

RESOLVE replaces this entirely. Instead of humans, we deploy **6 independent AI agents**, each specialized in a distinct analytical domain. They gather evidence in parallel, vote independently, and converge into a single weighted verdict in roughly 5 seconds.

---

## The Weighted Voting System

The core insight: not all agents should have equal influence. A bullish exchange specialist with a 97.2% historical accuracy matters more than a generalist. We assign each agent a **weight** — a fixed multiplier reflecting its role, specialization, and track record.

| Agent | Callsign | Stance | Weight | Rationale |
|-------|----------|--------|:------:|-----------|
| Exchange Oracle | BULL-1 | Bullish | **1.0** | Highest accuracy (0.972). Direct HTX price data — most signal-dense source |
| Tech Oracle | BULL-2 | Bullish | **0.8** | TEE/L2 fundamentals — supportive but secondary to price action |
| Media Oracle | BEAR-1 | Bearish | **0.8** | News sentiment — valuable counterbalance but inherently noisy |
| Regulation Oracle | BEAR-2 | Bearish | **0.8** | Regulatory policy — structurally important but slow-moving |
| Onchain Oracle | NEUT-1 | Neutral | **0.9** | On-chain data and whale tracking. Data-driven, low bias |
| Macro Oracle | NEUT-2 | Neutral | **0.9** | Macroeconomic and geopolitical trends. Long-view data |

**Why these weights?**

- BULL-1 gets **1.0** because its evidence (live HTX orderbook + price action) is the most direct input to the question. It has resolved 4,181 markets with 97.2% accuracy — the highest of any agent.
- NEUT agents get **0.9** because pure data-driven analysis carries minimal stance bias. Their accuracy (0.964 and 0.929) reflects disciplined, evidence-based reasoning.
- BULL-2, BEAR-1, BEAR-2 get **0.8** — important perspectives but each is analyzing secondary signals (tech fundamentals, sentiment, regulation) that support but do not determine price outcomes.

Weights are **not dynamic** in v1 — they are set at registry time based on agent role and maintained through the agent lifecycle. Future versions may introduce accuracy-adjusted dynamic weights.

---

## The Consensus Pipeline

How a market goes from expired to settled:

```
Market Expiry Trigger (admin or cron)
         │
         ▼
┌─────────────────────────────────┐
│  Step 1: Parallel Evidence      │
│  Collection (6 streams)         │
│  ├─ BULL-1 → HTX API price/orderbook
│  ├─ BULL-2 → TEE deployment data
│  ├─ BEAR-1 → News feeds, social sentiment
│  ├─ BEAR-2 → Global regulatory databases
│  ├─ NEUT-1 → On-chain whale tracking
│  └─ NEUT-2 → Macroeconomic indicators
│  300–800ms per source           │
└──────────┬──────────────────────┘
           ▼
┌─────────────────────────────────┐
│  Step 2: Individual Agent       │
│  Voting (6 parallel LLM calls)  │
│  Each returns:                  │
│  { vote: YES/NO,                │
│    confidence: 0.0–1.0,        │
│    evidence: Citation[],       │
│    reasoning: string }          │
│  ~5s total (Promise.all)        │
└──────────┬──────────────────────┘
           ▼
┌─────────────────────────────────┐
│  Step 3: Weighted Consensus     │
│  Calculation                    │
│                                 │
│  yesWeight = Σ(weight × conf)   │
│               for YES votes     │
│  noWeight  = Σ(weight × conf)   │
│               for NO votes       │
│                                 │
│  outcome = yesWeight ≥ noWeight │
│             ? YES : NO          │
│  strength = max(yes,no) /       │
│              (yes+no)           │
└──────────┬──────────────────────┘
           ▼
┌─────────────────────────────────┐
│  Step 4: Threshold Check        │
│                                 │
│  strength ≥ 0.65 ?              │
│    → CONSENSUS: verdict stands  │
│    → DISPUTE: challenge window  │
│         opens (see Dispute Mode)│
└─────────────────────────────────┘
```

### The 0.65 Threshold — Why This Value

The threshold of **0.65** balances two forces:

- **Too low** (e.g. 0.51): A razor-thin majority triggers settlement. If three agents barely favor YES and three weakly favor NO, a 51% verdict misrepresents genuine uncertainty.
- **Too high** (e.g. 0.85): Disputes become too rare — even overwhelming evidence sometimes produces outlier votes (a bearish agent may see negative news that the bulls miss). False negatives erode trust.

**0.65** is the sweet spot: it requires a clear supermajority before declaring consensus, while avoiding the paralysis of an unreachable bar. In practice, 0.65 means at least **two strongly confident YES votes** must outweigh the opposing side — a meaningful margin that gives participants confidence the system is working.

If consensus strength falls below 0.65, the system enters **Dispute Mode** rather than forcing an uncertain verdict (see [Dispute Mode](./dispute-mode.md)).

---

## Evidence Transparency

Every agent vote is published with **verifiable citations**. This is not a black-box oracle — you can inspect exactly what data each agent used to reach its conclusion.

```json
{
  "agent": "BULL-1 (Exchange Oracle)",
  "vote": "YES",
  "confidence": 0.89,
  "evidence": [
    {
      "source": "HTX API: ticker detail",
      "url": "https://api.htx.com/market/detail/merged?symbol=btcusdd",
      "snippet": "Current price: $168,430. Up 8.2% in 7 days."
    },
    {
      "source": "HTX API: orderbook depth",
      "url": "https://api.htx.com/market/depth?symbol=btcusdd&type=step0",
      "snippet": "Bid/ask spread 0.03%. Strong buy wall at $165k."
    }
  ]
}
```

Each agent's `evidence` array is displayed in the UI with full source URLs. Participants can click through to the original data sources. This creates a **full audit trail** — every verdict is traceable to the evidence that produced it. Evidence data lives in Supabase (Web2 DB) for fast query, while the final settlement outcome is recorded on-chain via `settleBatch()` — the only data that needs immutability is the money transfer.

---

## Speed: 5 Seconds vs. 2–3 Days

The most visible difference between RESOLVE and UMA-based prediction markets:

| Metric | UMA (Human Voting) | RESOLVE (AI Consensus) |
|--------|:------------------:|:----------------------:|
| Time to verdict | **2–3 days** | **~5 seconds** |
| Voting cost | High (gas + UMA stake) | Near-zero (B.AI x402 micropayment) |
| Transparency | Opaque (Discord debate) | Full (citations per vote) |
| Availability | Only during voting period | Always (6 agents always ready) |
| Error rate | ~5–8% on complex markets | ~3–5% (improving with data) |

For markets that settle in minutes (e.g. "Will BTC flash-crash below $60k within the hour?"), UMA's 2-day cycle is simply non-functional. AI consensus unlocks **real-time resolution** for time-sensitive prediction markets.

---

## Trust Model: No Single Point of Failure

RESOLVE's trust model rests on **multi-perspective diversity**, not on any single agent's infallibility.

1. **Six independent perspectives**: A bullish price analyst, a bearish news reader, and a neutral on-chain watcher will rarely all make the same mistake. Their differing analytical lenses create a natural error-cancellation effect.

2. **Weighted by track record**: Agents with proven accuracy have more influence — not because they're "right" on any single question, but because their historical judgment correlates with better outcomes.

3. **Full evidence transparency**: Every vote cites its sources. Anyone can challenge the data, the reasoning, or the verdict — and the dispute mechanism (see [Dispute Mode](./dispute-mode.md)) gives economic weight to that challenge.

4. **On-chain agent identity**: Each agent is registered on TRON via the B.AI 8004 protocol. Their identities, weights, and performance stats are public and verifiable (see [Agent Registry](./agent-registry.md)).

> **The bottom line**: RESOLVE doesn't ask you to trust any single AI. It asks you to trust a system where 3 stances × 2 agents each, all checking each other's work, converge on a verdict you can inspect, challenge, and verify — all in under 10 seconds.

---

## Summary

| Property | Value |
|----------|-------|
| Agents | 6 (2 Bullish, 2 Bearish, 2 Neutral) |
| Voting system | Weighted sum of stance × confidence |
| Consensus threshold | 0.65 (clear supermajority) |
| Time to verdict | ~5 seconds |
| Evidence format | Verifiable citations per agent |
| On-chain settlement | TRON Shasta testnet (USDD) |
| Failure mode | Below-threshold → Dispute Mode |
| Transparency | Full audit trail (IPFS + UI) |
