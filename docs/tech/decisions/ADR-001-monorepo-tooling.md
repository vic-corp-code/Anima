# ADR-001: Monorepo with bun workspaces + Turborepo

- **Status:** accepted (user decision, 2026-07-08)
- **Date:** 2026-07-07

## Context

Anima is explicitly a mono-repo hosting three connected apps (shelter workspace, volunteer platform, hub) that share a domain model, a backend, a design system, and i18n catalogs. Built by one person part-time.

## Decision

bun workspaces for package management + Turborepo for task orchestration (build/lint/test caching, `turbo run dev --filter=...`).

Chosen over pnpm workspaces (the initially considered default) — Victoria's preference, given bun works fine for this. Worth a quick spike early in phase-0 scaffolding to confirm bun plays well with the Convex + Next.js toolchain, since that combination is less battle-tested than pnpm's; fall back to pnpm+Turborepo if it fights either.

## Rationale

- Shared code (types, backend client, UI) is the whole point of the monorepo; workspaces is the standard, low-magic way to wire it.
- Turborepo adds task caching and filtering with near-zero config, and is the default pairing with Next.js/Vercel.
- bun's package manager is a drop-in for workspace-style monorepos and is significantly faster for install/run than pnpm, at some cost in ecosystem battle-testing with Next.js/Convex specifically — acceptable tradeoff for a solo project, validated via a phase-0 spike rather than assumed.
- Nx rejected: more powerful, but more concepts/config to maintain — not worth it for a solo project of this size.
- Polyrepo rejected: would force publishing shared packages or duplicating the domain model; kills the "one source of truth" principle.

## Consequences

- All apps version and deploy from one repo; a single PR can change schema + all three apps consistently.
- Must keep package boundaries honest (`domain` has no framework deps) so the monorepo doesn't become one tangled app.
- If the phase-0 bun spike surfaces friction with Convex or Next.js tooling, revert to pnpm+Turborepo before any real code depends on bun-specific behavior.
