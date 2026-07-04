# RESOLVE Project — Vercel Deployment Plan

> Version: 1.0 · Date: 2026-07-04
> Author: Gongsun Li
> Purpose: Step-by-step manual deployment guide

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Pre-Deployment Fixes (Required)](#3-pre-deployment-fixes-required)
4. [Step 1 — Supabase (Database)](#step-1--supabase-database)
5. [Step 2 — Vercel (Frontend + API)](#step-2--vercel-frontend--api)
6. [Step 3 — Environment Variables (Full List)](#step-3--environment-variables-full-list)
7. [Step 4 — Smart Contract Deployment Verification](#step-4--smart-contract-deployment-verification)
8. [Step 5 — Cron Jobs](#step-5--cron-jobs)
9. [Step 6 — On-Chain Data Initialization](#step-6--on-chain-data-initialization)
10. [Step 7 — Deployment Verification Checklist](#step-7--deployment-verification-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Cloud                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Next.js 16 (Serverless Functions)       │   │
│  │                                                    │   │
│  │  ┌─────────────┐  ┌────────────┐  ┌────────────┐  │   │
│  │  │ SSR Pages   │  │ API Routes │  │ Middleware  │  │   │
│  │  │ (16 routes) │  │ (16 total) │  │ (i18n geo) │  │   │
│  │  └─────────────┘  └─────┬──────┘  └────────────┘  │   │
│  └──────────────────────────┼───────────────────────────┘   │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  Supabase    │   │  Shasta      │   │  OpenAI-     │
  │  PostgreSQL │   │  TRON        │   │  Compatible  │
  │  (Database) │   │  Testnet     │   │  LLM API     │
  │             │   │ (Contracts)  │   │ (AI Oracle)  │
  └──────────────┘   └──────────────┘   └──────────────┘
```

### Component Hosting

| Component | Host | Cost | Notes |
|-----------|------|------|-------|
| **Web + API** | Vercel Hobby | **$0/mo** | Next.js 16 Serverless |
| **Database** | Supabase Free | **$0/mo** | 500MB PostgreSQL |
| **Smart Contracts** | Shasta Testnet | **$0** | Already deployed |
| **AI Oracle** | relay.zijo.io | **~$0** | OpenAI-compatible |
| **Cron Jobs** | Vercel Cron | **$0** | 2 free crons on Hobby |

### ⚠️ Known Limitations

- **Vercel Hobby max function timeout = 60s**, but `/api/markets/[slug]/resolve` sets `maxDuration = 120` (6 parallel LLM calls ~30s). Either downgrade to 30s (mock fallback) or upgrade to Pro ($20/mo, 300s).
- **Vercel is blocked by China's GFW**. Chinese judges need VPN or local demo.

---

## 2. Prerequisites

### Accounts Needed

| Service | Sign Up | Cost | Purpose |
|---------|---------|:----:|---------|
| **Vercel** | vercel.com (GitHub login) | **$0** | Host Next.js |
| **Supabase** | supabase.com (GitHub login) | **$0** | PostgreSQL database |
| **GitHub** | Already have | **$0** | Source code repo |
| **Shasta TRX** | shasta.trongrid.io faucet | **$0** | Contract + test transactions |

### Information to Have Ready

- [ ] `TRON_PRIVATE_KEY` — contract owner's private key (for settle signing)
- [ ] Shasta wallet `TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ`
- [ ] AgentRegistry contract address `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5`
- [ ] ResolveSettlement contract address (**not yet deployed**)
- [ ] USDD/MockUSDD address (**not yet deployed**)
- [ ] 6 Agent registration addresses (in `deployment-output.json`)
- [ ] OpenAI-compatible API Key (relay.zijo.io / B.AI)

---

## 3. Pre-Deployment Fixes (Required)

### 🔴 Fix 1: @resolve/db missing build script

**Problem**: `packages/db/package.json` has no `build` command. `pnpm -r build` will fail because it tries `build` on all packages.

**Fix**: Edit `packages/db/package.json`, add to `scripts`:

```json
{
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

Set `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"`, and ensure `tsconfig.json` includes `"outDir": "./dist"` with `"include": ["./src"]`.

<details>
<summary>Full fixed package.json</summary>

```json
{
  "name": "@resolve/db",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5"
  }
}
```
</details>

### 🔴 Fix 2: Rename proxy.ts → middleware.ts

**Problem**: File is named `apps/web/proxy.ts` but Next.js only recognizes `middleware.ts`. The geo-IP i18n detection won't load.

**Fix**: Rename `apps/web/proxy.ts` → `apps/web/middleware.ts` and export as default:

```typescript
// apps/web/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { COUNTRY_COOKIE } from "@/lib/i18n/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const country = req.headers.get("x-vercel-ip-country");
  if (country && req.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    res.cookies.set(COUNTRY_COOKIE, country, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

Then delete the old `apps/web/proxy.ts`.

### 🔴 Fix 3: Resolve endpoint timeout

**Problem**: `/api/markets/[slug]/resolve` sets `maxDuration = 120`, but Vercel Hobby max is **60s**.

**Options**:

| Option | Action | Cost |
|:-------|--------|:----:|
| **A: Strict** | Keep 120s, upgrade to Vercel Pro ($20/mo) | $20/mo |
| **B: Downgrade** | Set to 30s, use mock fallback when no API key | **$0** (recommended) |

**Recommended**: Edit the resolve route:

```typescript
// apps/web/app/api/markets/[slug]/resolve/route.ts
export const maxDuration = 30;
```

The `@resolve/ai` package has built-in mock fallback — when `OPENAI_API_KEY` is missing, it returns deterministic mock answers per agent role.

### 🟡 Fix 4 (Recommended): Add runtime = "nodejs"

**Problem**: Default Edge Runtime may not support `tronweb` and `@supabase/supabase-js` (they depend on Node.js built-in modules).

**Fix**: Add to routes using supabase or tronweb:

| Route | Reason |
|-------|--------|
| `apps/web/app/api/settle/route.ts` | tronweb transaction signing |
| `apps/web/app/api/buy/route.ts` | Supabase |
| `apps/web/app/api/sell/route.ts` | Supabase |
| `apps/web/app/api/cron/refresh-pools/route.ts` | Supabase + tronweb |
| `apps/web/app/api/markets/[slug]/resolve/route.ts` | Supabase + openai |
| `apps/web/app/api/agents/verify/route.ts` | tronweb |

Each file needs one line:

```typescript
export const runtime = "nodejs";
```

---

## Step 1 — Supabase (Database)

### 1.1 Create Supabase Project

1. supabase.com → GitHub login
2. **New Project**
   - **Name**: `resolve`
   - **Database Password**: Strong password (save it)
   - **Region**: **Singapore** (closest to Vercel + Shasta)
   - **Pricing Plan**: Free
3. Wait ~2 minutes for provisioning

### 1.2 Get Connection Credentials

Go to **Project Settings → API**:

```
Project URL: https://xxxx.supabase.co     ← SUPABASE_URL
anon public key: eyJhbGciOi...             ← SUPABASE_ANON_KEY
service_role key: eyJhbGciOi...            ← SUPABASE_SERVICE_KEY
```

### 1.3 Run Migrations

In Supabase Dashboard → **SQL Editor**, execute in order:

| Order | File | Purpose |
|:-----:|------|---------|
| 1 | `packages/db/migrations/00001_initial_schema.sql` | Base tables + hero market seed |
| 2 | `packages/db/migrations/00002_add_agents.sql` | agents table + 6 agent seed |
| 3 | `packages/db/migrations/00003_amm_schema.sql` | trades + positions balance model |
| 4 | `packages/db/migrations/00004_pool_state_sync.sql` | market_pool_states table |
| 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` | On-chain fields for agents |

**⚠️ Exec** sequentially. Check for errors after each migration.

### 1.4 Verify Seed Data

```sql
SELECT slug, question, status FROM markets;
-- Expected: btc-150k-eoy | Will Bitcoin close above $150,000... | active

SELECT agent_id, callsign, name, stance FROM agents ORDER BY sort_order;
-- Expected: 6 rows (bull-1~neut-2)

SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_type='BASE TABLE';
-- Expected: markets, positions, agent_consensus, agent_votes, agents, trades, market_pool_states
```

---

## Step 2 — Vercel (Frontend + API)

### 2.1 Import Project

1. vercel.com → **Add New → Project**
2. Select `resolve` repository
3. Vercel auto-detects Next.js

### 2.2 Build Configuration

**Framework Preset**: Next.js (auto)

**Root Directory**: (empty — use repo root)

**Build Command**:
```bash
cd apps/web && npx next build
```

> ⚠️ Do NOT use `pnpm build` — `apps/contracts` needs solc (TRON compiler), which is not available in Vercel's build environment.

**Install Command**:
```bash
pnpm install
```

**Output Directory**: `.next` (auto)

### 2.3 Node.js Version

In Vercel **Settings → General → Node.js Version**: **20.x**

### 2.4 Set Environment Variables

In Vercel **Settings → Environment Variables**, add all vars from Step 3 below.

### 2.5 Deploy

Click **Deploy**. First build takes 2-5 minutes. URL: `https://resolve-prediction.vercel.app` (auto-assigned).

---

## Step 3 — Environment Variables (Full List)

### 3.1 NEXT_PUBLIC_ (Browser — required at build time)

| Variable | How to Get | Required |
|----------|-----------|:--------:|
| `NEXT_PUBLIC_SETTLEMENT_ADDRESS` | Deploy ResolveSettlement, get from `deployment-output.json` or terminal output. Leave empty in airbag mode. | ⚠️ |
| `NEXT_PUBLIC_USDD_ADDRESS` | Deploy MockUSDD. Leave empty in airbag mode. | ⚠️ |
| `NEXT_PUBLIC_TRON_FULL_HOST` | Fixed: `https://api.shasta.trongrid.io` (Shasta testnet) | ✅ |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `true` = simulated settlement; `false` = real on-chain payout. Defaults to `true` if unset | ❌ |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | Already deployed AgentRegistry: `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5` (live mode only) | ⚠️ |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `mock` (derived), `preconfig` (preset addresses), `live` (chain read). Use `preconfig` for competition | ✅ |

> ⚠️ = Can be left empty in airbag mode — system auto-degrades to mock/simulated data

### 3.2 Server-Side Only (API Routes)

| Variable | How to Get | Required |
|----------|-----------|:--------:|
| `SUPABASE_URL` | Supabase project → **Settings → API → Project URL** | ✅ |
| `SUPABASE_ANON_KEY` | Same page → **Project API keys → anon public** | ✅ |
| `SUPABASE_SERVICE_KEY` | Same page → **Project API keys → service_role** (full access, use with care) | ✅ |
| `TRON_PRIVATE_KEY` | **Your deploy wallet's private key**. Used only by settle API for signing. **Keep secret — only set in Production** | ✅ |
| `OPENAI_API_KEY` | From your LLM provider (OpenAI / OpenRouter / B.AI / relay). **When absent, AI falls back to mock** | ❌ |
| `OPENAI_BASE_URL` | Your LLM provider's API endpoint, e.g. `https://openrouter.ai/api/v1`. Defaults to OpenAI official endpoint | ❌ |
| `OPENAI_MODEL` | Model name, e.g. `gpt-5.5`, `deepseek-chat`, `claude-sonnet-4`. Code defaults to `gpt-5.5` | ❌ |

### 3.3 Currently Deployed Contract Addresses (reference in this doc, not hardcoded in code)

| Contract | Address | Network | Status |
|----------|---------|:------:|:------:|
| **AgentRegistry** | `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5` | Shasta testnet | ✅ Deployed |
| **Deployer Wallet** | `TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ` | Shasta testnet | ✅ Has TRX balance |
| **6 Agent Registered Addresses** | All point to deployer wallet | Shasta testnet | ✅ All on-chain |
| **ResolveSettlement** | — | Shasta | ❌ Not deployed (not needed in airbag mode) |
| **MockUSDD** | — | Shasta | ❌ Not deployed (not needed in airbag mode) |

### 3.4 Recommended Configurations

**Competition/Demo** — Airbag mode + preconfig, full UI without any contract deployment:

```
NEXT_PUBLIC_AIRBAG_ENABLED=true
NEXT_PUBLIC_AGENT_REGISTRY_MODE=preconfig
```

Agent cards show valid-format TRON addresses (`TXYZ...`), clickable to Tronscan. All trade/settlement goes through simulated flow.

**Full-feature mode** — Requires deploying ResolveSettlement + MockUSDD:

```
NEXT_PUBLIC_AIRBAG_ENABLED=false
NEXT_PUBLIC_SETTLEMENT_ADDRESS=<from ResolveSettlement deployment>
NEXT_PUBLIC_USDD_ADDRESS=<from MockUSDD deployment>
NEXT_PUBLIC_AGENT_REGISTRY_MODE=live
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5
TRON_PRIVATE_KEY=<your key>
```

---

## Step 4 — Smart Contract Deployment Verification

### 4.1 Currently Deployed

| Contract | Address | Notes |
|----------|---------|-------|
| AgentRegistry | `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5` | 6 Agents registered |
| 6 Agents | All → `TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ` | Registered |

### 4.2 Optional: Deploy ResolveSettlement

Only needed for real buy/sell/settle chain flow:

```bash
cd apps/contracts
pnpm install
node scripts/compile.js
TRON_PRIVATE_KEY=<key> node scripts/deploy.js all
```

### 4.3 Sync Agent Addresses to DB

```bash
SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> node scripts/sync-agents-to-db.js
```

---

## Step 5 — Cron Jobs

### 5.1 Job List

| Endpoint | Frequency | Purpose | Dependency |
|----------|-----------|---------|------------|
| `GET /api/cron/refresh-pools` | Every 5 min | Refresh market prices from chain | ResolveSettlement contract |

### 5.2 Configure in vercel.json

Create in project root:

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

Vercel Hobby supports 2 free cron jobs.

### 5.3 Manual Trigger

```bash
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

---

## Step 6 — On-Chain Data Initialization

### 6.1 Create Test Market (Real Mode)

If using real mode: owner calls `createMarket()` + funds the contract with USDD. In airbag mode, this is all mock.

### 6.2 Initialize Pool State

```bash
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

In airbag mode, returns empty results.

---

## Step 7 — Deployment Verification Checklist

### 7.1 Build Locally First

```bash
# After fixing @resolve/db
pnpm install
cd apps/web && npx next build
```

### 7.2 Post-Deploy Verification (in browser)

| # | Check | Expected |
|:-:|-------|----------|
| 1 | `GET /` Home | Market cards + agent list load |
| 2 | `GET /markets` | Hero market `btc-150k-eoy` shows active |
| 3 | `GET /markets/btc-150k-eoy` | Market detail + TradePanel |
| 4 | `GET /agents` | 6 agent cards with BULL/BEAR/NEUT |
| 5 | `GET /api/markets` | JSON market list |
| 6 | `GET /api/agents` | 6 agent JSON |
| 7 | `GET /api/agents/verify` | On-chain agent addresses |
| 8 | `GET /api/price/BTC` | BTC real-time price |
| 9 | `GET /api/cron/refresh-pools` | Results (empty in airbag mode) |
| 10 | Language switch | CN/EN toggle works |

### 7.3 Error Recovery

| # | Scenario | Expected |
|:-:|----------|----------|
| E1 | Supabase unreachable | Page shows mock data (airbag) |
| E2 | TronLink available | Connect button appears |
| E3 | No LLM API key | AI consensus uses mock fallback |
| E4 | No contract address | Airbag mode activates automatically |

### 7.4 China Accessibility Test

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s" https://resolve-prediction.vercel.app
```

- `000` / timeout → GFW blocked. Use local demo for competition.
- `200` → accessible (may be slower, use local demo as backup).

---

## Appendix: Deployment Flowchart

```
┌─────────────────────────┐
│  Pre-Deployment Fixes   │
│ ① @resolve/db + build   │
│ ② proxy → middleware    │
│ ③ maxDuration 30s       │
│ ④ runtime nodejs        │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 1: Supabase       │  ~10 min
│  Create project →       │
│  Run 5 migrations →     │
│  Verify                 │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 2: Vercel         │  ~5 min
│  Import GitHub repo →   │
│  Configure build/env →  │
│  Deploy                 │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 3: Env Vars       │  ~3 min
│  Fill all variables →   │
│  Redeploy               │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 4: Contracts      │  ~10 min (optional)
│  Deploy ResolveSettle-  │
│  ment → sync-agents     │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 5: Cron Jobs      │  ~2 min
│  Configure vercel.json  │
│  Manual trigger test    │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 6: Verify         │  ~10 min
│  Full E2E test          │
│  Check! ✅               │
└─────────────────────────┘
```

**Estimated total**: 30-40 minutes (excluding optional contract deployment)
