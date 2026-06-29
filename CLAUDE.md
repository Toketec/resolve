# RESOLVE Monorepo — Claude Code Guide

This is a pnpm workspace monorepo. Key commands:
- `pnpm install` — install all workspace deps
- `pnpm dev` — run web app at localhost:3000
- `pnpm build` — build all packages
- `pnpm typecheck` — typecheck all packages

Shared types in `packages/shared/src/index.ts` — do NOT change without notifying team.

## Spec Convention

All work specs live in `spec/N_phase_name/` as quads:
| File | Purpose |
|------|---------|
| `requirements.md` | Problem, dependencies, scope boundaries |
| `plan.md` | Execution plan — step order, file paths, pitfalls |
| `tasks.md` | Task tracking — ID/description/status/Done checklist |
| **`check.md`** | **Verification plan — AI self-check commands + manual test steps (curl/browser) + error recovery + bonus points** |

## Verification Flow

After completing a spec:
1. Run AI self-checks in `spec/N/check.md` (typecheck, build, security scan)
2. Follow manual test steps to verify each function
3. Then run [docs/ENG/check.md](docs/ENG/check.md) for full project integration check

**Granularity**: One spec group = 4-8h of solo work, independently executable.

## 🛑 Git Rules
- **NO auto-commit or auto-push.** Always present changes to the human and ask "May I commit?" before any `git commit` or `git push`.
- This includes: code changes, doc updates, spec task status changes, config file edits.
