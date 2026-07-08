# Anima — Vision

> Working name. See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md#naming--branding) for naming.

## Mission

Give animal protection organizations (SPAs, shelters, associations, informal rescue groups) and the people who want to help them a **shared digital home**: one place to manage animals, publish their stories, raise funds for concrete needs, and connect with volunteers whose skills, time, and resources actually match what's needed.

## The problem

Animal welfare work in France and Spain runs on fragmented, improvised tooling:

- **Shelters and associations** track animals in spreadsheets or paper, post to social media by hand (rewriting the same announcement for Facebook, Instagram, and their website), and run fundraisers on generic platforms disconnected from the animals and needs they fund.
- **Willing volunteers** have real, specific resources — "I drive from Lyon to Grenoble twice a week", "I have a dedicated room for nursing cats and 10 years of experience" — but no structured way to declare them, and organizations have no way to find them at the moment of need.
- **Adopters and donors** discover animals through scattered Facebook posts and Leboncoin-style listings, with no filtering, no trust signals, and no view of the concrete needs (a cagnotte for 5 new cages) behind each organization.

The result: animals stay longer in shelters, urgent transports and foster placements are arranged through frantic phone chains, and small associations spend volunteer hours on communication busywork instead of animal care.

## The product: three connected platforms, one ecosystem

### 1. Shelter workspace (for organizations)
The back-office for SPAs, shelters, associations, and rescue groups:
- Manage their animal registry (identity, health, status, photos, history).
- Publish adoption announcements once, in a compact format, ready for every channel.
- Compose social media posts from animal/news data instead of writing from scratch.
- Create **cagnottes** for concrete needs ("we need 5 new cages"), linked to external payment platforms.

### 2. Volunteer platform (for people)
Where individuals build a structured helper profile:
- Skills and experience ("10 years nursing cats"), resources ("big house, dedicated room"), and logistics ("I drive X→A regularly, can transport animals in urgent care").
- Availability and response capacity (including urgency: can they act same-day?).
- Over time: reputation signals — reliability, verified history of completed missions. *(Design of any rating system is deliberately deferred; see open questions — rating humans is legally and ethically sensitive.)*

### 3. Connection hub (public, brings the two together)
The public face and the matchmaker:
- Browse adoptable animals and active cagnottes, filterable by animal type, place, and organization type (SPA, shelter, association…).
- Organizations post **needs/missions** (transport, foster, event help); volunteers find projects to invest themselves in.
- Matching between declared volunteer capabilities and organization needs — starting with search and filters, growing toward proactive matching.

**Key structural insight:** the hub is mostly the *public read-side* of data created in the other two platforms. This drives the architecture (shared backend, shared data model) — see [docs/tech/architecture.md](docs/tech/architecture.md).

## Who it's for

| Persona | Platform | Core job |
|---|---|---|
| Association manager (often a volunteer herself) | Shelter workspace | Track animals, communicate, fundraise — in minimal time |
| Skilled volunteer | Volunteer platform | Declare what she can offer, find where it's needed |
| Adopter / donor | Connection hub | Find an animal or a cause, trust what she sees |

## Principles

1. **Respect the users' time.** Our primary users are unpaid and overworked. Every feature is judged by minutes saved per week.
2. **Compact by default.** Announcements, posts, and profiles are structured and short — write once, publish everywhere.
3. **One source of truth.** An animal exists once in the system; announcements, posts, and hub listings derive from it.
4. **Trust is earned and protected.** Verification of organizations (RNA/SIRET in France, Registro de Asociaciones in Spain) before reputation of individuals. No dark patterns, no engagement farming.
5. **Bilingual from day one.** FR + ES as first-class locales; architecture ready for more.
6. **We don't touch the money (yet).** Cagnottes link out to established platforms (HelloAsso, Teaming, GoFundMe…). Payment compliance is not an MVP problem.
7. **Solo-sized steps.** This is built by one person part-time; every roadmap phase must ship something usable on its own.

## What success looks like

- **Year 1:** a handful of real associations manage their animals and publish through Anima weekly; the public hub lists their animals and cagnottes; first volunteer profiles exist.
- **Year 2:** organizations regularly find transport/foster help through the hub; volunteers get matched to missions; measurable reduction in "time to adoption" for pilot shelters.
- **Long term:** the default coordination layer for animal welfare in FR/ES — the place where an animal's journey from rescue to adoption is visible, supported, and fast.

## Non-goals (for now)

- Handling payments or holding funds.
- Veterinary/medical records compliance (we store practical health notes, not official records).
- Replacing legal registries (I-CAD in France, RIAC/regional registries in Spain) — we may integrate later, never replace.
- Native mobile apps before the web product proves itself.
- Markets beyond France and Spain.
