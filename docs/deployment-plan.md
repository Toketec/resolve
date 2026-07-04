# RESOLVE Vercel Deployment Guide

> Steps in order. ~30 min total.

---

## Step 1: Code Fixes

3 required changes before Vercel build:

1. **`packages/db/package.json`** → add `"build": "tsc"` under `scripts` (skip if already there)
2. **`apps/web/proxy.ts`** → rename to `middleware.ts`, rename the exported function to `middleware`
3. **`apps/web/app/api/markets/[slug]/resolve/route.ts`** → change `maxDuration` to `30`

---

## Step 2: Supabase (Database)

1. supabase.com → GitHub login → **New Project**
   - Name: `resolve`, set & save password, Region: **Singapore**
2. Go to **SQL Editor** → run these 5 files **in order**:

| # | File |
|:---:|------|
| 1 | `packages/db/migrations/00001_initial_schema.sql` |
| 2 | `packages/db/migrations/00002_add_agents.sql` |
| 3 | `packages/db/migrations/00003_amm_schema.sql` |
| 4 | `packages/db/migrations/00004_pool_state_sync.sql` |
| 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` |

3. **Settings → API** → copy 3 values:

| Label | Env Var |
|-------|---------|
| Project URL | `SUPABASE_URL` |
| anon public | `SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_KEY` |

---

## Step 3: Vercel (Website)

1. vercel.com → **Add New → Project** → select `resolve` repo
2. Configure:

| Field | Value |
|-------|-------|
| Framework Preset | Next.js (auto) |
| Root Directory | (leave empty) |
| Build Command | `cd apps/web && npx next build` |
| Install Command | `pnpm install` |
| Node.js Version | 20.x |

3. **Environment Variables** — add these:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | From Step 2 |
| `SUPABASE_ANON_KEY` | From Step 2 |
| `SUPABASE_SERVICE_KEY` | From Step 2 |
| `NEXT_PUBLIC_TRON_FULL_HOST` | `https://api.shasta.trongrid.io` |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `true` |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `preconfig` |
| `TRON_PRIVATE_KEY` | Your wallet private key (Production only) |

> Leave other vars empty — airbag mode handles everything with mock data.

4. Click **Deploy** → wait 2-5 min → URL: `resolve-prediction.vercel.app`

---

## Step 4: Verify

- [ ] Homepage loads with hero market card
- [ ] `/agents` shows 6 agent cards with TRON address links
- [ ] `/markets/btc-150k-eoy` detail page + TradePanel works
- [ ] Language switcher (CN/EN) works

---

## Competition Demo Tip

**Use local `pnpm dev` for actual judging**, keep Vercel as backup. Reasons:
- Vercel is blocked by China's firewall
- Local demo is more reliable, no network issues
- Have it running on 2 laptops for redundancy
