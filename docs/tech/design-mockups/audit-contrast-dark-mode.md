# Contrast/accessibility audit: dark-mode tokens + focus-visible coverage

Audit for [#154](https://github.com/vic-corp-code/Anima/issues/154), part of the "Design system — Back Office (BO) v2" milestone. Runs after Palette v2 ([#155](https://github.com/vic-corp-code/Anima/issues/155)) landed its final token values — which is what makes this audit's numbers stable.

**The living check is committed, not one-off**: `apps/shelter/src/app/globals.contrast.test.ts` (79 tests) parses the `:root` / `[data-theme="dark"]` blocks from `apps/shelter/src/app/globals.css`, resolves every `var()` / `color-mix()` chain, and asserts the full pair matrix below in both themes (normal text 4.5:1, UI components 3:1) plus the focus-visible/keyboard coverage invariants. Any future token or bespoke-component change that drops a pair below threshold fails `bun run test`. This doc is the report; the test is the repeatable verification.

## Method

- Colors resolved recursively: hex, named `black`/`white`, `var(--x)` against the theme's block, and `color-mix(in oklab|oklch, …)` (OKLab linear interpolation; OKLCH shortest-arc hue), matching the mixer used for the original report on this issue (comment `5219948817`).
- Tailwind `/10`–`/50` tints (`bg-success/10`, `dark:bg-warn/20`, `hover:bg-destructive/15`, `bg-muted/50`, …) composite the token over the surface it sits on — modeled as an OKLab mix with `--card`.
- Badge interiors from `apps/shelter/src/lib/animals/status-badge.ts` (`SUCCESS_TINT` & co.): text = `color-mix(color 74–78%, foreground)`, surface = `color-mix(color 14–16%, card)`.
- Thresholds: WCAG AA normal text 4.5:1, UI/focus indicators 3:1.
- Regression pins reproduce the two ratios pre-documented in `globals.css` comments (destructive ≈ 5.9:1 light, ≈ 6.7:1 dark) within tight bounds, so intentional destructive-token changes must consciously update the test.

## Results — every pair passes in both themes

| Pair (text on bg) | Light | Dark |
|---|---|---|
| foreground / background | 16.12 | 15.88 |
| card-foreground / card | 17.06 | 14.86 |
| muted-foreground / background | 5.35 | 5.99 |
| muted-foreground / card | 5.67 | 5.60 |
| muted-foreground / muted | 4.56 | 4.96 |
| muted-foreground / `bg-muted/50` over card | 5.09 | 5.30 |
| primary-foreground / primary | 5.34 | 7.19 |
| primary-foreground / primary hover (mix→black 8% / white 12%) | 6.38 | 8.14 |
| primary-foreground / primary active (mix→black 14% / white 20%) | 7.32 | 8.87 |
| accent-foreground / accent | 13.74 | 13.16 |
| destructive-foreground / destructive | 5.86 | 6.73 |
| destructive / `bg-destructive/10`–`/20` chip | 5.01 | 4.75 |
| destructive / `bg-destructive/15` hover | 4.64 | 5.18 |
| sidebar-foreground / sidebar | 9.86 | 10.38 |
| sidebar-accent-foreground / sidebar-accent (30% light / kit 12% dark wash) | 4.94 | 5.75 |
| sidebar-primary-foreground / sidebar-primary | 5.34 | 7.19 |
| success / background, card, `/10` chip, `/20` chip | 4.92 / 5.21 / 4.54 | 8.20 / 7.67 / 6.62 / 5.55 |
| warn / background, card, `/10` chip, `/20` chip | 4.93 / 5.22 / 4.56 | 8.37 / 7.83 / 6.75 / 5.63 |
| danger / background, card, `/10` chip, `/20` chip | 5.45 / 5.77 / 5.01 | 6.81 / 6.38 / 5.61 / 4.75 |
| meta / `/10` chip, `/20` chip | 4.58 | 6.65 / 5.54 |
| `SUCCESS_TINT` / `WARN_TINT` / `META_TINT` / `PRIMARY_TINT` badges | 5.58 / 6.12 / 6.10 / 6.10 | 6.99 / 7.53 / 7.51 / 6.97 |
| active indicator bar (primary) / sidebar — UI 3:1 | 5.25 | 6.81 |
| ring / background, sidebar-ring / sidebar — focus 3:1 | 4.96 / 5.25 | 7.28 / 6.81 |

The dark theme passed as shipped — confirming the issue's premise that the kit's dark tokens are purpose-built adaptations, not a naive light-to-dark swap. Hover/active states *gain* contrast in dark (mix toward white); the light destructive `/15` hover is the closest pair at 4.64:1, still above AA.

## Fixes the audit landed (#189, commits `7bc8ad1` + `ae03872`)

- Light `--muted-foreground` `#7a6d63 → #6f645a` (3.96 → 4.56 on the `--muted` wash).
- Light `--success` `#4f8a4f → #447744`, `--warn` `#c9822f → #946023` (hue-preserving OKLab darkening; chip pairs 3.61/2.80 → 4.54/4.56).
- Light `--sidebar-accent` wash 12% → 30% + `--sidebar-accent-foreground` `#9b5b32 → #784727` (4.46 → 4.94). Dark stays at kit 12% — mixing the *light* accent into dark card lightens the wash, so 30% measured 4.14:1 there (fail); kit 12% holds 5.75:1.
- `@custom-variant dark` rewired to `[data-theme="dark"]` — Tailwind's default `dark:` keys off `prefers-color-scheme`; unwired, `dark:bg-*/20` tints fired under a dark OS with light tokens (2.5–4.3:1) and never fired in app-dark on a light OS.
- Destructive hover tints `hover:bg-destructive/20` (4.29:1) / `dark:hover:bg-destructive/30` (3.96:1) → `/15` (4.64 / 5.18) in `button.tsx` + `badge.tsx` `[a]:hover`.
- Button focus ring `ring-ring/50 → ring-ring` (focus indicator 4.96:1 light / 7.28:1 dark vs ~1.7:1 at 50% alpha).

## Focus-visible / keyboard coverage (bespoke pieces)

All three bespoke pieces are real `<a>`/`<button>` elements, so the kit's global halo (`globals.css` `:where(a, button, input, select, textarea, [tabindex]):focus-visible` → `box-shadow: var(--focus-ring)`) covers them. Where the `:where()` halo loses to utility box-shadows, component-level rings carry the indicator — asserted in the test:

- **(a) Pill tag row** — status badges (`status-badge.ts`) and urgent-needs links (`UrgentNeedsCard.tsx` renders real `<Link>`s); tint pairs verified above. No gap.
- **(b) Sidebar active state** — `SidebarMenuButton` carries `focus-visible:ring-2` + `ring-sidebar-ring` (5.25:1 light / 6.81:1 dark against sidebar) and `data-[active=true]` gets the wash + text (4.94 / 5.75:1) + 3px primary indicator bar (5.25 / 6.81:1 ≥ 3:1). No gap.
- **(c) Icon-only topbar buttons** — chat FAB and sidebar trigger are `<Button size="icon">` with `aria-label`s; global halo + full-opacity Button ring (the `/50`-alpha ring was the one gap, fixed in `7bc8ad1`). No gap.

## Notes / non-issues

- The kit's own swatch-documentation bug (static hex labels not updating with the theme toggle) — not applicable: that documentation UI was never copied, only the token values are consumed.
- Light `--input` boundary: `--input = --surface` (decision 6) is ~1.1:1 against card — a border-only affordance can't reach 3:1 with kit-literal values in light mode. The kit's own light inputs are *filled* fields (12% fg-mix fill + 26% fg-mix edge), so this is a design follow-up, not a contrast regression; text pairs are this audit's scope and dark controls already get the kit's `--muted`-edge correction pattern. Flagged, not changed.
- Sidebar wash-vs-sidebar stays < 3:1 by design (soft tint); the active state is carried by the 3px primary bar + text contrast, both ≥ 3:1 / 4.5:1.

## Verification

`bun run test` (79/79), `bun run typecheck`, `bun run build` — all green.
