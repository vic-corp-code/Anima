# ADR-003: Convex as the single shared backend

- **Status:** accepted (with named risks and a phase-0 validation gate)
- **Date:** 2026-07-07

## Context

Three apps share one domain model; the hub is largely a public read-view of the other two apps' data. The developer already knows Convex. Solo, part-time: operational simplicity is a hard requirement. Alternatives considered: Postgres (Supabase / Neon + Drizzle/Prisma), Firebase.

## Decision

One **Convex** deployment as backend, database, file storage, scheduled jobs, and realtime layer for all three apps, living in `packages/backend`.

## Rationale

- **Zero ops.** No migrations infra, no connection pooling, no server processes. For a solo side-project this is worth more than SQL.
- **TS-native with generated end-to-end types** — multiplies with ADR-002; schema is code, queries are typed functions.
- **Prior experience.** The developer has shipped with Convex; on a part-time project, familiarity compounds.
- **Good fit for the workload:** document-shaped entities (animals, announcements, profiles), realtime dashboards for shelters, built-in file storage for photos, scheduled functions for saved-search alerts, transactional mutations for application lifecycles.
- **Why not Supabase/Neon (Postgres):** stronger querying (SQL, PostGIS for geo) and no lock-in, but reintroduces migrations, RLS or an API layer, and a second mental model. Chosen against primarily on solo-velocity grounds; it remains the fallback.
- **Why not Firebase:** weaker typing story, weaker query model, and equal-or-worse lock-in without the DX advantages.

## Known risks & mitigations

| Risk | Mitigation |
|---|---|
| **Geospatial queries** (radius search, route overlap) are core product features and not a document-DB strength | Phase-0 spike with Convex's geospatial component; fallback: precomputed region buckets (dept./province granularity is honestly enough for v1 filters) |
| **Vendor lock-in** (proprietary query layer & hosting) | Keep pure domain logic in `packages/domain` (no Convex imports); automated periodic data exports; accept consciously |
| **Complex reporting/analytics later** | Export to a cheap analytics store when (if) needed; not a v1 problem |
| **EU data residency / RGPD** | Verify Convex EU region options before phase 1; blocking check |
| **Pricing at scale** | Fine at side-project scale; re-evaluate at real traction (a good problem) |

## Validation gate (phase 0)

Convex is confirmed only after spiking: (1) radius/geo filtering, (2) SSR/ISR fetch from Next.js server components for hub SEO, (3) EU residency answer. If any fails hard, switch to Supabase **before** any real data exists — the decision is cheap to reverse in phase 0 and expensive after phase 2.
