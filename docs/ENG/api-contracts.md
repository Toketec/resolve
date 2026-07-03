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

## Contract 2 — Trade, AMM & Settle (C ↔ A)

Dev C exposes the API route and UI; Dev A implements the on-chain side.

### AMM Pricing Model (Linear Bonding Curve)

Each market is an independent AMM liquidity pool. The market creator (single LP) deposits initial liquidity USDD at market creation. All trades — buy and sell — interact with this pool.

```
YES_price = 0.5 + net / (2 * L)
NO_price  = 1 - YES_price

where:
  net = cumulative YES volume bought - cumulative NO volume bought (in USDD)
  L   = initial liquidity deposited by market creator (in USDD)

Price clamped to [0.01, 0.99]
```

When a user buys YES, `net` increases → YES price rises. When a user sells YES, `net` decreases → YES price falls. The LP's deposited USDD serves as the counterparty for all trades.

**Example** (market with L = 1,000 USDD, no trades yet):

| Action | net change | YES price | NO price |
|:-------|:----------:|:---------:|:--------:|
| Initial state | net = 0 | 50% | 50% |
| Buy $100 YES | net += 100 | **55% ↑** | 45% |
| Buy $200 NO | net -= 200 | **45% ↓** | 55% |
| Sell 50 YES shares | net -= 55 | ~43% | 57% |

### Interfaces

```ts
// ── Buy ──────────────────────────────────────────────
// C owns the route + UI; A owns the signing/transfer.
async function buyShares(args: {
  marketId: string;       // slug
  side: Outcome;          // "YES" | "NO"
  amountUSDD: number;     // USDD input
  walletAddress: string;  // connected TronLink wallet
}): Promise<TransactionResult>;

// ── Sell ─────────────────────────────────────────────
// NEW: sell shares back to the AMM pool
async function sellShares(args: {
  marketId: string;
  side: Outcome;          // which side to sell ("YES" or "NO")
  shares: number;         // number of shares to sell
  walletAddress: string;
}): Promise<TransactionResult>;

interface TransactionResult {
  txHash: string;
  shares: number;         // shares actually bought/sold
  price: number;          // execution price (0..1)
  usddAmount: number;     // USDD paid out or received
  fee: number;            // platform fee collected (in USDD)
  simulated: boolean;     // airbag mode
}

// ── Settle ───────────────────────────────────────────
// On consensus, owner settles winners
async function settle(args: {
  marketId: string;
  outcome: Outcome;
  winnerWallet: string;
}): Promise<{ txHash: string; simulated: boolean }>;

// ── Pool query (read-only) ───────────────────────────
async function getPoolState(marketId: string): Promise<{
  yesSupply: number;      // YES shares outstanding
  noSupply: number;       // NO shares outstanding
  yesPrice: number;       // current YES price
  noPrice: number;        // current NO price
  liquidity: number;      // USDD remaining in pool
  feePool: number;        // accumulated platform fees
}>;

// ── Create market (with creation fee) ────────────────
async function createMarket(args: {
  marketIdBytes32: string;
  liquidity: number;      // initial USDD deposit
}): Promise<{ txHash: string }>;
```

**Fee model** (on-chain):
- **Trading fee**: 0.1% on every buy and sell
  - 50% → LP (market creator)
  - 50% → platform `feePool` (owner withdrawable)
- **Creation fee**: Fixed 10 USDD per market (paid during `createMarket()`, goes to `feePool`)
- **Settlement fee** (future): Fixed 1 USDD from winner payout (post-hackathon)

### AMM Contract Status Transitions

```
Market created (10 USDD creation fee paid)
    │
    ├── Buy/Sell trades occur ←── 0.1% fee on each
    │
    ├── Market expires → AI resolve → consensus ≥ threshold
    │       │
    │       ├── Settle: pay winners from pool balance
    │       └── LP withdraws remaining pool (minus feePool)
    │
    └── Dispute: consensus < threshold → human review window
```

- **Walking-skeleton stub:** both buy/sell resolve instantly with a fake `TransactionResult`. A swaps in real TronLink + AMM contract behind the same signatures.

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
| User positions (balances per market) | **Supabase** (`positions`) + `tx_hash` link | Fast portfolio rendering; `tx_hash` provides on-chain verifiability |
| **Asset settlement (USDD payout)** | **TRON chain** (settlement/AMM contract) | Trust-minimized — money must move on-chain |
| **Platform fee pool** | **TRON chain** (contract state) | Economic loop requires trustless execution |
| **$HTX staking / incentives** | **TRON chain** (smart contract) | Economic loop requires trustless execution |

### Position Schema (Updated for AMM)

Each position now tracks **YES and NO balance per market per wallet**, instead of single-buy records:

```
positions table (Supabase):
  id            UUID PRIMARY KEY
  market_id     UUID → markets(id)
  wallet_address TEXT
  yes_balance   NUMERIC(20,6) DEFAULT 0    ← YES shares held
  no_balance    NUMERIC(20,6) DEFAULT 0    ← NO shares held
  total_bought  NUMERIC(20,6) DEFAULT 0    ← total USDD spent (for PnL calcs)
  total_sold    NUMERIC(20,6) DEFAULT 0    ← total USDD received
  updated_at    TIMESTAMPTZ
  UNIQUE(market_id, wallet_address)        ← one row per wallet per market
```

`tx_hash` is no longer on `positions` directly. Each trade (buy or sell) is recorded in a new `trades` table:

```
trades table (Supabase):                   ← NEW
  id            UUID PRIMARY KEY
  market_id     UUID → markets(id)
  wallet_address TEXT
  side          TEXT CHECK('YES'|'NO')
  type          TEXT CHECK('buy'|'sell')   ← buy or sell
  shares        NUMERIC(20,6)              ← shares involved
  price         NUMERIC(10,6)              ← execution price
  usdd_amount   NUMERIC(20,6)              ← USDD amount
  fee           NUMERIC(20,6) DEFAULT 0    ← platform fee
  tx_hash       TEXT                       ← on-chain proof
  created_at    TIMESTAMPTZ
```

### Interface: Supabase Data Layer

```ts
// Dev C implements these; A and B consume the data through API routes.

// Markets
async function getMarket(slug: string): Promise<Market>;
async function listMarkets(filter?: { status?: MarketStatus; category?: Category }): Promise<Market[]>;
async function updateMarketStatus(marketId: string, status: MarketStatus): Promise<void>;

// Positions (per wallet per market, with YES/NO balance tracking)
async function getPosition(marketId: string, wallet: string): Promise<Position | null>;
async function listPositionsByWallet(wallet: string): Promise<Position[]>;
async function updatePosition(marketId: string, wallet: string, delta: {
  side: 'YES' | 'NO';
  shares: number;           // positive = buy, negative = sell
  usddAmount: number;       // positive = spent, negative = received
  fee: number;
  txHash: string;
}): Promise<void>;
async function insertTrade(trade: Omit<Trade, 'id'>): Promise<Trade>;

// Consensus & Agent votes
async function saveConsensus(marketId: string, consensus: AIConsensus): Promise<void>;
async function getConsensus(marketId: string): Promise<AIConsensus | null>;
```

### Interface: TRON Settlement & AMM

```ts
// Dev A implements these; C calls them from API routes.

// AMM state (read-only, Trongrid)
async function getPoolState(marketId: string): Promise<{
  yesSupply: number; noSupply: number;
  yesPrice: number; noPrice: number;
  liquidity: number; feePool: number;
}>;

// Client-side buy (TronLink sign)
async function buyShares(marketId: string, side: Outcome, amountSun: bigint): Promise<{ txHash: string }>;

// Client-side sell (TronLink sign)
async function sellShares(marketId: string, side: Outcome, shares: bigint): Promise<{ txHash: string }>;

// Owner-only settlement
async function settle(marketId: string, outcome: Outcome, winner: string, payoutSun: bigint): Promise<string>;
async function claimFees(): Promise<string>;                    // owner withdraws feePool
```

### Bridge

The two systems connect via two fields:

- **`tx_hash`** on `trades` — links a Supabase trade record to its TRON transaction so anyone can verify on Tronscan.
- **`wallet_address`** on `Position` / `Trade` — the user's TRON wallet is the foreign key between Web2 identity and on-chain value.

This is **not a pure on-chain design**. For the hero demo, Supabase stores everything that needs fast reads (market list, positions, agent inference logs), while TRON handles only AMM settlement and staking. The narrative: *"Web2 speed where you need it, Web3 trust where it matters."*

---

## The rule

Every contract above has a **stub** form for the walking skeleton and a **real** form swapped in behind the identical signature. The signature never changes once agreed — that's what lets the three slices move in parallel and what makes the hero shot run end-to-end from week 1.

`@bankofai/x402` (v0.6.0) and `@bankofai/agent-wallet` (v2.4.0) are real, TypeScript, npm-installable, Node ≥20 — same stack as this app. No language bridge needed.
