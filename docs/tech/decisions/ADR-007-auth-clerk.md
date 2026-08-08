# ADR-007: Clerk for authentication

- **Status:** accepted (user decision, 2026-07-08)
- **Date:** 2026-07-08

## Context

Three apps share one identity system (see `overview.md`): a person can be both an organization member (with per-org roles) and a volunteer. `ADR-003` left the choice between Convex Auth (native to the backend) and Clerk (a dedicated auth vendor) as a phase-0 spike, tracked as a GitHub issue labeled `decision`.

## Decision

**Clerk** is the auth provider for all three apps, integrated with the shared Convex backend.

## Rationale

- Eases things for both sides: a polished, ready-made sign-up/sign-in/account UI for end users (association managers, volunteers, adopters), and less auth plumbing to build and maintain solo compared to rolling deeper on Convex Auth.
- Convex has first-class Clerk integration (JWT-based), so this doesn't fight `ADR-003`'s "one shared backend" decision — Convex functions still authorize via org membership as designed in `architecture.md`.
- Convex Auth was the lower-vendor-count alternative, but Clerk's maturity on multi-tenant/org-scoped auth patterns (organizations, invitations, roles) maps closely to Anima's own org-membership model, saving custom-build time.

## Consequences

- One more third-party vendor and its cost curve to watch at scale (acceptable at side-project scale; revisit if pricing becomes a problem — same posture as Convex in `ADR-003`).
- Verify Clerk's EU data residency / RGPD posture alongside the Convex EU-residency check already gating phase 0 (see the RGPD-baseline decision issue).
- Org/role modeling in Convex schema should lean on Clerk's organization primitives where they line up with Anima's admin/editor roles, rather than reinventing them.
