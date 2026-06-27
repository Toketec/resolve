# RESOLVE — Project Management Docs

Single source of truth for the HTX Genesis Hackathon build. Built from the locked planning session (grill Q1–Q12). If it's not written here, it isn't decided.

> 中文版见 [`README.zh.md`](./README.zh.md)。每篇英文文档都有对应的 `.zh.md` 中文版。

## Index

| Doc | What it covers |
|-----|----------------|
| [product-spec.md](./product-spec.md) | The locked product: goal, the one hero shot, scope (must / fake / drop), timeline. |
| [workload-split.md](./workload-split.md) | The 3-dev split (A / B / C) after all 12 locks, with sequencing. |
| [api-contracts.md](./api-contracts.md) | The day-1 interfaces A, B, C build against so slices stay parallel. |
| [open-questions.md](./open-questions.md) | The 8 unresolved mechanics (G1–G8) surfaced from the code. **Read before coding.** |

## The one-paragraph summary

RESOLVE is an AI-native prediction market for the HTX Genesis Hackathon. The goal is **to win** — real where it scores, faked where it doesn't. The whole demo is built around **one hero shot**: connect TronLink → make one live testnet buy → market expires → AI agents reason over curated evidence → consensus crosses threshold → real on-chain testnet payout. Three devs own three vertical slices (chain / AI / app), and Dev C owns the seam where they meet.

## The only hard deadline

**Submission: July 5, 2026.** Nothing is required before that date. Everything else (walking skeleton, freeze, backup video) is engineering discipline, not an external gate. See [product-spec.md](./product-spec.md#timeline).

## How to use these docs

1. All three devs read [product-spec.md](./product-spec.md) and [open-questions.md](./open-questions.md) first.
2. Agree the [api-contracts.md](./api-contracts.md) interfaces on day 1 — before anyone writes real logic.
3. Resolve the two blocking gaps (G6 agent count, G8 hero market) — they size Dev B.
4. Build to the contracts; swap mock → real behind them.
