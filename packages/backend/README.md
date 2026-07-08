# @anima/backend

Convex functions + schema — the shared backend for all three apps (ADR-003).

## First-time setup (do this yourself — it's interactive)

```
bun install
bunx convex dev
```

This opens a browser to log into Convex and link this package to a Convex project/deployment. It also generates `convex/_generated/` (gitignored). Once linked, add the resulting `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL` values to `apps/shelter/.env.local`.
