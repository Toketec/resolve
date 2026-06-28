# Open Questions — G1–G8

Status: **unresolved mechanics.** The grill (Q1–Q12) locked *strategy* — who builds what. These are the *mechanics* one layer down, surfaced from reading the actual code ([market detail page](../app/markets/[slug]/page.tsx), [trade-panel.tsx](../components/trade-panel.tsx), [lib/mock/markets.ts](../lib/mock/markets.ts), [lib/types.ts](../lib/types.ts)). Each one blocks a dev or breaks the hero shot if left undecided.

**Two of these (G6, G8) need a human decision because they size Dev B's work.** The other six have safe defaults; override if you disagree.

---

## G1 — Price model (default: accept)

**Code:** [trade-panel.tsx:14-16](../components/trade-panel.tsx#L14-L16) — `shares = amount / yesPrice`, with a **static** price. Buying does not move the price.

**Question:** Real price discovery (AMM / bonding curve / order book), or static?

**Default:** **Static.** Resolution is the hero, not price discovery. Lock the TradePanel math as-is. No bonding curve.

---

## G2 — Who funds the payout (default: accept)

**Code:** [trade-panel.tsx:17](../components/trade-panel.tsx#L17) — `potential = shares * $1`. The winner is paid $1/share. From where? A real market funds this from the losing side's pool, which needs escrow + solvency accounting.

**Question:** Real escrow/pool accounting, or pre-funded?

**Default:** **Pre-funded contract** (matches Q4). A fixed transfer to the winner's wallet. No real pool solvency math — fake the pool.

---

## G3 — Stablecoin mismatch (default: accept)

**Code:** [trade-panel.tsx:59](../components/trade-panel.tsx#L59) — UI says **USDC**, plus a "0.10% fee" line. The plan (Q4) uses **USDD** on TRON.

**Question:** Which stablecoin?

**Default:** **USDD.** One-line UI change. Trivial, but the code contradicts the plan today, so it's logged.

---

## G4 — The shot can't animate yet (default: accept)

**Code:** The market detail page is a **server component** — it reads `marketBySlug` once and renders. [ConsensusMeter](../components/consensus-meter.tsx) is static. Nothing makes votes "stream in" as the hero shot requires.

**Question:** How do votes appear to deliberate live? Websocket / SSE / client animation?

**Default:** **Client-side scripted reveal** (Dev C). Fetch the real consensus once, then reveal the votes with staged timing on the client. No websocket, no SSE.

---

## G5 — No expiry trigger (default: accept)

**Code:** Expiry is just a timestamp; [page.tsx:151](../app/markets/[slug]/page.tsx#L151) says "Oracles begin deliberation when the market expires." You can't stand on stage and wait for a real clock.

**Question:** How does the demo-er trigger expiry → resolving → resolved on command?

**Default:** **Hidden "Resolve now" control** (Dev C). The demo-er fires the transition on command — flips `status`, re-renders the consensus flow.

---

## G6 — Agent count conflict ⚠️ NEEDS DECISION

**Code conflict:**
- `buildConsensus()` uses **4** agents (`MOCK_AGENTS.slice(0, 4)`).
- [Agents page](../app/agents/page.tsx) headline says **"Six oracles."**
- Vote tiles render **"/4"**.
- [RESOLVE.md](../RESOLVE.md) describes **3** (Agent A / B / C).

**Why it matters:** this sizes Dev B's real work — every agent is a real Claude call + a curated evidence slice.

**Recommendation:** **3 real reasoning agents.** Matches the spec, cheaper (3 LLM calls), cleaner consensus. Display 6 as "online" on the agents page; only 3 actually deliberate on the hero market.

**Decision:** ✅ **Confirmed — 3 real ACTIVE + 3 STANDBY (6 total displayed)**

| Tier | Count | Details |
|:----|:-----:|---------|
| **ACTIVE** (real Claude reasoning) | 3 | BULL-1(Exchange) / BEAR-1(Media) / NEUT-1(Onchain) — called in parallel per resolve |
| **STANDBY** (UI display only) | 3 | BULL-2 / BEAR-2 / NEUT-2 — shown in Agent Pool with STANDBY badge, no real inference |

**Design advantages (for Q&A)**:
1. **Honest** — UI clearly distinguishes ACTIVE vs STANDBY, judges won't feel misled
2. **Best bang for the buck** — 3 real = 6 real in scoring (AI/Web3 score is about *authenticity of reasoning*, not agent count), but half the dev time and half the demo time
3. **Demo pacing** — 3 parallel Claude calls ≈ 8 seconds, fits in a 45s one-shot demo
4. **Scalable architecture** — Agent Pool scales from 6 → N; "dynamically activate the 3 most relevant agents from the pool" sounds like architecture, not a shortcut

---

## G7 — Wallet not linked to payout (default: accept)

**Code:** [lib/types.ts:92](../lib/types.ts#L92) — `Position` has `userId`, **not** `walletAddress`. Settlement (Dev A) needs to pay the *connected* TronLink wallet.

**Question:** How does a position know which wallet to pay?

**Default:** **Add `walletAddress` to the demo position.** The connected TronLink wallet is the payout recipient. This is the concrete A ↔ C seam (the Q7 seam made real).

---

## G8 — No hero market chosen ⚠️ NEEDS DECISION

**Code:** `resolutionCriteria` is free text per market. Nobody owns: the hero question, its curated evidence, the intended outcome.

**Why it matters:** the hero shot needs one market authored end-to-end with a determinism guard (Q3). This is content, and it's currently orphaned.

**Recommendation:** **Dev B authors ONE hero market end-to-end** as part of the determinism guard — the question, the curated evidence set, the expected agent votes, the expected consensus. Pick it now, or assign B to draft 3 candidates for the team to choose.

**Decision:** _______________

---

## Summary

| Gap | Topic | Status | Owner |
|-----|-------|--------|-------|
| G1 | Static price | default → accept | C |
| G2 | Pre-funded payout | default → accept | A |
| G3 | USDD not USDC | default → accept | C |
| G4 | Scripted vote reveal | default → accept | C |
| G5 | On-demand expiry trigger | default → accept | C |
| **G6** | **Agent count (decided: 3 real + 3 STANDBY)** | **✅ decided** | **B** |
| G7 | `walletAddress` on position | default → accept | A + C |
| **G8** | **Hero market (rec: B authors)** | **needs decision** | **B** |

The grill's biggest risk (Q7 — slices pass alone, never run together) lives exactly in **G4 + G5 + G7** — the render / trigger / identity seam. The walking skeleton is what forces those three into the open early.
