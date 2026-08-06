# Audit — typography scale + icon system

Read-only research for [#131](https://github.com/vic-corp-code/Anima/issues/131), Phase 0 of the "Design system — Back Office (BO) v2" milestone (#9). No code changes; this gates the Foundation wave.

Source material: `ui-kit.html`, `admin-dashboard.html`, `assets/site.css` (all in this directory) — the "Paws & Hearts" mockup set brought in by #156. Note this is a different mockup generation from the earlier "Shelter Workspace Mission" set (`index.html`, `dashboard.html`, etc.) documented in `docs/tech/design-system.md` / `EXTRACTION.md` — different palette (warm paper/earthen accent here vs. navy/red there), but the same kind of static HTML/CSS reference. This audit covers only the two files named above.

## 1. Type scale

All type tokens are defined once, in `assets/site.css`'s `:root` (lines 24–34), and shared by both files unchanged — `admin-dashboard.html`'s own `:root` block only adds two layout tokens (`--admin-pad`, `--side-w`), it does not redeclare any `--text-*` value. So there is one scale, not two.

### Size tokens (8 steps, 12–88px)

| Token | Value |
|---|---|
| `--text-xs` | 12px |
| `--text-sm` | 14px |
| `--text-base` | 17px |
| `--text-lg` | 20px |
| `--text-xl` | 28px |
| `--text-2xl` | 42px |
| `--text-3xl` | 64px |
| `--text-4xl` | 88px |

Responsive overrides (`site.css` lines 308, 318, viewport-scoped media queries) shrink the top three steps on smaller screens: `--text-4xl` → 64px → 46px, `--text-3xl` → 48px (tablet only), `--text-2xl` → 34px → 30px, `--text-xl` → 24px (phone only). Same mechanism in both files (inherited from `site.css`); `admin-dashboard.html` adds one more of its own at line 410 (`.view-head h1 { font-size: var(--text-xl) }` on small screens).

### Line-height and letter-spacing tokens

| Token | Value | Used for |
|---|---|---|
| `--leading-body` | 1.62 | body text default |
| `--leading-tight` | 1 | (defined, not referenced by selector in either file — headings hardcode their own line-heights instead, see below) |
| `--tracking-display` | -0.025em | h1 |

### Heading styles (`site.css` lines 103–106)

```css
h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 400; margin: 0; }
h1 { font-size: var(--text-4xl); line-height: 0.98; letter-spacing: var(--tracking-display); }  /* 88px, -0.025em */
h2 { font-size: var(--text-2xl); line-height: 1.06; letter-spacing: -0.02em; }                    /* 42px */
h3 { font-size: var(--text-lg);  line-height: 1.25; letter-spacing: -0.01em; }                    /* 20px */
```

Weight is 400 for every heading level — there is no bold-headline step anywhere in the scale.

**h4 has a base selector (`font-family`/`weight`/`margin` only, shared with h1–h3) but no base font-size/line-height/letter-spacing rule in `site.css`.** It only gets fully styled in `admin-dashboard.html`'s own inline `<style>` (line 341, scoped to `.content-card h4`): `font-family: var(--font-display); font-size: var(--text-lg); letter-spacing: -0.01em` (line-height unset → inherits body's 1.62, likely a gap since 1.62 is body-copy leading, not display leading). `h4` isn't used in `ui-kit.html` at all.

**h5 and h6 do not exist anywhere in either file** — no CSS rule, no `<h5>`/`<h6>` tag. The scale genuinely only defines 4 heading levels (h1–h4, and h4 only partially/only in one file), not 6. If BO-Shelter screens need h5/h6, there's no mockup precedent to follow — they'd need to be designed fresh, most likely landing on `--text-base` (17px) or `--text-sm` (14px) with the display font-family, keeping the same de facto step-down pattern.

### Body / label / mono styles

| Class / element | Size | Family | Weight | Line-height | Letter-spacing | Where |
|---|---|---|---|---|---|---|
| `body` | `--text-base` (17px) | Inter | inherit (400) | `--leading-body` (1.62) | normal | `site.css:94–102` |
| `.lead` | `--text-lg` (20px) | Inter | inherit | 1.55 | normal | `site.css:122` |
| `.body-copy` | `--text-base` (17px) | Inter | inherit | `--leading-body` (1.62) | normal | `ui-kit.html:101` (kit-local class) |
| `.muted-note` | `--text-sm` (14px) | Inter | inherit | inherit | 0.01em | `site.css:123` |
| `.eyebrow` (all-caps micro-label) | `--text-xs` (12px) | Inter | 600 | inherit | 0.09em | `site.css:118–121` |
| `.mono-datum` | `--text-xs` (12px) | SF Mono | inherit | inherit | 0.02em | `ui-kit.html:102` |
| `.type-sample` (display preview text) | (varies per row) | Georgia | inherit | 1.1 | -0.015em | `ui-kit.html:94` |

Field labels, table headers, KPI labels, sidebar nav labels, etc. are all built from these same primitives (`--text-xs`/`--text-sm` + uppercase + tracked letter-spacing + weight 600–700) rather than distinct named tokens — the pattern is consistent but ad hoc, e.g. `.field-label` (`text-sm`, weight 600), `.kit-table th` (`text-xs`, weight via inherited uppercase treatment).

### Drift found: `admin-dashboard.html` introduces off-scale sizes

The 8-step token scale itself is not touched or redeclared by `admin-dashboard.html`, but its own inline `<style>` block hardcodes several **new pixel sizes below `--text-xs` (12px) that aren't on the scale at all**, instead of reusing the smallest token:

- `10px` — `.side-brand .brand-sub`, `.side-group-label` (line 35), `.donut-hole .l`
- `11px` — `.side-link .count` (line 58), `.side-profile .who span`, `.topbar-crumb`, `.kpi-label`, `.feed-item .when`, `.field label`, `.field-hint`, table `th`, `.demo-pill` (line 126), `.media-tile .meta .dim` (line 353), plus two inline `style="font-size:11px"` labels (lines 629, 857)
- `12px` — `.kpi-delta`, `.bar-row .month`, `.attn-row .body span`, `table.data td.mono`, `.field-error`, `.content-card .meta`, `.stage-name`, `.toggle-row .tx span`, `.illus-note`, `.msg-row .when` (line 361)
- `13px` — `.btn-sm`

None of `10px`/`11px`/`13px` exist as a token; `12px` duplicates `--text-xs` by value but bypasses the variable. This is real scale fragmentation in the admin surface specifically (`ui-kit.html` doesn't do this — every size in it traces back to a `--text-*` var). Worth a decision before BO build: either fold these into `--text-xs` (nearest match, 12px) or add an explicit smaller token (e.g. `--text-2xs`, ~11px) if the admin density genuinely needs something under 12px. Recommend the latter only if legibility at 11–13px is validated; otherwise snap everything to `--text-xs`.

### Cross-check: does `admin-dashboard.html` visually agree with `ui-kit.html`?

Yes for the shared tokens, with one semantic note: every in-page `<h1>` in `admin-dashboard.html` (Dashboard's "Good afternoon…", Animals, Adoptions, Content, Media library, Messages, Settings) is wrapped in `.view-head` and restyled to `font-size: var(--text-2xl)` / `letter-spacing: -0.02em` (line 145) — i.e. visually identical to `ui-kit.html`'s **h2** treatment (site.css line 105), not the 88px base h1. This is a deliberate admin-density choice (dense dashboard, not a marketing hero) rather than a bug, but it means "h1" in the admin context is a semantic label only — the visual size that maps to it is the h2 step. Flag this explicitly if/when translating to BO-Shelter's actual heading hierarchy, since a literal "use `<h1>` → 88px" mapping would be wrong for admin screens.

## 2. Icon system

**Finding: hand-drawn inline SVG only. No icon font, no icon library import, no `<link>`/class-based icon system anywhere.**

Grep across both files and `site.css` for `<link`, `@font-face`, icon-font class patterns (`fa-`, `material-icons`, etc.), and icon libraries turned up nothing beyond the one `<link rel="stylesheet" href="assets/site.css">` in each file's `<head>`. No Font Awesome, no Material Icons, no Lucide, no icon webfont.

Both files embed the same mechanism: a single hidden `<svg width="0" height="0" style="position:absolute">` sprite sheet near the top of `<body>`, containing hand-authored `<symbol id="...">` definitions (24×24 viewBox for UI glyphs, two chevrons — `i-up`/`i-down`, admin-only — at 12×12; 64×64 for the three animal glyphs, `g-paw` is 24×24 fill not stroke), each referenced elsewhere via `<svg><use href="#id"/></svg>`. Most UI glyphs use `stroke="currentColor"` so they inherit text/accent color contextually; the fill-based ones (`g-paw`, `i-up`, `i-down`) use `fill="currentColor"` for the same effect.

- `ui-kit.html` defines the base set (lines 320–338): `g-dog`, `g-cat`, `g-rabbit`, `g-paw` (animal/brand glyphs), `i-heart`, `i-arrow`, `i-check` (generic UI glyphs).
- `admin-dashboard.html` defines a superset (lines 420–476), the same 4 animal/brand glyphs plus a fuller admin UI set: `i-heart`, `i-arrow`, `i-check`, `i-grid`, `i-search`, `i-plus`, `i-bell`, `i-gear`, `i-menu`, `i-close`, `i-edit`, `i-image`, `i-mail`, `i-doc`, `i-up`, `i-down`. This is not shared/deduplicated between the two files — each HTML file inlines its own copy of the sprite (with `admin-dashboard.html`'s being a superset, not a fork with diverging paths, from a visual check of the shared symbol IDs).
- The mockup's own written design principles (`ui-kit.html` "Principles" section, lines 921–943) state this explicitly: **Do** "Use the glyph set for icons"; **Don't** "Emoji as icons." So hand-drawn SVG is a stated, intentional direction, not an oversight.

**Confirmed direction (per the task brief): default to Lucide.** `packages/ui/package.json` already depends on `lucide-react`, and it's the icon set shadcn/ui's own components assume by default — so adopting it for BO-Shelter avoids a second icon system living alongside shadcn's blocks. This is a rebuild, not a port: Lucide's icon set doesn't 1:1 match the mockup's hand-drawn glyphs (the mockup's `g-dog`/`g-cat`/`g-rabbit`/`g-paw` are bespoke brand marks with no obvious Lucide equivalent — closest stock options are `dog`, `cat`, `rabbit`, `paw-print`, but they won't match the mockup's specific line weight/style). Recommend: use Lucide for all generic UI glyphs (search, plus, bell, gear, menu, close, edit, image, mail, doc, chevron-up/down, arrow, check, heart — every `i-*` symbol in the audit above has a direct Lucide equivalent), and treat the animal/brand glyphs (`g-dog`, `g-cat`, `g-rabbit`, `g-paw`) as a separate small custom-SVG set kept outside Lucide, since they're brand marks, not utility icons.

## 3. Fonts

Confirmed by Victoria; documented here with exact values pulled from `assets/site.css` (lines 21–23, 32–34, 104–106) — not re-derived.

```css
--font-display: Georgia, "Times New Roman", serif;   /* headlines/display */
--font-body: Inter, system-ui, sans-serif;            /* body copy/UI */
--font-mono: "SF Mono", ui-monospace, Menlo, monospace; /* tokens/data/meta */
```

### Georgia (display)

- `font-family: var(--font-display)` → `Georgia, "Times New Roman", serif`
- `font-weight: 400` on every heading level that uses it (h1–h4; see §1 — there is no bold display weight in this scale)
- Letter-spacing: `-0.025em` (h1, via `--tracking-display`), `-0.02em` (h2), `-0.01em` (h3, h4)
- Line-height: `0.98` (h1), `1.06` (h2), `1.25` (h3); h4 has no explicit line-height (inherits body's 1.62 — likely unintentional, see §1)

### Inter (body/UI)

- `font-family: var(--font-body)` → `Inter, system-ui, sans-serif`
- Base body: `font-size: 17px` (`--text-base`), `font-weight` unset (defaults to 400 via inherited normal weight), `line-height: 1.62` (`--leading-body`)
- Weight 500–600 shows up pervasively for labels/nav/emphasis (e.g. `.eyebrow` 600, `.field-label` 600, `.side-link` 500) — all standard steps, no off-scale weights found in these two files (contrast with the older mockup set, where `design-system.md` flags a `font-weight: 510` one-off — not present in `ui-kit.html`/`admin-dashboard.html`).
- Letter-spacing ranges from tight headline-adjacent contexts (`-0.015em` on `.type-sample`) to tracked uppercase micro-labels (`0.06em`–`0.12em`, e.g. `.eyebrow` at `0.09em`, `.side-group-label` at `0.12em`).

No `@font-face` or Google Fonts `<link>` exists in either file — the mockup relies on Georgia/Inter being present as system/pre-installed fonts in the browser rendering it. That's fine for a static reference file but means BO-Shelter must load both explicitly via `next/font` (Google) rather than assume availability — Georgia is a system font on most platforms as a fallback but not guaranteed on all; Inter is not a system font anywhere and needs actual loading.

### SF Mono (tokens/data/meta) — needs a substitute

`"SF Mono"` has no general web-embedding license and won't render on non-Apple platforms (falls through to `ui-monospace, Menlo, monospace`, which silently becomes a different-looking font on Windows/Linux/Android). Per the task brief, the substitute for this slot only is:

- **Geist Mono**, already in the stack — `apps/shelter/src/app/[locale]/layout.tsx` already imports `Geist_Mono` from `next/font/google` alongside `Geist` (sans). Reusing it here means no new font dependency, just wiring the existing `geistMono` variable into the `--font-mono` CSS variable for BO-Shelter instead of adding something new.
- **JetBrains Mono** as the fallback alternative if Geist Mono's proportions/x-height don't read well against the mockup's tight `.mono-datum`/`.kpi-num .unit` contexts once compared side by side — not adopted unless Geist Mono is visually rejected.

Mono usage in the mockup is exclusively `--text-xs` (12px) with `letter-spacing: 0.02em`, used for: token/spec labels in `ui-kit.html` (`.type-token`, `.space-token`, `.mono-datum`), and live data in `admin-dashboard.html` (`.bar-row .val`, table `.mono`/`.num` cells, `.feed-item .when` timestamps, `.legend-row .ct` counts, `.fee-row` amounts). No heading or body-length mono text anywhere — it's exclusively short, small-size, single-line data/meta strings, which is a favorable case for a substitute font (little room for a mismatched mono to look wrong at length).

## Summary for the Foundation wave

1. **Type scale**: one 8-step scale (12–88px), shared byte-for-byte between both files via `site.css` tokens — confirmed, no drift in the tokens themselves. Real gaps found: h4 is only half-defined (one file, no line-height), h5/h6 don't exist at all, and `admin-dashboard.html` hardcodes several off-scale sizes (10/11/12/13px) outside the token system. Each needs a decision before the scale is ported into Tailwind tokens.
2. **Icons**: hand-drawn inline SVG sprite (`<symbol>`/`<use>`), no icon font or library, confirmed by the mockup's own stated design principles. Move to Lucide for the ~15 generic UI glyphs (already a `packages/ui` dependency, already shadcn's assumed default); keep the 4 animal/brand glyphs (dog/cat/rabbit/paw) as a small bespoke SVG set since Lucide has no equivalent brand marks.
3. **Fonts**: Georgia (display, weight 400 only) / Inter (body/UI) load via `next/font`, replacing Geist as BO-Shelter's sans/display pairing. SF Mono's slot is filled by Geist Mono (already wired up in `apps/shelter/layout.tsx`, zero new dependency), with JetBrains Mono as a fallback only if Geist Mono looks wrong once compared. Mono usage in the mockups is uniformly short/small (12px data strings), which is a low-risk substitution case.
