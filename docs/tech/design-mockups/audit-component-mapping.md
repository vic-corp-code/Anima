# Component inventory → shadcn mapping

Audit for [#130](https://github.com/vic-corp-code/Anima/issues/130), part of the **Design system — Back Office (BO) v2** milestone ([#9](https://github.com/vic-corp-code/Anima/milestone/9)). Read-only research, no code changes. This is the most-referenced doc in the milestone — nearly every screen issue points here for "what shadcn component do I use for this."

**Sources**: [`ui-kit.html`](ui-kit.html) (the "Paws & Hearts" component gallery — primary source) and [`admin-dashboard.html`](admin-dashboard.html) (a full admin shell mockup — cross-checked for anything not in the kit gallery, e.g. topbar/search, drawer, toast, KPI cards, charts). Both are v2 mockups for this milestone, distinct from the earlier "Shelter Workspace Mission" set referenced in `docs/tech/design-system.md`.

**Out of scope for this doc** (covered by sibling Phase 0 audit issues on the same milestone): color/spacing/radius/elevation/motion tokens (#153, #132, #133), typography (#131), and full state coverage (#134). This doc is components only.

**Current install** (from #102/#104/#129): `button`, `card`, `input`, `table`, `badge`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `select`, `textarea`, `checkbox`, `radio-group`, `popover`, `form`, `avatar`, `progress`, `sonner`, `skeleton`, `separator`, `breadcrumb`, `sidebar`, `label`, `tooltip`. **Not yet installed**: `switch`, `alert`, `pagination` — tracked in #137.

## Framing note — primitives shadcn is actually known for

For `Dialog`, `DropdownMenu`, `Tabs`, `Popover`, `Command`, `Sheet`, `Sonner`: **`ui-kit.html` (the gallery) has no static representation of these at all, and structurally can't** — their real value is the Radix accessibility layer (focus trap, keyboard nav), which static HTML can't demonstrate. Screen issues shouldn't hunt the kit for visual specifics on these; use shadcn's own default structure/behavior, restyled with the extracted color/radius tokens only.

**Nuance found while auditing `admin-dashboard.html`**: it does hand-roll a working Drawer (`.drawer`, backdrop, Escape-to-close, focus-on-open JS) and a working Toast (`.toast`/`.toast-region`, timed dismissal, ARIA live region) — these give a *real* layout/content/copy reference (drawer header/body/footer structure, field order, toast copy tone) that `Sheet` and `Sonner` screen issues can use. But the underlying interaction (focus trap, ARIA wiring, animation) should still come from Radix/shadcn's own implementation, not be reverse-engineered from the mockup's hand-rolled JS — the framing note's caution still holds, it just isn't a *total* blackout for these two.

**`Tabs` is not fully unrepresented either — but only in markup, not in behavior.** The one `role="tablist"` in either file is the filter-chip control (`admin-dashboard.html:623` and `:717`, `<div class="chips" role="tablist">`). Read closely, though (`:624-627` for markup, `:975-981` for the JS), it doesn't carry real tab semantics: the `<button>` children have no `role="tab"`, no `aria-selected`, no `aria-controls`/associated `tabpanel`, and no roving-tabindex/arrow-key navigation — just plain buttons with click handlers that toggle an `is-active` class and re-filter a table/grid that stays mounted throughout (`renderAnimals()`/the media-tile `display` toggle, not a panel swap). That's the interaction contract of a single-select filter/segmented control, which is what shadcn's `ToggleGroup` is for — `Tabs` implies switching between separate content panels with keyboard arrow navigation, neither of which happens here. The `role="tablist"`/`aria-label` on the container reads as a mockup authoring artifact (a mislabeled ARIA role) rather than intentional tab semantics, so the `ToggleGroup` mapping below stands — but it's worth knowing this is the only tablist-flavored markup in the codebase, in case a future screen wants to lift its visual styling (the pill-track, `is-active` chip look) for an actual `Tabs` instance. `Dialog`, `DropdownMenu`, `Popover`, `Command` remain fully unrepresented in both files, in markup and behavior alike.

## Buttons

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-quiet` | ui-kit §Buttons | `Button` | `default` / `outline` / `secondary` / `link` respectively | Corrected from an earlier draft that mapped `.btn-ghost` → `outline` by name-association. Checking `assets/site.css:140-151` directly: `.btn-secondary` is `background: var(--surface)` (page-background-matching fill) with a visible `border-color: var(--border)` — that's shadcn's `outline` (bordered, background-matching fill). `.btn-ghost` is `background: var(--surface-warm)` with **no border** (`border: 1px solid transparent` inherited from `.btn`) — a solid, always-visible muted fill, which is shadcn's `secondary` (filled, no border), *not* `ghost` (transparent by default, fill only on hover — the kit has nothing that behaves that way under this name). So despite the identical class name, `.btn-ghost` is not shadcn `ghost`. Kit has no `destructive` variant — shadcn's `Button` expects one; add it using the kit's `--danger` token |
| Icon-only circular button (`.iconbtn`) | admin topbar, sidebar mobile toggle, drawer close, row actions | `Button` | `variant="ghost"`, `size="icon"`, `className="rounded-full"` | `.iconbtn` (`admin-dashboard.html:93-101`) *is* `background: transparent` by default, filling to `var(--surface-warm)` only on hover — that's the one element in either file that actually behaves like shadcn's `ghost` variant, which is why `ghost` is reserved for it rather than for `.btn-ghost` above. Kit's icon buttons are fully pill-shaped (42px/36px circles), not the default squared icon-button radius |
| Small button (`.btn-sm`) | admin drawer footer, settings save/cancel | `Button` | `size="sm"` | Direct mapping, no gap |

## Tags & status

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| `.tag` / `.tag--solid` / `.tag--wait` / `.tag--ok` | ui-kit §Tags, admin tables/cards | `Badge` | outline / solid(secondary) / warning(custom) / success(custom) | `success`/`warning` need new Badge variants — no shadcn slot by default (mirrors the `--color-success`/`--color-warning` gap noted in `design-system.md`) |
| `.tag--meta` | admin (Foster status, demo-pill) | `Badge` | **no shadcn slot** | Confirmed 5th color with no home — same `meta` gap already flagged in the issue |
| `.tag--muted` | admin (Adopted status, unused media) | `Badge` | `variant="secondary"` | Direct mapping |
| Status pill (`.pill--success/warn/meta/muted/danger`) | ui-kit §Tags & status | — | **no equivalent — build custom** | Established finding. Rounded-pill shape + colored dot is distinct from `Badge`'s rectangular default; would need a wrapping component even after Badge variants exist |
| Recency dot (`.dot`, `.dot--new`) | ui-kit §Tags, admin sidebar/messages | — | plain `<span>` | Trivial, no primitive needed |
| Demo/notice pill (`.demo-pill`) | admin topbar | `Badge` | same `meta` gap as `.tag--meta` above | Reuses the ungapped 5th color |

## Forms

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| Text / email input | ui-kit §Forms, admin drawer/settings | `Input` | — | Direct mapping (already installed) |
| Input error state (`.field--error`, `aria-invalid`) | ui-kit §Forms, admin drawer (`field-error`) | `Input` + `Form` | react-hook-form + zod, Radix `aria-invalid` styling | Direct mapping — shadcn's `Input`/`Form` already style off `aria-invalid` |
| Select | ui-kit §Forms (native `<select>`), admin (`.select`, styled native + custom chevron) | `Select` | — | Both source patterns are plain/styled native `<select>`; replace with the installed Radix `Select`, not a native element |
| Textarea | ui-kit §Forms, admin drawer story field | `Textarea` | — | Direct mapping |
| Checkbox | ui-kit §Forms | `Checkbox` | — | Direct mapping |
| Radio | ui-kit §Forms | `RadioGroup` | — | Direct mapping |
| Switch | ui-kit §Forms, admin settings toggle rows | `Switch` | — | **Missing from install, tracked in #137** |
| Search input (pill shape, leading icon) | admin topbar-search, toolbar search-input | `Input` | composition: `Input` + absolutely-positioned Lucide icon | No dedicated shadcn "SearchInput" — this is a composition pattern to document, not a new primitive |
| File drop area (`.drop-area`) | admin drawer, "Add animal" photo field | — | **no equivalent — build custom** | New finding: dashed-border dropzone with placeholder icon + "drop or click to upload" copy. No shadcn file-upload primitive exists |
| Segmented filter chips (`.chips`/`.chip`, `is-active`) | admin animals toolbar ("All / Dogs / Cats / Small"), media filter | `ToggleGroup` | — | New finding: a pill-track segmented control. The container carries `role="tablist"`, but the interaction is single-select filtering of a table/grid that stays mounted (no `role="tab"`, no panel swap, no arrow-key nav — see the framing note above for the full read) — behaviorally that's `ToggleGroup` (Radix Toggle Group), not `Tabs`. **Not currently installed or in the "to install" list**, worth adding alongside #137's items |
| Adoption stage stepper (`.stepper`, 4 labeled segments: Enquiry → Meet → Home check → Complete) | admin adoptions table | — | **no equivalent — build custom** | New finding. Closest primitive is `Progress`, but it's a continuous bar, not discrete labeled segments — would need a purpose-built stepper |

## Cards

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| Content card (`.content-card`) | ui-kit §Cards, admin §Content (CMS card variant) | `Card` | `CardHeader`/`CardTitle`/`CardContent`/`CardFooter` | Direct mapping — admin's version adds a status `Badge` + meta line + action links inside |
| Stat tile / KPI card (`.stat-tile`, `.kpi`) | ui-kit §Cards, admin dashboard KPI row | `Card` | custom composition (label, big number, delta) | `Card` covers the shell; label/number/delta typography is bespoke composition, not a variant |
| KPI delta indicator (colored up/down arrow + text) | admin KPI row | — | small custom composition (icon + text) | Not a component gap — just a `lucide-react` arrow icon + colored text, no primitive needed |
| Media card (`.media-card`) / media tile (`.media-tile`) | ui-kit §Cards, admin §Media library | — | **no equivalent — build custom** | Established finding (`.media-card`), confirmed the same gap extends to admin's `.media-tile` grid variant (thumbnail + filename + dimensions + used/unused tag) |
| Animal card (`.animal-card`) | ui-kit §Patterns | — | **no equivalent — build custom** | Established finding |
| Panel (`.panel`, generic bordered container + `.panel-head`) | admin dashboard (charts, attention list, activity feed, settings) | `Card` | `CardHeader` (title + sub) + `CardContent` | Direct mapping — this is the admin app's generic "Card" already, just under a different class name |

## Tables

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| Data table (`.kit-table`, `table.data`) | ui-kit §Tables, admin animals/adoptions | `Table` | zebra rows, hover state, responsive column-hiding via CSS breakpoints, avatar-in-cell, row-action icon button | Direct mapping — already installed. Admin's version additionally hides columns (`col-type`, `col-breed`, `col-age`, `col-days`, `col-updated`) at various breakpoints; carry that responsive behavior into the `data-table` block |
| Table empty state (`.empty-row`, "No animals match — try clearing filters.") | admin animals table (JS-rendered when filter yields 0 rows) | `Table` | centered muted-text row spanning all columns | New finding: no new primitive needed, but worth documenting as the canonical empty-state pattern for every list screen using this table |

## Banners & alerts

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| Banner (`.banner--info/success/warn/danger`) | ui-kit §Banners & alerts | `Alert` (closest, not identical) | — | Established finding: **no equivalent — build custom**. Note `Alert` itself is also still missing from install (#137) — so this needs both the missing primitive installed *and* a custom wrapper once it lands |

## Navigation

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| Sidebar / admin nav shell | admin `.sidebar` | `sidebar` block | — | Established: needs a radius override for the pill active-state style |
| Sidebar active-item indicator (left accent bar + tinted background) | admin `.side-link.is-active` | `sidebar` | className/CSS override on the block's own active-item styling | No new primitive — a styling variant of the sidebar block |
| Sidebar nav count badge (`.count`, e.g. "24", "6", "3") | admin sidebar nav items | `Badge` or plain `<span>` | `variant="secondary"`, small/muted | Minor — kit renders it as plain mono text, not a filled pill; either works |
| Sidebar collapse-to-Sheet on mobile (`.sidebar-backdrop`, `transform: translateX`) | admin sidebar responsive behavior | `sidebar` block's own `Sheet`-based mobile mode | — | Confirms `design-system.md`'s existing plan: use the block's own responsive behavior, not the mockup's hand-rolled transform+backdrop JS |
| Admin topbar (crumb + title, search, actions) | admin `.topbar` | composition of `Input`, `Button`, `Badge`, `Avatar` in a sticky `<header>` | — | No single shadcn "Topbar" primitive — this is a bespoke composition to build from existing installed primitives, referencing this file for layout only |
| Notification bell + unread dot | admin topbar `.bell` | `Button` (icon) + small absolutely-positioned `<span>` dot | — | No new primitive |
| Avatar / photo placeholder (`.ph`, `.ph.av`, `.topbar-avatar`) | ui-kit, admin (sidebar profile, topbar, table rows, attention list) | `Avatar` | icon fallback (species glyph or initials) | Direct mapping — already installed |
| Public site header + nav (`.site-header`, `.site-nav` link states, `.mobile-nav`) | ui-kit header (copied from `index.html`) | — | out of BO scope | This is public marketing-site chrome, not BO admin — `admin-dashboard.html` has no equivalent header at all. Keep as reference only if/when ShelterWeb (a separate app) needs it later |
| Public site footer (`.site-footer`: brand, newsletter form, link columns, legal note) | ui-kit footer (copied from `index.html`) | — | out of BO scope | New finding: **`admin-dashboard.html` has no footer at all** — the admin shell's content area just ends. No BO footer to design against; if ShelterWeb needs one later, no shadcn footer primitive exists — compose from `Input`/`Button`/`Separator` |
| Breadcrumb (`.crumbs`) | ui-kit §Navigation | `Breadcrumb` (closest, not identical) | — | Established finding: **no equivalent — build custom** |
| Pagination (`.pagination`, Prev/1/2/current/3/4/Next) | ui-kit §Navigation | `pagination` | — | **Missing from install, tracked in #137.** Once installed, the kit's Prev/Next + numbered-page-with-current-state pattern maps directly, no custom wrapper needed |

## Overlays & feedback

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| Toast (`.toast`, `.toast-region`) | admin (real hand-rolled JS: timed show/dismiss, ARIA live region) | `Sonner` | — | Framing note applies — see nuance above. Use for copy/tone reference (e.g. "Max added", "Settings saved"), not for the interaction itself |
| Drawer (`.drawer`, slide-in from right, backdrop, Escape-to-close, focus-on-open) | admin "Add/Edit animal" | `Sheet` | side="right" | Framing note applies — see nuance above. Use for header/body/footer layout and field order reference, not for the interaction itself |
| Dialog / DropdownMenu / Tabs / Popover / Command | — | respective shadcn primitives | — | **Zero representation in either file.** Build from shadcn's own default structure/behavior per the framing note verbatim above |

## Composed list/feed patterns (no new primitives — documented for reference)

| Element | Found in | Composition | Notes |
|---|---|---|---|
| Needs-attention list (`.attn-list`/`.attn-row`) | admin dashboard | `Avatar`/icon glyph + text + `Badge` or `Button` (link) | No new primitive — a styled list of rows |
| Recent activity feed (`.feed`/`.feed-item`) | admin dashboard | timestamp column + rich text | No new primitive |
| Message list (`.msg-row`, unread dot) | admin messages view | text rows + small unread-dot indicator | No new primitive |
| Settings toggle row (`.toggle-row`: label + description + control) | admin settings | `Switch` (missing, #137) + plain text | Blocked on #137's `Switch` install, otherwise trivial composition |
| Fee row (`.fee-row`, plain label/value line) | admin settings | plain text row | No primitive needed |

## Charts

| Element | Found in | shadcn candidate(s) | Variant / mapping | Notes |
|---|---|---|---|---|
| Bar chart (`.bar-chart`) | ui-kit §Patterns, admin "Adoptions, last 6 months" | — | **no equivalent — build custom** | Established finding. No chart primitive planned — no chart data in schema yet, skip |
| Donut chart + legend (`.donut`, admin "Animals by type") | admin dashboard | — | **no equivalent — build custom** | New finding: a second, distinct chart type not previously flagged (pure CSS `conic-gradient`, no chart library). Same schema-data caveat applies — skip until real data exists |

## Loading & empty states

| Element | Found in | shadcn candidate(s) | Notes |
|---|---|---|---|
| Loading indicators (spinners, skeletons) | — | `Skeleton` (already installed) | New finding: **no loading-indicator pattern appears anywhere in either mockup file.** `Skeleton` has no mockup reference to build from — use shadcn's own default skeleton shapes for BO screens, same "no visual reference, decide fresh" treatment as other unrepresented primitives |
| Empty state | admin `.empty-row` (table) | `Table` + centered muted text | The only empty-state pattern present in either file — see Tables section above. No empty-state pattern exists for card grids (media library, content list) — decide fresh if a filter/search ever yields zero results there |

## Summary of new findings beyond the issue's established list

- `ToggleGroup` candidate for the segmented filter chips (`.chips`/`.chip`) — not currently installed or scoped in #137; worth a decision on whether to fold it into that issue.
- File-upload dropzone (`.drop-area`) — no equivalent, build custom.
- Adoption-stage stepper (`.stepper`) — no equivalent, build custom (closest but insufficient: `Progress`).
- A second, distinct chart type (donut/`conic-gradient`) in addition to the already-flagged bar chart — same "no chart primitive, skip for now" treatment applies.
- Table empty state (`.empty-row`) — a concrete, reusable pattern worth carrying into every list screen.
- No loading-indicator pattern anywhere in either file — flag explicitly so `Skeleton`-using screens know they're designing fresh, not matching a mockup.
- `admin-dashboard.html`'s Drawer and Toast are real (non-Radix) working implementations, not static mockups — they're useful as layout/copy reference for `Sheet`/`Sonner` even though the framing note's caution about not copying their behavior still applies.
- Public site header/footer (from `ui-kit.html`, copied from `index.html`) are out of BO scope entirely — `admin-dashboard.html` has no footer at all, confirming the BO shell doesn't need one.
- `.btn-ghost` maps to shadcn `secondary` and `.btn-secondary` maps to shadcn `outline` — not the reverse, despite the name similarity between `.btn-ghost` and shadcn's own `ghost` variant. Checked directly against `assets/site.css`: `.btn-ghost` is a filled, borderless pill (`secondary`-shaped), `.btn-secondary` is a bordered, background-matching pill (`outline`-shaped). Shadcn's real `ghost` (transparent by default, fills on hover) is reserved for `.iconbtn` instead, which is the one element that actually behaves that way.
- The filter chips' `role="tablist"` (the only tablist-flavored markup in either file) doesn't carry real tab semantics — no `role="tab"`, `aria-selected`, or panel-swap, just click-to-filter on content that stays mounted. Kept the `ToggleGroup` mapping; documented the ARIA label as likely a mockup authoring artifact rather than intentional `Tabs` usage.
