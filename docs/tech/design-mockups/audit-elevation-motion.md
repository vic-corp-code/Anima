# Elevation & motion audit: kit tokens vs. shadcn's default scale

Audit for [#133](https://github.com/vic-corp-code/Anima/issues/133), part of the "Design system — Back Office (BO) v2" milestone. Extracts every elevation/shadow and motion token the kit actually defines, and documents the decision on how to represent them in the shadcn/Tailwind setup. This is a **documentation-only audit** — it does not write `globals.css`; that work belongs to whichever issue applies these tokens (parallel to how [#155](https://github.com/vic-corp-code/Anima/issues/155) applies the color palette).

Sources read: `docs/tech/design-mockups/assets/site.css` (full light + dark `:root` blocks), `docs/tech/design-mockups/ui-kit.html` (the kit's own "Radius & elevation" and "Motion" documentation sections), `docs/tech/design-system.md`, and [#153](https://github.com/vic-corp-code/Anima/issues/153)'s companion audit (`docs/tech/design-mockups/audit-token-structure.md`), whose elevation/ring findings are treated as settled here, not re-derived.

## 1. Elevation/shadow tokens

`site.css` defines four elevation-adjacent custom properties. Only two are real, graduated shadow values — this confirms #153's finding.

| Token | Light | Dark | Real shadow value? |
|---|---|---|---|
| `--elev-flat` | `none` | `none` (inherited, no dark override) | No — it's the absence of elevation, not a value. |
| `--elev-ring` | `0 0 0 1px var(--border)` | same formula, resolves to `0 0 0 1px #4d4036` | Marginal — a 1px hairline outline via `box-shadow`, not a blurred/perceived-depth shadow. No blur, no opacity ramp, identical in both themes. |
| `--elev-raised` | `0 20px 52px rgba(32, 25, 20, 0.12)` | `0 20px 52px rgba(0, 0, 0, 0.55)` | **Yes** — the kit's one genuine soft shadow: large offset/blur, low-opacity warm-black in light, higher-opacity true-black in dark. |
| `--focus-ring` | `0 0 0 4px rgba(155, 91, 50, 0.24)` | `0 0 0 4px rgba(217, 146, 92, 0.35)` | **Yes**, but it's a focus-state halo, not a resting-state elevation step — tracked as its own decision in §4, not folded into the shadow scale in §3. |

So: **2 real elevation values** (`--elev-ring`'s hairline, `--elev-raised`'s soft shadow) plus a separate focus system (`--focus-ring`) — confirming both the issue body's "~3 elevation levels" count and #153's "2 usable shadow values" finding.

The kit's own `ui-kit.html` documentation agrees with this reading. Its "Radius & elevation" section (`#kit-radiuselev`) is captioned **"Soft radii and a single restrained shadow. The focus ring is a tinted halo of the accent — never a hard outline"** — i.e. the kit's own authors treat this as one shadow (`--elev-raised`), one structural ring (`--elev-ring`), and one distinct focus treatment, not a graduated scale. It demos exactly the three tokens above (`.elev-sample.is-ring`, `.is-raised`, `.is-focus`) side by side, nothing more.

Compare to shadcn v4's default: `shadow-xs` on inputs/buttons, `shadow-sm` on cards, and a full 7-step scale (`--shadow-2xs` … `--shadow-2xl`) available for anything heavier. The kit's `--elev-raised` alone (20px offset, 52px blur) is already visually heavier than shadcn's `shadow-lg`/`shadow-xl` — this is a much heavier resting elevation than shadcn ships by default, on far fewer explicit steps.

## 2. Motion tokens

`site.css` defines exactly two durations and one easing curve — matching the issue body's count and `ui-kit.html`'s own "Motion" section caption, **"Two durations and one easing. Motion is felt, not watched"**:

| Token | Value | Observed usage in `site.css` |
|---|---|---|
| `--motion-fast` | `150ms` | Buttons (background/border-color/transform), theme toggle, switch track |
| `--motion-base` | `240ms` | Site header border-color on scroll-stuck, `.motion-demo` hover (transform + box-shadow) in the kit |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Paired with every transition above — the kit's only easing curve, used everywhere motion is applied |

One inconsistency worth flagging: `.reveal`'s scroll-in animation (`opacity 620ms var(--ease-standard), transform 620ms var(--ease-standard)`) hardcodes `620ms` directly rather than referencing a third duration token. It reuses `--ease-standard` but the duration itself is a one-off, not tokenized. Whoever applies these tokens should decide whether to add a `--motion-slow` token for this case or leave it as a deliberate one-off for scroll-reveal specifically (it's the only non-hover/non-interactive-state transition in the file, so it may not belong in the same scale as the other two).

`prefers-reduced-motion: reduce` is already handled globally (durations forced to `0.01ms`, `.reveal` snaps to its resting state) — no gap there, just noting it since it's adjacent to the token set.

## 3. Decision: shadow-derivation approach

**Recommend defining dedicated CSS custom properties following a tweakcn-style derivation** — a base `--shadow-x/y/blur/spread/opacity/color` set, deriving the 7 named sizes (`--shadow-2xs` … `--shadow-2xl`) via `calc()` offsets from that base — **rather than defaulting to Tailwind/shadcn's flat, near-invisible default shadow scale.**

Rationale:
- The kit's heavier elevation (large offset, large blur, warm-black tint in light mode) is a deliberate part of its tactile/warm visual identity, not an oversight or a value that should be flattened to match shadcn's near-flat defaults. Softening it to `shadow-xs`/`shadow-sm` would visibly undercut the mockup.
- A tweakcn-style base-value derivation is the right structural fit specifically because the kit gives real values for only 2 of the 7 steps needed. Deriving from one base (color, opacity, x/y/blur/spread) lets every step scale consistently from real data rather than needing 7 independently invented shadow strings.
- Anchor points from real kit values: `--elev-ring` (hairline, no blur) is the natural source for the low end of the scale (`--shadow-2xs`/`--shadow-xs`), and `--elev-raised` (20px/52px, 0.12–0.55 alpha) is the natural source for the high end (`--shadow-lg`/`--shadow-xl`, possibly `--shadow-2xl`). The 2–3 steps between them (`sm`, `md`, `2xl` if not covered by raised) have no source value in the kit and must be interpolated on the same offset/blur/opacity curve rather than invented independently — keeps the whole scale internally consistent even though most of it isn't literally extracted.
- Color should follow the kit's own light/dark split: warm near-black (`rgba(32,25,20,…)`) in light mode, true black (`rgba(0,0,0,…)`) in dark mode — not a flat neutral gray shadow color, which is what shadcn's default effectively uses.

This decision only concerns the **resting-state shadow scale**. It does not cover `--focus-ring`, which is a distinct interaction-state token — see §4.

## 4. Decision: focus-ring approach

**Recommend keeping the kit's soft 4px colored box-shadow style, not shadcn v4's default flat `--ring` color + `ring-*` utility pattern.** This was already flagged as a structural (not just value) mismatch by #153's audit (its `--ring` mapping row and open question 5) — restating and confirming that read here from the motion/elevation side:

- shadcn v4's `--ring` is a single flat color, consumed by Tailwind's `ring-*` utilities where width, offset, and opacity are all separate utility classes applied at the call site. There's no token that bakes "4px, tinted, semi-transparent" into one value.
- The kit's `--focus-ring` is the opposite: a complete `box-shadow` value — width, color, and opacity baked into one token (`0 0 0 4px rgba(accent, 0.24–0.35)`). It behaves as a soft halo, not a hard-edged ring, and `ui-kit.html`'s own copy is explicit that this is intentional: *"The focus ring is a tinted halo of the accent — never a hard outline."*
- Because the two systems don't share a shape, adopting shadcn's default `--ring` + `ring-*` utilities and just repointing the color to the kit's accent would silently lose the soft-halo treatment (you'd get a flat-opacity hard ring at whatever width the utility class specifies, not the kit's blurred 4px glow). This needs its own implementation — e.g. a custom Tailwind utility or a `box-shadow: var(--focus-ring)` rule on `:focus-visible`, mirroring `site.css`'s own `:where(a, button, input, select, textarea, [tabindex]):focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: var(--radius-sm); }` — rather than routing through shadcn's `ring-*` classes.
- Recommend keeping the soft-halo style (over switching to shadcn's flat default) because it's directly relevant to the accessibility work already scoped in [#154](https://github.com/vic-corp-code/Anima/issues/154) (contrast/accessibility pass on dark-mode tokens, which explicitly includes "focus-visible/keyboard-nav state coverage on the bespoke pieces"). A visible, non-default focus treatment is a legitimate accessibility asset here, not just a style preference — don't trade it away for utility-class convenience.
- Both light and dark values are real, extracted tokens (not gaps): light `0 0 0 4px rgba(155, 91, 50, 0.24)`, dark `0 0 0 4px rgba(217, 146, 92, 0.35)` — same accent color as `--accent`/`--primary`, opacity raised in dark mode to stay visible against the darker ground.

## 5. Open items for whoever applies these tokens

1. **Shadow scale**: only 2 of 7 shadcn steps have real source values (§1, §3) — the rest need interpolation on a shared base, not independent invention. Flagged already in #153's open question 4; this audit is the "how" for that flag.
2. **Motion**: decide whether `.reveal`'s hardcoded `620ms` becomes a third named duration token (`--motion-slow`) or stays a deliberate one-off (§2).
3. **Focus ring implementation**: needs a custom Tailwind mechanism (utility class or `:focus-visible` rule referencing a `--focus-ring` box-shadow token), not shadcn's default `ring-*` utilities — sequence this with or after #154's accessibility pass since both touch the same focus-visible surface.
4. **Naming**: recommend keeping the kit's own token names (`--elev-ring`, `--elev-raised`, `--focus-ring`, `--motion-fast`, `--motion-base`, `--ease-standard`) as the source-of-truth custom properties, with the derived `--shadow-2xs…2xl` scale as a separate, additional layer built from them — mirrors how #153 recommends carrying over kit-specific tokens (`--meta`, `--border-soft`) alongside the standard shadcn slots rather than collapsing everything into shadcn's names only.
