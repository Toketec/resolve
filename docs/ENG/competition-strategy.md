# RESOLVE Competition Strategy — HTX Genesis Hackathon

> **Version**: 1.0 · **Anchor**: 2026-06-27
> **Target**: Advance Top 40 → Top 15 → Fight for Top 3 + Track Award + Special Prize

---

## 1. Competition Landscape

### 1.1 Advancement Pipeline (4-Stage Funnel)

```
Submission (unlimited) ──[Screening]──→ Top 40 ──[Online Demo Day]──→ Top 15 ──[WAIC Shanghai Final]──→ Top 3 + Awards
    Jul 5 deadline         Jul 6-7           Jul 11-12                    Jul 17-18
```

**Key facts:**
- Screening evaluates: project direction, technical feasibility, product completeness, AI/Web3 integration depth, ecosystem fit.
- Online Demo Day: invited judges + HTX DAO community jointly vote for Top 15.
- Final scoring = judge score (80%) + community score (20%); 5 judges score 0–100 on 5 dimensions, remove extremes and average.

### 1.2 Track Strategy

| Track | Fit | Strategy |
|-------|:---:|----------|
| **🔥 Genesis Genesis** | ⭐⭐⭐⭐⭐ | **Confirmed route.** AI×Web3 cross-domain — exactly the "unprecedented cross-domain play" Genesis demands |
| AI Track | ⭐⭐ | Standby (not allocated) |
| Web3 Track | ⭐⭐ | Standby (not allocated) |

**Decision**: ✅ Genesis track. Narrative: **"AI Agent-powered decentralized prediction markets + HTX ecosystem."**

### 1.3 Awards at Stake

| Award | Prize | Strategy |
|-------|:----:|----------|
| 🥇 Champion | $6,000 | Requires top scores across all 5 dimensions |
| 🥈 Runner-up | $3,000 | Strong product completeness + tech innovation |
| 🥉 Third Place | $1,500 | Strong differentiation sufficient |
| 🏆 Track Award | $1,500 | Best in Genesis track |
| 🤖 Best AI+Web3 Fusion | $1,000 | **Our safety net** — real AI reasoning + on-chain settlement demo solidifies this |
| 👥 Community Choice x2 | $500 | Community mobilization strategy |
| 🌟 Most Popular | $200 | Same as above |

---

## 2. Our Competitive Positioning

### 2.1 Why RESOLVE Wins (Pitch Narrative)

```
Problem:  Prediction markets rely on centralized oracles or manual arbitration — slow, manipulable, unscalable
Solution: Multiple AI agents independently reason → curated evidence → consensus algorithm → auto on-chain settlement
Differentiation: Not "AI-wrapped Web3" — AI-native oracle replacement
```

### 2.3 Differentiation Moats

- **Not a Polymarket fork**: We are not a copycat with ChatGPT wrapper. We **replace UMA's human voting with AI multi-agent consensus** as the decentralized arbitration layer for prediction markets.
- **Not a ChatGPT wrapper**: Multi-agent independent reasoning → weighted consensus → on-chain payout, each vote with a verifiable evidence chain.
- **Not demo-only**: Real TRON testnet transactions + real AI reasoning + real settlement.
- **Agent ≠ Trading Advisor**: Our Agents do NOT analyze markets to tell users which side to bet on. **Agents are arbitrators** who replace UMA token holders — after market expiry, they reason, vote, and trigger on-chain payouts. Users decide their own bets.

### 2.4 Complete End-to-End Flow (4-Layer Division)

```
Phase                      User Does                  Agent Does                   System Does              Contract Does
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
① Wallet Connect          Connect TronLink+sign      —                            UI show address           —
② Make Prediction         Pick YES+amount+sign       —                            Write Supabase position   buyShares()
③ AI Resolution (5-6s)    Watch animation            6 Agents parallel(6LLM)     Consensus math+DB write   —
                                                     → 6-vote consensus          +UI animation
④ On-chain Settlement     Owner signs settle         —                            Call contract             settle()→USDD to winner
```

**User operations total**: 3-4 clicks (install wallet, connect, sign buy, owner signs settle)
**Agent operations total**: 6 LLM calls + 1 x402 payment (fully automated, ~5-6 seconds)

**One-sentence positioning**: Not "a prediction market with AI features" — but **an AI-native arbitration layer that replaces UMA human token voters as the decentralized verdict oracle for prediction markets**.

### 2.3 Scoring Strategy Matrix

| Dimension | Target Score (out of 100) | Strategy |
|-----------|:------------------------:|----------|
| **Tech Innovation** | 85–90 | 6-Agent full parallel LLM reasoning + 6-vote weighted consensus + 8004/x402 |
| **Product Completeness** | 80–85 | Full frontend + end-to-end walking skeleton demo |
| **Commercial Potential** | 75–80 | Prediction market × AI Agent economy narrative + clear roadmap |
| **AI/Web3 Integration** | 90–95 | **Real AI calls + on-chain settlement + 8004 identity** — no fakes |
| **Presentation** | 80–85 | 45-second one-take hero shot |

---

## 3. Technical Strategy

### 3.1 Hybrid Data Architecture

**Web2 DB (Supabase) + TRON chain hybrid:**

| Data Type | Store | Rationale |
|-----------|:-----:|-----------|
| Market metadata, positions, consensus logs | **Supabase PostgreSQL** | Fast reads, search, filtering |
| Asset settlement, $HTX staking | **TRON chain** | Trust-minimized, immutable |

**Core principle**: "Web2 speed + Web3 trust — not a compromise for the sake of being on-chain."

### 6 Active Agent Pool (All 6, Full Parallel, 6 Dimensions)

| Tier | Count | Role | Description |
|:----|:-----:|------|-------------|
| ⚡ **BULL-1** (Exchange) | 1 | Bullish analysis | HTX BTC price, volume trends → technical bull bias |
| ⚡ **BULL-2** (Tech) | 1 | Bullish supplement | AI/blockchain tech fundamentals — TEE, L2 scaling |
| ⚡ **BEAR-1** (Media) | 1 | Bearish/cautious | News sentiment, regulatory dynamics → conservative bias |
| ⚡ **BEAR-2** (Regulation) | 1 | Bearish supplement | Global regulatory risk — SEC, EU MiCA |
| ⚡ **NEUT-1** (Onchain) | 1 | Neutral judgment | On-chain data, whale positions → data-driven neutral |
| ⚡ **NEUT-2** (Macro) | 1 | Neutral supplement | Macro economy, interest rates, geopolitics |

**No STANDBY tier anymore.** All 6 Agents reason in parallel after market expiry, each producing `{outcome, confidence, evidence[]}`, then 6-vote weighted consensus. This is full-spectrum verdict — exchange, media, on-chain, tech, regulatory, macro — no dimension missed.

**Total time**: 6 parallel LLM calls ≈ 5-6 seconds (Promise.all)
**Cost**: ~$0.30-0.60/resolve
**Pitch line**: "6 Agents across 6 independent dimensions produce a full-spectrum verdict — not a partial judgment from 3 agents."

**Resolve flow:**
```
→ all 6 receive evidence harness in parallel   (6 LLM calls, ~5s)
→ weighted consensus                            (< 0.5s)
→ UI: votes 1-by-1 reveal animation
```

- Consensus threshold: 0.65
- Total resolve time: ~5-6 seconds (fits in 45s demo)

### 3.3 HTX Ecosystem — 3 Integrations

| Integration | Type | Where Used |
|:-----------|:----:|------------|
| **HTX Public API** (price data) | Read-only HTTP | BULL-1 agent evidence: price, orderbook depth, K-line |
| **B.AI 8004 Protocol** (Agent identity) | TRON on-chain registration | Each AI Agent gets a verified 8004 ID on TRON |
| **B.AI x402 Protocol** (Micropayment) | On-chain payment | Agent pays settlement fee autonomously after resolve() |

**Plus**: B.AI compute credits ($300-500) used for NEUT-1 inference, showing "Powered by B.AI."

### 3.4 Key Tech Decisions

| Decision | Conclusion |
|----------|-----------|
| **Deployment** | Vercel Serverless (zero cost, no ICP filing) |
| **Backend** | Next.js API Routes (no standalone server) |
| **Database** | Supabase PostgreSQL |
| **Blockchain** | TRON Shasta testnet (HTX ecosystem chain) |
| **AI Provider** | Claude API (primary) / DeepSeek via OpenRouter (backup) |
| **Domain** | `resolve-prediction.vercel.app` |

---

## 4. Team Split & Priority Sequencing

### 4.1 Three Vertical Slices

| Dev | Focus | Key Tasks |
|:----|:------|:----------|
| **Dev A** | Chain / Money | TronLink connect, buy signing, settlement contract, testnet payout, 8004/x402, $HTX Fee Pool UI |
| **Dev B** | AI Oracle + Pitch | Real Claude reasoning (3 agents), orchestrator, evidence harness, consensus math, pitch deck, demo script |
| **Dev C** | App / Data / Seam | API routes, Supabase data layer, HTX price feed, buy UI, walking skeleton, live demo, deploy |

### 4.2 Priority Cascade

```
P0 — Walking Skeleton (all mocked, real API contracts)
  → A: buy/payout chain + B: single agent reasoning
  → C: API routes + Supabase schema + UI routes
  → ALL: day 1 parallel start

P1 — Real replacements
  → Real TronLink buy → Real 3-agent Claude consensus → Real testnet payout
  → 8004 registration + x402 payment
  → Vote reveal animation + hidden trigger

P2 — Polish & pitch
  → 45s one-take demo rehearsal
  → Pitch deck + judge Q&A prep
  → Backup video recording
```

### 4.3 Timeline (June 27 → July 5)

```
Jun 27-28  Planning + Walking Skeleton spawn
Jun 29     Key paths: real agent + real contract
Jun 30     Replace mocks: real buy → real inference → real payout
Jul 1-2    Polish: animations, $HTX UI, B.AI integration
Jul 3      12:00 — HARD FREEZE (bug fixes only)
Jul 4-5    Submission + backup video
```

---

## 5. Risk Mitigation & Common Pitfalls

### 5.1 Predicted Failure Modes

| Pitfall | Likelihood | Impact | Mitigation |
|---------|:----------:|:------:|:-----------|
| TRON testnet unstable | 🔴 High | ❌ Kills hero shot | Airbag: simulated payout button + backup video |
| Claude API rate limit | 🟡 Medium | ❌ AI reasoning fails | Deterministic fallback + curated evidence set |
| Team integration gaps | 🟡 Medium | ❌ Slices don't connect | Walking skeleton day 1; seam owned by Dev C |
| Over-engineering | 🟡 Medium | ⚠️ Wasted time | "Mock first, real later" discipline |
| Submission materials incomplete | 🟢 Low | ⚠️ Screening points lost | Prepare by Jul 3 (2 days buffer) |
| Insufficient community voting | 🟢 Low | ⚠️ Losing 20% final score | Twitter + community outreach before final |

### 5.2 Common Pitfalls for Genesis Track Projects

1. **"Blockchain for blockchain's sake"** — using Web3 where a database suffices, then claiming decentralization as the only virtue. Our Hybrid architecture explicitly avoids this.
2. **"ChatGPT wrapper" trap** — one-shot Claude call dressed as "AI integration." Our 6-agent pool + orchestrator + evidence harness is structurally differentiated.
3. **Demo fragility** — live demo that works once but breaks on replay. Walking skeleton + curated evidence + determinism guard ensure the hero shot is repeatable.
4. **Missing HTX ecosystem proof** — not demonstrating actual use of HTX resources. We use 3 (HTX API + 8004 + x402), exceeding the minimum of 1.
5. **Narrative dissonance** — a pitch that claims "AI-native" but shows a static Web3 app. Our demo opens with AI reasoning, not with a wallet connect screen.

### 5.3 What We Fake vs. What Is Real

| Real (Hero Path) | Fake (Static / Pre-seeded) |
|:-----------------|:---------------------------|
| TronLink connection + buy signing | Other 7 markets' volume/participant counts |
| 3-agent real Claude reasoning | Agent avatars, names, descriptions |
| Weighted consensus calculation | Market creation history |
| TRON testnet settlement payout | — |
| HTX real-time price data | — |
| 8004 identity registration | — |
| x402 micropayment trigger | — |

---

## 6. Stage Deliverables

### Screening (by Jul 5)

- Project name + description (100 words)
- GitHub repo with complete README
- Team intro + contact info
- Demo video / link
- Technical brief

### Online Demo Day (Jul 11-12)

- 5-8 min pitch deck (Chinese)
- 45-60s project showcase video
- Live demo script
- Community voting assets (screenshots + tweets)

### WAIC Shanghai Final (Jul 17-18)

- 8-10 min pitch + Q&A prep
- Stable on-site demo
- Core architecture poster
- Team follow-up plan materials

---

> **One-liner summary**: Days 1-5 (Jun 27-Jul 1) focus on "hero shot fully real end-to-end"; days 3-5 (Jul 2-4) focus on "perfect demo + submission no gaps." Our nuke is **AI×Web3 fusion** — this is explicitly called out as a bonus in the official rules, and we must exploit it to the maximum.
