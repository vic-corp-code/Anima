# @anima/backend

Convex functions + schema — the shared backend for all three apps (ADR-003).

## First-time setup (do this yourself — it's interactive)

```
bun install
bunx convex dev
```

This opens a browser to log into Convex and link this package to a Convex project/deployment. It also generates `convex/_generated/` (gitignored). Once linked, add the resulting `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL` values to `apps/shelter/.env.local`.

## Conductor worktrees

All Conductor worktrees intentionally share this one Convex dev deployment for now (side project, no need for per-worktree isolation yet) — `.conductor/settings.toml` copies both `apps/shelter/.env.local` and this package's `.env.local` into new worktrees so `CONVEX_DEPLOYMENT` stays pinned to the shared deployment instead of the setup script's `convex dev --once` linking a new one.

`CLERK_JWT_ISSUER_DOMAIN` (read in `convex/auth.config.ts`) is a deployment-scoped env var, set via `npx convex env set CLERK_JWT_ISSUER_DOMAIN <value>` or the Convex dashboard — not a `.env.local` entry. It only needs setting once per deployment, not per clone/worktree.
