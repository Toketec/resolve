# Workload Split — 3 Devs

Status: **locked**. This is the *current* split, re-shaped from the original — notably, chain-adjacent work moved off Dev A where it isn't wallet/value work, and the pitch + integration seam got explicit owners.

The split is **three vertical slices**. Each dev owns one end-to-end, so they build in parallel with minimal merge conflict. The seams between slices are owned by Dev C.

```
[ Dev A: Chain / Money ]   [ Dev B: AI Oracle + Pitch ]   [ Dev C: App / Data / Seam ]
  TronLink connect           real Claude reasoning           Next.js pages (exist)
  one-side buy (signing)     curated evidence harness        API routes + minimal DB
  settlement contract        consensus math                  replace lib/mock
  testnet payout + airbag     determinism guard              HTX market-data feed (read-only)
  8004 identity + x402        → then owns the pitch          buy UI + the live demo shot
  $HTX Fee Pool UI (C-20)                                    integration + deploy
```

## Dev A — Chain / Money ("the money")

Owns **every line that touches a wallet or moves value.** Riskiest external dependencies → starts day 1.

- **TronLink** connect — kill the dead "Connect Wallet" button; wire the connected address.
- **Buy path (on-chain side only)** — the signing / transfer for one-side buys. The *UI and API route* are Dev C's; A implements only the lines that sign or move value.
- **Settlement contract** — pre-funded, pays a fixed amount to the winner's wallet on consensus. **Build this first** — it's the hero's climax and the walking skeleton needs it to swap real.
- **Testnet payout + airbag** — real TRC-20 transfer on TRON testnet; one-keystroke simulated-confirmation fallback.
- **8004 identity + x402 payment** — A owns the chain plumbing (`@bankofai/agent-wallet`, `@bankofai/x402`). Dev B *specifies* (which agent IDs, where the payment fires); A *implements*.
- **$HTX Fee Pool UI** — pure frontend display (C-20) showing the 0.1% fee → $HTX Buyback counter on TradePanel, $HTX Earned on Agent cards, and market stake info. Scores Product Completeness.

Scores: HTX Ecosystem Fit (15), Product Completeness (25).
Sequencing: **payout contract → 8004/x402 → buy signing.** Airbag present from the start.

## Dev B — AI Oracle ("the wow") + Pitch

Owns the **hero's correctness** — the novel part that is RESOLVE's entire pitch. Narrow surface, highest stakes → stabilizes early, then pivots to the pitch.

- **Real agent resolution** — replace the hardcoded `buildConsensus()` in [packages/ai/src/index.ts](../packages/ai/src/index.ts) (currently returns a fixed `0.62` / `0.92`). Feed market question + criteria → real Claude calls → each agent returns `{ outcome, confidence, evidence }`.
- **Curated evidence harness** — a controlled, pre-fetched evidence set per the hero market. No live scraping (fragile, kills the shot).
- **Consensus math** — the aggregation function, typed against `AgentVote` / `AIConsensus` in [packages/shared/src/index.ts](../packages/shared/src/index.ts).
- **Determinism guard** — the shot must land every time; the hero market is authored and rehearsed so consensus reliably crosses threshold in ~30s.
- **Then the pitch** — once reasoning is frozen, B owns the **30 non-code points**: the deck, the 45-second demo script, the commercial + HTX-ecosystem narrative, and dry-running the judge Q&A. B understands the hero most deeply, so B explains why it's real.

Scores: Technical Innovation (30), Commercial Potential (20), Presentation (10, with C).

## Dev C — App / Data / Seam ("the spine")

Owns the existing Next.js app, the data layer, **and the integration seam** — accountable for the hero shot running end-to-end.

- **Minimal data layer** — only what the demo writes live: the one position (A's trade) and the one consensus result (B). Markets pre-seeded. A full Postgres + Prisma CRUD layer is scope-creep for this demo.
- **API routes** — the contracts A and B plug into (see [api-contracts.md](./api-contracts.md)). Define these day 1.
- **HTX market-data feed** — read-only HTTP, feeds the exchange agent. This is data-layer work, not wallet work → it's C's, not A's.
- **Buy UI + API** — the [apps/web/components/trade-panel.tsx](../apps/web/components/trade-panel.tsx) flow and its route; A supplies only the signing call.
- **The live demo shot** — C drives it: the staged vote reveal, the on-demand expiry trigger, the continuous flow.
- **Integration + deploy** — the walking skeleton, the seam, Vercel (already live).

Scores: Product Completeness (25), Presentation (10).

## The seam — why Dev C owns "it runs"

The hero shot **crosses all three slices**: buy (A) → reasoning (B) → payout (A) → all tied onto the screen in one flow (C). Three perfectly-working slices is *not* a working demo — the demo lives in the seams.

**Discipline: the walking skeleton.** The full hero shot runs end-to-end as early as possible with every slice **faked** (mock wallet, canned votes, mock payout) but wired through the **real API contracts** and **real UI**. Then each dev swaps their mock → real *behind a stable contract*. Integration risk is paid down continuously, not on the last night.

## Contracts that keep the slices parallel (agree day 1)

1. **Resolution** (C ↔ B): `resolve(market) → AIConsensus`. B fills it, C calls it.
2. **Trade / settle** (C ↔ A): `buyShares(...)` + `settle(market, outcome)`. C exposes the API, A implements the chain side.
3. **Price feed** (C → B): C delivers HTX price → B's exchange agent consumes it.

[packages/shared/src/index.ts](../packages/shared/src/index.ts) is the shared truth. Nobody edits types without telling the other two. Full signatures in [api-contracts.md](./api-contracts.md).

## Priority if time runs short

C's minimal data layer + API → A's wallet + testnet buy + payout → B's real consensus (Claude direct; 8004/x402 is the bonus, not the baseline). **Demo > completeness**, always.

---
> **Footnote**: All file paths in this document are Monorepo-relative, with `resolve/` as the root.
