# Technical Architecture

Decisions are recorded as ADRs in [decisions/](decisions/); this doc is the assembled picture.

## Guiding constraints

- **One developer, part-time.** Minimize operational surface: no servers to patch, no clusters, no self-managed databases. Boring where possible.
- **Three apps, one domain model.** The hub is mostly a public read-view of shelter + volunteer data → a single shared backend, not three services (see ADR-003).
- **TypeScript end-to-end** (ADR-002): one language, shared types from database schema to UI props.
- **FR/ES from day one** (ADR-004): i18n wiring is foundation work, not a retrofit.

## Monorepo layout (target)

```
anima/
├── apps/
│   ├── shelter/          # Shelter workspace (Next.js) — app.anima.tld
│   ├── volunteers/       # Volunteer platform (Next.js) — volunteers.anima.tld
│   └── hub/              # Public hub (Next.js, SEO-critical) — anima.tld
├── packages/
│   ├── backend/          # Convex functions + schema (THE shared backend)
│   ├── ui/               # Shared design system (cards, forms, layout)
│   ├── i18n/             # Locale infra + shared FR/ES message catalogs
│   ├── domain/           # Pure domain logic & types (status machines, capability
│   │                     #   types, card formatting) — no framework imports
│   └── config/           # Shared eslint/ts/tailwind configs
├── docs/                 # This documentation
└── turbo.json / pnpm-workspace.yaml
```

Notes:
- **Apps may merge.** `volunteers` and `hub` could ship as one Next.js app with two surfaces if separation proves heavy for one person. Keep the *package* boundaries clean (domain, backend, ui) so the app boundary stays cheap to change. Decide at phase 3, not now.
- `packages/domain` holds logic that must not depend on Convex or React (e.g., the announcement card model rendered both on web and into social images). Keeps the exit door open (see Convex lock-in, ADR-003).

## Stack summary

| Layer | Choice | ADR |
|---|---|---|
| Monorepo tooling | pnpm workspaces + Turborepo | [ADR-001](decisions/ADR-001-monorepo-tooling.md) |
| Language | TypeScript everywhere, strict | [ADR-002](decisions/ADR-002-typescript-nextjs.md) |
| Frontend | Next.js (App Router) + Tailwind | [ADR-002](decisions/ADR-002-typescript-nextjs.md) |
| Backend + DB + files + realtime | **Convex** (single deployment, shared by all apps) | [ADR-003](decisions/ADR-003-convex-backend.md) |
| Auth | Convex Auth or Clerk — decide at phase 0 spike | [ADR-003](decisions/ADR-003-convex-backend.md), open question |
| i18n | FR + ES first-class; library chosen at phase 0 (next-intl likely) | [ADR-004](decisions/ADR-004-i18n-fr-es.md) |
| Payments | None — external links (HelloAsso, Teaming, …) | [ADR-005](decisions/ADR-005-payments-linkout.md) |
| Social posting | Generate & copy (text + rendered images); Meta API later | [ADR-006](decisions/ADR-006-social-posting.md) |
| Hosting | Vercel (apps) + Convex cloud; EU data residency to verify | open question |

## Cross-cutting design points

### Identity & authorization
One user account across all apps. Authorization is **organization-scoped**: a user has roles per organization (admin/editor) plus an optional volunteer profile. Enforced in Convex functions (every mutation checks org membership), never only in the UI.

### Geography
Place-based filtering (radius search, route matching) is core to the product and the **weakest spot of a document DB**. Plan: store lat/lng per org/mission/volunteer-area (geocode via a provider at write time), use Convex's geospatial component for radius queries; route matching (volunteer route ↔ transport mission) starts as coarse origin/destination area overlap, not road-network math. Validate this in a phase-0 spike — it's the top technical risk of the Convex choice.

### SEO on the hub
Animal/org/cagnotte pages must be server-rendered and indexable. Next.js SSR/ISR fetching from Convex over HTTP; verify the pattern (Convex + Next.js server components) in phase 0. If realtime isn't needed on public pages, plain server-side fetch + revalidation is enough.

### Media
Animal photos are the heaviest asset. Convex file storage for originals; resized variants generated on upload (Convex action) or via an image CDN. Social composer needs server-side image rendering (announcement card → shareable PNG) — likely satori/resvg in a Convex action or a tiny render endpoint. Spike in phase 2.

### Notifications
Email first (transactional provider, e.g. Resend), triggered from Convex. Saved-search alerts for volunteers are a scheduled Convex function scanning new missions. Push/SMS much later.

### GDPR (FR + ES = full RGPD scope)
- EU hosting/data residency for user data — **verify Convex region options before phase 1**.
- Volunteer capabilities & availability are personal data: consent-based visibility, export, deletion (cascade design in schema from the start: deleting a user must clean applications, profiles, reputation events).
- Animal data is not personal data, but adopter inquiries and org member info are.
- Cookie/consent banner only if/when analytics require it; prefer privacy-friendly analytics (Plausible-class).

## Environments & workflow

- `dev` (per-developer Convex dev deployment) → `preview` (per-PR, Vercel + Convex preview) → `prod`.
- CI: typecheck, lint, unit tests on `packages/domain` and Convex function tests (convex-test), Playwright smoke on critical flows later.
- One `prod` Convex deployment serves all three apps.

## Top technical risks (watch list)

1. **Geo queries on Convex** — spike phase 0; fallback: precomputed region buckets, or (worst case) revisit backend choice before data grows.
2. **SEO/SSR + Convex** on the hub — spike phase 0.
3. **Meta API** for direct social posting — treat as its own project; product works without it (ADR-006).
4. **Convex lock-in** — mitigated by `packages/domain` isolation and regular data exports; accepted consciously (ADR-003).
