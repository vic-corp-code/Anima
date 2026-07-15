# ADR-008: Geoapify for geocoding

- **Status:** accepted (user decision, 2026-07-15)
- **Date:** 2026-07-15

## Context

`architecture.md`'s Geography section calls place-based filtering (radius search, route matching) the top technical risk of the Convex choice. The plan is to geocode addresses (org, mission, volunteer area) to lat/lng **once, at write time**, then run radius queries against stored coordinates via Convex's geospatial component — geocoding itself is low-volume, not a per-search cost. `OPEN_QUESTIONS.md` left the provider choice open pending the phase-0 geo spike, with FR+ES coverage and cost as the stated criteria; RGPD/EU data residency is a phase-0 blocking concern for the project overall (`architecture.md`'s GDPR section), which also bears on sending address text to a third party.

Candidates considered: Mapbox (best free tier and DX, US company with standard EU DPA/SCCs), Google Geocoding API (best raw accuracy, but requires a billing account with a card on file and is the heaviest setup friction), and Geoapify (Germany-based, GDPR-first positioning, OSM-backed data).

## Decision

**Geoapify** is the geocoding provider for address → lat/lng across org, mission, and volunteer-area records.

## Rationale

- EU-native (Germany-based) posture fits the project's RGPD-first stance more directly than a US vendor's SCC/DPA paperwork.
- OSM-backed data has strong France + Spain coverage, matching the FR+ES launch scope (`ADR-004`).
- Free tier (~90k requests/month equivalent) comfortably covers write-time-only geocoding at side-project scale.

## Consequences

- Less polished docs/SDKs than Mapbox — budget a bit more integration time in the phase-0 geo spike.
- One more third-party vendor and cost curve to watch at scale, same posture as Convex (`ADR-003`) and Clerk (`ADR-007`).
- Still worth confirming Geoapify's specific DPA/data-processing terms during the RGPD baseline work (`OPEN_QUESTIONS.md`), same as the Convex and Clerk EU-residency checks.
