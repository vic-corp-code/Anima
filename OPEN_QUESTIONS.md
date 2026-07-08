# Open Questions

Decisions deliberately deferred. Each has a **decide-by** phase (see [ROADMAP.md](docs/roadmap/ROADMAP.md)). Move resolved items to the bottom with the decision + date.

## Naming & branding
- **Product names.** "Anima" is a working title (collision risk: several products use it). Sub-brand the three apps or one brand with sections? Domain availability FR/ES. → *decide by end of phase 1 (before public hub).*
- Tone & visual identity: warm/associative vs. modern/efficient. → *phase 1.*

## Legal & compliance
- **Legal structure for Anima itself**: association loi 1901? SASU? Nothing until traction? Affects liability (user data, marketplace role) and eligibility to partner with public SPAs. → *before phase 2 goes public.*
- **RGPD baseline**: privacy policy, DPA with providers (Convex, Vercel, email), records of processing. Is Convex EU-resident? (blocking check in phase 0). → *phase 0–1.*
- **France, certificat d'engagement de connaissance** (mandatory since 2022 for adopters): does the hub need to surface/track it in the inquiry flow, or leave it fully to orgs? → *phase 2.*
- **Spain: Ley 7/2023 de bienestar animal** implications for announcements (e.g., rules around advertising animals, breeder vs. shelter distinctions). Needs proper reading. → *phase 2.*
- **Volunteer law**: ES Ley 45/2015 requires written agreements for organized volunteering; FR bénévolat is informal. Do we generate agreement templates? Are missions "organized volunteering"? → *phase 4.*
- Liability when a mission goes wrong (animal injured during volunteer transport): disclaimers, insurance guidance for orgs/volunteers. → *phase 4.*

## Product
- **Reputation system design** (the hardest one): what exactly beyond objective mission counts? Structured endorsement tags? Reliability ratio? Who sees what? Appeal process? Explicitly NOT free-text public reviews or star ratings in early versions — revisit with real usage evidence. → *phase 5, informed by phases 3–4.*
- **Volunteers app vs. hub section**: separate Next.js app or a surface of the hub? (Architecture keeps this cheap to decide.) → *start of phase 3.*
- Adopter accounts: browse without account is settled; can you *inquire* without an account (email-only)? → *phase 2 design.*
- Do informal groups (no RNA/registry) get full features or a limited unverified tier? Where's the fraud line (fake shelters farming donations)? → *phase 1–2.*
- Multiple animals per announcement (litters)? → *phase 1, cheap to decide early.*
- Machine translation of user content (FR↔ES) — labeled auto-translate, on-demand, or never? → *phase 3+.*
- Should orgs' hub pages support custom domains (becoming their website)? → *phase 5.* Note: phase 2 now ships a basic site editor (shelter-app.md F7) so org pages are themeable/customizable regardless — this question narrows to *pointing the org's own domain* at that page, not whether it can look like a website.
- **Site editor custom block types** beyond free text (images, embeds, multi-page) — expand iteratively based on what pilot orgs actually ask for, not upfront. → *phase 2+, ongoing.*
- Moderation workload: who moderates reports when it's a solo project? Community moderators from pilot orgs? → *before phase 3 (user-generated volunteer content).*

## Tech
- **i18n library**: next-intl vs. alternatives. → *phase 0.*
- Geocoding provider (place names → lat/lng; FR + ES coverage; cost): Google vs. Mapbox vs. OSM/Nominatim. → *phase 0 geo spike.*
- Image pipeline: Convex storage + on-upload resize vs. image CDN. → *phase 1.*
- Card→image rendering approach (satori/resvg in Convex action vs. render endpoint). → *phase 2.*
- Email provider (Resend or similar; EU?). → *phase 1.*
- Analytics choice (Plausible-class). → *phase 2.*
- Data export/backup routine for Convex (lock-in mitigation, ADR-003). → *phase 1.*
- Testing strategy depth: convex-test coverage targets, when Playwright enters. → *phase 1.*

## Ecosystem & partnerships
- Curated list of supported cagnotte platforms per country (FR: HelloAsso, Leetchi…; ES: Teaming, GoFundMe, migranodearena) and whether to prioritize a HelloAsso API read-integration. → *phase 2–5.*
- Relationship with existing players (Seconde Chance, ADOPTION.com-likes, regional federations): compete, ingest, or partner? → *phase 2.*
- I-CAD (FR chip registry) / Spanish regional registries: any integration possible or desirable? → *phase 5.*
- Pilot recruitment: which 1–3 associations, and what do we promise them? → *phase 1 (critical).*

## Business
- Sustainability model (even as a side-project, hosting costs money at traction): free forever core + paid extras for large SPAs? Donations? Public subsidies (FR assos numériques)? → *revisit at each phase boundary; no pressure before phase 4.*

---

## Resolved

- **Market**: France + Spain from day 1, bilingual FR/ES. *(user, 2026-07-07 → ADR-004)*
- **Stack**: TypeScript end-to-end proposed & accepted; Convex as backend with phase-0 validation gates. *(user + ADR-002/003, 2026-07-07)*
- **Team context**: solo side-project → roadmap shape. *(user, 2026-07-07)*
- **Payments**: link out to external platforms, no money handling in v1. *(user, 2026-07-07 → ADR-005)*
- **Social posting**: generate & copy in v1, APIs later. *(ADR-006, 2026-07-07)*
- **Monorepo tooling**: bun workspaces + Turborepo (over pnpm). *(user, 2026-07-08 → ADR-001)*
- **Auth provider**: Clerk (over Convex Auth) — eases things for users and dev. *(user, 2026-07-08 → ADR-007)*
