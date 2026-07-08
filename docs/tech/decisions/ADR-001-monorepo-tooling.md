# ADR-001: Monorepo with pnpm workspaces + Turborepo

- **Status:** in progress
- **Date:** 2026-07-07

## Context

Anima is explicitly a mono-repo hosting three connected apps (shelter workspace, volunteer platform, hub) that share a domain model, a backend, a design system, and i18n catalogs. Built by one person part-time.

## Decision

pnpm workspaces for package management + Turborepo for task orchestration (build/lint/test caching, `turbo run dev --filter=...`).

Victoria- If bun works fine for this i rather use bun instead of pnpm-

## Rationale

- Shared code (types, backend client, UI) is the whole point of the monorepo; pnpm workspaces is the standard, low-magic way to wire it.
- Turborepo adds task caching and filtering with near-zero config, and is the default pairing with Next.js/Vercel.
- Nx rejected: more powerful, but more concepts/config to maintain — not worth it for a solo project of this size.
- Polyrepo rejected: would force publishing shared packages or duplicating the domain model; kills the "one source of truth" principle.

## Consequences

- All apps version and deploy from one repo; a single PR can change schema + all three apps consistently.
- Must keep package boundaries honest (`domain` has no framework deps) so the monorepo doesn't become one tangled app.
