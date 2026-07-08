# Anima

*(working name)* — A connected ecosystem for animal welfare in France and Spain: shelter management, volunteer coordination, and a public hub for adoptions and fund drives.

**Status: planning.** No code yet — this repo currently holds the vision, product specs, technical decisions, and roadmap that prepare the build.

## The three platforms (one monorepo, one shared backend)

1. **Shelter workspace** — SPAs, shelters, associations and rescue groups manage their animals, publish compact adoption announcements, compose social posts, and create cagnottes for concrete needs.
2. **Volunteer platform** — people declare structured capabilities (transport routes, foster capacity, skills, availability/urgency) and find where to help.
3. **Connection hub** — the public site: browse adoptable animals, cagnottes, and missions, filtered by animal type, place, and organization type.

## Documentation map

| Document | What it answers |
|---|---|
| [VISION.md](VISION.md) | Why this exists, for whom, principles, non-goals |
| [docs/product/overview.md](docs/product/overview.md) | How the three products connect; shared domain model |
| [docs/product/shelter-app.md](docs/product/shelter-app.md) | Shelter workspace spec |
| [docs/product/volunteer-platform.md](docs/product/volunteer-platform.md) | Volunteer platform spec |
| [docs/product/connect-hub.md](docs/product/connect-hub.md) | Public hub spec |
| [docs/tech/architecture.md](docs/tech/architecture.md) | Monorepo layout, stack, cross-cutting design, risk list |
| [docs/tech/decisions/](docs/tech/decisions/) | ADRs: monorepo tooling, TS/Next.js, Convex, i18n, payments, social posting |
| [docs/roadmap/ROADMAP.md](docs/roadmap/ROADMAP.md) | Phases 0–5 with exit gates (solo, part-time pacing) |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | Deferred decisions with decide-by phases |

## Key decisions so far

- **Market:** France + Spain, bilingual FR/ES from day one.
- **Stack:** TypeScript end-to-end; Next.js apps; **Convex** shared backend (validated by phase-0 spikes: geo queries, SSR/SEO, EU residency); pnpm + Turborepo.
- **Money:** cagnottes link to external platforms (HelloAsso, Teaming…) — Anima never handles funds in v1.
- **Social:** composer generates ready-to-paste posts + images; platform APIs come later.
- **Sequence:** shelter workspace → public hub → volunteers → missions/connection → matching & trust.

## Next actions

1. Resolve phase-0 open questions (auth provider, i18n lib, geocoding).
2. Scaffold the monorepo and run the three Convex validation spikes.
3. Start conversations with 1–3 candidate pilot associations (can begin now — it gates phase 1).
