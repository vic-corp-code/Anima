# Anima — code conventions

Product/architecture context lives in [docs/](docs/), [VISION.md](VISION.md), [ROADMAP.md](docs/roadmap/ROADMAP.md), and the ADRs in [docs/tech/decisions/](docs/tech/decisions/). Read those before making product or architecture decisions — this file is dev-workflow only.

## Workspace

bun workspaces + Turborepo (ADR-001). `apps/*` are Next.js apps, `packages/*` are shared code.

```
bun install          # install everything
bun run dev           # turbo run dev, all apps
bun run typecheck      # turbo run typecheck
bun run lint            # turbo run lint
bun run build            # turbo run build
```

Run a single app: `bun run dev --filter=@anima/shelter` (or `cd apps/shelter && bun run dev`).

## First-time setup

Two services need accounts you create yourself — see:
- `packages/backend/README.md` for Convex (`bunx convex dev`, interactive login).
- `apps/shelter/.env.local.example` for Clerk keys (from dashboard.clerk.com) and the Convex URL, once you have both.

## Conventions

- TypeScript strict everywhere (ADR-002). Shared `tsconfig.base.json` and `eslint.base.js` live in `packages/config`.
- `packages/domain` has no Convex or React imports — pure logic only (see `docs/tech/architecture.md`).
- No hardcoded UI strings — copy goes through `packages/i18n` message catalogs (ADR-004). Both `fr` and `es` ship together; France is the only enabled operating country for now, Spain is gated at signup.
- Next.js 16: use `proxy.ts`, not `middleware.ts` (the convention was renamed; same `(request) => response` shape). See `apps/shelter/proxy.ts` for the Clerk + next-intl composition.
