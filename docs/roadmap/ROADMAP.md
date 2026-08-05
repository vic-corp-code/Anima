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

**The task-level checklist for each phase now lives in GitHub, not here** — one [milestone](https://github.com/vic-corp-code/Anima/milestones) per phase, one issue per bullet. This file keeps the *why* (goals, sequencing, exit gates); GitHub tracks the *what's done*.

---

## Phase 0 — Foundations & de-risking (~2–4 weekends)

Goal: a running skeleton and answers to the questions that could invalidate the stack.

**Status: done.** Monorepo scaffold, Convex schema + Clerk auth, i18n (FR/ES), the three Convex validation gates (geo, SSR/SEO, EU residency), design tokens, and repo hygiene (CI, CLAUDE.md) are all shipped — see the [Phase 0 milestone](https://github.com/vic-corp-code/Anima/milestone/1) (closed) for the itemized, dated record.

**Exit gate:** logged-in user creates an organization, in FR and ES, on a deployed preview; all three Convex gates green (else switch to Supabase now — see ADR-003). *Met.*

## Phase 1 — Shelter workspace MVP (~2–3 months part-time)

Goal: one real association replaces its spreadsheet.

**Status: feature-complete.** Animal registry, members & roles, announcements, cagnottes, news posts, manual org verification, the conversational AI intake agent with full CRUD tools, org dashboard navigation, and archive lifecycles are all shipped — see the [Phase 1 milestone](https://github.com/vic-corp-code/Anima/milestone/2) (closed) for the itemized, dated record. Transactional email and pilot recruitment remain open (not blocking) — see the milestone's 2 open issues.

**Recruit 1–3 pilot associations in France** (Spain is gated at account creation until enabled, see ADR-004) — deferred for now (2026-07-30). Rationale: all Phase 1 features are checked off; the workspace is feature-complete but needs a real-world reliability pass before onboarding non-technical users — see issues labeled [`bug`](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Abug) for remaining open items (none blocking, but fixing them first will improve the pilot experience).

**Exit gate:** ≥1 pilot org manages its real animals in Anima for 4 consecutive weeks; "arrival → announcement live" under 10 min. *(Gate itself unchanged — only the timing of when to start recruiting toward it has moved.)*

## Phase 2 — Public hub, read-only (~1–2 months)

Goal: pilot orgs' animals and cagnottes are public, filterable, and Google-indexable.

Split into two independent tracks: **2b has no dependency on 2a** and can be built first, in parallel, or during Phase 1's pilot-recruitment wait — it only reads Phase-1 data (animals/news/cagnottes) and shares no code with the hub beyond the existing card components.

### Phase 2a — Hub core

In progress — see the [Phase 2a milestone](https://github.com/vic-corp-code/Anima/milestone/3): animals directory with filters, org site editor, adoption inquiry email relay, SEO (SSR/ISR + sitemaps), verified-org default filter + reporting, and privacy-friendly analytics.

**Exit gate (2a):** first adoption inquiry arrives via the hub; animal pages indexed by Google.

### Phase 2b — Social composer v1

See the [Phase 2b milestone](https://github.com/vic-corp-code/Anima/milestone/4): per-network captions + rendered post/story images from animals/news/cagnottes (generate & copy, ADR-006).

**Exit gate (2b):** pilot orgs use the composer ≥ weekly.

## Phase 3 — Volunteer platform (~2 months)

Goal: individuals can declare structured capabilities and find orgs.

See the [Phase 3 milestone](https://github.com/vic-corp-code/Anima/milestone/5): app-boundary decision (`apps/volunteers` vs. a hub section), signup + profile CRUD, visibility controls, structured capabilities (transport/foster/availability first), volunteer directory, safety basics, and org browsing.

**Exit gate:** ≥20 profiles with ≥1 structured capability; a pilot org finds and contacts a volunteer.

## Phase 4 — Connection: missions & applications (~2 months)

Goal: the loop closes — a real need is fulfilled through the platform.

See the [Phase 4 milestone](https://github.com/vic-corp-code/Anima/milestone/6): missions in the shelter workspace, missions board + application flow on the hub, saved searches/email alerts, mission history, and notification hardening.

**Exit gate:** first mission posted, matched, completed, and confirmed by both sides. 🎉 (north-star moment)

## Phase 5 — Trust, matching & growth (ongoing)

Direction, not commitments — re-plan with real usage data. See the [Phase 5 milestone](https://github.com/vic-corp-code/Anima/milestone/7): proactive matching, reputation tier 3, HelloAsso integration, direct social publishing, adopter accounts, machine translation, and mobile/registry-integration evaluation.

---

## Standing rules

1. **Don't start phase N+1 before phase N's exit gate.** Gates are user-behavior facts, not feature checklists — Phase 0's three-spike gate is the deliberate exception, since de-risking is inherently checklist-shaped.
2. **Pilot feedback outranks this roadmap from the moment Phase 1's pilot begins** — re-cut Phase 2 scope with Phase 1 learnings, and phases 4+ with Phase 2/3 learnings.
3. **Anything cut goes to a GitHub issue labeled `decision`** — never silently dropped.
4. Revisit issues labeled [`decision`](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision) at each phase boundary; several have "decide by" phases noted in the issue body and are attached to that phase's milestone.
5. **Before treating a phase's checklist as complete, every open `decision` issue attached to that phase's milestone must be resolved (closed with the decision recorded) or explicitly re-milestoned** — not left stale.
