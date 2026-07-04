# RESOLVE Deployment Guide

> Fresh-environment deployment. Execute chapters in order.
> All modules: Database (Supabase) + Smart Contracts (Shasta) + Backend sync + Frontend (Vercel) + Cron Jobs

---

## Chapter 1: Account Registration

| Service | Sign Up | Purpose |
|---------|---------|---------|
| Vercel | vercel.com (GitHub login) | Web app + API hosting |
| Supabase | supabase.com (GitHub login) | PostgreSQL database |
| Shasta faucet | shasta.trongrid.io | Test TRX for contract deployment |
| LLM API | openrouter.ai or any OpenAI-compatible | AI inference (optional) |

---

## Chapter 2: Database (Supabase)

**1. Create project**

supabase.com → **New Project**:
- Name: `resolve`
- Password: create & save
- Region: **Singapore**
- Wait ~2 minutes

**2. Import schema + seed data**

**SQL Editor** → execute 5 files **in order**:

| # | File | What it does |
|:---:|------|-------------|
| 1 | `packages/db/migrations/00001_initial_schema.sql` | Create 4 tables + insert hero market |
| 2 | `packages/db/migrations/00002_add_agents.sql` | Create agents table + insert 6 AI Agents |
| 3 | `packages/db/migrations/00003_amm_schema.sql` | Create trades table + position balance model |
| 4 | `packages/db/migrations/00004_pool_state_sync.sql` | Create market pool state table |
| 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` | Add 5 on-chain fields to agents table |

After execution, database will contain:
- 7 tables: `markets`, `positions`, `agent_consensus`, `agent_votes`, `agents`, `trades`, `market_pool_states`
- 1 hero market: slug=`btc-150k-eoy`
- 6 Agents: bull-1 ~ neut-2

**3. Record connection credentials**

Project Settings → **API** → copy these 3 values:

```
SUPABASE_URL       = https://xxxx.supabase.co
SUPABASE_ANON_KEY  = eyJhbG...
SUPABASE_SERVICE_KEY = eyJhbG...
```

---

## Chapter 3: Smart Contracts (Deploy to Shasta Testnet)

### 3.1 Prepare environment

On a machine with Node.js:

```bash
cd apps/contracts
pnpm install
node scripts/compile.js
```

Build artifacts:
- `build/MockUSDD.json`
- `build/ResolveSettlement.json`

### 3.2 Deploy all contracts

```bash
# Deploy all (in order: MockUSDD → ResolveSettlement → AgentRegistry + register 6 Agents)
TRON_PRIVATE_KEY=<wallet private key> node scripts/deploy.js all
```

Deployment order (each depends on the previous address):

```
① MockUSDD (test USDD token with faucet)
   ↓ address passed to constructor
② ResolveSettlement (core contract: create market, buy, sell, settleBatch, AMM)
   ↓
③ AgentRegistry (agent identity registry) + register 6 Agents
```

On success, terminal outputs 3 addresses — **save each one**:

```
📋 NEXT_PUBLIC_USDD_ADDRESS="TMock..."
📋 NEXT_PUBLIC_SETTLEMENT_ADDRESS="TSettle..."
📋 NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS="TReg..."
```

> ⚠️ The `deployment-output.json` file **only stores AgentRegistry info**. USDD and Settlement addresses are printed to terminal only — the deployer must copy them manually.

### 3.3 Sync on-chain addresses to database

```bash
SUPABASE_URL=<from Ch2> SUPABASE_ANON_KEY=<from Ch2> \
node scripts/sync-agents-to-db.js
```

Updates `agents` table with `tron_address`, `deployment_tx_hash`, etc.

### 3.4 Create on-chain market (optional)

For real buy/sell flow (not mock):

1. Call `createMarket(marketId, liquidity)` on ResolveSettlement
2. `marketId` must match DB's `btc-150k-eoy` (bytes32 encoded)
3. Call `approve(SETTLEMENT_ADDRESS, amount)` for USDD

> Skip if using airbag mode (`AIRBAG_ENABLED=true`) — system uses simulated flow.

---

## Chapter 4: Web App + API (Deploy to Vercel)

### 4.1 Create Vercel project

1. vercel.com → **Add New → Project**
2. Select GitHub repo `resolve`
3. Auto-detects Next.js

### 4.2 Build settings

| Field | Value |
|-------|-------|
| Framework Preset | Next.js (auto) |
| Root Directory | (leave empty) |
| Build Command | `cd apps/web && npx next build` |
| Install Command | `pnpm install` |
| Node.js Version | **20.x** |

> Do NOT use `pnpm build` — contracts package needs solc (not available in Vercel build env).

### 4.3 Environment variables

Add these 13 variables in Vercel **Settings → Environment Variables**:

**① Database (from Chapter 2)**

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbG...` |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` |

**② Blockchain (from Chapter 3.2)**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SETTLEMENT_ADDRESS` | Settlement contract address |
| `NEXT_PUBLIC_USDD_ADDRESS` | USDD contract address |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | AgentRegistry contract address |
| `NEXT_PUBLIC_TRON_FULL_HOST` | `https://api.shasta.trongrid.io` |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `live` (read from chain) or `preconfig` |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `true` (simulated settlement) |
| `TRON_PRIVATE_KEY` | Wallet private key (Production only) |

**③ AI Inference (optional, auto-mock if absent)**

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | From LLM provider |
| `OPENAI_BASE_URL` | e.g. `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | e.g. `gpt-5.5` |

### 4.4 Deploy

Click **Deploy**. First build: ~2-5 min. Get URL:

```
https://resolve-prediction.vercel.app
```

---

## Chapter 5: Cron Jobs (Vercel Cron)

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-pools",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

- Commit to main → Vercel auto-loads
- Every 5 min: reads on-chain prices/liquidity → updates `market_pool_states` table
- Hobby plan: 2 free cron jobs

First manual trigger:

```bash
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

---

## Chapter 6: Verification

### 6.1 API endpoints

```bash
# Markets (should include btc-150k-eoy)
curl https://resolve-prediction.vercel.app/api/markets

# Agents (should return 6)
curl https://resolve-prediction.vercel.app/api/agents

# On-chain agent verification
curl https://resolve-prediction.vercel.app/api/agents/verify

# BTC price
curl https://resolve-prediction.vercel.app/api/price/BTC

# Cron (pool refresh)
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools

# K-line
curl https://resolve-prediction.vercel.app/api/price/BTC/kline
```

### 6.2 Page checks

| URL | What to check |
|-----|--------------|
| `/` | Homepage shows market cards |
| `/markets` | Hero market `btc-150k-eoy` visible, status=active |
| `/markets/btc-150k-eoy` | Market detail + TradePanel |
| `/agents` | 6 agent cards with TRON address links |
| `/portfolio` | Portfolio page (requires TronLink) |
| `/create` | Create market page |

### 6.3 Error handling

| Scenario | Expected |
|----------|----------|
| Supabase unreachable | Page shows mock data, no crash |
| No contract address configured | Airbag mode auto-activates |
| No LLM API key | AI consensus uses mock fallback |
| TronLink not installed | Shows "install TronLink" prompt |

---

## Appendix: Complete Component Inventory

| # | Component | Type | Location | Deployment method |
|:-:|-----------|------|----------|-------------------|
| 1 | PostgreSQL database (7 tables) | Data layer | Supabase | Run 5 migration SQL files |
| 2 | Seed data (1 market + 6 agents) | Data layer | Supabase | Built into SQL migrations |
| 3 | MockUSDD contract | Smart contract | Shasta testnet | `node scripts/deploy.js all` |
| 4 | ResolveSettlement (AMM) contract | Smart contract | Shasta testnet | Same |
| 5 | AgentRegistry contract | Smart contract | Shasta testnet | Same |
| 6 | 6 Agent on-chain registration | Init | Shasta testnet | deploy.js auto-runs |
| 7 | Sync on-chain addresses to DB | Init | Local | `node scripts/sync-agents-to-db.js` |
| 8 | Next.js pages + 16 APIs | App layer | Vercel | GitHub push → auto-build |
| 9 | i18n geo middleware | App layer | Vercel | Deployed with Next.js |
| 10 | Pool state refresh cron | Scheduled | Vercel Cron | `vercel.json` config |
| 11 | AI consensus inference | On-demand | Vercel API | Part of API routes |
| 12 | 13 environment variables | Config | Vercel | Manual entry |
