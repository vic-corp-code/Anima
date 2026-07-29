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

Three services need accounts you create yourself — see:
- `packages/backend/README.md` for Convex (`bunx convex dev`, interactive login).
- `apps/shelter/.env.local.example` for Clerk keys (from dashboard.clerk.com) and the Convex URL, once you have both.
- Vercel — see Deploying below for CLI setup and a gotcha that bites on a fresh clone.

## Deploying

Hosted on Vercel — project `anima-shelter`, team `victorias-projects-10f9308b`, git-connected to the `corp` remote's `main`/`dev` branches (auto-deploys on push). CLI isn't installed globally here; use `npx vercel <cmd>`.

- **Link at the repo root, never from `apps/shelter`**: `packages/backend/vercel-build.sh` assumes it's invoked from root and does relative `cd`s. Linking from the wrong directory doesn't error — it silently creates a new, misconfigured project.
  ```
  npx vercel link --scope victorias-projects-10f9308b --project anima-shelter
  ```
- Build Command is `bash ../../packages/backend/vercel-build.sh` (Vercel's Build Command field has a 256-char limit, hence the wrapper script). It runs `convex deploy` before `next build`, so `NEXT_PUBLIC_CONVEX_URL` is captured per-branch at build time — never set it as a static Vercel env var.
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CONVEX_DEPLOY_KEY` (exact name required) are already set on Vercel for Production/Preview/Development. On a fresh clone, after linking, `vercel env pull apps/shelter/.env.local` gets you the Clerk keys without re-copying from the dashboard — you still need the Convex setup above for `NEXT_PUBLIC_CONVEX_URL`.
- For any Vercel CLI y/N confirmation (e.g. `vercel project rm`), pipe `printf 'y\n' |`, not `yes |` — the latter spams a broken echo loop in this CLI version instead of submitting.
- `vercel-build.sh` passes `--check-build-environment disable` to `convex deploy`. Newer Convex CLI versions refuse to deploy with a Production-type `CONVEX_DEPLOY_KEY` on a non-production Vercel build (`VERCEL_ENV !== "production"`) unless told otherwise — which is every branch except `main` here, since this project deliberately uses one Production deploy key across all Vercel environments (see the `CONVEX_DEPLOY_KEY` bullet above). Without that flag, every `dev`-branch (and any other non-`main`) deploy fails immediately with "Detected a non-production build environment... This is probably unintentional." Don't remove the flag without also changing that deploy-key strategy.

## Conventions

- TypeScript strict everywhere (ADR-002). Shared `tsconfig.base.json` and `eslint.base.js` live in `packages/config`.
- `packages/domain` has no Convex or React imports — pure logic only (see `docs/tech/architecture.md`).
- No hardcoded UI strings — copy goes through `packages/i18n` message catalogs (ADR-004). Both `fr` and `es` ship together; France is the only enabled operating country for now, Spain is gated at signup.
- Next.js 16: use `proxy.ts`, not `middleware.ts` (the convention was renamed; same `(request) => response` shape). See `apps/shelter/proxy.ts` for the Clerk + next-intl composition.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
