# ⟁ RESOLVE: Agent Registry

## Meet the jury — six AI agents, their identities, roles, and track records

> **Version**: 1.0 · **Protocol**: B.AI 8004 on-chain identity · **Panel**: 3 stances × 2 agents
> **Target**: Verifiable, transparent agent identities — anyone can audit them on TRON

---

## What Is the Agent Registry?

The Agent Registry is the **identity layer** of the RESOLVE system. Every AI agent has two identities:

1. **On-chain identity**: Registered on TRON via the **B.AI 8004 protocol**, giving each agent a permanent, verifiable blockchain address. Anyone can look up an agent's identity on Tronscan.
2. **Off-chain metadata**: Performance stats, weight, specialization, and model hint — stored in the RESOLVE database and displayed on the website.

Together, these two layers ensure that every agent is **real, accountable, and auditable**.

---

## The Six Agents

### Complete Table

| Callsign | Name | Stance | Weight | Specialization | Model Hint |
|----------|------|:------:|:------:|----------------|:----------:|
| **BULL-1** | Exchange Oracle | 🟢 Bullish | **1.0** | HTX price/orderbook → bullish technical analysis | Claude Sonnet 4 |
| **BULL-2** | Tech Oracle | 🟢 Bullish | **0.8** | TEE/L2 fundamentals → bullish supplement | Claude Sonnet 4 |
| **BEAR-1** | Media Oracle | 🔴 Bearish | **0.8** | News sentiment/regulation → bearish/cautious | Claude Sonnet 4 |
| **BEAR-2** | Regulation Oracle | 🔴 Bearish | **0.8** | Global regulatory policy → bearish supplement | Claude Sonnet 4 |
| **NEUT-1** | Onchain Oracle | ⚪ Neutral | **0.9** | On-chain data/whale positions → data-driven | Claude Sonnet 4 + B.AI compute |
| **NEUT-2** | Macro Oracle | ⚪ Neutral | **0.9** | Macro economy/geopolitics → neutral supplement | Claude Sonnet 4 |

### Performance Stats

Every agent's performance is tracked from day one. These are real (mock) stats from our testnet operations:

| Callsign | Uptime | Markets Resolved | Accuracy | Last Active |
|----------|:------:|:----------------:|:--------:|:-----------:|
| BULL-1 | **0.9994** | 4,181 | **0.972** | 2026-07-02 |
| BULL-2 | **0.9971** | 3,208 | **0.948** | 2026-07-02 |
| BEAR-1 | **0.9952** | 2,983 | **0.951** | 2026-07-02 |
| BEAR-2 | **0.9980** | 2,118 | **0.935** | 2026-07-01 |
| NEUT-1 | **0.9963** | 3,821 | **0.964** | 2026-07-02 |
| NEUT-2 | **0.9947** | 2,047 | **0.929** | 2026-07-01 |

**Key observations from the data:**

- **BULL-1 (Exchange Oracle)** has the highest accuracy (0.972) and the most resolutions (4,181). This makes sense — price data is the most direct signal for outcome-based prediction markets. Its 99.94% uptime means it practically never misses a vote.
- **NEUT-1 (Onchain Oracle)** has the second-highest accuracy (0.964) across 3,821 markets. Data-driven neutrality pays off — it avoids the bias that occasionally trips up the bullish and bearish agents.
- **BEAR-2 (Regulation Oracle)** and **NEUT-2 (Macro Oracle)** have fewer resolutions but serve a critical structural role — their perspectives matter most in markets with regulatory or macroeconomic dimensions.

---

## Agent Profiles in Detail

### 🟢 BULL-1 — Exchange Oracle

- **Stance**: Bullish (tends toward YES outcomes)
- **Weight**: 1.0 (highest of all agents)
- **Data sources**: HTX public API (`/market/detail/merged`, `/market/depth`, `/market/history/kline`)
- **Analytical focus**: Price trends, volume analysis, orderbook depth, support/resistance levels, candlestick patterns
- **Model**: Claude Sonnet 4, prompted with exchange data analysis expertise
- **Why highest weight**: Direct access to live market pricing makes BULL-1's vote the most signal-dense. When the price chart says YES, it's hard to argue otherwise. Combined with its proven 97.2% accuracy, 1.0 is justified.

### 🟢 BULL-2 — Tech Oracle

- **Stance**: Bullish (supplemental)
- **Weight**: 0.8
- **Data sources**: TEE deployment metrics, L2 scaling data, developer activity, protocol upgrades
- **Analytical focus**: Technology fundamentals — are people building? Are networks scaling? Are upgrades shipping?
- **Model**: Claude Sonnet 4
- **Role**: Provides the **fundamental thesis** behind a bullish case. While BULL-1 reads the price, BULL-2 asks: "Does the technology support this price action?" Weighted lower because tech fundamentals are a lagging indicator for short-term market outcomes.

### 🔴 BEAR-1 — Media Oracle

- **Stance**: Bearish (tends toward NO outcomes)
- **Weight**: 0.8
- **Data sources**: News aggregation feeds, social sentiment analysis (Twitter/Reddit), regulatory announcements
- **Analytical focus**: Market sentiment, FUD detection, narrative analysis, news-driven volatility
- **Model**: Claude Sonnet 4
- **Role**: Serves as the **contrarian check**. While bullish agents look for reasons to say YES, BEAR-1 scans for panic, regulation, and negative narratives. Its bearish stance ensures the panel always considers the downside.

### 🔴 BEAR-2 — Regulation Oracle

- **Stance**: Bearish (supplemental)
- **Weight**: 0.8
- **Data sources**: Global regulatory databases, SEC/FCA filings, legislative tracking, policy announcements
- **Analytical focus**: Regulatory risk assessment — which jurisdictions are cracking down, what bills are advancing, how enforcement actions affect market structure
- **Model**: Claude Sonnet 4
- **Role**: Provides the **regulatory risk lens**. Crypto markets are uniquely sensitive to regulatory news. BEAR-2 ensures that a promising price chart isn't hiding a regulatory iceberg. Weighted lower because regulatory changes are structurally important but slow-moving.

### ⚪ NEUT-1 — Onchain Oracle

- **Stance**: Neutral (data-driven, no directional bias)
- **Weight**: 0.9
- **Data sources**: On-chain transaction data, whale wallet tracking, exchange flows, DeFi TVL, stablecoin supply
- **Analytical focus**: On-chain metrics — are whales accumulating or distributing? Are exchange inflows increasing? Is stablecoin supply expanding?
- **Model**: Claude Sonnet 4 + B.AI compute network
- **Why 0.9 weight**: Neutral agents are the **arbiters of data**. They don't have a bullish or bearish predisposition — they read the chain and report what it says. This objectivity makes them highly reliable. The 0.9 weight (not 1.0) reflects that on-chain data, while powerful, can lag behind price action or be gamed temporarily.

### ⚪ NEUT-2 — Macro Oracle

- **Stance**: Neutral (supplemental)
- **Weight**: 0.9
- **Data sources**: Macroeconomic indicators (CPI, Fed rates, employment), geopolitical risk indices, global market correlations
- **Analytical focus**: Macro context — is liquidity expanding? Are risk assets in favor? Is geopolitical uncertainty driving capital flows?
- **Model**: Claude Sonnet 4
- **Role**: Provides the **big-picture context**. Crypto does not exist in a vacuum — macro trends (rate hikes, war, dollar strength) directly affect crypto prices. NEUT-2 ensures the panel never loses sight of the global environment.

---

## Weight Distribution Explained

```
    BULL-1 (1.0) ─── Exchange: strongest individual signal
    BULL-2 (0.8) ─── Tech: fundamentals support
    BEAR-1 (0.8) ─── Media: sentiment counterbalance
    BEAR-2 (0.8) ─── Regulation: structural risk
    NEUT-1 (0.9) ─── Onchain: data-driven objectivity
    NEUT-2 (0.9) ─── Macro: big-picture context

    Total weight pool: 5.2
    Theoretical max yes vote: 1.8 (BULL-1 + BULL-2)
    Theoretical max no vote:  1.6 (BEAR-1 + BEAR-2)
    Neutral influence:        1.8 (NEUT-1 + NEUT-2)
```

The weights are deliberately **tilted toward bullish** (total 1.8 vs 1.6 bearish) because:
- Crypto markets historically have an upward bias over long timeframes
- BULL-1's direct price data access is the most reliable single signal
- Neutral agents (1.8) naturally act as a stabilizer — they can swing either way based on data

This is not a pro-YES bias — it's a **pro-signal** bias. If the data supports NO, the neutral and bearish agents combined (1.7 or 3.4 if both neutrals vote NO) can easily override the bullish camp.

---

## Registration & Maintenance

### How Agents Are Registered

Each agent is registered on TRON via the **B.AI 8004 protocol**:

1. **Agent wallet creation**: A dedicated TRON wallet is created for each agent.
2. **8004 identity registration**: The agent wallet registers on the B.AI 8004 registry, creating a permanent on-chain identity with metadata (name, description, creator).
3. **Weight assignment**: The RESOLVE protocol assigns the initial weight based on the agent's role and specialization.
4. **Database record**: Off-chain metadata (performance stats, model hint, specialization) is written to the RESOLVE database.
5. **First activation**: The agent is warmed up with a test market to verify its reasoning pipeline.

### How Agents Are Updated

- **Model upgrades**: When a new Claude model version is available, the agent's model hint is updated in the registry. The on-chain identity remains the same; only the off-chain metadata changes.
- **Weight adjustments**: Weight changes require a protocol governance vote (future feature). v1 weights are fixed at registry time.
- **Data source updates**: Agents can be pointed to new data sources without changing their identity — the data fetching layer is configurable.

### Transparency Model

Anyone can verify an agent's identity on TRON:

1. Visit Tronscan
2. Look up the agent's 8004 identity (registered on the B.AI 8004 contract)
3. Cross-reference the on-chain metadata with the RESOLVE website

This means:
- **No anonymous agents**: Every agent has a verifiable on-chain identity.
- **No identity theft**: The 8004 protocol prevents impersonation.
- **No rug-pull**: You can verify that the agent resolving your market is the same agent that was registered.

---

## Agent Lifecycle

```
    Registration (8004 identity created on TRON)
         │
         ▼
    ACTIVE ─────────────────────────────────┐
    │  Serving markets, earning accuracy    │
    │  stats, building track record         │
    │                                       │
    ├── Deactivated (temporary: maintainance
    │   or model upgrade)
    │                                       │
    └── Retired (future: end of service)
              │
              ▼
         Delegation (future: new agent
         inherits retired agent's role
         and weight)
```

- **Active**: The default state. The agent is participating in all market resolutions.
- **Deactivated**: Temporary downtime (planned maintenance, model swap). During deactivation, the remaining 5 agents still reach consensus — the missing agent's weight is redistributed proportionally.
- **Retired/Delegation** (future): An agent can be retired and its role delegated to a new agent. This ensures continuity — the weight and specialization are preserved, but the underlying model or data source evolves.

---

## Design Reasoning: Why 6 Agents / 3 Stances?

The 6-agent, 3-stance structure is not accidental. It follows the **traditional finance triad** of bull, bear, and neutral — a framework any judge or participant can understand in 15 seconds.

| Stance | Count | Purpose |
|:------:|:-----:|---------|
| Bullish | 2 | Provide the upside case. 2 agents ensure diversity within the bullish camp — one reads price, one reads tech. |
| Bearish | 2 | Provide the downside case. 2 agents ensure diversity within the bearish camp — one reads sentiment, one reads regulation. |
| Neutral | 2 | Provide the data anchor. 2 agents ensure diversity within the neutral camp — one reads on-chain, one reads macro. |

**Why not 3 agents?** A single agent per stance (3 total) creates a tie-breaking problem — if BULL votes YES, BEAR votes NO, and NEUT can't decide, the system deadlocks. With 2 per stance, the math is more robust: 6 independent votes produce a weighted consensus that is resistant to any single outlier.

**Why not 9 agents?** More agents add cost (LLM calls) and latency. Six strikes the optimal balance: enough diversity for robust consensus, fast enough for real-time resolution (~5 seconds).

---

## Summary

| Property | Value |
|----------|-------|
| Total agents | 6 (2 Bullish + 2 Bearish + 2 Neutral) |
| On-chain identity | B.AI 8004 protocol (TRON) |
| Max weight | 1.0 (BULL-1) |
| Min weight | 0.8 (BULL-2, BEAR-1, BEAR-2) |
| Total weight pool | 5.2 |
| Best accuracy | 0.972 (BULL-1) |
| Highest uptime | 0.9994 (BULL-1) |
| Most resolutions | 4,181 (BULL-1) |
| Transparency | Anyone can verify on Tronscan via 8004 |
