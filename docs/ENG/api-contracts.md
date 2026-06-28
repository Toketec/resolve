# API Contracts — Day 1 Interfaces

Status: **agree before writing real logic.** These are the seams between the three slices. If A, B, and C agree these on day 1, each can build (and fake, then make real) independently without blocking the others.

The shared type vocabulary already exists in [packages/shared/src/index.ts](../packages/shared/src/index.ts) — `Market`, `AIConsensus`, `AgentVote`, `Evidence`, `Position`, `Outcome`. **Do not edit those types without telling the other two devs.**

---

## Contract 1 — Resolution (C ↔ B)

The heart of RESOLVE. Dev B implements; Dev C calls it when a market expires.

```ts
// Dev B owns the body. Dev C owns the call site.
async function resolve(market: Market): Promise<AIConsensus>;
```

- Input: a `Market` (question, `resolutionCriteria`, category).
- Output: a full `AIConsensus` (`status`, `outcome`, `confidence`, `threshold`, `votes[]`, timestamps) — the exact shape [ConsensusMeter](../apps/web/components/consensus-meter.tsx) and the [detail page](../apps/web/app/markets/[slug]/page.tsx) already render.
- Internally B does N real Claude calls (N = 3) over the curated evidence set, then runs the consensus math.
- **Walking-skeleton stub:** return a canned `AIConsensus` after a short delay. C builds the reveal against this; B swaps in real reasoning behind the same signature.

**Consensus math (B's, sketch):**
```
yesWeight = sum(vote.confidence where vote == YES)
noWeight  = sum(vote.confidence where vote == NO)
outcome    = yesWeight >= noWeight ? "YES" : "NO"
confidence = max(yesWeight, noWeight) / (yesWeight + noWeight)
status     = confidence >= threshold ? "consensus" : "dispute"
```

---

## Contract 2 — Trade & Settle (C ↔ A)

Dev C exposes the API route and UI; Dev A implements the on-chain side.

```ts
// Buy one side. C owns the route + UI; A owns the signing/transfer.
async function buyShares(args: {
  marketId: string;
  side: Outcome;          // "YES" | "NO"
  amount: number;         // in USDD
  walletAddress: string;  // connected TronLink wallet
}): Promise<Position>;     // includes walletAddress for payout

// Settle on consensus. A implements the contract call.
async function settle(args: {
  marketId: string;
  outcome: Outcome;
  winnerWallet: string;
}): Promise<{ txHash: string; simulated: boolean }>;
```

- `buyShares` — C handles the form/route ([apps/web/components/trade-panel.tsx](../apps/web/components/trade-panel.tsx)); A handles only the lines that sign or move value.
- `settle` — A's pre-funded contract pays a fixed amount to `winnerWallet`. `simulated: true` when the **airbag** fired (testnet flaky) — the UI shows a confirmation either way.
- **Walking-skeleton stub:** both resolve instantly with a fake `Position` / fake `txHash`. A swaps in real TronLink + TRC-20 behind the same signatures.

---

## Contract 3 — Price Feed (C → B)

```ts
// C fetches read-only HTX market data; B's exchange agent consumes it.
async function getPrice(symbol: string): Promise<{
  symbol: string;
  price: number;
  source: "htx";
  at: string;
}>;
```

- Read-only HTTP. No wallet → this is C's data-layer work, not A's.
- Feeds the exchange-oracle agent's evidence in `resolve()`.
- **Walking-skeleton stub:** return a static price; C swaps in the real HTX endpoint.

---

## Contract 4 — B.AI thin integration (A implements, B specifies)

Not a code seam between slices so much as a spec handoff:

- **B specifies:** which agent identity to register (one), and the point in `resolve()` where the x402 payment fires.
- **A implements:** `@bankofai/agent-wallet` (signing) + `@bankofai/x402` (payment) on TRON testnet. One real 8004 registration, one real x402 micropayment.
- Timeboxed 2–3 days. If it fights back, fall to narrative-only — **zero hero impact**, because reasoning is Claude-direct.

---

## Contract 5 — Hybrid Data Layer (C owns, all three consume)

RESOLVE uses a **Web2 DB (Supabase) + TRON chain** hybrid storage architecture. This contract documents which data lives where and the interface signatures between the two systems.

### Storage Allocation

| Data | Store | Rationale |
|------|:-----:|-----------|
| Market metadata (question, description, category, status) | **Supabase** (`markets` table) | Search/filter/sort needs < 10ms; chain queries take 3-5s |
| Agent definitions and inference records | **Supabase** (`agent_consensus`, `agent_votes`) | AI logs don't need chain-level immutability |
| User positions (buy records) | **Supabase** (`positions`) + `tx_hash` link | Fast portfolio rendering; `tx_hash` provides on-chain verifiability |
| **Asset settlement (USDD payout)** | **TRON chain** (settlement contract) | Trust-minimized — money must move on-chain |
| **$HTX staking / incentives** | **TRON chain** (smart contract) | Economic loop requires trustless execution |

### Interface: Supabase Data Layer

```ts
// Dev C implements these; A and B consume the data through API routes.

// Markets
async function getMarket(slug: string): Promise<Market>;
async function listMarkets(filter?: { status?: MarketStatus; category?: Category }): Promise<Market[]>;
async function updateMarketStatus(marketId: string, status: MarketStatus): Promise<void>;

// Positions
async function getPositions(walletAddress: string): Promise<Position[]>;
async function createPosition(pos: Omit<Position, 'id'>): Promise<Position>;

// Consensus & Agent votes
async function saveConsensus(marketId: string, consensus: AIConsensus): Promise<void>;
async function getConsensus(marketId: string): Promise<AIConsensus | null>;
```

### Interface: TRON Settlement

```ts
// Dev A implements these; C calls them from API routes.

// Settlement — the only on-chain contract call in the hero flow
async function settleOnChain(args: {
  marketId: string;
  outcome: Outcome;
  winnerWallet: string;
  amountUSDD: number;
}): Promise<{ txHash: string; status: "confirmed" | "simulated" }>;

// Query staking info (read-only, Trongrid)
async function getMarketStake(marketId: string): Promise<{ stakedHTX: number; staker: string }>;
```

### Bridge

The two systems connect via two fields:

- **`tx_hash`** on `Position` — links a Supabase buy record to its TRON transaction so anyone can verify on Tronscan.
- **`wallet_address`** on `Position` / `Market` — the user's TRON wallet is the foreign key between Web2 identity and on-chain value.

This is **not a pure on-chain design**. For the hero demo, Supabase stores everything that needs fast reads (market list, positions, agent inference logs), while TRON handles only asset settlement and staking. The narrative: *"Web2 speed where you need it, Web3 trust where it matters."*

---

## The rule

Every contract above has a **stub** form for the walking skeleton and a **real** form swapped in behind the identical signature. The signature never changes once agreed — that's what lets the three slices move in parallel and what makes the hero shot run end-to-end from week 1.

`@bankofai/x402` (v0.6.0) and `@bankofai/agent-wallet` (v2.4.0) are real, TypeScript, npm-installable, Node ≥20 — same stack as this app. No language bridge needed.
