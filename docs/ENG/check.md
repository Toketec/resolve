# RESOLVE — Master Acceptance Plan & Test Checklist

> **Version**: 1.0 · **Anchor**: 2026-06-28 · **Purpose**: One-stop verification for all 6 specs + bonus features, before every submission
> **AI Self-Check Rule**: Only `pnpm typecheck` + `pnpm build` + simple curl — ≤ 60 seconds
> **Manual Check Rule**: Clear step-by-step instructions; just follow to verify

---

## Quick Overview

| Phase | Deliverable | AI Check | Manual Check | Ref Spec |
|:-----:|-------------|:--------:|:------------:|:--------:|
| 1 | API skeleton + data layer | ✓ typecheck | ✓ browser/curl verify | [spec/1/check.md](../spec/1_dev_finish_core_api/check.md) |
| 2 | TronLink wallet connect | ✓ typecheck | ✓ browser test | [spec/2/check.md](../spec/2_dev_finish_wallet/check.md) |
| 3 | AI Oracle reasoning | ✓ typecheck | ✓ real API call | [spec/3/check.md](../spec/3_dev_finish_ai_oracle/check.md) |
| 4 | Contract + on-chain logic | ✓ typecheck | ✓ on-chain verify | [spec/4/check.md](../spec/4_dev_finish_contract/check.md) |
| 5 | Walking Skeleton integration | ✓ typecheck | ✓ browser end-to-end | [spec/5/check.md](../spec/5_dev_finish_integration/check.md) |
| 6 | Demo polish (UX/animation) | ✓ typecheck | ✓ browser Demo simulate | [spec/6/check.md](../spec/6_dev_finish_demo_ux/check.md) |
| **E1** | 🆕 **$HTX Economy Display** | ✓ typecheck | ✓ check Buyback + Agent incentive UI | C-20 |
| **E2** | 🆕 **More HTX API** | ✓ typecheck | ✓ check orderbook + K-line chart | C-21 |
| **E3** | 🆕 **B.AI Hash Badge** | ✓ typecheck | ✓ check "Powered by B.AI" | C-22 |

> **Each spec has its own detailed check.md** — expand from the table above for full step-by-step verification. This file is the **master orchestration layer** that coordinates all specs and runs the Hero Market finale.

---

## 🔧 AI Self-Check (Universal — Run Before Every Submission)

```bash
# === 1. Type check (10s) ===
pnpm typecheck

# === 2. Build verify (30s) ===
pnpm build

# === 3. Dev server reachable (if running) ===
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/markets
```

**If any fails → DO NOT COMMIT. Fix first.**

---

## 🧪 Manual Verification (Expand per spec)

### ✅ Spec 1 — Core API Routes & Data Layer

**Prerequisite**: `pnpm dev` running locally, no terminal errors.

**Detailed steps**: see [spec/1/check.md](../spec/1_dev_finish_core_api/check.md)

**Summary**:
1. `curl http://localhost:3000/api/markets` → JSON array, 6+ markets
2. `curl http://localhost:3000/api/markets/btc-150k-2026` → single market with slug match
3. `curl http://localhost:3000/api/markets/btc-150k-2026/resolve` → AIConsensus with votes
4. `curl http://localhost:3000/api/agents` → 6 agents (all active, no standby)
5. `curl -X POST http://localhost:3000/api/buy ...` → Position with txHash
6. `curl http://localhost:3000/api/price/BTC` → price data, re-call for non-static check

---

### ✅ Spec 2 — TronLink Wallet Connection

**Prerequisite**: Chrome with TronLink extension, switched to Shasta testnet.

**Detailed steps**: see [spec/2/check.md](../spec/2_dev_finish_wallet/check.md)

**Summary**:
1. Open incognito → `localhost:3000` → "Install TronLink →"
2. After install → "Connect Wallet" button
3. Click → TronLink popup → confirm → address `T...xxx` + green dot + "Shasta"
4. Switch account in TronLink → address auto-updates
5. Disconnect → back to "Connect Wallet"
6. Refresh page → still connected (session persistence)

---

### ✅ Spec 3 — AI Oracle Reasoning Pipeline

**Prerequisite**: `.env` has `ANTHROPIC_API_KEY`.

**Detailed steps**: see [spec/3/check.md](../spec/3_dev_finish_ai_oracle/check.md)

**Summary**:
1. Run AI oracle script → returns AIConsensus with 3 votes
2. Each vote: agentId/outcome/confidence/evidence[].{source,url,snippet}
3. Consensus: status="consensus", confidence ≥ 0.65
4. Votes show distinct roles (BULL-1 YES-biased, BEAR-1 NO/neutral, NEUT-1 data-driven)
5. No API key → mock fallback, no crash
6. Same params, 2 calls → consistent results
7. Evidence includes HTX price data

---

### ✅ Spec 4 — Settlement Contract & B.AI Integration

**Prerequisite**: Shasta testnet with USDD test tokens, contract deployed.

**Detailed steps**: see [spec/4/check.md](../spec/4_dev_finish_contract/check.md)

**Summary**:
1. Contract visible on Shasta explorer with tx history
2. Contract address matches `lib/constants.ts`
3. `buyShares()` via TronLink → success → txHash
4. Testnet browser shows buy tx → success, balance increased
5. Airbag ON → settle → `{ txHash, simulated: true }`, balance unchanged
6. Airbag OFF → settle → winner receives USDD
7. 🆕 B.AI 8004 identity queryable on B.AI platform
8. 🆕 x402 payment triggered on resolve() → visible tx hash
9. No plaintext private keys/seed phrases in codebase

---

### ✅ Spec 5 — Walking Skeleton Frontend ⇄ API

**Prerequisite**: spec 1–4 complete, API returns real data.

**Detailed steps**: see [spec/5/check.md](../spec/5_dev_finish_integration/check.md)

**Summary (seam verification)**:
1. Homepage: market list from API (no mock import) — **seam mock→API**
2. Market detail: loads from `GET /api/markets/[slug]` — **seam slug→data**
3. Connect Wallet → calls tronLink.connect() — **seam UI→wallet**
4. Buy YES → `POST /api/buy` → TronLink sign → Position — **seam buy→chain**
5. Resolve → `GET /api/markets/[slug]/resolve` → votes in ConsensusMeter — **seam resolve→AI**
6. Settle → `POST /api/settle` → txHash — **seam settle→contract**
7. `/agents` → `GET /api/agents` → 6 agents (all active)
8. 🆕 Agent detail shows 8004 ID + Tronscan link
9. 🆕 x402 tx hash below ConsensusMeter

---

### ✅ Spec 6 — Demo Controls & UX Polish

**Prerequisite**: spec 5 complete, full Walking Skeleton operational.

**Detailed steps**: see [spec/6/check.md](../spec/6_dev_finish_demo_ux/check.md)

**Summary**:
1. `/markets/...?dev=1` → Force Resolve button visible (hidden without param)
2. Click Force Resolve → status `resolving`
3. Votes appear 1-by-1 (~1.5s interval) with fade-in + slide-up animation
4. ConsensusMeter progress bar grows with each vote
5. After all 3 votes → status "consensus" + ✓ mark
6. TradePanel shows "USDD" (not USDC) — global USDC→USDD replacement
7. Network offline → friendly error + Retry button, no crash
8. Loading → "Processing..." + disabled button
9. 🆕 Agent 8004 card with Tronscan link
10. 🆕 x402 tx hash in ConsensusMeter area
11. 🆕 **$HTX Buyback** counter (C-20)
12. 🆕 **Agent $HTX incentive** display (C-20)
13. 🆕 **HTX orderbook depth** chart (C-21)
14. 🆕 **HTX K-line** chart (C-21)
15. 🆕 **B.AI hash badge** on Agent cards (C-22)

---

## 🎬 Hero Market Finale — Full Demo Walkthrough

> Run this one-shot before finals. After every change, run at least one full end-to-end cycle.

| # | Step | Action | Pass Criteria | Time |
|:-:|------|--------|--------------|:---:|
| H1 | Wallet connect | Open page → Connect TronLink | Address `T...xxx` + green dot + Shasta | 5s |
| H2 | Enter market | Click Hero Market card | Detail page loads, TradePanel visible | 3s |
| H3 | Buy | Select YES → amount → Buy | TronLink sign → position shown | 10s |
| H4 | Trigger resolve | Secret tap / `?dev=1` Force | status → resolving | 1s |
| H5 | AI deliberation | Wait for votes 1-by-1 | 3 votes × 1.5s = 4.5s | 5s |
| H6 | Consensus reached | Observe ConsensusMeter | ≥0.65 ✓ | — |
| H7 | Settlement | Click Settle | txHash displayed | 5s |
| H8 | Payout check | Wallet balance change | USDD balance increased | — |
| H9 🆕 | B.AI showcase | Agent 8004 ID visible | Link to Tronscan works | — |
| H10 🆕 | x402 txHash visible | Below ConsensusMeter | Link to on-chain explorer | — |
| **H11** 🆕 | **$HTX Buyback** | TradePanel bottom shows accumulation | Counter visible + non-zero | — |
| **H12** 🆕 | **HTX K-line + depth** | Market detail page charts | Charts render with real data | — |
| **H13** 🆕 | **B.AI hash badge** | Agent cards | "Powered by B.AI" badge visible | — |

**Total Demo Duration**: ~30 seconds (including 4.5s AI deliberation gap)

---

## 📋 Final Submission Checklist

- [ ] GitHub README complete (introduction, team, demo link, architecture diagram)
- [ ] Demo video 45–60s recorded (Screenflow screen recording)
- [ ] Pitch deck 10+ pages (problem→solution→tech→business→team→roadmap)
- [ ] Publicly accessible (Vercel deploy: `resolve-prediction.vercel.app`)
- [ ] Submission form fully filled in
- [ ] **Ecosystem resource usage declared in submission materials — HTX API, $HTX economy model, B.AI hash power** ⚠️ Critical
- [ ] At least 3 judge Q&A prepped
- [ ] Hero Market end-to-end run ≥ 5 times
- [ ] 🆕 $HTX Fee Pool / Buyback counter visible in UI
- [ ] 🆕 HTX orderbook + K-line charts visible on market detail page
- [ ] 🆕 Agent cards show "Powered by B.AI" badge

---

## ⚡ AI Self-Check Quick Reference (Development Phase, Before Every Commit)

```bash
# 30-second checklist
pnpm typecheck  || exit 1
pnpm build      || exit 1
echo "AI self-check passed ✓"
```

**That's it.** Fancy test frameworks are for production projects — for a hackathon, the only AI self-check needed is "doesn't fail to typecheck, doesn't fail to build".
