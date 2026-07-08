# Product Spec — Volunteer Platform

Where individuals declare what they can offer animal welfare organizations: skills, resources, time, logistics. Built in **phase 3**, after the shelter workspace and hub exist (volunteers need something to volunteer *for*).

## Target user

Motivated individuals with concrete, underused resources:
- *"In my job I drive from X to A regularly — I can transport pets needing urgent care."*
- *"I have a big house with a dedicated room for nursing cats, and 10 years of experience."*
- *"I'm free every weekend and can help at events or with shelter maintenance."*

Today these people help ad-hoc via Facebook groups and phone chains. Their capabilities are invisible until someone happens to ask.

## Jobs to be done

1. **"Let organizations know what I can offer, once, in a structured way."**
2. **"Find missions/projects that match my capabilities and area."**
3. **"Be reachable for urgent needs I've opted into."**
4. **"Build a track record so organizations trust me with animals."**

## Feature areas

### F1. Profile
- Identity: name, photo, city/area, languages (FR/ES/…), short bio.
- Contact preferences and notification channels.
- Visibility control: public on hub / visible to verified orgs only / hidden (search-only mode).

### F2. Structured capabilities (the core innovation — not a free-text CV)
Capabilities are **typed**, so orgs can filter and matching can work:

| Capability type | Structured fields | Example |
|---|---|---|
| **Transport** | regular route (from → to, frequency) or radius; vehicle type; can carry (cage sizes, species); urgent-capable? | "Lyon → Grenoble, 2×/week, car with 2 large cages, same-day OK" |
| **Foster / home care** | housing type, dedicated space?, garden?, other animals present, species accepted, capacity, special care (nursing, kittens, medical, quarantine) | "House, dedicated cat nursing room, capacity 4, 10 y experience" |
| **On-site help** | tasks (cleaning, walking, handling, maintenance), physical constraints | |
| **Skills** | vet/vet-tech, photography, communication, IT, legal, event organizing… + experience level & proof (diploma, years) | |
| **Availability** | recurring slots (weekends, evenings), exceptional availability, **urgency tier**: planned-only / can act within days / same-day emergency | |

### F3. Discovery & applications
- Browse/search open missions (from orgs) with filters: mission type, species, place/route, urgency, org type.
- Apply to a mission with a short message; track status (sent → seen → accepted/declined → completed).
- Saved searches → notification when a matching mission appears (this is the killer feature for urgent transports).

### F4. History & reputation (deliberately conservative — phase 4/5)
Rating humans on "trustability" is legally and ethically loaded (GDPR profiling concerns, defamation risk, discouragement of new volunteers). Sequenced approach:

1. **Phase 3 (launch):** verified facts only — email/phone verified, profile completeness, member since.
2. **Phase 4:** **mission history** — count of completed missions, confirmed by both sides. Objective, non-gameable, no opinions.
3. **Phase 5 (after real usage teaches us):** possible additions — org endorsements (structured tags like "punctual", "great with fearful dogs", only after a completed mission, no free text, no numeric score), reliability signal (completed vs. accepted-then-abandoned). **Never**: public 1–5 stars on people, at least until strongly justified. Full design in OPEN_QUESTIONS.

### F5. Safety & privacy
- Exact address never public — area/city only; precise info shared only after an org accepts an application.
- Minors excluded (18+) in v1.
- Report/block mechanism from day one.
- GDPR: capability data is personal data; explicit consent for visibility, easy export & deletion.

## MVP cut (phase 3)

F1, F2 (transport + foster + availability types first — they serve the most urgent real-world need), F3 with basic filters + email notifications for saved searches. F4 tier 1 only. F5 basics (area-only location, report button).

## Explicitly out of scope (v1)

- Background checks / identity verification services.
- In-app chat (email relay first).
- Volunteer ↔ volunteer social features.
- Formal volunteering agreements/paperwork generation (open question — French *bénévolat* norms, Spanish *Ley del Voluntariado* requires written agreement for organized volunteering; may need document templates later).

## Success metrics

- ≥ 50% of profiles have at least one *structured* capability (not just a bio).
- First real-world mission completed through the platform (north-star moment).
- Median time-to-first-application on urgent transport missions < 24h.
