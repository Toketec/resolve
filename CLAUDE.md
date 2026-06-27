# RESOLVE Monorepo — Claude Code Guide

This is a pnpm workspace monorepo. Key commands:
- `pnpm install` — install all workspace deps
- `pnpm dev` — run web app at localhost:3000
- `pnpm build` — build all packages
- `pnpm typecheck` — typecheck all packages

Shared types in `packages/shared/src/index.ts` — do NOT change without notifying team.

## Spec Convention

All work specs live in `spec/N_phase_name/` as triples:
| File | Purpose |
|------|---------|
| `requirements.md` | Problem, dependencies, acceptance criteria, scope boundaries |
| `plan.md` | Execution plan — step order, file paths, pitfalls |
| `tasks.md` | Task tracking — ID/description/status/Done checklist |

**Granularity**: One spec group = 4-8h of solo work, independently executable.
