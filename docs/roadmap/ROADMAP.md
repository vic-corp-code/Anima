# Roadmap

Calibrated for a **solo, part-time builder**: phases are sequential, each ships something independently useful, and each has an explicit exit gate before the next begins. No calendar dates — phases end when their gate is met. Durations below are rough effort feelings, not commitments.

```
Phase 0          Phase 1              Phase 2              Phase 3              Phase 4              Phase 5
Foundations  →   Shelter MVP      →   Public Hub       →   Volunteers       →   Connection       →   Trust & Growth
(spikes,         (registry,           (directory,          (profiles,           (missions,           (matching,
 skeleton)        announcements,       cagnottes,           capabilities,        applications,        reputation,
                  cagnottes)           org pages, SEO)      search)              composer v2)         integrations)
```

**Sequencing rationale:** shelter workspace first because everything derives from its data. Hub second because it makes phase-1 data publicly valuable immediately (shelters get reach — the retention hook) and needs no second user population. Volunteers third, once there are organizations to volunteer for. Connection (missions ↔ volunteers) only when both sides exist.

---

## Phase 0 — Foundations & de-risking (~2–4 weekends)

Goal: a running skeleton and answers to the questions that could invalidate the stack.

- [ ] Monorepo scaffold: bun workspaces + Turborepo, `apps/shelter` + `packages/{backend,ui,i18n,domain,config}` (hub/volunteers apps created in their phases). Quick spike confirming bun plays well with Convex + Next.js tooling; fall back to pnpm if it fights either (ADR-001).
- [ ] Convex project + first schema slice (organizations, users, memberships).
- [ ] Wire Clerk auth (ADR-007): login/signup, org membership synced to Convex.
- [ ] i18n wiring (next-intl or chosen lib), FR + ES catalogs, lint rule against hardcoded strings.
- [ ] **Spike: geo** — store lat/lng, radius query via Convex geospatial component. *Convex validation gate #1 (ADR-003).*
- [ ] **Spike: SSR/SEO** — server-render a page from Convex data with ISR. *Gate #2.*
- [ ] **Check: Convex EU data residency.** *Gate #3.*
- [ ] Basic design tokens in `packages/ui` (the three apps must feel like one product later).
- [ ] Repo hygiene: CI (typecheck/lint/test), preview deployments, README, CLAUDE.md for the repo.

**Exit gate:** logged-in user creates an organization, in FR and ES, on a deployed preview; all three Convex gates green (else switch to Supabase now — see ADR-003).

## Phase 1 — Shelter workspace MVP (~2–3 months part-time)

Goal: one real association replaces its spreadsheet.

- [ ] Animal registry: CRUD, photos (Convex file storage + resizing), status lifecycle, event timeline, mobile-friendly list with filters.
- [ ] Members & roles (admin/editor), email invites.
- [ ] Adoption announcements: auto-draft from animal record, compact card format (the reusable component), publish/close lifecycle.
- [ ] Cagnottes: create with external link (ADR-005), manual progress, list.
- [ ] Minimal news posts.
- [ ] Manual org verification flow (declare RNA/SIRET/ES-registry, admin marks verified).
- [ ] Transactional email (invites, inquiry relay groundwork).
- [ ] **Recruit 1–3 pilot associations in France** (Spain is gated at account creation until enabled, see ADR-004) — product work, not code, and the most important line in this phase.

**Exit gate:** ≥1 pilot org manages its real animals in Anima for 4 consecutive weeks; "arrival → announcement live" under 10 min.

## Phase 2 — Public hub, read-only (~1–2 months)

Goal: pilot orgs' animals and cagnottes are public, filterable, and Google-indexable.

- [ ] `apps/hub`: animals directory with filters (species, place/radius, org type + secondary), animal pages, org pages, cagnottes directory.
- [ ] Org site editor in the shelter workspace: theme + section order + free-text custom blocks for org pages (shelter-app.md F7, connect-hub.md F3).
- [ ] Adoption inquiry → email relay to org (no adopter account yet).
- [ ] SEO: SSR/ISR, clean URLs, sitemaps, OpenGraph images (reuses card→image rendering).
- [ ] **Social composer v1 (generate & copy, ADR-006):** per-network captions + rendered post/story images from animals/news/cagnottes.
- [ ] Privacy-friendly analytics; measure inquiry sources and cagnotte click-throughs.

**Exit gate:** first adoption inquiry arrives via the hub; pilot orgs use the composer ≥ weekly; animal pages indexed by Google.

## Phase 3 — Volunteer platform (~2 months)

Goal: individuals can declare structured capabilities and find orgs.

- [ ] `apps/volunteers` (or a hub section — decide now, see architecture note): signup, profile, visibility controls.
- [ ] Structured capabilities: **transport + foster + availability** types first; on-site & skills after.
- [ ] Volunteer directory for verified orgs (search by capability, area).
- [ ] Safety basics: area-only location, report/block, 18+, GDPR export/delete.
- [ ] Volunteer-facing browse of orgs (missions arrive in phase 4).

**Exit gate:** ≥20 profiles with ≥1 structured capability; a pilot org finds and contacts a volunteer.

## Phase 4 — Connection: missions & applications (~2 months)

Goal: the loop closes — a real need is fulfilled through the platform.

- [ ] Missions in shelter workspace: create (type, urgency, location/route, window), manage.
- [ ] Missions board on hub with filters; mission → application flow (sent/seen/accepted/declined/completed with both-sides confirmation).
- [ ] Saved searches + email alerts for volunteers (the urgent-transport killer feature).
- [ ] Mission history on profiles (reputation tier 2 — objective counts only).
- [ ] Notifications hardening (email digests, urgent immediate sends).

**Exit gate:** first mission posted, matched, completed, and confirmed by both sides. 🎉 (north-star moment)

## Phase 5 — Trust, matching & growth (ongoing)

Direction, not commitments — re-plan with real usage data:

- Rule-based proactive matching (route overlap, radius, species, urgency tier).
- Reputation tier 3 (structured endorsements — design carefully, see OPEN_QUESTIONS).
- HelloAsso API read-integration for automatic cagnotte progress.
- Direct social publishing (Meta App Review — its own sub-project).
- Adopter accounts & tracked inquiries; adoption paperwork aids (certificat d'engagement FR).
- Machine-translated content variants (labeled), third locale.
- Mobile app evaluation; I-CAD / registry integrations; multi-org features.

---

## Standing rules

1. **Don't start phase N+1 before phase N's exit gate.** Gates are user-behavior facts, not feature checklists.
2. **Pilot feedback outranks this roadmap.** Re-cut phases 3+ after phase 2 learnings.
3. **Anything cut goes to OPEN_QUESTIONS or a phase-5 bullet** — never silently dropped.
4. Revisit [OPEN_QUESTIONS.md](../../OPEN_QUESTIONS.md) at each phase boundary; several decisions have "decide by" phases.
