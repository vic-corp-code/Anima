# Audit: i18n text-expansion risk (FR/ES vs. English mockup copy)

Part of the Phase 0 design-system audit for BO v2 ([#135](https://github.com/vic-corp-code/Anima/issues/135), milestone "Design system — Back Office (BO) v2"). Read-only research, no code changes.

**Sources examined**: `ui-kit.html`, `admin-dashboard.html`, `assets/site.css` (the shared stylesheet both mockups load), and `packages/i18n/messages/{fr,es}.json` for real-copy length comparisons. Companion audits referenced: [#132](https://github.com/vic-corp-code/Anima/issues/132) (sidebar is a fixed 248px, mobile is an off-canvas `Sheet`) and [#131](https://github.com/vic-corp-code/Anima/issues/131) (the admin table uses progressive column-dropping at breakpoints, not horizontal scroll).

## Why this matters here specifically

The oft-quoted "FR runs ~15–30% longer than EN" is an average across full sentences. UI *labels* — the short, standalone strings that sit inside pills, badges, and nav items — are the tail risk: single words can expand far more than 30%, and there's no surrounding sentence to absorb it. Pulling real strings from `packages/i18n/messages/`:

| English concept | FR | Δ | ES | Δ |
|---|---|---|---|---|
| Save (4) | `Enregistrer` (11) | +175% | `Guardar` (7) | +75% |
| Status (6) | `Statut` (6) | 0% | `Estado` (6) | 0% |
| Remove (6) | `Retirer` (7) | +17% | `Eliminar` (8) | +33% |
| Edit (4) | `Modifier` (8) | +100% | `Modificar` (9) | +125% |
| Fostered (8) | `En famille d'accueil` (20) | +150% | `En acogida` (10) | +25% |
| Adoption pending (16) | `Adoption en cours` (17) | +6% | `Adopción en curso` (17) | +6% |
| Generate invite link (20) | `Générer un lien d'invitation` (28) | +40% | `Generar enlace de invitación` (28) | +40% |

The single largest raw expansion in this sample is `"Save"` → `"Enregistrer"` at +175% — a 4-character button label almost tripling in length. That's not this audit's worst case *in practice*, though, because `.btn` sizes via padding (see §1) and easily absorbs it. The worst case that actually matters for this audit is `animals.status.fostered` → `"En famille d'accueil"` at +150%: it's a status-enum string headed for a *status pill*, a tighter, more content-sensitive container than a button, and it's a direct hit on this audit's #2 (status pills). The mockup's `registry.html`/table status badges are single words ("Available", "Foster", "Adopted") sized for ~6–8 characters; one of the seven real statuses is 20 characters. Any pill sized to fit "Foster" will not fit "En famille d'accueil".

## Findings by component

### 1. Pill-shaped buttons — safe

`.btn` (site.css:130) and all four role variants (`.btn-primary/-secondary/-ghost`, `.btn-quiet`) size via `min-height: 48px; padding: 0 var(--space-6)` — no `width`/`min-width` anywhere. Text drives the box; a longer label just makes the pill wider. `.chip` (admin-dashboard.html:234, the "All / Dogs / Cats / Small" filter buttons) is the same pattern: `padding: 8px 14px; min-height: 34px`, no width.

**One secondary flag**: `.chips` (the flex container wrapping the chip buttons, admin-dashboard.html:233) is `display: inline-flex` with no `flex-wrap: wrap`. Individual chips are safe, but if translated labels push the *group's* total width past its container on a narrow viewport, the row won't wrap — it'll overflow. Low severity (the parent `.toolbar` does wrap between elements), but cheap to fix: add `flex-wrap: wrap` to `.chips`.

**Recommendation**: keep doing exactly what's already done — size these with padding, never `width`/`min-width`. No action needed beyond the `.chips` wrap fix.

### 2. Tag/badge/status-pill components — safe by CSS, risky by content (see table above)

`.tag` (site.css:157) and its `--solid/--wait/--ok` variants, plus `.tag--meta`/`.tag--muted` added in admin-dashboard.html:279-280, and ui-kit.html's `.pill`/`.pill--*` (ui-kit.html:156-172) are all `padding: 4px 10px` / `padding: 5px 12px`, `display: inline-block`/`inline-flex` — no fixed width. Same for `.demo-pill` (admin-dashboard.html:125) and the `.count` badge in sidebar links.

So none of these will *clip* — they'll grow. The risk is layout, not truncation:
- **Table status cells** (`animalRow()` in admin-dashboard.html:928-931, and the static rows in `ui-kit.html`'s table demo) render the badge inline in a `<td>` with `white-space: nowrap` on the cell (see §4) — a badge that grows from "Foster" to "En famille d'accueil" width will widen that whole table column, which cascades into the table-overflow risk below.
- **`attn-row .tag`** (admin-dashboard.html:214, the "Needs attention" panel's "Long wait" pill) sits at the end of a flex row (`flex: none`) next to `.attn-row .body` (admin-dashboard.html:211), which already has `min-width: 0` set (the same defensive pattern noted for `.side-profile .who` in §5) so it shrinks instead of overflowing when the pill widens. Good — no fix needed here, just worth knowing this is *why* it's safe.

**Recommendation**: no CSS change needed for the pills themselves. Flag `animals.status.*` specifically for whoever builds the animal-list/registry screen (#107 in design-system.md) — budget badge/column width for `fostered`'s 20 characters, not `Adopted`'s 7.

### 3. Sidebar nav item labels — risky

Confirmed per #132: `.sidebar` is `width: var(--side-w)` = fixed `248px` (admin-dashboard.html:11,18). Each `.side-link` (admin-dashboard.html:41) is:

```css
.side-link { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); ... }
.side-link .count { margin-left: auto; ... }
```

No `white-space: nowrap` is set, so text *can* wrap in principle — but nothing here is designed for it either: it's a single flex row (icon 18px + gap 12px + label + `margin-left: auto` count badge), no `flex-wrap`, no line-height/height rule that accommodates a two-line label without the row growing awkwardly, and the count badge's `margin-left: auto` assumes the label stays short enough to leave room on the same line.

Budget check at 248px: minus ~32px horizontal padding, 18px icon, 12px gap, and ~24px reserved for a two-digit count badge, there's roughly **150–160px** for label text. "Dashboard" → "Tableau de bord" (15 chars) and "Settings" → "Paramètres" both plausibly fit on one line at the mockup's `--text-sm` (14px), but it's tight, and there's no defined fallback if a future label doesn't fit (e.g. "Content" is currently unlabeled with a count, but "Members"/"Cagnottes"/"Annonces" from the real BO nav — see `packages/i18n/messages/fr.json` `organizations.nav.*` — are all plausible sidebar items and some run longer than the mockup's demo set).

**Recommendation**: decide the wrap strategy now, before the sidebar shell issue is built (design-system.md's "Org shell (nav)" row references this exact component). Two reasonable options:
- Allow the label to wrap to 2 lines (`white-space: normal`, remove any implicit nowrap assumption, let `.side-link` grow in height) and move the count badge onto its own line or drop it in favor of a smaller inline badge — this is more robust for long-tail translations.
- Keep single-line but add `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on the label span specifically (not the whole row) with a native `title` attribute / tooltip for the full text, and stop letting the count badge assume free space — reserve its width explicitly instead of `margin-left: auto`.

Either is fine; what's not fine is shipping the current "just let it flex and hope" state, since it currently has no rule either way.

### 4. Table column headers — risky (the biggest finding)

This is the one place where two different, and *inconsistent*, choices exist between the two mockup files:

- **`ui-kit.html`** (ui-kit.html:223): `.kit-table-wrap { overflow-x: auto; ... }` and the accompanying copy explicitly states the intended pattern: *"On narrow screens the table scrolls inside its wrap — content never crops."* This is the safe, documented pattern.
- **`admin-dashboard.html`** does the opposite. `.table-wrap { overflow: hidden; ... }` (admin-dashboard.html:257) and `.table-scroll { overflow-x: hidden; }` (admin-dashboard.html:258) — both containers actively **suppress** horizontal scrolling. Combined with `table.data th, table.data td { ...; white-space: nowrap; }` (admin-dashboard.html:260) and `table-layout: auto` (columns auto-size to content, no fixed column widths), the table has no valid escape hatch if content is too wide: it can't scroll (overflow hidden), it can't wrap (nowrap), and there's no `text-overflow: ellipsis` anywhere in `site.css`. Content that doesn't fit is **silently clipped mid-character** — not truncated with an ellipsis, just cut off at the container edge.

This is consistent with #131's finding that the admin table relies on progressive column-dropping (`.col-type`, `.col-breed`, `.col-age`, `.col-days`, `.col-updated` all get `display: none` at specific breakpoints — admin-dashboard.html:383-415) instead of scrolling. That's a deliberate, reasonable strategy for viewport-width pressure — but those breakpoints were tuned against **English** header/cell text widths. Two compounding effects once FR/ES copy lands:
1. Headers translate to different lengths than the columns they sit above were sized for (`table-layout: auto` means the *widest cell in the column*, header or data, sets the column width — a longer header can make a column wider than any of its data rows would have required).
2. Because there's no scroll fallback, a column that's still visible at a given breakpoint but whose header/content is now wider in FR could push the whole table wider than the viewport and get clipped by the `overflow: hidden` wrappers, with zero visual affordance (no scrollbar, no ellipsis) that anything is missing.

The one column that already does this right is `.cell-name` (admin-dashboard.html:270): `white-space: normal; min-width: 120px` — it explicitly opts out of `nowrap` and allows wrapping, with `min-width` as a floor rather than the risky *cap* the task brief warns about. That's the model to copy for the other columns, or the columns need real ellipsis+tooltip treatment.

**Recommendation** (pick one, applied consistently, before building the animal-list/adoptions-list screens):
- **Preferred**: change `.table-wrap`/`.table-scroll` to `overflow-x: auto` (matching `ui-kit.html`'s already-documented pattern) so a table that's still too wide after column-dropping scrolls horizontally instead of clipping. Keep the column-dropping breakpoints as the primary strategy; scroll becomes the safety net, not the plan.
- **Alternative**, if horizontal scroll is deliberately rejected for BO (e.g. touch-target reasons): add `text-overflow: ellipsis; overflow: hidden;` to `table.data th, table.data td` (in addition to the existing `white-space: nowrap`) and put a `title="…"` attribute (or a real tooltip) on any header/cell that might truncate, so at minimum users can discover the full value on hover/focus. This does not fix the "column drop breakpoints tuned for English" problem, so still re-verify the breakpoints once real FR copy is in the header row.
- Either way, re-check the `@media` breakpoints in admin-dashboard.html:383-415 against actual FR header widths once `packages/i18n` has real table-header strings — don't assume the English-tuned breakpoints still hold.

### 5. Other constrained containers

- **Topbar search input** (`.topbar-search`, admin-dashboard.html:112): `width: min(320px, 30vw)`, fixed cap. Holds only a placeholder (`"Search animals, people…"` → FR `"Rechercher animaux, personnes…"`, notably longer). Low risk: browsers clip placeholder text without breaking layout (no visible bug, just a slightly earlier cut-off), and it's not actionable/persistent text. No action needed, but worth a spot-check once the placeholder string ships.
- **KPI stat tiles** (`.kpi-grid`, admin-dashboard.html:149): grid cells are `1fr` (responsive: 5 → 3 → 2 → 1 columns across breakpoints), and `.kpi-label` has no width cap of its own — it flows inside a flexible cell. Low risk; worst case a label wraps to 2 lines above the big number, which the `display: flex; flex-direction: column` layout already accommodates.
- **Adoption "Stage" column** (`<th style="min-width:210px">`, admin-dashboard.html:680): uses `min-width` correctly as a floor, not a cap — safe, matches `.cell-name`'s pattern. No action needed.
- **Settings/drawer form fields** (`.field label`, admin-dashboard.html:299): labels are block-level above their inputs, no width constraint. Safe.
- **`.side-profile .who`** (admin-dashboard.html:74): `min-width: 0` is set precisely so the flex child can shrink instead of overflowing — this is correct defensive CSS and should be the pattern copied wherever text sits next to a fixed-size element in a flex row (e.g. the sidebar nav fix in §3, and the `attn-row` body text in §2).

## Summary table

| Component | Sizing | Risk | Fix |
|---|---|---|---|
| `.btn*` buttons | padding-based | Safe | none |
| `.chip` filter buttons | padding-based | Safe (group wrap is minor) | add `flex-wrap: wrap` to `.chips` |
| `.tag`/`.pill` badges | padding-based | Safe (CSS); content risk via `fostered` (+150%) | budget real enum-string widths, esp. animal status |
| Sidebar nav items (`.side-link` in 248px `.sidebar`) | flex row, no wrap/ellipsis rule either way | **Risky — undefined** | decide wrap-to-2-lines vs. ellipsis+tooltip before building the nav shell |
| Table headers/cells (`admin-dashboard.html`) | `white-space: nowrap` + `overflow: hidden` (no scroll, no ellipsis) | **Risky — silent clipping** | switch to `overflow-x: auto` (match `ui-kit.html`) or add ellipsis+tooltip; re-verify column-drop breakpoints against real FR text |
| `.cell-name` table column | `white-space: normal; min-width` | Safe — model pattern | none, copy this pattern elsewhere |
| Topbar search placeholder | fixed `min(320px, 30vw)` | Low risk | none |
| KPI stat labels | flexible grid `1fr` | Low risk | none |
| Adoption "Stage" column | `min-width` (floor) | Safe | none |

## Checklist for screen issues building against these components

Before building any screen listed in `docs/tech/design-system.md`'s Screen inventory that uses a table, a sidebar-style nav, or a status/tag badge:

1. Pull the real `fr`/`es` string from `packages/i18n/messages/` (or draft it) before sizing the container — don't size against the mockup's English placeholder.
2. For any pill/tag/button: confirm it's `padding`-based, not `width`/`min-width`-based, before reusing the mockup's class as-is.
3. For any table: confirm the wrap has `overflow-x: auto` (or an explicit ellipsis+tooltip treatment) — don't inherit `admin-dashboard.html`'s `overflow: hidden` table wrap unmodified.
4. For any nav/label inside a fixed-width container: confirm there's an explicit wrap-or-truncate rule, not an implicit one.
