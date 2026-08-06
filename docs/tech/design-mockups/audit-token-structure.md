# Token structure audit: tweakcn/shadcn slots vs. the kit

Audit for [#153](https://github.com/vic-corp-code/Anima/issues/153), part of the "Design system — Back Office (BO) v2" milestone. Enumerates every CSS variable slot tweakcn/shadcn expects, compares it against what `docs/tech/design-mockups/assets/site.css` actually defines, and proposes a concrete mapping. This is a **documentation-only audit** — it does not write `globals.css` (that's [#155](https://github.com/vic-corp-code/Anima/issues/155)) and does not decide anything outside the mapping itself.

Sources read: `assets/site.css` (full light + dark `:root` blocks), `ui-kit.html`, `admin-dashboard.html`, `docs/tech/design-system.md`, and the findings already established in issue #153's body (treated here as settled, not re-derived).

## 0. Established going in (from #153, not re-derived here)

- **Dark-mode mechanism confirmed matching**: `[data-theme="dark"]` attribute on `<html>`, toggled via `documentElement.setAttribute('data-theme', t)` — exactly the mechanism `docs/tech/design-system.md` already decided on. No adapter needed.
- **The single most important row**: shadcn's `--accent` is a neutral hover/highlight slot. It is **not** the kit's `--accent`, which is the warm brand color. The kit's `--accent` maps to shadcn's `--primary`/`--primary-foreground`. Getting this backwards would put the brand color in the wrong semantic slot everywhere a shadcn component reaches for `--accent` (e.g. hover states on menu items).
- shadcn tokens come in foreground/background **pairs**; the kit's tokens are standalone. Every pairable slot below shows what text color the kit actually uses on top of it (`--accent-on` is the kit's only explicit "-on" companion — everything else pairs by convention/observed usage, not a dedicated token).
- `--meta` and the tag-color pattern have no shadcn slot at all — carried as an extra custom token, not force-fit.
- Sidebar tokens aren't defined directly in the kit. Section 4 derives them from `--surface`/`--accent`/`--border-soft`, grounded in how `admin-dashboard.html`'s actual sidebar markup uses those tokens (see 4.1).

## 1. Kit's own tokens (from `assets/site.css`)

| Kit token | Light | Dark |
|---|---|---|
| `--bg` | `#fbf6ee` | `#17120e` |
| `--surface` | `#fffdf8` | `#1f1913` |
| `--surface-warm` | `#f1e3cf` | `#2c231a` |
| `--fg` | `#201914` | `#f4ece1` |
| `--fg-2` | `#4c4037` | `#d3c6b6` |
| `--muted` | `#7a6d63` | `#9e9081` |
| `--meta` | `#9b5b32` | `#dda06d` |
| `--border` | `#ded2c3` | `#4d4036` |
| `--border-soft` | `#eee4d7` | `#33291f` |
| `--accent` | `#9b5b32` | `#d9925c` |
| `--accent-on` | `#ffffff` | `#1a130d` |
| `--accent-hover` | `color-mix(in oklab, var(--accent), black 8%)` | `color-mix(in oklab, var(--accent), white 12%)` |
| `--accent-active` | `color-mix(in oklab, var(--accent), black 14%)` | `color-mix(in oklab, var(--accent), white 20%)` |
| `--success` | `#4f8a4f` | `#7cbb7c` |
| `--warn` | `#c9822f` | `#e0a24f` |
| `--danger` | `#b33a3a` | `#e58079` |
| `--elev-flat` | `none` | `none` |
| `--elev-ring` | `0 0 0 1px var(--border)` | (same formula) |
| `--elev-raised` | `0 20px 52px rgba(32,25,20,.12)` | `0 20px 52px rgba(0,0,0,.55)` |
| `--focus-ring` | `0 0 0 4px rgba(155,91,50,.24)` | `0 0 0 4px rgba(217,146,92,.35)` |
| `--radius-sm` / `-md` / `-lg` / `-pill` | `10px` / `16px` / `24px` / `9999px` | (same, radius has no dark variant) |
| `--tracking-display` | `-0.025em` | (same) |

Note: `--muted` in the kit is a **text** color (used for secondary/quiet copy), while shadcn's `--muted` is a **background** slot with its own `--muted-foreground` text companion. Same name, different role — flagged explicitly in §2 so it isn't copied over literally.

`ui-kit.html` and `admin-dashboard.html` were checked for any tokens beyond this list: `ui-kit.html` defines none (it only consumes `site.css`'s set, plus unrelated type/spacing/motion tokens not relevant to color theming). `admin-dashboard.html` defines exactly two new custom properties — `--admin-pad` (responsive content padding) and `--side-w` (sidebar width, `248px`) — both layout, not color/theming, so out of scope for this audit.

## 2. Mapping table: kit token → shadcn slot → light → dark

| shadcn slot | Kit source | Light | Dark | Notes |
|---|---|---|---|---|
| `--background` | `--bg` | `#fbf6ee` | `#17120e` | |
| `--foreground` | `--fg` | `#201914` | `#f4ece1` | |
| `--card` | `--surface` | `#fffdf8` | `#1f1913` | Confirmed by `admin-dashboard.html`: panels/cards sit on `--surface`, border `--border-soft` (not `--border` — see the border row below). |
| `--card-foreground` | `--fg` | `#201914` | `#f4ece1` | Kit has no separate on-card text color; body `--fg` is reused. |
| `--popover` | `--surface` | `#fffdf8` | `#1f1913` | No dedicated popover token in the kit. Nearest analog is the mobile-nav dropdown, which uses `--surface` + `--elev-raised`. Same source as `--card` — flagged as a merge, per Victoria's explicit "merging where there's no clean 1:1 source is fine." |
| `--popover-foreground` | `--fg` | `#201914` | `#f4ece1` | |
| `--primary` | `--accent` | `#9b5b32` | `#d9925c` | **The critical row.** This is the kit's brand-warm accent, not shadcn's neutral `--accent` slot. |
| `--primary-foreground` | `--accent-on` | `#ffffff` | `#1a130d` | The kit's only explicit foreground-pairing token; use it exactly as named. |
| `--secondary` | `--surface` | `#fffdf8` | `#1f1913` | `.btn-secondary` in `site.css` is `background: var(--surface); color: var(--fg); border: var(--border)`. Same source as `--card`/`--popover` — another explicit merge. |
| `--secondary-foreground` | `--fg` | `#201914` | `#f4ece1` | |
| `--muted` | `--surface-warm` | `#f1e3cf` | `#2c231a` | shadcn's `--muted` is a *background* slot (subtle recessed panel). The kit's `--surface-warm` is the closest match (used for ghost-button fill, active tag backgrounds). **Do not** map this from the kit's own `--muted` token — that's a text color, see §1. |
| `--muted-foreground` | `--muted` (kit) | `#7a6d63` | `#9e9081` | This is where the kit's `--muted` *does* belong — as the foreground half of shadcn's pair, not the background half. |
| `--accent` (shadcn's neutral hover slot) | `--surface-warm` | `#f1e3cf` | `#2c231a` | Confirmed against real usage: `admin-dashboard.html`'s sidebar hover state and `site.css`'s `.btn-ghost`/`.mobile-nav a:hover` all use `--surface-warm`. Same source as shadcn `--muted` above — the kit doesn't distinguish "muted panel" from "hover highlight," shadcn does; one kit token covers both. |
| `--accent-foreground` | `--fg` | `#201914` | `#f4ece1` | |
| `--destructive` | `--danger` | `#b33a3a` | `#e58079` | |
| `--destructive-foreground` | *(gap — no kit token)* | — | — | The kit has no `--danger-on` companion (unlike `--accent-on`). Existing usages (`.tag--wait`/`.tag--ok`-style patterns) compute text color via `color-mix()` at the call site rather than storing a flat foreground. Needs a real value picked in #155 — likely `#ffffff` for light (danger is dark enough to carry white text) but dark mode's `#e58079` is light enough that it may need a dark foreground instead; check contrast, don't assume. |
| `--border` | `--border` | `#ded2c3` | `#4d4036` | Kit uses **two** border tokens (`--border`, `--border-soft`) where shadcn has one. Tracing real component usage: buttons and structural dividers use `--border`; cards, inputs, and the sidebar container use `--border-soft`. shadcn's single `--border` can't carry both — recommend keeping `--border-soft` as an explicit extra custom token (like `--meta`) rather than collapsing it, and deciding per-component in #155 which one a given shadcn primitive should actually receive. |
| `--input` | `--border-soft` | `#eee4d7` | `#33291f` | Confirmed from `admin-dashboard.html`'s form-field styling: inputs border on `--border-soft`, not `--border`; focus swaps to `--accent`. |
| `--ring` | `--accent` | `#9b5b32` | `#d9925c` | Structural mismatch, not just a value pick: the kit's `--focus-ring` is a full box-shadow (`0 0 0 4px rgba(...)` — a 4px soft ring baked at fixed opacity), while shadcn's `--ring` is a single solid color consumed by Tailwind's `ring-*` utilities (width/offset are separate classes, not baked into the token). The color component of `--focus-ring` is `--accent` at ~24-35% opacity, so `--ring: var(--accent)` is the right source — but #155 needs to explicitly decide whether to keep the kit's soft box-shadow ring style (would need a custom Tailwind ring utility) or adopt shadcn's default hard-edged ring. Don't assume one silently. |
| `--chart-1` … `--chart-5` | *(gap — no kit token)* | — | — | The kit has no data-visualization palette at all — not partially covered, entirely absent. A mechanical candidate set exists (`--accent`, `--success`, `--warn`, `--danger`, `--meta`), but `--accent` and `--meta` are both warm browns and `--warn`/`--danger` are adjacent orange/red — as a 5-color categorical set this risks poor distinguishability (including for color-blind users). This needs a real design decision in #155, not a mechanical fill-in. |
| `--radius` (+ derived `sm`/`md`/`lg`/`xl`) | `--radius-sm/md/lg/pill` | `10px`/`16px`/`24px`/pill | (same) | Structural mismatch: shadcn derives 4 sizes from **one** base via `calc()` offsets (e.g. `sm: base-4px`, `md: base-2px`, `lg: base`, `xl: base+4px`), a narrow linear spread. The kit has 3 explicit, widely-spaced sizes (10/16/24) *plus* a hard `9999px` pill that buttons always use — no single base value reproduces that spread through shadcn's formula. #155 needs to decide: pick one base and accept fidelity loss on sm/lg, use multiple radius tokens instead of shadcn's single-base scale, or add `--radius-pill` as a named extra (parallel to how `--meta`/`--border-soft` are carried as extras). |
| Shadow scale (`--shadow-2xs` … `--shadow-2xl`, 8 steps) | `--elev-flat` / `--elev-ring` / `--elev-raised` | see §1 | see §1 | The kit doesn't have a graduated scale — it has 3 flat *states* (none / hairline-ring / one raised elevation), not 8 sizes. Only `--elev-raised` is an actual blurred shadow; `--elev-ring` is a 1px outline, not a shadow. Recommend anchoring `--shadow-lg`/`--shadow-xl` to `--elev-raised` and `--shadow-xs`/`--shadow-sm` to `--elev-ring`'s hairline — the remaining 4-5 steps (`2xs`, `xs`/`sm` gaps, `md`, `2xl`) have no source value and would need to be invented, not extracted, in #155. |
| Tracking scale (`--tracking-tighter` … `--tracking-widest`) | `--tracking-display` | `-0.025em` | (same) | The kit has exactly one tracking variable, applied only to `h1`. `h2`/`h3` hardcode `-0.02em`/`-0.01em` inline rather than using variables, and `site.css` itself hardcodes further literals never captured as `--tracking-*` variables: `0.02em` on `.btn`/`.site-nav a` (buttons/nav) and `0.09em` on `.eyebrow`. `design-system.md`'s own letter-spacing note cites a different, non-overlapping pair — `-0.02em` headings and `0.06em` uppercase micro-labels — so these are two separate sources, not one list; the conclusion below holds for either set. Recommend treating `--tracking-display` as shadcn's tightest step (`--tracking-tighter` or `--tracking-tight`) and, per `design-system.md`'s own recommendation, leaving the rest as arbitrary Tailwind values (`tracking-[0.06em]`) rather than inventing a full scale to force these into — same call design-system.md already made for the same reason. |

## 3. Extra kit tokens with no shadcn slot

Carried forward as custom tokens, not force-fit into the standard list (explicitly OK'd by Victoria in #153):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--meta` | `#9b5b32` | `#dda06d` | Eyebrow labels, "new" indicator dots — metadata emphasis, distinct from both `--muted` (quiet text) and `--accent`/`--primary` (interactive/brand). |
| `--border-soft` | `#eee4d7` | `#33291f` | Secondary hairline for cards/inputs/sidebar container (see the `--border`/`--input` rows above) — the kit's border system is two-tier where shadcn's is one-tier. |
| `--accent-hover` / `--accent-active` | `color-mix()` formulas | `color-mix()` formulas | State variants of `--primary`. shadcn has no equivalent slot — Tailwind's `hover:`/`active:` modifiers plus opacity utilities normally cover this instead. Flag the opposite gap direction: the kit has explicit tokens for something shadcn/Tailwind conventionally does with utility classes, not tokens. #155 should decide whether to keep these as tokens (for consistency with the rest of the kit) or drop them in favor of Tailwind state modifiers.
| Tag/status-pill colors | computed via `color-mix()` at the call site from `--warn`/`--success`/`--surface` | same, inverted | Not a stored token at all — `.tag--wait`/`.tag--ok` compute their color inline. Worth noting since shadcn/tweakcn also has no dedicated "tag" slot; this pattern (derive at use-site from `--warn`/`--success`) is a reasonable one to keep rather than pre-computing fixed tag colors. |

## 4. Sidebar: `--sidebar` + 7 sub-slots

Not defined directly anywhere in the kit (confirmed — neither `site.css` nor `ui-kit.html` has a sidebar-specific token block; `ui-kit.html`'s own component index doesn't style itself as a "sidebar" component). shadcn's `sidebar.tsx` primitive (already on `ds-milestone` via #129, "Install core shadcn primitives," commit d0dd9f9) references 6 of these 8 slots directly in `packages/ui/src/components/ui/sidebar.tsx`: `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`. `--sidebar-primary`/`--sidebar-primary-foreground` never appear in the file — they're part of shadcn's documented slot set but nothing the installed primitive currently consumes, which makes §4.2's rows for those two more speculative than the rest of this section (no live code path to check them against, not just no mockup element to trace). This section is a **proposed derivation**, not an extraction — grounded where possible in real behavior traced from `admin-dashboard.html`'s actual sidebar markup/CSS (§4.1), proposed by analogy elsewhere (§4.2).

### 4.1 Grounded in `admin-dashboard.html`'s real sidebar

| shadcn slot | Kit source | Light | Dark | Grounding |
|---|---|---|---|---|
| `--sidebar` | `--surface` | `#fffdf8` | `#1f1913` | Sidebar container background in the mockup. |
| `--sidebar-foreground` | `--fg-2` | `#4c4037` | `#d3c6b6` | Default (inactive) nav-link text color in the mockup. |
| `--sidebar-border` | `--border-soft` | `#eee4d7` | `#33291f` | Sidebar's own container border in the mockup (not `--border`). |
| `--sidebar-accent` | `color-mix(in oklab, var(--accent) 12%, var(--surface))` | *(computed)* | *(computed)* | The mockup's active-nav-item background is exactly this formula, not a flat color — carry the `color-mix()` expression itself rather than flattening it to a hex. |
| `--sidebar-accent-foreground` | `--accent` | `#9b5b32` | `#d9925c` | Active nav-item text/icon color in the mockup. |

### 4.2 Proposed by analogy (no distinct element in the mockup to confirm against)

`--sidebar-primary`/`--sidebar-primary-foreground` also aren't referenced by the currently-installed `sidebar.tsx` (see above) — lower priority to resolve than the rest of this table until/unless a component actually consumes them.

| shadcn slot | Kit source | Light | Dark | Why unconfirmed |
|---|---|---|---|---|
| `--sidebar-primary` | `--accent` | `#9b5b32` | `#d9925c` | shadcn typically reserves this for a standalone CTA/brand element inside the sidebar (distinct from the active-menu-item styling in §4.1). The mockup's sidebar has no such element — this is a same-as-global-primary guess, not a traced value. |
| `--sidebar-primary-foreground` | `--accent-on` | `#ffffff` | `#1a130d` | Same caveat as above. |
| `--sidebar-ring` | `--accent` | `#9b5b32` | `#d9925c` | Consistent with the global `--ring` proposal in §2 — same structural caveat applies (kit's focus style is a box-shadow ring, shadcn's is a plain ring color). |

## 5. Open questions / gaps for #155 (Palette v2)

1. **`--destructive-foreground` has no source value.** Needs a real pick + contrast check for both light (`#b33a3a` bg) and dark (`#e58079` bg) — don't reuse `--accent-on` by default, danger's dark-mode value is much lighter than accent's.
2. **`--chart-1..5` is a total gap**, and the mechanical candidate set (`accent`/`success`/`warn`/`meta`/`danger`) has real distinguishability risk — `accent` and `meta` are both warm browns, `warn`/`danger` are adjacent hues. Needs an actual design pass, not auto-fill.
3. **Radius can't be reproduced by shadcn's single-base `calc()` scale.** The kit's 10/16/24/pill spread is wider than a 4-step linear derivation covers, and pill has no scale slot at all. Decide: accept fidelity loss, add extra radius tokens, or restructure the scale.
4. **Shadow scale is mostly unfilled.** The kit only actually gives you 2 usable shadow values (`--elev-ring`, `--elev-raised`) against an 8-step scale — most steps need to be invented, and elsewhere in Anima that's explicitly out of scope for #155 alone (see #133, the elevation/motion audit, for how the shadow/radius `calc()` derivation pattern should apply more broadly).
5. **`--ring`'s shape mismatch**: kit's focus style is a soft 4px box-shadow at fixed opacity; shadcn's `--ring` is a flat color meant for hard-edged `ring-*` utilities. Decide whether dark/light-mode focus rings keep the kit's softer look (custom Tailwind ring utility) or move to shadcn defaults — this is a visible, not just structural, decision.
6. **Two-tier border system (`--border` / `--border-soft`) vs. shadcn's single `--border`.** Real usage splits roughly: `--border` for structural/interactive edges (buttons, dividers), `--border-soft` for card/input/sidebar containers. Either keep `--border-soft` as a permanent extra custom token (recommended — it's clearly load-bearing, not incidental) or collapse the distinction; don't let it default to "shadcn's `--border` wins everywhere" without a conscious choice, since that would visibly change card/input contrast from what the mockup shows.
7. **`--input` background is ambiguous** in the traced admin-dashboard styling (reads as `--surface` in some rules, `--bg` in others) — worth a direct look at the mockup's rendered form fields rather than just the CSS, to settle which one is intended.
8. **Sidebar `--sidebar-primary`/`-primary-foreground`/`-ring` (§4.2) are unconfirmed guesses** — no distinct sidebar CTA element exists in the mockup to check them against. If #155 designs a sidebar element that would use these slots (e.g. a "new announcement" button pinned in the sidebar), revisit against that real component instead of the analogy used here.
9. **No `--input-foreground` row.** Checked deliberately, not an oversight: neither shadcn's own theming docs nor tweakcn's published variable list define a dedicated `--input-foreground` slot — text inside form controls is covered by the global `--foreground` token, same as everywhere else. The kit's own inputs set `color: var(--fg)` directly (per `admin-dashboard.html`'s form styling), which is consistent with reusing `--foreground` rather than needing a separate slot — no gap to fill. If a future tweakcn export this repo adopts does turn out to define `--input-foreground`, it maps straight to `--fg`, same source as `--foreground` itself.
