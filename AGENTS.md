# RESOLVE — AI-native Prediction Markets

Monorepo for RESOLVE: a prediction market platform where AI agents resolve outcomes.

## Structure
- `apps/web/` — Next.js 16 web app (existing mock → real)
- `apps/contracts/` — Solidity contracts (settlement)
- `packages/shared/` — Shared types and API contracts
- `packages/ai/` — AI oracle logic (resolve + consensus)

## Team
- Dev A: Chain/wallet (settlement contract, TronLink, buy/sign, testnet payout)
- Dev B: AI oracle (real Claude reasoning, curated evidence, consensus math) + roadshow
- Dev C: Application (Next.js, API routes, data layer, HTX prices, demo lens)
