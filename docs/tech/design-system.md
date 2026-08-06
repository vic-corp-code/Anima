# Design system — Back Office (BO / shelter workspace)

Starting point for the shelter workspace's visual design. Scope is BO-Shelter only for now — Hub (phase 2a, and phase 3's volunteer section — resolved to live inside `apps/hub`, not a separate app, see [#12](https://github.com/vic-corp-code/Anima/issues/12)) and ShelterWeb (a separate, optional, not-yet-scheduled app — one shelter's own standalone site, decided in [#91](https://github.com/vic-corp-code/Anima/issues/91)) get their own design pass later, once this establishes the pattern.

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

**In scope, not deferred.** A proof-of-concept now exists on 2 of the 6 mockup screens (`index.html`, `dashboard.html`, added 2026-08-05) — see `docs/tech/design-mockups/EXTRACTION.md` §1 for full detail. Mechanism and values:

- Toggle is an explicit user choice (`[data-theme="dark"]` attribute on the root element + a sun/moon button), **not** a `prefers-color-scheme` media query — same BO-wide, `localStorage`-persisted pattern as the accent-color picker above. Build both as one small settings surface, not two independent floating buttons (the mockup itself ends up placing two separate floating buttons in the same corner — don't repeat that).
- Base tokens have dark values: `--bg` → `#0f0f0f`, `--surface` → `#1a1a1a`, `--foreground` → `#f0f0f0`, muted text → `#a0a0a0`, border → `#2a2a2a`.
- **Still open**: the example reuses the light-mode `--color-primary`/`--color-destructive` (navy/red) unchanged in dark mode — flagged by its own author as a contrast risk, not a considered decision. `--color-success`/`--color-warning` have no dark values at all yet. Resolve both before shipping dark mode for real, likely with lightened variants for dark backgrounds.
- Only applied to 2 of 6 mockup screens — apply the same base tokens to the other 4 when building them.

`apps/shelter/globals.css` already has a `prefers-color-scheme: dark` block from scaffolding — note the mechanism decided here (explicit toggle) means that media-query block should likely be replaced by the attribute-based approach, not merged with it.

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

## Component organization

Decided for [#136](https://github.com/vic-corp-code/Anima/issues/136) (2026-08-06), ahead of 15+ screen issues landing in parallel on this milestone — gates the Foundation wave. Read [`docs/tech/design-mockups/audit-component-mapping.md`](design-mockups/audit-component-mapping.md) (#130) for the full bespoke-component inventory referenced below.

### 1. shadcn CLI-sourced primitives stay flat in `components/ui/`

Confirmed as a decision, not just current state: every primitive pulled via `npx shadcn add` — the already-installed set (`button`, `card`, `input`, `table`, `badge`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `select`, `textarea`, `checkbox`, `radio-group`, `popover`, `form`, `avatar`, `progress`, `sonner`, `skeleton`, `separator`, `breadcrumb`, `sidebar`, `label`, `tooltip`), plus `switch`, `alert`, `pagination` (#137), `toggle-group` (candidate raised in #130's audit), and any future ones — lands directly in `packages/ui/src/components/ui/`, one file per primitive, no subfolders. This matches the pattern set by #102/#104.

Reason: it must stay safe to re-run `npx shadcn add <name>` and diff the result without hunting through domain folders for a stray hand-edited copy. If a primitive needs Anima-specific restyling beyond tokens/variants, restyle it in place in `components/ui/` — don't fork it into a domain folder under a new name.

### 2. New bespoke/composite components: domain-grouped folders, following existing precedent

`animals/`, `announcements/`, `cagnottes/`, `news/` already group composites by schema entity, and a component can live in one domain's folder while being reused from another (`PhotoUpload.tsx` lives in `components/animals/` but is imported into the announcement create/edit screen — see the "Constraints" section above). Consistency wins over inventing a new structure: keep grouping by domain, and treat cross-domain reuse as normal rather than a reason to relocate a component.

Applying this to #130's bespoke/no-shadcn-equivalent inventory:

| New composite | Folder | Why |
|---|---|---|
| `StatTile`/KPI card, KPI delta indicator, bar chart, donut chart, needs-attention list, activity feed | `components/dashboard/` (new) | Dashboard-screen-specific; no existing domain folder fits, and the dashboard is a first-class screen in the inventory above |
| `AnimalCard` (`.animal-card`), adoption-stage stepper | `components/animals/` | Entity-specific — the stepper tracks one animal's adoption progress, same domain `PhotoUpload`/`AnimalForm` already live in |
| Media card / media tile (`.media-card`/`.media-tile`) | `components/media/` (new) — **only if/when a media-library screen is actually built.** It's not in this doc's screen inventory today; don't create the folder speculatively | — |
| Status pill (`.pill--*`), banner/alert wrapper (`.banner--*`), custom breadcrumb (`.crumbs`), file-upload dropzone (`.drop-area`) | `components/common/` (new) | Cross-cutting — no single entity owns a status pill, a banner, or a breadcrumb; these get used from every domain folder and from app shell chrome |

Rule for anything not in this table: if a new composite is tied to one schema entity or one dedicated screen, it joins that entity's/screen's folder (creating a new domain folder if none exists yet, as with `dashboard/` above). If it's genuinely used across domains with no natural single owner, it goes in `common/`. Don't create a new domain folder for a single one-off component — check whether `common/` already fits first.

### 3. File naming: kebab-case and PascalCase coexist, deliberately

- `components/ui/*.tsx` — kebab-case (`dropdown-menu.tsx`, `radio-group.tsx`), because that's what the shadcn CLI writes verbatim. Never rename these to PascalCase — it breaks the "safe to re-run `npx shadcn add`" property from decision 1.
- `components/<domain>/*.tsx` — PascalCase (`AnimalForm.tsx`, `PhotoUpload.tsx`, `AnnouncementCard.tsx`, `CagnotteCard.tsx`, `NewsPostCard.tsx`, and new ones like `StatTile.tsx`), matching every composite that exists today.

This split is deliberate, not an inconsistency to clean up later: kebab-case marks "generated by the shadcn CLI, treat as regenerable"; PascalCase marks "hand-written composite, ours to change freely." New composites should always be PascalCase regardless of which folder they land in; new primitives pulled by the CLI should always be kebab-case. Don't force one convention repo-wide.

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
