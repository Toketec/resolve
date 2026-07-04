# RESOLVE Deployment Guide (For Ops)

> Fresh-environment deployment checklist. Execute in order.
> Estimated time: 1-2 hours (incl. contract deployment wait time)

---

## I. Accounts Needed

| Service | Sign Up | Purpose |
|---------|---------|---------|
| Vercel | vercel.com (GitHub login) | Web app + API hosting |
| Supabase | supabase.com (GitHub login) | PostgreSQL database |
| Shasta testnet TRX | shasta.trongrid.io faucet | Contract deployment gas fee |
| LLM API | openrouter.ai / deepseek / any OpenAI-compatible | AI inference (optional, works without) |

---

## II. Infrastructure Setup

### 2.1 Supabase (Database)

1. Create project:
   - supabase.com → **New Project**
   - Name: `resolve`
   - Database Password: create & save
   - Region: **Singapore**
   - Wait ~2 minutes

2. Run database initialization:
   - **SQL Editor** → paste file content → run
   - Execute **in order** (one by one):

   | # | File | Purpose |
   |:---:|------|---------|
   | 1 | `packages/db/migrations/00001_initial_schema.sql` | Create tables + hero market seed |
   | 2 | `packages/db/migrations/00002_add_agents.sql` | Create agents table + 6 AI Agent seed |
   | 3 | `packages/db/migrations/00003_amm_schema.sql` | Create trades table + position model |
   | 4 | `packages/db/migrations/00004_pool_state_sync.sql` | Create market pool state table |
   | 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` | Add on-chain address fields to agents |

3. Record connection credentials:
   - **Project Settings → API** → copy 3 values:

   | Label | Env Variable |
   |-------|-------------|
   | Project URL | `SUPABASE_URL` |
   | anon public key | `SUPABASE_ANON_KEY` |
   | service_role key | `SUPABASE_SERVICE_KEY` |

### 2.2 Deploy Smart Contracts (Shasta Testnet)

**Prerequisite**: Deployer wallet needs Shasta test TRX (claim at https://shasta.trongrid.io).

1. Run on your local machine or CI:

```bash
cd apps/contracts
pnpm install
node scripts/compile.js
TRON_PRIVATE_KEY=<deployer wallet private key> node scripts/deploy.js all
```

2. On success, terminal outputs:

```
=== Deployment Summary ===
Next.js .env entries:
  NEXT_PUBLIC_USDD_ADDRESS="TXYZabc123..."
  NEXT_PUBLIC_SETTLEMENT_ADDRESS="TXYZdef456..."
  NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS="TXYZghi789..."
```

3. Save these 3 contract addresses.
4. Sync agent on-chain addresses to database:

```bash
SUPABASE_URL=<from step above> \
SUPABASE_ANON_KEY=<from step above> \
node scripts/sync-agents-to-db.js
```

5. Create a test market on-chain + inject liquidity (for buy/sell to work):

```bash
TRON_PRIVATE_KEY=<deployer key> \
SETTLEMENT_ADDRESS=<from deploy output> \
USDD_ADDRESS=<from deploy output> \
node scripts/create-test-market.js
```

> Note: The DB already has a hero market from migration seed. If running in airbag mode (`AIRBAG_ENABLED=true`), on-chain market creation is optional — the UI uses mock data.

---

## III. Application Deployment (Vercel)

### 3.1 Create Project

1. vercel.com → **Add New → Project**
2. Select GitHub repo `resolve`

### 3.2 Build Settings

| Field | Value |
|-------|-------|
| Framework Preset | Next.js (auto) |
| Root Directory | (leave empty) |
| Build Command | `cd apps/web && npx next build` |
| Install Command | `pnpm install` |
| Node.js Version | 20.x |

### 3.3 Environment Variables

Add these in Vercel **Settings → Environment Variables**:

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | From Supabase | Database URL |
| `SUPABASE_ANON_KEY` | From Supabase | Database anon key |
| `SUPABASE_SERVICE_KEY` | From Supabase | Database service key (admin) |
| `NEXT_PUBLIC_TRON_FULL_HOST` | `https://api.shasta.trongrid.io` | TRON RPC endpoint |
| `NEXT_PUBLIC_SETTLEMENT_ADDRESS` | From contract deploy | ResolveSettlement contract |
| `NEXT_PUBLIC_USDD_ADDRESS` | From contract deploy | USDD/MockUSDD contract |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | From contract deploy | AgentRegistry contract |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `live` | Agent address source |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `false` | `true`=simulated, `false`=real payout |
| `TRON_PRIVATE_KEY` | Your wallet private key | For settle tx signing (Production only) |
| `OPENAI_API_KEY` | From LLM provider | AI inference (optional, mock fallback) |
| `OPENAI_BASE_URL` | LLM API endpoint | e.g. `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | Model name | e.g. `gpt-5.5` / `deepseek-chat` |

### 3.4 Deploy

- Click **Deploy**
- First build: ~2-5 minutes
- Get URL: `https://resolve-prediction.vercel.app`

### 3.5 Configure Cron Jobs

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

Commit to main — Vercel auto-detects.

Manual first trigger:

```bash
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

Expected: `{ "refreshed": 1, "failed": 0, "total": 1, "results": [...] }`

---

## IV. Deployment Verification

### 4.1 API Endpoints

```bash
# Markets
curl https://resolve-prediction.vercel.app/api/markets
# Expected: JSON array with btc-150k-eoy

# Agents
curl https://resolve-prediction.vercel.app/api/agents
# Expected: 6 agents

# Agent on-chain verification
curl https://resolve-prediction.vercel.app/api/agents/verify
# Expected: agent addresses from chain

# BTC price
curl https://resolve-prediction.vercel.app/api/price/BTC
# Expected: JSON with price field

# Cron (pool refresh)
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
# Expected: refresh results JSON
```

### 4.2 Pages

| URL | Check |
|-----|-------|
| `/` | Market cards visible |
| `/markets` | Hero market `btc-150k-eoy` shows |
| `/markets/btc-150k-eoy` | Detail + TradePanel |
| `/agents` | 6 agent cards with TRON address links |
| `/portfolio` | Portfolio page (requires TronLink) |
| `/create` | Create market page |

### 4.3 Error Scenarios

| Scenario | Expected |
|----------|----------|
| Supabase unreachable | Page shows mock data, no crash |
| TRON contract unreachable | Airbag mode auto-activates |
| No LLM API key | AI consensus uses mock fallback |
| TronLink not installed | Shows "install TronLink" prompt |

---

## V. FAQ

### Q: Blank page / 500 error after deploy

A: Check Vercel build logs. Most common cause: missing `SUPABASE_URL` or `SUPABASE_ANON_KEY`.

### Q: Buy/sell buttons don't respond

A: Check `NEXT_PUBLIC_SETTLEMENT_ADDRESS` and `NEXT_PUBLIC_USDD_ADDRESS`. In airbag mode (`AIRBAG_ENABLED=true`), transactions are simulated — no contract address needed.

### Q: Agent page shows no TRON addresses

A: Check `NEXT_PUBLIC_AGENT_REGISTRY_MODE`. Must be `live` or `preconfig`. `mock` mode hides real addresses.
