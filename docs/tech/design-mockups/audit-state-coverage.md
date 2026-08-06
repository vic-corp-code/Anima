# Empty / loading / error state coverage

Audit for [#134](https://github.com/vic-corp-code/Anima/issues/134), part of the **Design system — Back Office (BO) v2** milestone ([#9](https://github.com/vic-corp-code/Anima/milestone/9)). Read-only research, no code changes.

**Sources**: [`ui-kit.html`](ui-kit.html) and [`admin-dashboard.html`](admin-dashboard.html) — the v2 mockups for this milestone (distinct from the earlier "Shelter Workspace Mission" set in `docs/tech/design-system.md`). Cross-checked against the sibling component-mapping audit, [#130](https://github.com/vic-corp-code/Anima/issues/130) (`audit-component-mapping.md`, on its own branch as of this writing), which first flagged the two findings this doc formalizes: the `.empty-row` pattern exists, no loading-indicator pattern exists anywhere.

**This matters most for the data-table-heavy screens**: animal list ([#140](https://github.com/vic-corp-code/Anima/issues/140)) and members ([#141](https://github.com/vic-corp-code/Anima/issues/141)). Both should follow the conventions below rather than each inventing its own empty/loading/error handling — members has no mockup reference at all (per `design-system.md`'s screen inventory), so this doc is its only guidance for those three states.

## 1. Empty state — confirmed, reuse as-is

`admin-dashboard.html` has exactly one empty-state pattern, on the animal table. It's JS-rendered when a filter/search yields zero rows:

```css
.empty-row td { text-align: center; padding: var(--space-12) var(--space-4); color: var(--muted); font-size: var(--text-sm); }
```
```js
tbody.innerHTML = '<tr><td colspan="9" class="empty-row">No animals match — try clearing filters.</td></tr>';
```

Styling, exact values:
- **Spacing**: `padding: 48px 16px` (`--space-12 --space-4`) — generous vertical padding, not just a normal row height, so the empty state reads as a distinct block rather than a squashed row.
- **Text**: `--text-sm` (14px), color `--muted` (`#8c8c8c` light-mode) — same weight/color as any other secondary table text, no special emphasis.
- **No icon.** Just centered text.
- **Structure**: a single `<tr>` with one `<td colspan="{column count}">` spanning the full table width, keeping the table shell (header, borders, `.table-wrap` container) intact around it — only the body collapses to the message.
- **Copy pattern**: states what's empty + the likely fix ("No animals match — try clearing filters."), not a bare "No results." Carry that tone into other lists.

**Convention**: this is the canonical empty-state pattern for every list/table screen in BO — animal list, members, and any future data-table screen. Implementation note for #130's mapping: no new shadcn primitive needed, this is a plain centered-text row using the installed `Table` component's own `<TableCell colSpan={n}>`.

No empty-state pattern exists for non-table layouts (card grids like the media library or a future content list) — if a card-grid screen needs one, decide fresh from this same tone (centered, muted, states the fix), don't assume it's covered here.

## 2. Loading state — confirmed gap, proposed convention

Checked both mockup files for spinners, skeletons, shimmer, or any other loading indicator: **none exist.** No screen in either file demonstrates a loading state — every screen mockup only shows the fully-loaded happy path. `Skeleton` (`packages/ui/src/components/ui/skeleton.tsx`, installed via [#104](https://github.com/vic-corp-code/Anima/issues/104)) has no visual reference to build from — this section proposes the convention rather than confirming one.

**Proposal**: use shadcn's `Skeleton` (already installed), shaped to match the real content's dimensions per screen — not a single generic shimmer block. Two shapes cover BO's actual layouts:

### Table-row skeleton (animal list, members, any `data-table` screen)

Match the real row geometry from `admin-dashboard.html`'s animal table:
- Row height ≈ **64px**, driven by the 40px circular avatar cell (`.ph.av`, `border-radius: var(--radius-pill)`) plus `--space-3` (12px) vertical cell padding on all sides.
- Per column:
  - Avatar cell → `Skeleton` circle, `40x40`, `rounded-full`.
  - Text cells (name, breed, mono/numeric columns) → `Skeleton` bar, height ~14px (matching `--text-sm`) or ~12px for mono/secondary columns, width scaled to roughly the real content's typical length (e.g. name ~100px, breed ~80px, a short numeric column ~32px) — don't make every bar the same width, it should still read as "a table," not a stack of identical stripes.
  - Badge cells (status) → `Skeleton` pill, ~24px tall, ~64px wide, `rounded-full`.
  - Actions cell → `Skeleton` circle, `36x36` (matching `.iconbtn`'s real size), `rounded-full`.
- Render **5–6 skeleton rows** by default inside the same `Table`/`TableBody` shell (real header stays static, only body rows are placeholders) — mirrors a typical first-page load without overcommitting to an exact page size.
- Keep the table chrome (`.table-wrap` border/radius, header row) real and static during loading; only body rows become skeletons. This avoids layout shift when real data arrives — same column widths, same row height.

### Card skeleton (KPI/stat cards, content cards — lower priority for this milestone but same principle)

If a card-based screen needs a loading state, size the skeleton to the specific card variant rather than a generic block:
- Stat/KPI card (`.stat-tile` / `.kpi`, `padding: var(--space-8)` / `var(--space-5)`): a `Skeleton` bar for the label (~11px tall, short width), a larger `Skeleton` bar for the big number (~32-40px tall), optionally a small delta bar underneath.
- Content card (`.content-card`): a `Skeleton` rectangle matching the thumbnail/media area if present, plus 2–3 text bars for title/meta.

**Why not a generic shimmer block**: the mockup's whole visual language is precise, purposeful spacing (see `design-system.md`'s typography/spacing notes) — a loading state that doesn't respect real dimensions creates visible jank when content swaps in. Sizing skeletons to real geometry is the point of this convention, not a nice-to-have.

## 3. Error state — confirmed, reuse the banner's danger variant

`ui-kit.html` §11 ("Banners & alerts") defines four banner variants sharing one base class, differentiated by tone token and ARIA role:

```css
.banner--info    { /* --meta tint */ }
.banner--success { /* --success tint */ }
.banner--warn    { /* --warn tint */ }
.banner--danger  { /* --danger tint */ }
```

The **danger** variant is the one built specifically for error/failure communication — it's the only one using `role="alert"` (the other three use `role="status"`), and its example content is an explicit form-submission failure:

```html
<div class="banner banner--danger" role="alert">
  <svg ...><!-- circle + X icon --></svg>
  <div class="banner-body">
    <span class="banner-title">Could not submit</span>
    <span class="banner-text">Check the highlighted fields and try again.</span>
  </div>
</div>
```

Structure/styling shared by all four variants, `banner--danger` specifics:
- Layout: `display: flex`, icon + `.banner-body` (title + text stacked, 2px gap), `padding: var(--space-4) var(--space-6)` (16px/24px), `border-radius: var(--radius-md)`, 1px border.
- Tint: `background: color-mix(in oklab, var(--danger) 10%, var(--surface))`, `border-color: color-mix(in oklab, var(--danger) 28%, var(--surface))`, icon color `var(--danger)`.
- Icon: a circle-with-X (distinct from the other three variants' icons — info uses an "i" circle, success a checkmark, warn a triangle).
- Text: title `font-weight: 600`, `--text-sm`; body `--text-sm`, `--fg-2`.
- `role="alert"` — the accessibility signal that this one is assertive/interrupting, unlike the other three's polite `role="status"`.

**Convention**: use the danger-toned banner treatment (tint, icon, `role="alert"`) for every error state — failed data loads, failed submits, failed actions. Reuse the same title+text copy pattern (`banner-title`: short statement of what failed; `banner-text`: what to do about it), matching "Could not submit" / "Check the highlighted fields and try again."

**Implementation note, cross-referencing #130's mapping**: the banner has no installed shadcn primitive yet. `#130`'s audit maps it to shadcn's `Alert` (closest match, not identical) — but `Alert` itself isn't installed (tracked in [#137](https://github.com/vic-corp-code/Anima/issues/137)), so this needs both that install landing *and* a custom wrapper applying the four tint variants (`info`/`success`/`warn`/`danger`) on top of it, since shadcn's `Alert` ships with only `default`/`destructive` out of the box. For error states specifically, `Alert`'s `variant="destructive"` is the natural landing spot for `banner--danger` once that wrapper exists. Until then, a data-table screen needing an error state (e.g. a failed fetch) should use the danger tint/copy pattern documented above, built as a plain styled component — not invent a different error treatment.

## Summary — what #140 and #141 should do

Both animal list ([#140](https://github.com/vic-corp-code/Anima/issues/140)) and members ([#141](https://github.com/vic-corp-code/Anima/issues/141)) are `data-table`-based screens and should follow this doc rather than deciding their own state handling:

| State | Convention |
|---|---|
| Empty (zero rows after filter/search) | Single centered `<TableCell colSpan={n}>` row, `--muted` `--text-sm` text, `48px 16px` padding, states what's empty + how to fix it. No icon. |
| Loading (initial fetch / refetch) | 5–6 `Skeleton` rows inside the real, static table shell — circle for avatar, bars sized to each column's typical content, pill for status badges, circle for the actions button. Real header stays static. |
| Error (failed fetch/action) | Danger-toned banner, `role="alert"`, X-circle icon, title states what failed, body states the fix — same copy pattern as `banner--danger`'s "Could not submit" example. Backed by shadcn `Alert` + custom tint wrapper once `Alert` lands via #137. |

Members has no mockup reference for its happy-path layout either — when #141 designs the table itself, these three states still apply unchanged; they're geometry- and role-based (row height, column count, colspan), not tied to animal-specific content.
