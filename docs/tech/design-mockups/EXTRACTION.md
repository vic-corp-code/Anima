# Extraction — Shelter Workspace Mission mockup

Reverse-engineered from the 6 static HTML/CSS mockups in this folder (produced in an external tool, Open Design, for a fictional shelter "Refuge Espoir Animal — SPA · Marseille"). No framework, no build step: inline `<style>` per file (fully duplicated across all 6 — same `:root` block, same `.sidebar`/`.nav`/`.btn` rules copy-pasted everywhere), a little vanilla JS per file. Grounds the milestone "Design system — Back Office (BO)" (`docs/tech/design-system.md`, issues #102–118).

## 1. Design tokens

### Colors (light + a dark-mode proof-of-concept added 2026-08-05 to 2 of 6 screens, see below)

| Mockup var | Value | Shelter `globals.css` slot | Notes |
|---|---|---|---|
| `--bg` | `#ffffff` | `--background` / `--color-card` (`0 0% 100%`) | page + card background |
| `--surface` | `#f5f5f5` | `--color-muted` (`240 4.8% 95.9%`) | sidebar bg, table header bg, hover surfaces, stat-bar bg |
| `--fg` | `#000000` | `--foreground` / `--color-card-foreground` | pure black, not `#171717` like current globals.css |
| `--muted` | `#8c8c8c` | `--color-muted-foreground` | secondary text |
| `--border` | `#dbdbdb` | `--color-border` / `--color-input` | |
| `--accent` | `#032f62` (deep navy) | `--color-primary` | primary buttons, active nav, links, focus rings |
| `--accent-secondary` | `#d73a49` (red) | `--color-destructive` | negative stat-trend, "medical" status badge, error-adjacent |
| `--success` | `#17a34a` (green, dashboard/registry/fundraising only — **absent from index.html/announcements.html/social.html**) | no existing slot — **new token needed**, e.g. `--color-success` | "available" badge, positive trend, progress-bar fill, "completed" fundraiser status |
| `--warn` | `#ea580c` (orange, dashboard/registry/fundraising only) | no existing slot — **new token needed**, e.g. `--color-warning` | "high priority" need badge, "adoption in progress" badge |
| — | `#ffffff` hardcoded | `--color-primary-foreground` | text-on-accent, not tokenized in the mockup (just literal white) |

Every mockup redeclares the same 6–8 vars in its own `<style>` — there is no shared stylesheet. Treat `dashboard.html`'s `:root` block as the canonical/most-complete one (adds `--success`/`--warn` that `index.html` lacks).

### The theme picker in index.html is a live customization feature, not just a static palette choice

`index.html` ships a working (localStorage-persisted) accent-color switcher — 9 preset pairs, applied by overwriting `--accent`/`--accent-secondary` on `documentElement` via inline `style.setProperty`:

```js
ocean:  { accent: '#032f62', secondary: '#0a4a8a' }  // default/active
forest: { accent: '#065f46', secondary: '#047857' }
sunset: { accent: '#c2410c', secondary: '#dc2626' }
plum:   { accent: '#6b21a8', secondary: '#7e22ce' }
amber:  { accent: '#b45309', secondary: '#d97706' }
rose:   { accent: '#be123c', secondary: '#e11d48' }
sky:    { accent: '#0369a1', secondary: '#0284c7' }
teal:   { accent: '#0f766e', secondary: '#14b8a6' }
slate:  { accent: '#334155', secondary: '#475569' }
```

This directly matches the "tweak cn to easily allow users to customise" direction. **Decided (2026-08-05): keep this a BO-wide preference, localStorage-persisted, exactly as the mockup builds it — not per-organization.** Per-org theming is deferred until the phase 3+ apps exist. Implement by overriding `--color-primary` as an inline CSS custom property on `documentElement`, same mechanism as the mockup. `secondary` in the picker is really just a darker/adjacent shade of the same hue for gradients — not a second semantic color; don't confuse it with `--accent-secondary` (the red destructive color) used elsewhere, which is unrelated.

**shadcn/tweakcn implication**: this changes issue #103's framing from "pick one static theme" to "install one tweakcn theme as the *default*, but keep `--color-primary` swappable at runtime from a small curated set (the 9 mockup pairs are a ready-made starting list), persisted in the browser." Needs a decision on where the primitive lives (button variant `primary` must read the CSS var, not a hardcoded Tailwind color class).

### Dark mode: a real proposal now exists (added 2026-08-05, `index.html` + `dashboard.html` only)

Victoria added a dark-mode example to 2 of the 6 mockup screens (not all 6 — `announcements.html`, `fundraising.html`, `registry.html`, `social.html` are still light-only). Mechanism, read directly from the updated files:

- **Attribute-based, not media-query-based**: `[data-theme="dark"] { ... }` selector overriding the `:root` vars, toggled by setting/removing `data-theme="dark"` on `documentElement` — **not** `prefers-color-scheme`. This matters: it means dark mode is an explicit user choice here, not an OS-preference follow, and it uses the identical mechanism (attribute + `localStorage`) as the accent-color picker above — the two toggles should likely be built as one small settings system, not two independent ad hoc pieces.
- **Dark palette values**:

  | Token | Light | Dark |
  |---|---|---|
  | `--bg` | `#ffffff` | `#0f0f0f` |
  | `--surface` | `#f5f5f5` | `#1a1a1a` |
  | `--fg` | `#000000` | `#f0f0f0` |
  | `--muted` | `#8c8c8c` | `#a0a0a0` |
  | `--border` | `#dbdbdb` | `#2a2a2a` |
  | `--accent` / `--accent-secondary` | `#032f62` / `#d73a49` | **unchanged** — mockup's own comment flags this: "Accent colors stay the same but will be perceived differently on dark background" |

  **Flag, don't silently fix**: reusing the exact same navy/red on a near-black background is a real contrast risk (navy `#032f62` especially, as text-on-dark or as a large fill) — the mockup author explicitly left this as a known open question, not a considered decision. Whoever implements dark mode should check contrast ratios and likely needs a lightened accent variant for dark mode (e.g. a `--color-primary` that's a lighter navy in dark mode while `--accent` swatch previews stay true to the picker's colors), not just reuse these two values as-is. `--success`/`--warning` (only defined in `dashboard.html`/`fundraising.html`/`registry.html`'s `:root`, see above) have **no dark equivalent in this example at all** — still fully open.
- **Toggle UI**: a fixed sun/moon icon button (48×48, same card-style chrome as other floating controls), animated icon swap (sun fades/rotates out, moon fades/rotates in) via opacity+transform transitions, `aria-label="Basculer le mode sombre"`. Positioned bottom-right in `dashboard.html`; in `index.html` it's shifted to `right: 84px` specifically to sit beside the existing theme-color-picker trigger (which occupies the actual bottom-right corner there) — i.e. **the mockup itself is already juggling two floating settings buttons in one corner**, a sign these two controls (accent color + light/dark) belong in one combined settings affordance for the real build rather than two separate fixed buttons.
- **Persistence**: `localStorage.getItem('spa-dark-mode')` / `setItem('spa-dark-mode', 'dark'|'light')`, defaults to light if unset. Same BO-wide (not per-org) scope decision as the accent picker applies here — see above.
- **Responsive**: toggle button repositions at the mobile breakpoint (same pattern as other floating controls repositioning at ≤768/1024px elsewhere in the mockups).

### Typography

- Single font family everywhere: `Geist, system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, sans-serif` for both `--font-display` and `--font-body` (they're identical — no distinct display face). `apps/shelter` already loads Geist via `next/font` (`--font-geist-sans` in globals.css) — reuse that, no new font needed.
- Base body font-size: `15px` (not Tailwind's default `16px`/`1rem`) — a global `text-[15px]` base or a custom `--text-base` override should be a deliberate decision, not silently dropped.
- Scale observed: page title `28px/600/-0.02em` (display font), section title `18px`/`16px` @ `600`/`-0.01em`, stat value `36px/600/-0.02em`, body `14–15px`, small/meta `12–13px` with `text-transform: uppercase` + `letter-spacing: 0.06em` for table headers and stat labels, `0.02em` for labels/badges/pills.
- **Non-standard font-weight: `510`.** Used everywhere buttons/nav-items/labels want "a bit more than regular but not full 600 bold" (`.btn`, `.nav-item`, `.field-label`... wait field-label is 600). Tailwind's default weight scale has no `510` — nearest is `font-medium` (500) or a custom value. Decide once: either snap to Tailwind's 500 (`font-medium`) or add `font-weight: 510` as a one-off utility. Don't let 13 screens each pick a different rounding.
- Letter-spacing is used pervasively and precisely: `-0.02em` (large headings), `-0.01em` (medium headings/card titles), `0.01em`–`0.02em` (body/nav/labels/buttons), `0.06em` (uppercase micro-labels). Map to Tailwind's `tracking-tight`/`tracking-normal`/`tracking-wide` won't hit these exact values — if pixel-fidelity matters, these need arbitrary-value classes (`tracking-[-0.02em]` etc.) rather than the default scale.

### Spacing / radius / shadows

- Border radius: **flat `8px` everywhere** — cards, buttons, inputs, badges use `border-radius: 8px`; small elements (status badges, action buttons, data pills) use `6px`; nothing uses a larger/pill radius except the theme-color swatches (`border-radius: 50%`) and status/priority chips (`border-radius: 4px–6px`, inconsistent — see below). shadcn's default `--radius: 0.5rem` (8px) already matches exactly — no change needed to the existing `--radius` token in `apps/shelter/globals.css`.
- Spacing scale in use: `4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48px` — a fairly standard 4px-based scale, nothing exotic. Sidebar width fixed at `240px`; main content `max-width: 1200–1600px` depending on screen (1200 for index, 1400 for dashboard/fundraising, 1600 for registry, uncapped/800 for the two split-pane composer screens).
- Shadows are all `oklch(from var(--fg) l c h / <alpha>)` — i.e. "black at N% alpha" rather than a fixed shadow color, so they auto-adapt if `--fg` ever changes (though never tested against a dark `--fg`). Two weights seen: hover cards `0 4px 12–16px / 0.08`, floating panels (theme picker) `0 8px 32px / 0.12`, small buttons `0 2px 12px / 0.08`. shadcn's default shadow scale (`shadow-sm`/`shadow-md`/`shadow-lg`) is close enough visually; the `oklch(from ...)` trick itself doesn't need porting, Tailwind's shadow utilities are fine.
- Focus rings: `outline: 2px solid var(--accent); outline-offset: 2px` on interactive elements, plus a `box-shadow: 0 0 0 3px oklch(from var(--accent) l c h / 0.1)` glow on focused text inputs. shadcn's default `ring` utilities cover this; make sure the ring color is wired to `--color-ring` → `--accent`.
- Background gradients: only on `index.html`'s body (two very faint radial gradients tinted with `--accent` at 2–3% alpha, purely decorative) — skip, not worth reproducing, or reproduce as a single optional decorative class if the org-picker landing page equivalent is ever built.

### Inconsistency to flag, not silently "fix": status/badge radius and color mapping

- `.status-badge` (registry) uses `border-radius: 6px`; `.fundraiser-status` and `.need-priority` (dashboard/fundraising) also use `6px`/`4px` inconsistently in different files (dashboard's `.need-priority` is `border-radius: 4px`, registry's `.status-badge` and fundraising's `.fundraiser-status` are `6px`). When ported to a single shadcn `Badge` component this collapses naturally — just don't hand-pick one file's radius as "correct" without noting the other two disagree.
- Status/badge color semantics observed (all as `oklch(from <color> l c h / 0.12)` background + solid text):
  - `success` (green): "Disponible" (registry), positive stat trend (dashboard), "En cours"/progress bars/"Objectif atteint" implicitly via green fill (fundraising)
  - `warn` (orange): "Prioritaire" need (dashboard), "En adoption" (registry) — note **orange is reused for two different meanings** (urgency vs. a neutral in-progress state) — worth a product decision on whether that's intentional
  - `accent` (navy): "Réservée" (registry), "Objectif atteint"/completed (fundraising) — navy also reused for two meanings
  - `accent-secondary` (red): "Urgent" need (dashboard), "Soins médicaux" (registry) — consistent "alarm" meaning, this one's clean

## 2. Nav / shell pattern

Two different nav patterns exist across the 6 files — **they were not unified even within the mockup**:

1. **`index.html`**: not the app shell at all — it's a standalone landing/picker page (centered, max-width 1200px, no sidebar) with a card grid linking to the 5 other screens, plus the floating theme-color picker described above. This is mockup-tool scaffolding (a way to navigate between the 5 real screens), not a screen the real app needs — **don't port `index.html` as a route**, but do port its theme-picker JS pattern.
2. **`dashboard.html`/`registry.html`/`announcements.html`/`fundraising.html`/`social.html`**: the actual shared shell — `grid-template-columns: 240px 1fr` (or wider for the two multi-column composer screens), a fixed left sidebar with:
   - `.sidebar-header`: org name (16px/600) + org type/city (13px, muted) — maps directly to the real `organizations` table's `name` + `type`/city-ish field.
   - `.nav`: 5 flat links, each icon (20×20 outline SVG, 1.8px stroke, `stroke: currentColor`) + label, `active` state = white/bg background + `--accent` text color (not a filled pill, just a background swap against the sidebar's grey `--surface`).
   - No nested/collapsible sections, no user/account menu, no org-switcher, no sign-out control anywhere in any mockup — these all still need to be designed, they're simply absent.
   - No mobile hamburger/drawer trigger and no JS for it — **at `max-width: 1024px` every screen just does `.sidebar { display: none; }`, i.e. the sidebar disappears with no replacement affordance.** The mockup does not demonstrate any mobile nav pattern at all (contradicts the impression that a "responsive Sheet" was already prototyped — it wasn't; #105's mobile-Sheet behavior is still fully unspecified and must be designed fresh from the shadcn `sidebar` block's own defaults, not from this mockup).

For the shadcn `sidebar` block (#105): use its standard header/content/footer slots — header = org name + type (could be `SidebarHeader` with an org-switcher added later), content = the 5 nav items as `SidebarMenuButton`s with `lucide-react` icons (already a dependency) swapped in for the inline SVGs, active state via the block's built-in active styling (which already does a background/foreground swap, matching this pattern closely). Footer is unused in the mockup — natural place for a future user/org menu.

## 3. Per-screen breakdown

### dashboard.html → issue #106 (Org dashboard: stat-card overview)

- **Stats grid**: `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`, 4 stat cards: "Animaux accueillis" (127, +8 this week, negative-styled trend arrow — inconsistent, an *increase* in animals is shown in the red/negative trend color, worth flagging as a mockup bug not a deliberate semantic choice), "Adoptions en cours" (23, +5, green/positive), "Capacité d'accueil" (84%, "127/150 places occupées" — **shelter capacity/bed-count concept with no corresponding field in schema.ts today**, no trend), "Bénévoles actifs" (42, "18 disponibles cette semaine" — **volunteers concept, entirely absent from the milestone's screen inventory and from schema.ts**). Needs: `Card` (already in `packages/ui`), a small custom `StatCard` composing `Card` + label + big value + optional trend chip, `Badge` only for the trend arrows if styled as chips (currently just colored inline text + an SVG chevron, not a badge).
  - **Real-data mapping**: only 2 of the 4 stat cards ("animaux accueillis" = animals count, "adoptions en cours" = announcements with active status, roughly) map to data that exists today. Capacity and volunteers need either a schema addition or must be dropped/deferred — flag to product before building, don't invent fake fields.
- **"Besoins urgents" (urgent needs) section**: a card containing a list of `.need-item`s — icon tile (40×40, bg `--bg`, border) + title + meta line + priority badge (`urgent`/`high`). **This entire concept — a discrete "needs" list with priority levels, separate from animals/cagnottes/announcements — has no backing table in schema.ts and no milestone issue.** The 3 example needs (transport request, foster-home request, cage-budget request) look like they could each map to: a future `needs` table, OR be synthesized from existing data (e.g. a cagnotte under its goal + an animal without cage capacity), but the mockup presents them as first-class authored items, not derived. This needs a product decision before implementation — don't invent a `needs` table speculatively.
  - The "Créer une cagnotte" section action linking urgent needs → fundraising is a real, buildable cross-link once cagnottes exist; keep it even if "needs" itself is deferred (just link from a static "besoins" heading straight to the cagnotte-creation flow).
- **"Activité récente" (recent activity feed)**: chronological list, icon tile (32×32, `--surface` bg, no border) + rich text (`<strong>` actor + entity names) + relative timestamp ("Il y a 12 minutes"). Examples span animal-status changes, announcement publication, cagnotte donations, volunteer signup, medical-record updates — i.e. **a cross-entity audit-log/timeline concept.** `animalEvents` (mentioned in design-system.md for the animal-detail screen, #108) is the closest existing schema concept but is scoped to a single animal; this dashboard feed implies an org-wide activity log spanning animals+announcements+cagnottes+members+volunteers. No such table exists. Flag as a gap (see §6) — likely needs its own `activityLog`-style table if built for real, or should be scoped down to "recent animal events only" for a v1 that doesn't require a new cross-cutting table.
- Primitives needed: `Card`, `Badge` (priority + trend chips), icons via `lucide-react` (map: house/roof→animals, heart→adoptions, bed/grid→capacity, users→volunteers, truck→transport need, home→foster need, box→cage need).

### registry.html → issue #107 (Animal list: data-table)

- Toolbar: search input (icon-prefixed, 40px left-padding for the icon) + 5 filter pills (`Tous`/`Chats`/`Chiens`/`Disponibles`/`En adoption` — single-select, `active` = filled `--accent` bg). Maps to shadcn `data-table`'s built-in column-filter/faceted-filter pattern, or a simpler controlled `ToggleGroup`-style row if the block's filter UI is heavier than needed — either works, pills-as-single-select is the important detail to preserve, not necessarily the exact shadcn filter widget.
- Table columns: Animal (photo 48×48 rounded-8 thumbnail + name (600 weight) + breed/sex/sterilized line, all one cell), Âge/Sexe, Arrivée (date), Statut (badge), Actions (2 icon-only buttons: "Voir le dossier" (eye icon) / "Modifier" (edit icon)).
- Status badge values seen: `available` (green, "Disponible"), `adoption` (orange, "En adoption"), `reserved` (navy, "Réservée"/"Réservé" — grammatically gendered in French, watch i18n plural/gender handling), `medical` (red, "Soins médicaux"). Maps to the schema's animal `status` field — confirm the 4 mockup values line up with actual enum values in `schema.ts` (not verified in this pass; whoever picks up #107 should reconcile against the real `status` union, this mockup may use different labels than the schema's actual enum).
- Mobile: at ≤768px, columns 3 and 4 (Âge/Sexe, Arrivée) are hidden via `display: none` on `nth-child` — a real `data-table` should do this via column visibility config, not CSS nth-child hiding.
- JS is filter/search **UI-only** — click toggles `.active` class, input has a `console.log`, no actual filtering logic. Build real filtering against Convex query args, nothing to port functionally.
- Needs: `table` (or shadcn `data-table` block wrapping it), `badge`, `avatar`-or-plain-thumbnail (mockup uses a plain gradient div as a placeholder image, not a circular avatar — a plain rounded-8 `<img>`/`next/image` is more accurate than `avatar`, which implies circular).

### announcements.html → issue #110, but **this mockup is the create/edit form + live multi-channel preview, not the list/detail/actions screen the issue currently describes**

- Two-column layout: form column (max-width 800px) + a fixed 420px preview column showing the *same content* rendered as it would look on Facebook, Instagram, and the shelter's own website simultaneously (3 stacked preview cards, each with a platform label, then platform-appropriate layout — Facebook is text-first, Instagram is photo-first, website is photo-first with structured fields).
- Form sections: Animal (select existing animal from registry — reuses registry data, doesn't re-enter identity), Histoire (free-text story textarea + personality + ideal-home short inputs), Photos (3 empty upload slots, 120×120, dashed border — reuses the existing `PhotoUpload` component conceptually), Publication (contact email/phone + 4 platform checkboxes: site web/Facebook/Instagram/Leboncoin, 3 pre-checked).
- The JS "live preview" is not actually wired (inputs log to console, preview cards are static markup) — but the *intent* (typing in one form updates 3 platform-specific renderings live) is real product behavior to build, using React state + derived preview components per platform, not the 3 raw hardcoded preview blocks shown here.
- This significantly changes the scope of #110 as currently written ("card-grid + dropdown-menu row actions" for list/detail) — the mockup only covers creation, not the list or single-announcement detail view. Recommend updating #110's issue body (or splitting into a separate "announcement create: form + multi-channel preview" issue) once this extraction lands, rather than quietly reinterpreting the existing issue.
- Needs: `select` (animal picker, already in "primitives to install"), `textarea`, `checkbox` group, reuse `PhotoUpload` from `packages/ui`, and a net-new "multi-platform live preview" pattern with no shadcn block equivalent — bespoke, same category as the AI chat panel (#116).

### fundraising.html → issue #111 (Cagnottes list/detail: card-grid + progress) — matches well, plus a creation modal

- Stats bar (4 plain label/value pairs in a shared grey surface strip, not individual cards — different from the dashboard's bordered stat cards): total raised, active count, "donateurs ce mois" (**donor-count-this-month — not in schema, cagnottes schema per design-system.md only has targetAmount/currentAmount/deadline/externalUrl, no per-donation/donor tracking**), goals-reached count.
- Card grid (`auto-fill, minmax(360px, 1fr)`): header (title + description) + body (progress section: raised amount (20px/600) + "sur {goal}€" (muted) + 8px-tall rounded progress bar in green; meta row: donor-count icon + days-remaining icon; footer: status badge (`active`/`completed`) + right-aligned "Voir la page" button). `progress` primitive maps directly.
- **Creation is a modal dialog**, not a separate route/page — `shadcn dialog`, not a form-block page. Fields: title, description (textarea), goal amount (number, €), category (select: infrastructure/medical/food/urgent/other — **no `category` field in the cagnottes schema per design-system.md** — new field or drop from v1), external platform (select: Leetchi/HelloAsso/PayPal/Tipeee) + external URL (matches schema's `externalUrl` well). Modal open/close is plain `.open` class toggling + a background-click handler — straightforward `Dialog` port.
- Needs: `progress`, `dialog` (not in the original "primitives to install" list's cagnotte row explicitly, but implied — confirm `dialog` is installed for this screen too, not just for members's invite dialog as design-system.md currently states), `select`.

### social.html → **not** issue #112 (News) — see verdict below, flag as new/unscoped work

- Three-column layout (300px templates sidebar + editor column max-800px + 380px live-preview column) — the richest layout of the 6 screens.
- **Templates sidebar**: 6 canned templates ("Adoption réussie", "Nouvel arrivant", "Besoin urgent", "Lancement cagnotte", "Appel bénévoles", "Actualité refuge"), each a clickable card that overwrites the whole editor textarea with a mail-merge string containing `{{placeholder}}` tokens (e.g. `{{nom}}`, `{{race}}`, `{{âge}}`, `{{adoptant}}`, `{{besoin}}`, `{{objectif}}`, `{{tâches}}`...).
- **Editor**: "type de contenu" select (Animal/Actualité/Besoin/Événement — 4 source-data kinds), "sélectionner l'élément" select (populated from that type — only Animal is exemplified, with a few registry animals), a row of clickable "data pills" (`{{nom}}` `{{race}}` `{{âge}}` `{{sexe}}` `{{date}}` `{{adoptant}}`) that insert the token at the textarea cursor position, the content textarea itself (pre-filled from the active template), and a platform select (Facebook/Instagram/Twitter-X).
- **Live preview column**: single card showing platform label + rendered content + a live character counter that turns orange past 280 chars (a Twitter-era limit convention, not accurate per-platform limits for FB/IG).
- **Actions**: Publier maintenant (submit → alert stub), Programmer (schedule — no UI for picking a date/time exists, just the button), Copier le texte (clipboard copy via `navigator.clipboard`).
- This is a genuinely different content model from anything in `schema.ts`: a template-driven composer over merge fields resolved from animals/news/needs/events, with per-platform character-limit awareness and (implied, unbuilt) scheduling — not a stored "post" entity with title/text/photo like `newsPosts`. See §5 for the full verdict.
- Needs, if built: `select` ×2, `tabs`-or-similar for template switching (currently a simple list, `tabs` isn't quite right — more like a `RadioGroup`/list-selection), a merge-field-insertion textarea (bespoke, no shadcn primitive covers cursor-position token insertion), `sonner` (toast) for the copy-confirmation instead of `alert()`.

## 4. JS interactivity inventory

| File | Script does | React/shadcn equivalent |
|---|---|---|
| `index.html` | Theme-color picker: toggle a floating panel open/closed, click-outside-to-close, arrow-key roving tabindex across 9 color swatches, persist choice to `localStorage`, overwrite 2 CSS custom properties on `documentElement` | Controlled `Popover` (Radix, not in the "to install" list yet — add it) wrapping a `RadioGroup` of swatches; persist to the org record via a Convex mutation instead of `localStorage`; set the CSS vars via inline `style` on a server-rendered root wrapper so there's no flash-of-wrong-color |
| `dashboard.html` | none | — |
| `registry.html` | Filter-pill single-select (class toggle only), search input (`console.log` only) | Controlled state + real Convex query args; no logic to port, only the interaction shape (single-select pills, live-as-you-type search) |
| `announcements.html` | Every form input logs to console on `input` (preview is NOT actually re-rendered from input — the 3 preview cards are static markup, this is a mockup limitation, not a working live-preview); form `submit` is prevented + shows an `alert()` | Real implementation needs the 3 preview cards to be derived components reading the same form state (React Hook Form or plain `useState`), replacing the static preview entirely — don't port the console.log/alert stubs, they're placeholders |
| `fundraising.html` | Modal open/close via class toggle + background-click-to-close; "create" button does client-only validation (`title`/`goal` required) + `alert()` | `Dialog` (Radix) with its own built-in focus-trap/overlay-click/Escape handling — don't hand-roll; validation → real form (react-hook-form + zod per design-system.md's `form` primitive), replace `alert()` with `sonner` toast |
| `social.html` | Template click → overwrite textarea value from a hardcoded template-string map; data-pill click → insert token at cursor position (`selectionStart`); live char-count with a 280-char warn threshold; platform `<select>` change → relabel the preview card's platform text; clipboard copy via `navigator.clipboard.writeText`; form submit → `alert()` | All portable as real behavior (not just UI shape) — this is the one screen where the JS *is* close to the real feature logic, not just a stub. Template map becomes real data (seeded or admin-configurable), cursor-insertion needs a ref to the textarea DOM node (React doesn't have a built-in for this, `textareaRef.current.setRangeText(...)` is the direct DOM API equivalent), char-count and platform-relabel are trivial derived state, clipboard copy → same Clipboard API works unchanged in React, replace `alert()`s with `sonner` |

## 5. social.html verdict: **new feature, not the News screen (#112)**

`newsPosts` in `schema.ts` (`title`, `text`, `photoUrls[]`, optional `linkedAnimalIds[]`, optional `linkedCagnotteId`) and `NewsPostCard` (presentational, takes `title`/`text`/`photoUrl`/link-indicator props) both model a **single authored post displayed in-app** (and reused by the future public hub) — one title, one body, optionally cross-linked to an animal or cagnotte for display purposes. There's no template system, no merge-field resolution, no per-platform text variant, no character-limit awareness, and no external-platform publish/schedule concept anywhere in that schema or component.

`social.html` models something else entirely: **a mail-merge-style composer that generates platform-specific social media post text from a template + a selected data source (animal/news/need/event), with the explicit goal of publishing (or scheduling, or copying) that text out to Facebook/Instagram/Twitter** — external platforms the app doesn't otherwise integrate with. It's conceptually closer to what `announcements.html`'s multi-channel preview panel already does (generate platform-flavored copy from one source of truth) than to `NewsPostCard`. In fact **`announcements.html` and `social.html` overlap significantly** — both take shelter data and produce Facebook/Instagram-flavored text — the difference is announcements.html is scoped to "publish this specific animal for adoption" (structured form → 3 fixed preview renderings) while social.html is a general-purpose "compose any kind of post from a template" tool (6 templates spanning adoptions, arrivals, urgent needs, fundraisers, volunteer calls, general news). A future design pass might even want to merge these into one "compose & publish" surface rather than building two separate composer UIs — worth raising with product before scoping the work.

**Recommendation**: do not fold this into #112. It needs its own issue, its own product-scoping pass (does "Publier maintenant" actually integrate with Facebook/Instagram/Twitter APIs, or is this always a copy-paste-then-post-yourself workflow with no real external publish? the mockup's `alert('Publication envoyée !')` doesn't tell us which), and likely a new schema decision (does the app persist composed/sent posts at all, e.g. for a history view, or is it purely ephemeral compose-and-copy with zero storage?). Until that's answered, nothing here should be built beyond the isolated UI shell.

## 6. Gaps

**In the mockups but with no milestone issue / no schema backing:**
- Shelter capacity ("84%, 127/150 places") — dashboard stat card
- Volunteers ("42 actifs, 18 disponibles") — dashboard stat card; the mockup's recent-activity feed also shows a volunteer signup event
- "Besoins urgents" (urgent needs list with priority levels: transport requests, foster-home requests, budget/equipment needs) — dashboard section, distinct entity from animals/cagnottes/announcements
- Org-wide recent-activity/audit feed spanning animals + announcements + cagnottes + volunteers — dashboard section
- Donor count / "donateurs ce mois" and per-cagnotte donor counts — fundraising stats + cards (cagnottes schema has no donor tracking, only aggregate `currentAmount`)
- Cagnotte `category` field (infrastructure/medical/food/urgent/other) — fundraising creation modal
- The entire `social.html` composer feature (see §5)
- A user/org-switcher/account menu and any sign-out control in the nav shell — absent from every mockup
- A working mobile nav pattern — every mockup just hides the sidebar at ≤1024px with nothing replacing it

**In the milestone's screen inventory but not covered by any mockup at all** (still need an independent palette/pattern decision, this extraction doesn't help): Animal detail (#108), Animal create/edit (#109), Members (#113), Org creation flow (#114), Verification card (#115), AI chat panel (#116), Sign-in/up theming (#117), Invite accept (#118). None of these 8 screens appear in any of the 6 mockup files.

**Dark mode**: `index.html` and `dashboard.html` got a real proof-of-concept added 2026-08-05 (`[data-theme="dark"]` attribute + toggle, values in §1). The other 4 screens (`announcements`, `fundraising`, `registry`, `social`) are still light-only — apply the same 5 base tokens (`--bg`/`--surface`/`--fg`/`--muted`/`--border`) to them when building, and still resolve the open `--accent`/`--success`/`--warning` dark-contrast question (§1) before shipping, since the 2-screen example explicitly punts on it.
