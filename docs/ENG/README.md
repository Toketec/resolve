# RESOLVE — Documentation Index

> **AI-native prediction markets for the HTX Genesis Hackathon.**
> 6-Agent pool (3 ACTIVE real Claude reasoning + 3 STANDBY display) with Hybrid Web2 DB + TRON chain settlement.
> Team: Dev A (Chain/Money), Dev B (AI Oracle + Pitch), Dev C (App/Data/Seam).

---

## Document Index

| Doc | Description |
|-----|-------------|
| [architecture-overview.md](./architecture-overview.md) | Full system architecture — Vercel Serverless deployment, 3-tier design, ADRs, component breakdown, cost analysis |
| [dev-execution-spec.md](./dev-execution-spec.md) | 35+ tasks sliced by A/B/C with acceptance criteria, dependencies, integration timeline, code conventions |
| [judge-qa.md](./judge-qa.md) | Judge Q&A preparation — technical deep dives on HTX ecosystem, AI system design, Hybrid data architecture, $HTX economy, expected questions |
| [workload-split.md](./workload-split.md) | The 3-dev split (A / B / C) — vertical slices with sequencing priorities and contract boundaries |
| [api-contracts.md](./api-contracts.md) | Day-1 interfaces — Resolution, Trade & Settle, Price Feed, B.AI integration, and Hybrid Data Layer |
| [competition-strategy.md](./competition-strategy.md) | Competition landscape — advancement pipeline, scoring strategy, track positioning, risk mitigation, stage deliverables |

### Root-level documents

| Doc | Description |
|-----|-------------|
| [check.md](../check.md) | Acceptance checklist — pre-submission verification for the hero market end-to-end flow |

> 中文版见 [../CHI/README.zh.md](../CHI/README.zh.md)。

---

## Quick Start for Contributors

1. **Understand the architecture** — start with [architecture-overview.md](./architecture-overview.md) for the big picture.
2. **Know the interfaces** — read [api-contracts.md](./api-contracts.md) for the contracts between slices. These are locked.
3. **Find your slice** — [workload-split.md](./workload-split.md) tells you exactly what you own.
4. **Execute** — [dev-execution-spec.md](./dev-execution-spec.md) lists every task with acceptance criteria.
5. **Prepare the pitch** — [judge-qa.md](./judge-qa.md) covers the judge narrative; [competition-strategy.md](./competition-strategy.md) covers the competition game plan.

### Key Commands

```bash
pnpm install            # Install all dependencies
pnpm dev                # Run dev server (from project root)
pnpm typecheck          # Type-check all packages
pnpm build              # Build for production
```

### Project Structure

```
resolve/
├── AGENTS.md, CLAUDE.md, docs/
├── apps/
│   ├── web/           # Next.js 16 app (UI + API Routes)
│   └── contracts/     # Solidity contracts
├── packages/
│   ├── shared/        # Types + type definitions
│   ├── ai/            # AI oracle logic (agents, consensus)
│   └── db/            # Supabase client + data layer
```

### Hero Market (Quick Demo)

**"Will Bitcoin close above $150,000 by Dec 31, 2026?"**

1. Connect TronLink → buy YES on testnet → market expires (admin trigger)
2. Orchestrator selects 3 agents → parallel Claude inference → weighted consensus
3. Payout to winner's wallet on TRON testnet

Total demo time: ~45 seconds.
