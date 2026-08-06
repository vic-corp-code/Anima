# Audit — spacing, breakpoints & mobile responsive behavior

Part of the Phase 0 audit for the restarted Design system milestone (#9), against the **new** Open Design kit (`ui-kit.html` + `admin-dashboard.html`, brought in by #156) — not the old 6-screen mockup that `docs/tech/design-system.md` still describes. Read-only research for #132; gates the sidebar/nav shell issue (#138).

Source files: `docs/tech/design-mockups/ui-kit.html`, `docs/tech/design-mockups/admin-dashboard.html`, `docs/tech/design-mockups/assets/site.css`, `docs/tech/design-mockups/assets/site.js`. All three HTML/CSS/JS files are shared across the kit — `ui-kit.html` and `admin-dashboard.html` both `<link>` the same `assets/site.css` and layer page-specific `<style>` on top; only the public-site nav toggle lives in the shared `assets/site.js` (see §3).

## 1. Container widths, gutters, spacing scale

**Spacing scale** — defined once in `site.css` `:root`, consumed everywhere via `var(--space-N)`:

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |

It's a consistent 4px-multiplier system (4/8/12/16/20/24/32/48 — every step is `4px × n`), but the step sequence isn't linear: it skips 7, 9, 10, 11 and jumps straight from 6→8→12. Treat it as a fixed palette of 8 allowed values, not "any multiple of 4."

**Container / gutters** — also `site.css` `:root`, used by the `.container` class:

| Token | Value |
|---|---|
| `--container-max` | 1180px |
| `--container-gutter-desktop` | 36px |
| `--container-gutter-tablet` | 24px |
| `--container-gutter-phone` | 16px |

`.container { width: 100%; max-width: var(--container-max); margin: 0 auto; padding: 0 var(--container-gutter-desktop); }`, with the gutter swapped to `-tablet`/`-phone` at the two breakpoints below.

**Important distinction — the admin shell does *not* use `.container` at all.** `ui-kit.html` (a documentation/reference page, laid out like the marketing site) uses `.container` throughout and is capped at 1180px. `admin-dashboard.html` (the actual app shell) never references `.container` — it defines its own fluid padding token instead:

```css
--admin-pad: clamp(16px, 3vw, 32px);
```

applied to `.topbar` and `.content`. So the dashboard content area is full-bleed / fluid-width (no max-width cap), with padding that scales continuously between 16px and 32px based on viewport width, plus a fixed `--side-w: 248px` sidebar. There is no equivalent of a "max content width" for the admin app — worth deciding explicitly when building the real shell, since shadcn's dashboard blocks typically do use one.

## 2. Breakpoints

Every `@media` value found, across all three sources (all `max-width`):

| Breakpoint | Defined in | What changes |
|---|---|---|
| **1240px** | `admin-dashboard.html` | `.kpi-grid` 5→3 cols, `.media-grid` 4→3 cols |
| **1080px** | `site.css` | Global `:root` text-scale tokens shrink (`--text-4xl/3xl/2xl`); `.container` gutter → tablet; `.band` padding → tablet; `.footer-grid` → 2 cols; public site-nav hides, `.nav-toggle` hamburger appears (marketing header only, see §4) |
| **1024px** | `admin-dashboard.html` | **Sidebar goes off-canvas** — see §3. Also: `.dash-grid` → 1 col, `.col-days` table column hidden |
| **980px** | `ui-kit.html` | `.kit-layout` (sticky index + content) collapses to 1 column; sticky index becomes static |
| **860px** | `admin-dashboard.html` | `.kpi-grid` → 2 cols, `.dash-grid-2` → 1 col, `.content-grid` → 1 col, `.media-grid` → 2 cols, topbar search hidden, `.col-breed`/`.col-updated` table columns hidden |
| **720px** | `site.css`, `ui-kit.html` | `site.css`: text-scale shrinks further, `.container` gutter → phone, `.band` padding → phone, `.section-head` stacks, `.footer-grid` → 1 col. `ui-kit.html`: `.principles-grid` → 1 col, `.type-row` grid tightens |
| **620px** | `admin-dashboard.html` | `.kpi-grid` → 1 col, `.col-type` table column hidden, `.field-row` → 1 col, `.drawer` → full width, demo pill hidden, view-head `h1` shrinks |
| **480px** | `admin-dashboard.html` | `.col-age` table column hidden, `.media-grid` → 1 col |

No `min-width` media queries anywhere — everything is defined top-down from desktop.

## 3. Sidebar / mobile nav — the critical question

**Yes — `admin-dashboard.html` defines a real, complete, working mobile sidebar pattern.** This is a meaningful change from the old (now-superseded) mockup, which `design-system.md` correctly flagged as having *zero* mobile nav — the old mockup just hid the sidebar below 1024px with nothing replacing it, which is what caused rework on the original sidebar issue. The new kit does not repeat that miss.

**CSS** (`admin-dashboard.html`, inside `@media (max-width: 1024px)`):
```css
.sidebar { transform: translateX(-100%); box-shadow: var(--elev-raised); }
.sidebar.is-open { transform: translateX(0); }
.sidebar-backdrop.is-open { display: block; opacity: 1; }
.main { margin-left: 0; }
.hamburger { display: inline-grid; }
```
Above 1024px the sidebar is `position: fixed` at `--side-w: 248px` and always visible (`.main` has `margin-left: var(--side-w)`); the hamburger button (`.iconbtn.hamburger`, `#sidebarOpen`) is `display: none`. Below 1024px it flips to an off-canvas drawer (`translateX(-100%)` by default, slides in via `transform` transition on `.is-open`), `.main` collapses its margin to 0 (full width), and the hamburger becomes visible in the topbar.

**JS** (inline `<script>` at the bottom of `admin-dashboard.html`, *not* in the shared `assets/site.js` — that file only handles the public marketing-site header's mobile nav toggle, unrelated to the admin sidebar):
```js
var sidebar = $('#sidebar');
var sidebarBackdrop = $('#sidebarBackdrop');
function openSidebar() { sidebar.classList.add('is-open'); sidebarBackdrop.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
function closeSidebar() { sidebar.classList.remove('is-open'); sidebarBackdrop.classList.remove('is-open'); document.body.style.overflow = ''; }
$('#sidebarOpen').addEventListener('click', function () { sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar(); });
sidebarBackdrop.addEventListener('click', closeSidebar);
```
This is a full hamburger-toggle + off-canvas drawer + dark overlay pattern:
- Hamburger button toggles open/closed.
- A `.sidebar-backdrop` overlay (`position: fixed; inset: 0`, semi-transparent) appears behind the drawer and closes it on click.
- Body scroll is locked (`overflow: hidden`) while the drawer is open.
- Selecting a nav item auto-closes the sidebar (`switchView()` calls `closeSidebar()` on every nav click) — appropriate single-page-app behavior for a drawer.

**One gap worth flagging, not a blocker**: there's no Escape-key handler wired to the sidebar (only the separate right-side detail `.drawer` responds to Escape, at line ~1036). Minor, and moot anyway per the recommendation below.

**Recommendation for #138**: despite this being a real, considered pattern (unlike the old mockup), it's still a bespoke hand-rolled implementation, not shadcn's `sidebar` block. Per `design-system.md`'s existing decision ("Mobile nav: replace the hand-rolled bottom-tab bar... with the shadcn sidebar block's own responsive behavior... Build this from the shadcn block's own defaults, not from the mockup" — written against the *old* mockup, but the reasoning still holds against the new one), #138 should still build from shadcn's `sidebar` block and its own default mobile `Sheet` behavior rather than porting this bespoke transform/backdrop pattern verbatim. The value of this finding is: the new kit's behavior (hamburger + off-canvas + overlay + auto-close-on-navigate, single breakpoint at 1024px) is directionally consistent with what shadcn's `Sheet`-based sidebar does out of the box, so there's no conflict to resolve — just no need to reverse-engineer a custom mobile interaction from scratch, and no reason to treat the mockup as silent on mobile the way the old one was.

## 4. Other responsive behavior

**Public/marketing header nav** (`site.css`, shared — used by `ui-kit.html`'s own header, not by the admin dashboard, which has no `.site-nav`): standard responsive header pattern, separate from the admin sidebar. Below 1080px, `.site-nav` and the header CTA button hide and `.nav-toggle` (hamburger) appears; `assets/site.js` wires `#navToggle`/`#mobileNav` to toggle a `data-open="true"` attribute on `.mobile-nav`, which is an absolutely-positioned dropdown panel (`position: absolute; top: 100%`), not an off-canvas drawer — simpler than the admin sidebar pattern, and with Escape-key support (`assets/site.js` line ~59).

**Card/stat grids** — two different strategies depending on file:
- `ui-kit.html`'s own patterns (`.card-grid`, `.pattern-grid`) use `repeat(auto-fit, minmax(240px, 1fr))` — fluid, self-wrapping, no explicit breakpoint needed.
- `admin-dashboard.html`'s dashboard grids use fixed `repeat(N, 1fr)` column counts that step down at explicit breakpoints instead (see §2 table: `.kpi-grid` 5→3→2→1, `.media-grid` 4→3→2→1, `.content-grid`/`.dash-grid-2` 2→1). Two different responsive-grid philosophies coexist in the kit — worth picking one (fluid `auto-fit`/`auto-fill` is simpler to maintain and matches what shadcn block grids typically do) rather than porting the admin dashboard's fixed-step breakpoints as-is.

**Tables — two different, inconsistent patterns**:
- `ui-kit.html`'s documented/generic table pattern (`.kit-table-wrap`) uses horizontal scroll: `overflow-x: auto` with `.kit-table { min-width: 480px }`, i.e. the table scrolls sideways inside its wrapper on narrow viewports.
- `admin-dashboard.html`'s actual data tables (Animals, Adoptions lists) do the opposite: `.table-scroll { overflow-x: hidden }` (no horizontal scroll at all) and instead progressively **hide columns** at each breakpoint via utility classes (`col-days` hidden ≤1024px, `col-breed`/`col-updated` ≤860px, `col-type` ≤620px, `col-age` ≤480px), driven by both CSS and matching JS (the animal-row renderer emits the same `col-*` classes). This is a deliberate, considered pattern for the real tables (least-important columns drop first), not an oversight — but it contradicts what the UI kit documents as "the" table pattern. Flag this inconsistency; #138 and future table-building issues should decide once which pattern BO data tables actually use (column-dropping matches what the working dashboard does and is arguably better for a data-table block anyway).

**Detail drawer** (right-side panel, `admin-dashboard.html`, separate from the sidebar): `width: min(480px, 100%)`, becomes full-width below 620px (`.drawer { width: 100% }` in the 620px query), has its own backdrop and *does* respond to Escape.

## Summary for #138

- Spacing unit: 4px-multiplier scale, 8 fixed steps (4 through 48), token `--space-N`.
- Container: `.container`/1180px+gutters applies to marketing-style pages (`ui-kit.html`); the admin app shell (`admin-dashboard.html`) is full-bleed with fluid `clamp(16px, 3vw, 32px)` padding instead — no max-width cap on the app content area.
- Breakpoints in use: 480, 620, 720, 860, 980, 1024, 1080, 1240px (no consistent shared set — each file/component picks its own).
- **Sidebar mobile behavior: real and complete**, not absent like the old mockup — hamburger toggle, off-canvas slide (`transform`, single breakpoint at 1024px), dark backdrop with click-to-close, body-scroll lock, auto-close on navigation. Still recommend building #138 from shadcn's `sidebar` block and its own default `Sheet` mobile behavior rather than porting this bespoke implementation — the two are directionally aligned, so there's nothing to reconcile, just nothing to copy verbatim either.
