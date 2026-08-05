# Design system — Back Office (BO / shelter workspace)

Starting point for the shelter workspace's visual design, and the source data for whatever design-template tool ("claudeDesign") ends up consuming it. Scope is the BO only for now — the public hub (phase 2a) and volunteer platform (phase 3) get their own design pass later, once this establishes the pattern.

## Approach

- **Base primitives: shadcn/ui** (Radix + Tailwind v4). `packages/ui` already has the underlying deps (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`) but no `components.json` — components were hand-copied (`button.tsx`, `card.tsx`, `input.tsx`). First step is initializing the shadcn CLI properly so palettes and blocks can be pulled with `npx shadcn add`.
- **Palette: [tweakcn.com](https://tweakcn.com)** — pick a pre-built theme rather than hand-rolling tokens, apply it to the existing `@theme inline` CSS-variable block in `apps/shelter/src/app/globals.css` (light + dark). This is also the practical resolution of the long-open "Tone & visual identity" decision — picking a palette *is* deciding the tone.
- **Layout scaffolding: [ui.shadcn.com/blocks](https://ui.shadcn.com/blocks)** — pull a dashboard/sidebar block as the shell, data-table blocks for list screens, form blocks for create/edit — then swap in Anima's real entities/fields. Only hand-build where no block fits (the AI chat panel).
- Mobile nav: replace the hand-rolled bottom-tab bar (`OrgNav.tsx`) with the shadcn sidebar block's own responsive behavior (slide-out `Sheet` on mobile), rather than keeping the bottom tabs.

## Constraints to carry into every screen

- **i18n**: all copy goes through `next-intl` message catalogs (`packages/i18n`) — no hardcoded strings in adapted block code, per CLAUDE.md convention. FR is default, ES ships alongside.
- **Dark mode**: `globals.css` already has a `prefers-color-scheme: dark` block — new tokens/components must support both.
- **TypeScript strict** everywhere; components live in `packages/ui` when shared across future apps, or `apps/shelter/src/components` when BO-specific (like `OrgChat.tsx`).
- Existing reusable cards (`AnnouncementCard`, `CagnotteCard`, `NewsPostCard` in `packages/ui`) are shared with the future public hub — restyle them in place rather than forking.

## Screen inventory

Grounded in `apps/shelter/src/app/[locale]/organizations/[organizationId]/` and `packages/backend/convex/schema.ts`.

| Screen | Route | Entity / key fields | Candidate block | New shadcn primitives |
|---|---|---|---|---|
| Org shell (nav) | layout | — | `sidebar` block (desktop + mobile Sheet) | `sidebar` |
| Org dashboard | `/organizations/[id]` | org + counts across all entities, `VerificationCard` | dashboard-style stat cards | `badge` |
| Animal list | `/animals` | species, sex, status, sterilized, photoUrls | `data-table` block | `table`, `badge`, thumbnail/`avatar` |
| Animal detail | `/animals/[id]` | full record + `animalEvents` timeline | profile/detail layout | `tabs`, `badge`, image carousel |
| Animal create/edit | `/animals/new`, `/animals/[id]/edit` | identity, health, behavior, media sections | form block | `select`, `checkbox`, `textarea`, `form` (react-hook-form + zod) |
| Animal → announcements | `/animals/[id]/announcements` | filtered announcement list | reuse announcements list pattern | — |
| Announcements list/detail | `/announcements`, `/announcements/[id]`, `/announcements/new` | title, status, publishedAt/closedAt | card-grid (reuses `AnnouncementCard`) | `badge`, `dropdown-menu` |
| Cagnottes list/detail | `/cagnottes`, `/cagnottes/[id]` | targetAmount, currentAmount, deadline, externalUrl | card-grid (reuses `CagnotteCard`) | `progress` |
| News list/detail | `/news`, `/news/[id]` | title, linkedAnimalIds, linkedCagnotteId | card-grid (reuses `NewsPostCard`) | — |
| Members | `/members` | userId, role (admin/editor), invites | `data-table` block | `table`, `avatar`, `dialog` (invite link) |
| Org creation | `/organizations/new` | name, type, country (FR enabled/ES gated) | form block | `select`, `radio-group` |
| Verification | (card on dashboard) | verificationStatus, registryNumber | small card, self-declare form | `badge` |
| AI chat | `OrgChat.tsx` | 25 tool types, human-approval UI | mostly bespoke | `sheet`/`drawer`, borrow message-bubble styling only |
| Sign-in/up | `/sign-in`, `/sign-up` | Clerk-hosted | — | theme via Clerk's `appearance` prop only |
| Invite accept | `/invite/[token]` | invite token → org join | simple accept card | — |

## Primitives to install

`table`, `badge`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `select`, `textarea`, `checkbox`, `radio-group`, `form`, `avatar`, `progress`, `sonner` (toast), `skeleton`, `separator`, `breadcrumb`, `sidebar`. (`button`, `card`, `input` already exist — replace with CLI versions if they drift from the block-provided ones.)

## Open decisions this touches

- [Tone & visual identity](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+tone) — resolved in practice by the palette pick (see the palette-selection issue in this milestone); close that decision issue once a theme is chosen.
- [Product names](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+product+names) — naming is separate from visuals, not blocking this work.
