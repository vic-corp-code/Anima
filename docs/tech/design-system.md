# Design system — Back Office (BO / shelter workspace)

Starting point for the shelter workspace's visual design. Scope is the BO only for now — the public hub (phase 2a) and volunteer platform (phase 3) get their own design pass later, once this establishes the pattern.

**Ground truth: the "Shelter Workspace Mission" mockup** — 6 static HTML/CSS screens produced in Open Design, copied into [`docs/tech/design-mockups/`](design-mockups/) (`index`, `dashboard`, `announcements`, `fundraising`, `registry`, `social`). [`design-mockups/EXTRACTION.md`](design-mockups/EXTRACTION.md) is the full reverse-engineered spec (exact colors, type scale, spacing, per-screen component inventory, JS-interaction inventory) — read it before building any screen below. This doc stays a summary; EXTRACTION.md has the pixel-level detail.

## Approach

- **Base primitives: shadcn/ui** (Radix + Tailwind v4). `packages/ui` already has the underlying deps (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`) but no `components.json` — components were hand-copied (`button.tsx`, `card.tsx`, `input.tsx`). First step is initializing the shadcn CLI properly so palettes and blocks can be pulled with `npx shadcn add`.
- **Palette: extracted from the mockup, not a fresh tweakcn pick.** Light-mode values only (the mockup has no dark mode at all — see Dark mode below). Apply to the existing `@theme inline` block in `apps/shelter/src/app/globals.css`:

  | Token | Value | shadcn slot |
  |---|---|---|
  | background | `#ffffff` | `--background` |
  | surface | `#f5f5f5` | `--color-muted` |
  | foreground | `#000000` | `--foreground` (mockup uses pure black, not the current `#171717`) |
  | muted text | `#8c8c8c` | `--color-muted-foreground` |
  | border | `#dbdbdb` | `--color-border` / `--color-input` |
  | accent (navy) | `#032f62` | `--color-primary` |
  | accent-secondary (red) | `#d73a49` | `--color-destructive` |
  | success (green) | `#17a34a` | **new token**, `--color-success` |
  | warning (orange) | `#ea580c` | **new token**, `--color-warning` |
  | radius | `8px` | `--radius` — already matches shadcn's default `0.5rem`, no change needed |

  This resolves the "Tone & visual identity" decision (#77) — close it once this palette is applied.
- **Runtime accent switcher, BO-wide (not per-organization).** `index.html`'s theme picker is a real working feature (9 preset accent pairs, `documentElement.style.setProperty`), not just mockup chrome — port the interaction pattern (`Popover` + `RadioGroup` of swatches) but keep it a single **localStorage-persisted preference for the whole BO app**, matching how the mockup actually works. Per-organization theming is out of scope until the volunteer/hub apps (phase 3+) exist — don't build org-level storage for this now.
- **Layout scaffolding: [ui.shadcn.com/blocks](https://ui.shadcn.com/blocks)** — pull a dashboard/sidebar block as the shell, data-table blocks for list screens, form blocks for create/edit — then swap in Anima's real entities/fields, using the mockup's own layout/component choices (see EXTRACTION.md §3) as the spec for what to swap in. Only hand-build where no block fits (the AI chat panel, the announcement multi-channel preview).
- Mobile nav: replace the hand-rolled bottom-tab bar (`OrgNav.tsx`) with the shadcn sidebar block's own responsive behavior (slide-out `Sheet` on mobile). Note: the mockup does **not** demonstrate any mobile pattern — every screen just hides the sidebar below 1024px with no replacement. Build this from the shadcn block's own defaults, not from the mockup.

## Dark mode

**In scope, not deferred** — but the mockup provides zero guidance (no `.dark` class, no `prefers-color-scheme` query anywhere in the 6 files). `apps/shelter/globals.css` already has a dark block; every token in the palette table above needs an independently-chosen dark equivalent as its own small design pass before/alongside building each screen.

## Typography notes from the mockup

- Font: Geist everywhere (display and body are identical) — already loaded via `next/font` in this app, nothing new to add.
- Base body size is `15px`, not Tailwind's `16px` default — decide once whether to override globally.
- Font-weight `510` is used pervasively (buttons, nav items) where Tailwind has no matching step — recommend snapping to `font-medium` (500) rather than introducing a one-off weight.
- Letter-spacing is precise and non-default (`-0.02em` headings, `0.06em` uppercase micro-labels) — use arbitrary-value Tailwind classes (`tracking-[-0.02em]`) where fidelity matters, the default `tracking-tight`/`tracking-wide` scale won't hit these values.

## Constraints to carry into every screen

- **i18n**: all copy goes through `next-intl` message catalogs (`packages/i18n`) — no hardcoded strings in adapted block code, per CLAUDE.md convention. FR is default, ES ships alongside.
- **Dark mode**: `globals.css` already has a `prefers-color-scheme: dark` block — new tokens/components must support both.
- **TypeScript strict** everywhere; components live in `packages/ui` when shared across future apps, or `apps/shelter/src/components` when BO-specific (like `OrgChat.tsx`).
- Existing reusable cards (`AnnouncementCard`, `CagnotteCard`, `NewsPostCard` in `packages/ui`) are shared with the future public hub — restyle them in place rather than forking.

## Screen inventory

Grounded in `apps/shelter/src/app/[locale]/organizations/[organizationId]/` and `packages/backend/convex/schema.ts`.

| Screen | Route | Entity / key fields | Candidate block | New shadcn primitives | Mockup reference |
|---|---|---|---|---|---|
| Org shell (nav) | layout | — | `sidebar` block (desktop + mobile Sheet) | `sidebar` | `index.html`'s nav shell pattern (EXTRACTION.md §2) — mobile behavior is NOT in the mockup, design fresh |
| Org dashboard | `/organizations/[id]` | org + counts across all entities, `VerificationCard` | dashboard-style stat cards | `badge` | `dashboard.html` (#106) — see scope notes below |
| Animal list | `/animals` | species, sex, status, sterilized, photoUrls | `data-table` block | `table`, `badge`, thumbnail (plain rounded `<img>`, not a circular `avatar`) | `registry.html` (#107) — **reconcile mockup's 4 status labels against the real 7-value enum** (`in_care`/`adoptable`/`adoption_pending`/`adopted`/`fostered`/`transferred`/`deceased`) before assigning badge colors |
| Animal detail | `/animals/[id]` | full record + `animalEvents` timeline | profile/detail layout | `tabs`, `badge`, image carousel | not in mockup — no visual reference, decide fresh |
| Animal create/edit | `/animals/new`, `/animals/[id]/edit` | identity, health, behavior, media sections | form block | `select`, `checkbox`, `textarea`, `form` (react-hook-form + zod) | not in mockup — no visual reference, decide fresh |
| Animal → announcements | `/animals/[id]/announcements` | filtered announcement list | reuse announcements list pattern | — | — |
| Announcements list/actions | `/announcements`, `/announcements/[id]` | title, status, publishedAt/closedAt | card-grid (reuses `AnnouncementCard`) | `badge`, `dropdown-menu` | not in mockup — see below, split from create |
| Announcement create/edit | `/announcements/new` | animal, story, photos, publication channels | two-column form + live multi-channel preview | `select`, `textarea`, checkbox group, reuse `PhotoUpload` | `announcements.html` — bespoke multi-platform preview, no shadcn block covers it |
| Cagnottes list/detail | `/cagnottes`, `/cagnottes/[id]` | targetAmount, currentAmount, deadline, externalUrl | card-grid (reuses `CagnotteCard`) + creation `Dialog` | `progress`, `dialog`, `select` | `fundraising.html` (#111) — matches well; mockup's donor-count stat and category field have no schema backing, dropped for v1 |
| News list/detail | `/news`, `/news/[id]` | title, linkedAnimalIds, linkedCagnotteId | card-grid (reuses `NewsPostCard`) | — | not in mockup — `social.html` is a different feature, see below, not this screen |
| Members | `/members` | userId, role (admin/editor), invites | `data-table` block | `table`, `avatar`, `dialog` (invite link) | not in mockup — no visual reference, decide fresh |
| Org creation | `/organizations/new` | name, type, country (FR enabled/ES gated) | form block | `select`, `radio-group` | not in mockup — no visual reference, decide fresh |
| Verification | (card on dashboard) | verificationStatus, registryNumber | small card, self-declare form | `badge` | not in mockup — no visual reference, decide fresh |
| AI chat | `OrgChat.tsx` | 25 tool types, human-approval UI | mostly bespoke | `sheet`/`drawer`, borrow message-bubble styling only | not in mockup — no visual reference, decide fresh |
| Sign-in/up | `/sign-in`, `/sign-up` | Clerk-hosted | — | theme via Clerk's `appearance` prop only | not in mockup |
| Invite accept | `/invite/[token]` | invite token → org join | simple accept card | — | not in mockup |

## Primitives to install

`table`, `badge`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `select`, `textarea`, `checkbox`, `radio-group`, `popover`, `form`, `avatar`, `progress`, `sonner` (toast), `skeleton`, `separator`, `breadcrumb`, `sidebar`. (`button`, `card`, `input` already exist — replace with CLI versions if they drift from the block-provided ones. `popover` added for the accent-color switcher.)

## Scope decisions made against the mockup (2026-08-05)

The mockup proposes several dashboard/social concepts with no schema or issue backing. Decided:

- **Shelter capacity + volunteer-count stat cards** (dashboard): dropped from v1, no schema fields exist for either. Tracked as future ideas, not this milestone — see issues on the Phase 5 milestone.
- **Org-wide "recent activity" feed** (dashboard): dropped from v1 — would need a new cross-entity audit-log table just for a dashboard widget. Tracked as a future idea on the Phase 5 milestone.
- **"Besoins urgents" (urgent needs) list** (dashboard): not a new table — derive it from existing data instead (e.g. cagnottes under their goal, animals flagged for medical care). No new entity.
- **`social.html`'s composer is not this milestone's scope at all** — it's the visual reference for **Phase 2b's already-decided social composer** (ADR-006, "generate & copy first, APIs later"). Keep the file as reference for when Phase 2b starts; don't build it as part of the BO design pass. A follow-up `[decision]` issue captures the one genuinely new idea it raised (event-triggered post suggestions, e.g. marking an animal adopted auto-drafting a post) for Phase 2b to reflect on.
- **Cagnotte donor-count and `category` field**: no schema backing, dropped for v1 (see the cagnottes row above).

## Open decisions this touches

- [Tone & visual identity](https://github.com/vic-corp-code/Anima/issues/77) — resolved by the palette table above (extracted from the mockup, not a fresh tweakcn pick); close once applied.
- [Product names](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+product+names) — naming is separate from visuals, not blocking this work.
