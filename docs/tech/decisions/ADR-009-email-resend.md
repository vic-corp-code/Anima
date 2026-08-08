# ADR-009: Resend for transactional email

- **Status:** accepted (user decision, 2026-08-03)
- **Date:** 2026-08-03

## Context

The RGPD-baseline decision issue left the email provider open, decide-by phase 1. Nothing in Phase 1 actually blocks on it — invites ship as shareable links (no email infra needed) — but Phase 2's adoption-inquiry relay does need one, and the roadmap's new standing rule 5 requires decide-by-phase-1 items to be resolved before Phase 1 counts as complete.

Same RGPD-first posture that drove `ADR-008` (Geoapify) applies here: any provider handling adopter/org contact emails is a third party processing EU personal data.

## Decision

**Resend**, using its EU-hosted sending region, for all transactional email (Phase 2 inquiry relay first; future invite/notification email if that path is ever revisited).

## Rationale

- Has an official Vercel Marketplace listing — provisioning goes through `/marketplace` like other integrations on this stack, rather than a bespoke API key setup.
- Offers an EU region for sending, fitting the RGPD-first stance already established for Convex (`ADR-003`) and Geoapify (`ADR-008`).
- Simple API, good Next.js ecosystem fit — low integration overhead for a solo builder.

## Consequences

- No code or dependency exists yet — this ADR fixes the *choice*, not the integration. Provisioning (via `/marketplace`) and wiring happen when Phase 2's inquiry relay is actually built.
- Still worth confirming Resend's specific DPA/data-processing terms during the RGPD baseline work (see the decision issue), same as the Convex, Clerk, and Geoapify checks.
