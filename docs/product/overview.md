# Product Overview — The Anima Ecosystem

Three products, one data model, one account system. Read [VISION.md](../VISION.md) first.

## The three products and how they connect

```
┌─────────────────────────┐        ┌─────────────────────────┐
│   SHELTER WORKSPACE     │        │   VOLUNTEER PLATFORM    │
│   (organizations)       │        │   (individuals)         │
│                         │        │                         │
│  • Animal registry      │        │  • Helper profile       │
│  • Adoption announce.   │        │  • Skills & resources   │
│  • Social post composer │        │  • Availability/urgency │
│  • Cagnottes (needs)    │        │  • Mission history      │
│  • Missions (help asks) │        │  • (later) reputation   │
└───────────┬─────────────┘        └───────────┬─────────────┘
            │        writes                    │  writes
            ▼                                  ▼
      ┌─────────────────────────────────────────────┐
      │           SHARED BACKEND & DATA             │
      │  orgs · animals · announcements · cagnottes │
      │  missions · profiles · applications         │
      └───────────────────┬─────────────────────────┘
                          │  reads (mostly)
                          ▼
            ┌─────────────────────────┐
            │     CONNECTION HUB      │
            │     (public)            │
            │                         │
            │  • Adoptable animals    │
            │  • Active cagnottes     │
            │  • Open missions        │
            │  • Filters: animal type,│
            │    place, org type      │
            │  • Adoption inquiries   │
            │  • Mission applications │
            └─────────────────────────┘
```

The hub is primarily the **public read-side** of the other two, plus the interaction points (inquiries, applications) that flow back.

## Shared domain model (first sketch)

| Entity | Owned by | Notes |
|---|---|---|
| **Organization** | Shelter workspace | Type (SPA / shelter / association / informal group), location, verification status (RNA/SIRET, ES registry), members & roles |
| **Org site config** | Shelter workspace | Theme, section order, and custom blocks for the org's public hub page. Edited in the shelter workspace, rendered on the hub (shelter-app.md F7 / connect-hub.md F3). Presentation only — never a second copy of animal/cagnotte/news data |
| **Animal** | Organization | Species, breed, sex, age, identification (chip #), health notes, status (in care / adoptable / adopted / fostered / deceased), photos, story |
| **Announcement** | Organization | Derived from an Animal; the compact, publishable adoption card. Has locale variants (FR/ES) |
| **News post** | Organization | Short update (event, rescue story) → feeds the social composer & hub |
| **Cagnotte** | Organization | Title, concrete goal ("5 new cages"), amount target (informational), **external URL** (HelloAsso, Teaming…), status |
| **Mission** | Organization | A need for human help: type (transport, foster, on-site, event, skill-based), urgency, location(s), time window |
| **Volunteer profile** | Individual | Structured capabilities (see volunteer-platform.md), availability, service area / regular routes |
| **Application / Inquiry** | Individual → Org | Volunteer applies to mission; adopter inquires about animal. Lifecycle: sent → seen → accepted/declined → completed |
| **Reputation event** | System | Deferred design. Only from *completed, mutually confirmed* missions — never free-text public ratings at first. See the [reputation-system-design decision issue](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+reputation) |

## Shared concepts across all three apps

- **Accounts:** one identity system. A person can be both a volunteer AND a member of an organization. Organization membership carries roles (admin, editor).
- **Localization:** UI in FR and ES everywhere. User content is written in the org's language; locale variants optional per announcement.
- **Geography:** everything geolocatable (org address, mission route, volunteer service area) to power place-based filtering. Country-aware (FR/ES) from day one.
- **Verification tiers:** unverified → email-verified → registry-verified organization (RNA/SIRET/Registro). Hub visibility can depend on tier.
- **Compactness:** every publishable object (announcement, cagnotte, mission) has a canonical compact card format that renders consistently on the hub, in social posts, and in embeds.

## Detailed specs

- [shelter-app.md](shelter-app.md) — Shelter workspace
- [volunteer-platform.md](volunteer-platform.md) — Volunteer platform
- [connect-hub.md](connect-hub.md) — Connection hub

## What we deliberately do NOT build per phase

Scope discipline for a solo builder — see [ROADMAP.md](../roadmap/ROADMAP.md) for phasing. Standing exclusions:

- In-app payments / holding funds (ADR-005)
- Chat/messaging system in MVP (email notifications + contact info exchange first)
- Automated posting to social APIs in MVP (composer generates ready-to-paste content first, see ADR-006)
- Public rating scores on people in MVP (structured verification & history first)
