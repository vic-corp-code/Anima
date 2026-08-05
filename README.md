# Anima

*(working name)* — A connected ecosystem for animal welfare in France and Spain: shelter management, volunteer coordination, and a public hub for adoptions and fund drives.

**Status: Phase 1 (Shelter MVP) complete, Phase 2a (Hub core) in progress.** The shelter workspace is feature-complete with animal registry, announcements, cagnottes, news posts, AI-powered intake agent, and org management. See [ROADMAP.md](docs/roadmap/ROADMAP.md) for phase rationale/exit gates and the [GitHub milestones](https://github.com/vic-corp-code/Anima/milestones) for the live task list.

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
| [docs/tech/decisions/](docs/tech/decisions/) | ADRs: monorepo tooling, TS/Next.js, Convex, i18n, payments, social posting, auth |
| [docs/roadmap/ROADMAP.md](docs/roadmap/ROADMAP.md) | Phases 0–5 with exit gates (solo, part-time pacing) |
| [GitHub milestones](https://github.com/vic-corp-code/Anima/milestones) & [issues](https://github.com/vic-corp-code/Anima/issues) | The actual task list — one milestone per phase |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | Pointer to deferred decisions (`label:decision` issues) |

## Key decisions so far

- **Market:** bilingual FR/ES UI from day one; France-first launch — Spain shown but gated at account creation until enabled.
- **Stack:** TypeScript end-to-end; Next.js apps; **Convex** shared backend (validated by phase-0 spikes: geo queries, SSR/SEO, EU residency); bun + Turborepo; **Clerk** for auth.
- **Money:** cagnottes link to external platforms (HelloAsso, Teaming…) — Anima never handles funds in v1.
- **Social:** composer generates ready-to-paste posts + images; platform APIs come later.
- **Sequence:** shelter workspace → public hub → volunteers → missions/connection → matching & trust.

## Getting started

```bash
bun install          # install everything
bun run dev           # turbo run dev, all apps
```

See [CLAUDE.md](CLAUDE.md) for conventions, first-time setup (Convex, Clerk, Vercel), and deploying.
