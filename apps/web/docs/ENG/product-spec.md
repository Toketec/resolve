# Product Spec — RESOLVE (Hackathon Build)

Status: **locked**. Derived from planning session Q1–Q12. Changing anything here requires re-opening the relevant lock.

## 1. Goal (Q1)

**Win the HTX Genesis Hackathon.** Optimize for the 100-point rubric and Demo Day, not for a production launch. Decision filter for every choice: *does it score points or does it appear in the demo? If neither — fake it or cut it.*

Build a real launchable product *after* winning, using the prize / B.AI compute / incubation.

### Scoring rubric (what we optimize for)

| Dimension | Weight | Who covers it |
|-----------|:------:|---------------|
| Technical Innovation | 30 | Dev B (real AI resolution) |
| Product Completeness | 25 | Dev C + Dev A |
| Commercial Potential | 20 | Dev B (pitch narrative) |
| HTX Ecosystem Fit | 15 | Dev A (TRON payout, 8004/x402) + Dev C (HTX feed) |
| Presentation | 10 | Dev B (pitch) + Dev C (demo driver) |

Genesis Track (AI + Web3 combined) earns bonus points; the **Best AI+Web3 Fusion** special award is $1,500. RESOLVE is a textbook Genesis entry.

## 2. The hero shot (Q2) — the single thing that must be flawless

One continuous, ~45-second shot:

1. Connect **TronLink** wallet.
2. Make **one live buy** of YES (or NO) with testnet stablecoin.
3. Market **expires** (triggered on demand — see [G5](./open-questions.md)).
4. AI agents **reason** over curated evidence (real Claude calls — see [G8](./open-questions.md)).
5. Votes **stream in**, **consensus** crosses the threshold.
6. Market **auto-settles**; a **real on-chain testnet payout** lands in the connected wallet.
7. Tagline: our agent is **8004-registered** and was **x402-paid** on-chain.

Everything else on screen is supporting cast: real enough to set up the hero, not the star.

## 3. How real is each piece

| Piece | Demo reality | Lock |
|-------|--------------|:----:|
| AI reasoning | **Real** Claude calls, **curated** evidence set, determinism guard | Q3 |
| Payout | **Real** on-chain, **TRON testnet**, pre-funded contract | Q4 |
| Trading | **One live buy** (deposit + buy one side). No sell, no order book. Rest pre-seeded. | Q5 |
| B.AI | **Thin real**: one 8004 identity + one x402 payment. Reasoning stays Claude-direct. | Q6 |
| Airbag | One-keystroke **simulated payout** fallback if testnet is flaky on stage | Q4 |

## 4. Scope

### MUST be real (the hero path)
- TronLink connect → one testnet buy → expiry → real reasoning → consensus → testnet payout.
- One curated hero market authored end-to-end.
- One 8004 agent identity + one x402 payment.

### FAKE / pre-seed (supporting cast)
- All other markets, volume, liquidity, trader counts — pre-seeded.
- Escrow / pool solvency accounting — pre-funded contract, fixed payout.
- Price discovery — static price, buying doesn't move it (see [G1](./open-questions.md)).
- Agent "online" status, uptime, accuracy stats — display only.

### DROP (not in this build)
- Selling positions, order book, market-maker logic.
- LP yield (JustLend / SunSwap / stUSDT) — phase-2 slide only.
- $HTX dispute voting — phase-2 slide only.
- Full cross-chain, full tokenomics.

## 5. Timeline

Today's anchor: **June 14, 2026**. Only one external gate exists.

| Milestone | Date | Required? |
|-----------|------|:---------:|
| **Submission deadline** | **Jul 5** | **YES — the only hard gate** |
| Preliminary screening | Jul 6–7 | judges only |
| Online Demo Day | Jul 11–12 | live pitch |
| Offline finals window | Jul 17–20 (one day) | if shortlisted |

### Recommended internal discipline (not external deadlines)
- **Walking skeleton** running end-to-end (all slices faked, wired through real contracts + real UI) — as early as possible. This retires the biggest risk: three slices that pass alone but never run together.
- **Hard freeze** a few days before Jul 5 → leaves slack to rehearse and record a **backup video** for the airbag.
- After submission, the Jul 5 → Jul 11 window is free rehearsal time before the live pitch.

These dates are the team's call. Only Jul 5 is fixed.
