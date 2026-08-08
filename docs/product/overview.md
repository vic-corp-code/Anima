# Product Overview — The Anima Ecosystem

Three products, one data model, one account system. Read [VISION.md](../VISION.md) first.

## The three products and how they connect

- **BO-Shelter** (`apps/shelter`) — the back-office admin app where a shelter/association manages its animals, announcements, cagnottes, and social posts.
- **Hub** (`apps/hub`) — the single public marketplace, aggregating *all* client shelters. Adopters and donors browse it read-mostly; volunteers have a real presence here too — profile, capabilities, mission discovery, and applications are all written directly on the hub, not in a separate app ([#12](https://github.com/vic-corp-code/Anima/issues/12)).
- **ShelterWeb** (`apps/shelterweb`, not yet built) — a separate, optional product: one shelter's own standalone public site, own domain, managed from BO-Shelter. Shows only that shelter's data, unlike the hub's aggregate view ([#91](https://github.com/vic-corp-code/Anima/issues/91)).

```
┌─────────────────────────┐        ┌───────────────────────────────┐
│       BO-SHELTER        │        │              HUB               │
│   (org admin, back-off.)│        │  (public: all orgs, adopters,  │
│                         │        │   donors, volunteers)          │
│  • Animal registry      │        │                                 │
│  • Adoption announce.   │        │  • Adoptable animals directory │
│  • Social post composer │        │  • Active cagnottes             │
│  • Cagnottes (needs)    │        │  • Org pages                    │
│  • Missions (help asks) │        │  • Volunteer profiles           │
│  • Org site config      │        │  • Missions board + applications│
└───────────┬─────────────┘        └────────────┬────────────────────┘
            │        writes                     │  writes + reads
            ▼                                   ▼
      ┌──────────────────────────────────────────────┐
      │            SHARED BACKEND & DATA              │
      │  orgs · animals · announcements · cagnottes   │
      │  missions · volunteer profiles · applications │
      └────────────────────┬───────────────────────────┘
                           │  reads (one org's data only)
                           ▼
            ┌─────────────────────────┐
            │       SHELTERWEB        │
            │  (optional, standalone, │
            │   not yet built)        │
            │                         │
            │  • One shelter's own    │
            │    public site          │
            │  • Own domain           │
            │  • Content managed from │
            │    BO-Shelter           │
            └─────────────────────────┘
```

The hub is both a **writer** (volunteer profiles, applications, inquiries are created there) and a **reader** (of BO-Shelter's org/animal/cagnotte/mission data). ShelterWeb is read-only against the shared backend, scoped to a single organization.

## Shared domain model (first sketch)

| Entity | Owned by | Notes |
|---|---|---|
| **Organization** | BO-Shelter | Type (SPA / shelter / association / informal group), location, verification status (RNA/SIRET, ES registry), members & roles |
| **Org site config** | BO-Shelter | Theme, section order, and custom blocks for the org's public hub page. Edited in BO-Shelter, rendered on the hub (shelter-app.md F7 / connect-hub.md F3). Presentation only — never a second copy of animal/cagnotte/news data |
| **Animal** | Organization | Species, breed, sex, age, identification (chip #), health notes, status (in care / adoptable / adopted / fostered / deceased), photos, story |
| **Announcement** | Organization | Derived from an Animal; the compact, publishable adoption card. Has locale variants (FR/ES) |
| **News post** | Organization | Short update (event, rescue story) → feeds the social composer & hub |
| **Cagnotte** | Organization | Title, concrete goal ("5 new cages"), amount target (informational), **external URL** (HelloAsso, Teaming…), status |
| **Mission** | Organization | A need for human help: type (transport, foster, on-site, event, skill-based), urgency, location(s), time window |
| **Volunteer profile** | Individual, on the hub | Structured capabilities (see connect-hub.md's "Volunteers on the Hub" section), availability, service area / regular routes |
| **Application / Inquiry** | Individual → Org | Volunteer applies to mission; adopter inquires about animal. Lifecycle: sent → seen → accepted/declined → completed |
| **Reputation event** | System | Deferred design. Only from *completed, mutually confirmed* missions — never free-text public ratings at first. See the [reputation-system-design decision issue](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+reputation) |

## Shared concepts across the ecosystem

- **Accounts:** one identity system. A person can be both a volunteer (on the hub) AND a member of an organization (in BO-Shelter). Organization membership carries roles (admin, editor).
- **Localization:** UI in FR and ES everywhere. User content is written in the org's language; locale variants optional per announcement.
- **Geography:** everything geolocatable (org address, mission route, volunteer service area) to power place-based filtering. Country-aware (FR/ES) from day one.
- **Verification tiers:** unverified → email-verified → registry-verified organization (RNA/SIRET/Registro). Hub visibility can depend on tier.
- **Compactness:** every publishable object (announcement, cagnotte, mission) has a canonical compact card format that renders consistently on the hub, in social posts, and in embeds.

## Detailed specs

- [shelter-app.md](shelter-app.md) — BO-Shelter
- [connect-hub.md](connect-hub.md) — Hub, including its "Volunteers on the Hub" section
- ShelterWeb has no spec yet — not yet scaffolded, no phase assigned (see [#91](https://github.com/vic-corp-code/Anima/issues/91))

## What we deliberately do NOT build per phase

Scope discipline for a solo builder — see [ROADMAP.md](../roadmap/ROADMAP.md) for phasing. Standing exclusions:

- In-app payments / holding funds (ADR-005)
- Chat/messaging system in MVP (email notifications + contact info exchange first)
- Automated posting to social APIs in MVP (composer generates ready-to-paste content first, see ADR-006)
- Public rating scores on people in MVP (structured verification & history first)
