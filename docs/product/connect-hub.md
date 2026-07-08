# Product Spec — Connection Hub

The public face of the ecosystem and the marketplace that connects organizations with adopters, donors, and volunteers. Mostly the **read-side** of data created in the shelter workspace and volunteer platform, plus the interactions (inquiries, applications) flowing back.

Ships in **phase 2** as a read-only showcase; grows interaction features as the volunteer platform comes online.

## Target users

- **Adopters:** "I want to adopt a cat near Toulouse from a trustworthy shelter."
- **Donors:** "I'd rather fund '5 cages for the Valencia shelter' than an abstract charity."
- **Volunteers:** "I want a project to invest myself in" (entry point → volunteer platform).

## Jobs to be done

1. **"Find an adoptable animal that fits my life, near me."**
2. **"See concrete needs I can fund, and trust where money goes."**
3. **"Discover organizations and missions where my help matters."**
4. **"Contact the organization without friction."**

## Feature areas

### F1. Adoptable animals directory (phase 2)
- Grid of announcement cards (the compact format from the shelter workspace).
- Filters: **species/animal type · place (country, region, radius) · organization type (SPA / shelter / association / group)** + sex, age bracket, compatibility (kids/cats/dogs), sterilized.
- Animal detail page: gallery, story, key facts, organization card, **adoption inquiry** (form → email to org in MVP; tracked inquiries later).
- SEO is a feature: every animal page indexable, clean URLs, OpenGraph cards (this is how shelters get reach — the hub must outperform a Facebook post in Google).

### F2. Cagnottes directory (phase 2)
- Active cagnottes with the same filter system; card shows concrete goal, org, progress (manually updated), and prominent **"Donate on HelloAsso/Teaming/…"** external link.
- Trust framing: verification badge of the org, link to org page, clear disclosure that payment happens on the external platform.

### F3. Organization pages (phase 2)
- Public profile per org: description, verification badge, location, their adoptable animals, active cagnottes, news feed, (later) open missions.
- Shareable URL — this becomes the org's de-facto website (many associations have none).
- Presentation is org-controlled: section order, theme, and custom blocks are edited in the shelter workspace (see shelter-app.md F7 — the site editor) and rendered here. Content itself (animals/cagnottes/news) stays data-driven; the editor doesn't duplicate it.

### F4. Missions board (phase 4)
- Open missions from all orgs, filterable by type (transport/foster/on-site/skill), urgency, place/route, species.
- Mission detail → apply (requires volunteer profile → funnel into the volunteer platform).

### F5. Matching (phase 5 — the long-term differentiator)
- From search to suggestion: notify volunteers when a mission matches their structured capabilities ("a transport Lyon→Grenoble was just posted; it's on your declared route").
- Suggest foster candidates to orgs for a given animal (species, capacity, special-care match).
- Start rule-based on structured fields (route overlap, radius, species, urgency tier). No ML until rules stop being good enough.

### F6. Trust & moderation (cross-cutting)
- Only verified organizations appear by default (filter to include unverified, clearly badged).
- Content reporting on any public object; admin moderation queue.
- No user-generated free-text reviews of orgs or people in v1 (see OPEN_QUESTIONS on reputation).

## MVP cut (phase 2)

F1 + F2 + F3, read-only, with email-based adoption inquiries. No accounts needed for browsing; account only to inquire (or even email-only, no account — decide during design).

## Explicitly out of scope (v1)

- In-app payments/donation processing.
- Reviews/comments on animals or orgs.
- Adoption paperwork workflow (contracts, certificates — France's *certificat d'engagement*, note in OPEN_QUESTIONS).
- Cross-posting to Leboncoin-style marketplaces.

## Success metrics

- % of adoption inquiries on hub-listed animals that originate from the hub (vs. Facebook).
- Organic search impressions on animal pages (SEO working).
- First adoption completed via a hub inquiry; first donation click-through to an external cagnotte.
- Phase 4+: mission fill rate (posted → completed).
