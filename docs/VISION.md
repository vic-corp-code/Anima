# Anima — Vision

> Working name. See the [naming/branding decision issues](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+is%3Aopen+label%3Adecision+naming) for naming.

## Mission

Give animal protection organizations (SPAs, shelters, associations, informal rescue groups) and the people who want to help them a **shared digital home**: one place to manage animals, publish their stories, raise funds for concrete needs, and connect with volunteers whose skills, time, and resources actually match what's needed.

## The problem

Animal welfare work in France and Spain runs on fragmented, improvised tooling:

- **Shelters and associations** track animals in spreadsheets or paper, post to social media by hand (rewriting the same announcement for Facebook, Instagram, and their website), and run fundraisers on generic platforms disconnected from the animals and needs they fund.
- **Willing volunteers** have real, specific resources — "I drive from Lyon to Grenoble twice a week", "I have a dedicated room for nursing cats and 10 years of experience" — but no structured way to declare them, and organizations have no way to find them at the moment of need.
- **Adopters and donors** discover animals through scattered Facebook posts and Leboncoin-style listings, with no filtering, no trust signals, and no view of the concrete needs (a cagnotte for 5 new cages) behind each organization.

The result: animals stay longer in shelters, urgent transports and foster placements are arranged through frantic phone chains, and small associations spend volunteer hours on communication busywork instead of animal care.

## The product: three connected platforms, one ecosystem

### 1. BO-Shelter (for organizations)
The back-office for SPAs, shelters, associations, and rescue groups:
- Manage their animal registry (identity, health, status, photos, history).
- Publish adoption announcements once, in a compact format, ready for every channel.
- Compose social media posts from animal/news data instead of writing from scratch.
- Create **cagnottes** for concrete needs ("we need 5 new cages"), linked to external payment platforms.

### 2. Hub (public, brings organizations, adopters, and volunteers together)
The public face and the matchmaker — one marketplace, three kinds of people:
- Adopters and donors browse adoptable animals and active cagnottes, filterable by animal type, place, and organization type (SPA, shelter, association…).
- Volunteers build a structured helper profile right here — skills and experience ("10 years nursing cats"), resources ("big house, dedicated room"), logistics ("I drive X→A regularly, can transport animals in urgent care"), and availability/urgency (can they act same-day?). Over time: reputation signals — reliability, verified history of completed missions. *(Design of any rating system is deliberately deferred; see open questions — rating humans is legally and ethically sensitive.)*
- Organizations post **needs/missions** (transport, foster, event help); volunteers find projects to invest themselves in. Matching between declared volunteer capabilities and organization needs starts with search and filters, growing toward proactive matching.

### 3. ShelterWeb (optional, for organizations that want their own presence)
A shelter's own standalone public website — own domain, managed from BO-Shelter, showing only that organization's data. Separate from appearing on the Hub: an organization can have one, the other, or both. Not yet built; no launch timeline committed.

**Key structural insight:** the hub is mostly the *public read-side* of data created in BO-Shelter, plus write surfaces of its own (volunteer profiles, applications, inquiries all happen on the hub, not in a separate app). ShelterWeb is a read-only window onto a single organization's data. This drives the architecture (shared backend, shared data model) — see [docs/tech/architecture.md](docs/tech/architecture.md).

## Who it's for

| Persona | Platform | Core job |
|---|---|---|
| Association manager (often a volunteer herself) | BO-Shelter | Track animals, communicate, fundraise — in minimal time |
| Skilled volunteer | Hub | Declare what she can offer, find where it's needed |
| Adopter / donor | Hub | Find an animal or a cause, trust what she sees |

## Principles

1. **Respect the users' time.** Our primary users are unpaid and overworked. Every feature is judged by minutes saved per week.
2. **Compact by default.** Announcements, posts, and profiles are structured and short — write once, publish everywhere.
3. **One source of truth.** An animal exists once in the system; announcements, posts, and hub listings derive from it.
4. **Trust is earned and protected.** Verification of organizations (RNA/SIRET in France, Registro de Asociaciones in Spain) before reputation of individuals. No dark patterns, no engagement farming.
5. **Bilingual from day one.** FR + ES as first-class UI locales; architecture ready for more. Launch scope is France-first — Spain as an operating country is gated at signup until enabled (see ADR-004) — but no UI or data-model retrofit is needed to turn it on.
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
