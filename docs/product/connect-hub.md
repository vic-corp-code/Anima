# Product Spec — Connection Hub

The public face of the ecosystem and the marketplace that connects organizations with adopters, donors, and volunteers — all three meet here, on one app (`apps/hub`). Mostly the **read-side** of data created in BO-Shelter (the back-office admin app), plus write surfaces of its own: adoption inquiries, mission applications, and volunteer profiles are all created directly on the hub, not in a separate app.

Ships in **phase 2** as a read-only showcase for adopters/donors; grows a volunteer-facing side in **phase 3** (built inside this same app, not a separate one — see [#12](https://github.com/vic-corp-code/Anima/issues/12)).

## Adopters & donors

### Target users

- **Adopters:** "I want to adopt a cat near Toulouse from a trustworthy shelter."
- **Donors:** "I'd rather fund '5 cages for the Valencia shelter' than an abstract charity."

### Jobs to be done

1. **"Find an adoptable animal that fits my life, near me."**
2. **"See concrete needs I can fund, and trust where money goes."**
3. **"Contact the organization without friction."**

### F1. Adoptable animals directory (phase 2)
- Grid of announcement cards (the compact format from BO-Shelter).
- Filters: **species/animal type · place (country, region, radius) · organization type (SPA / shelter / association / group)** + sex, age bracket, compatibility (kids/cats/dogs), sterilized.
- Animal detail page: gallery, story, key facts, organization card, **adoption inquiry** (form → email to org in MVP; tracked inquiries later).
- SEO is a feature: every animal page indexable, clean URLs, OpenGraph cards (this is how shelters get reach — the hub must outperform a Facebook post in Google).

### F2. Cagnottes directory (phase 2)
- Active cagnottes with the same filter system; card shows concrete goal, org, progress (manually updated), and prominent **"Donate on HelloAsso/Teaming/…"** external link.
- Trust framing: verification badge of the org, link to org page, clear disclosure that payment happens on the external platform.

### F3. Organization pages (phase 2)
- Public profile per org: description, verification badge, location, their adoptable animals, active cagnottes, news feed, (later) open missions.
- Shareable URL — this becomes the org's de-facto website (many associations have none) *unless* they've opted into ShelterWeb (see below).
- Presentation is org-controlled: section order, theme, and custom blocks are edited in BO-Shelter (see shelter-app.md F7 — the site editor) and rendered here. Content itself (animals/cagnottes/news) stays data-driven; the editor doesn't duplicate it.

## Volunteers on the Hub

Individuals declare what they can offer animal welfare organizations — skills, resources, time, logistics — and find where to help. Built in **phase 3**, after animals/cagnottes/orgs exist (volunteers need something to volunteer *for*). This lives entirely inside the hub: there is no separate volunteer app ([#12](https://github.com/vic-corp-code/Anima/issues/12)) — a volunteer's profile, discovery, and applications are all hub features alongside the adopter/donor ones above.

### Target user

Motivated individuals with concrete, underused resources:
- *"In my job I drive from X to A regularly — I can transport pets needing urgent care."*
- *"I have a big house with a dedicated room for nursing cats, and 10 years of experience."*
- *"I'm free every weekend and can help at events or with shelter maintenance."*

Today these people help ad-hoc via Facebook groups and phone chains. Their capabilities are invisible until someone happens to ask.

### Jobs to be done

1. **"Let organizations know what I can offer, once, in a structured way."**
2. **"Find missions/projects that match my capabilities and area."**
3. **"Be reachable for urgent needs I've opted into."**
4. **"Build a track record so organizations trust me with animals."**

### F4. Volunteer profile
- Identity: name, photo, city/area, languages (FR/ES/…), short bio.
- Contact preferences and notification channels.
- Visibility control: public on hub / visible to verified orgs only / hidden (search-only mode).

### F5. Structured capabilities (the core innovation — not a free-text CV)
Capabilities are **typed**, so orgs can filter and matching can work:

| Capability type | Structured fields | Example |
|---|---|---|
| **Transport** | regular route (from → to, frequency) or radius; vehicle type; can carry (cage sizes, species); urgent-capable? | "Lyon → Grenoble, 2×/week, car with 2 large cages, same-day OK" |
| **Foster / home care** | housing type, dedicated space?, garden?, other animals present, species accepted, capacity, special care (nursing, kittens, medical, quarantine) | "House, dedicated cat nursing room, capacity 4, 10 y experience" |
| **On-site help** | tasks (cleaning, walking, handling, maintenance), physical constraints | |
| **Skills** | vet/vet-tech, photography, communication, IT, legal, event organizing… + experience level & proof (diploma, years) | |
| **Availability** | recurring slots (weekends, evenings), exceptional availability, **urgency tier**: planned-only / can act within days / same-day emergency | |

### F6. Discovery & mission applications
- Browse/search open missions (from orgs) with filters: mission type, species, place/route, urgency, org type — the hub's missions board (phase 4).
- Apply to a mission with a short message; track status (sent → seen → accepted/declined → completed).
- Saved searches → notification when a matching mission appears (this is the killer feature for urgent transports).

### F7. History & reputation (deliberately conservative — phase 4/5)
Rating humans on "trustability" is legally and ethically loaded (GDPR profiling concerns, defamation risk, discouragement of new volunteers). Sequenced approach:

1. **Phase 3 (launch):** verified facts only — email/phone verified, profile completeness, member since.
2. **Phase 4:** **mission history** — count of completed missions, confirmed by both sides. Objective, non-gameable, no opinions.
3. **Phase 5 (after real usage teaches us):** possible additions — org endorsements (structured tags like "punctual", "great with fearful dogs", only after a completed mission, no free text, no numeric score), reliability signal (completed vs. accepted-then-abandoned). **Never**: public 1–5 stars on people, at least until strongly justified. Full design in the [reputation-system-design decision issue](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+reputation).

### F8. Safety & privacy
- Exact address never public — area/city only; precise info shared only after an org accepts an application.
- Minors excluded (18+) in v1.
- Report/block mechanism from day one.
- GDPR: capability data is personal data; explicit consent for visibility, easy export & deletion.

## F9. Matching (phase 5 — the long-term differentiator)
- From search to suggestion: notify volunteers when a mission matches their structured capabilities ("a transport Lyon→Grenoble was just posted; it's on your declared route").
- Suggest foster candidates to orgs for a given animal (species, capacity, special-care match).
- Start rule-based on structured fields (route overlap, radius, species, urgency tier). No ML until rules stop being good enough.

## F10. Trust & moderation (cross-cutting)
- Only verified organizations appear by default (filter to include unverified, clearly badged).
- Content reporting on any public object; admin moderation queue.
- No user-generated free-text reviews of orgs or people in v1 (see the [reputation-system-design decision issue](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+reputation)).

## MVP cut

**Phase 2** (adopters/donors): F1 + F2 + F3, read-only, with email-based adoption inquiries. No accounts needed for browsing; account only to inquire (or even email-only, no account — decide during design).

**Phase 3** (volunteers): F4, F5 (transport + foster + availability types first — they serve the most urgent real-world need), F6 with basic filters + email notifications for saved searches. F7 tier 1 only (verified facts). F8 basics (area-only location, report button).

## Explicitly out of scope (v1)

- In-app payments/donation processing.
- Reviews/comments on animals, orgs, or people in v1.
- Adoption paperwork workflow (contracts, certificates — France's *certificat d'engagement*, see the [adopter-accounts decision issue](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+adopter)).
- Cross-posting to Leboncoin-style marketplaces.
- Background checks / identity verification services for volunteers.
- In-app chat (email relay first).
- Volunteer ↔ volunteer social features.
- Formal volunteering agreements/paperwork generation (open question — French *bénévolat* norms, Spanish *Ley del Voluntariado* requires written agreement for organized volunteering; may need document templates later).

## Success metrics

- % of adoption inquiries on hub-listed animals that originate from the hub (vs. Facebook).
- Organic search impressions on animal pages (SEO working).
- First adoption completed via a hub inquiry; first donation click-through to an external cagnotte.
- ≥ 50% of volunteer profiles have at least one *structured* capability (not just a bio).
- First real-world mission completed through the platform (north-star moment).
- Median time-to-first-application on urgent transport missions < 24h.
- Phase 4+: mission fill rate (posted → completed).
