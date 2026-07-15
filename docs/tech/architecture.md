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
└── turbo.json / bun workspaces (package.json)
```

Notes:
- **Apps may merge.** `volunteers` and `hub` could ship as one Next.js app with two surfaces if separation proves heavy for one person. Keep the *package* boundaries clean (domain, backend, ui) so the app boundary stays cheap to change. Decide at phase 3, not now.
- `packages/domain` holds logic that must not depend on Convex or React (e.g., the announcement card model rendered both on web and into social images). Keeps the exit door open (see Convex lock-in, ADR-003).

## Stack summary

| Layer | Choice | ADR |
|---|---|---|
| Monorepo tooling | bun workspaces + Turborepo | [ADR-001](decisions/ADR-001-monorepo-tooling.md) |
| Language | TypeScript everywhere, strict | [ADR-002](decisions/ADR-002-typescript-nextjs.md) |
| Frontend | Next.js (App Router) + Tailwind | [ADR-002](decisions/ADR-002-typescript-nextjs.md) |
| Backend + DB + files + realtime | **Convex** (single deployment, shared by all apps) | [ADR-003](decisions/ADR-003-convex-backend.md) |
| Auth | **Clerk** | [ADR-007](decisions/ADR-007-auth-clerk.md) |
| i18n | FR + ES first-class; library chosen at phase 0 (next-intl likely) | [ADR-004](decisions/ADR-004-i18n-fr-es.md) |
| Payments | None — external links (HelloAsso, Teaming, …) | [ADR-005](decisions/ADR-005-payments-linkout.md) |
| Social posting | Generate & copy (text + rendered images); Meta API later | [ADR-006](decisions/ADR-006-social-posting.md) |
| Hosting | Vercel (apps) + Convex cloud; EU data residency to verify | open question |

## Cross-cutting design points

### Identity & authorization
One user account across all apps. Authorization is **organization-scoped**: a user has roles per organization (admin/editor) plus an optional volunteer profile. Enforced in Convex functions (every mutation checks org membership), never only in the UI.

### Geography
Place-based filtering (radius search, route matching) is core to the product and the **weakest spot of a document DB**. Plan: store lat/lng per org/mission/volunteer-area (geocode via a provider at write time), use Convex's geospatial component for radius queries; route matching (volunteer route ↔ transport mission) starts as coarse origin/destination area overlap, not road-network math.

**Validated in the phase-0 spike (2026-07-15):** geocode via Geoapify in a Convex action (`ADR-008`) → store lat/lng on the record → index via `@convex-dev/geospatial` in a mutation → radius query via its `nearest` query with `maxDistance`. Tested with real FR addresses; distance-sorted results and radius filtering both work as expected. One finding: **the geospatial index is separate storage from the source table** — deleting a record does not cascade to its index entry, so any deletion mutation (e.g. removing an organization) must explicitly call the index's `remove` too.

### SEO on the hub
Animal/org/cagnotte pages must be server-rendered and indexable. Next.js SSR/ISR fetching from Convex over HTTP; verify the pattern (Convex + Next.js server components) in phase 0. If realtime isn't needed on public pages, plain server-side fetch + revalidation is enough.

**Validated in the phase-0 spike (2026-07-15):** `fetchQuery` from `convex/nextjs` in an App Router server component does server-render Convex data correctly — confirmed the record's content is present in the raw HTML response, not just client-hydrated. **But ISR did not work as planned:** `export const revalidate = N` had no effect — every response came back `Cache-Control: no-store`, i.e. fully dynamic (re-rendered + re-fetched on every request), even on pages with no Convex call at all. Root cause: the shared Clerk + next-intl `proxy.ts` middleware sets cookies (session, `NEXT_LOCALE`) on every request, which opts all routes it covers out of static/ISR caching — this is a Next.js middleware behavior, not specific to Convex. Consequence: the public hub (once built) will need its own route scope that the auth/locale-cookie-setting middleware doesn't cover, or it will silently lose ISR and hit Convex on every page view. Not a phase-0 blocker (SEO-valid HTML is still produced either way, and cost is fine at side-project traffic) but flag when the hub's routing is actually designed.

### Media
Animal photos are the heaviest asset. Convex file storage for originals; resized variants generated on upload (Convex action) or via an image CDN. Social composer needs server-side image rendering (announcement card → shareable PNG) — likely satori/resvg in a Convex action or a tiny render endpoint. Spike in phase 2.

### Notifications
Email first (transactional provider, e.g. Resend), triggered from Convex. Saved-search alerts for volunteers are a scheduled Convex function scanning new missions. Push/SMS much later.

### GDPR (FR + ES = full RGPD scope)
- **EU hosting/data residency (phase-0 gate #3, checked 2026-07-15):** Convex offers region selection at deployment-creation time — `us` (N. Virginia) or `eu` (Ireland) — but **an existing deployment's region cannot be changed afterward**; moving means creating a new deployment and migrating data. Our personal dev deployment had defaulted to `us` (the CLI default when no `--region` flag is given); recreated it in `eu` via `npx convex deployment create dev/eu --type dev --region eu --select` (now `resilient-mule-266.eu-west-1.convex.cloud`) since there was no real data to migrate yet. **Remember for the prod deployment:** it will also default to `us` unless `--region eu` is passed explicitly (or the team's default region is changed in the dashboard first) — get this right at creation time, since it can't be fixed after.
- Volunteer capabilities & availability are personal data: consent-based visibility, export, deletion (cascade design in schema from the start: deleting a user must clean applications, profiles, reputation events).
- Animal data is not personal data, but adopter inquiries and org member info are.
- Cookie/consent banner only if/when analytics require it; prefer privacy-friendly analytics (Plausible-class).

## Environments & workflow

- `dev` (per-developer Convex dev deployment) → `preview` (per-PR, Vercel + Convex preview) → `prod`.
- CI: typecheck, lint, unit tests on `packages/domain` and Convex function tests (convex-test), Playwright smoke on critical flows later.
- One `prod` Convex deployment serves all three apps.

## Top technical risks (watch list)

1. **Geo queries on Convex** — validated in phase-0 spike, see Geography section above; fallback if it stops scaling: precomputed region buckets, or (worst case) revisit backend choice before data grows.
2. **SEO/SSR + Convex** on the hub — SSR validated in phase-0 spike; ISR caching currently blocked by shared auth/locale middleware, see SEO section above. Revisit when the hub's route structure is designed.
3. **Meta API** for direct social posting — treat as its own project; product works without it (ADR-006).
4. **Convex lock-in** — mitigated by `packages/domain` isolation and regular data exports; accepted consciously (ADR-003).
