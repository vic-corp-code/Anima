// Automated WCAG contrast + focus-visible audit for the BO dark-mode tokens
// (issue #154). This is the repeatable form of the one-off script that
// produced the audit report — see docs/tech/design-mockups/audit-contrast-dark-mode.md.
//
// It parses the :root / [data-theme="dark"] blocks from globals.css, resolves
// every var()/color-mix() chain (OKLab + OKLCH, shortest-arc hue), and asserts
// the full documented pair matrix in both themes: normal text 4.5:1, UI
// components 3:1. It also holds the focus-visible/keyboard coverage of the
// bespoke (non-Radix-backed) pieces: pill tag row, sidebar active state,
// icon-only topbar buttons.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const globalsCss = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const uiDir = new URL("../../../../packages/ui/src/components/ui/", import.meta.url);
const buttonSrc = readFileSync(new URL("button.tsx", uiDir), "utf8");
const badgeSrc = readFileSync(new URL("badge.tsx", uiDir), "utf8");
const sidebarSrc = readFileSync(new URL("sidebar.tsx", uiDir), "utf8");
const statusBadgeSrc = readFileSync(new URL("../lib/animals/status-badge.ts", import.meta.url), "utf8");
const urgentNeedsSrc = readFileSync(
  new URL("[locale]/organizations/[organizationId]/UrgentNeedsCard.tsx", import.meta.url),
  "utf8",
);
const orgLayoutSrc = readFileSync(
  new URL("[locale]/organizations/[organizationId]/layout.tsx", import.meta.url),
  "utf8",
);

/* ------------------------------------------------------------------ */
/* Token parsing                                                       */
/* ------------------------------------------------------------------ */

type Rgb = [number, number, number];

function parseTokenBlock(css: string, selector: RegExp): Map<string, string> {
  const m = css.match(selector);
  const vars = new Map<string, string>();
  if (!m) return vars;
  for (const [, name, value] of m[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    vars.set(name, value.trim());
  }
  return vars;
}

const LIGHT_TOKENS = parseTokenBlock(globalsCss, /:root\s*\{([^}]*)\}/);
const DARK_TOKENS = parseTokenBlock(globalsCss, /\[data-theme="dark"\]\s*\{([^}]*)\}/);

/* ------------------------------------------------------------------ */
/* Color math: WCAG relative luminance + OKLab/OKLCH mixing            */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToOklab([r, g, b]: Rgb): [number, number, number] {
  const l = [r, g, b].map(toLinear);
  const lms = [
    [0.4122214708, 0.5363325363, 0.0514459929],
    [0.2119034982, 0.6806995451, 0.1073969566],
    [0.0883024619, 0.2817188376, 0.6299787005],
  ].map((row) => Math.cbrt(row[0] * l[0] + row[1] * l[1] + row[2] * l[2]));
  const lab = [
    [0.2104542553, 0.793617785, -0.0040720468],
    [1.9779984951, -2.428592205, 0.4505937099],
    [0.0259040371, 0.7827717662, -0.808675766],
  ].map((row) => row[0] * lms[0] + row[1] * lms[1] + row[2] * lms[2]);
  return [lab[0], lab[1], lab[2]];
}

// Björn Ottosson's OKLab → linear sRGB (inverse LMS matrix, NOT the transpose
// of the forward one — a transpose here silently green-shifts every mix).
const LMS_TO_LINEAR_RGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];

function oklabToRgb(lab: [number, number, number]): Rgb {
  const lms = [
    [1, 0.3963377774, 0.2158037573],
    [1, -0.1055613458, -0.0638541728],
    [1, -0.0894841775, -1.291485548],
  ].map((row) => Math.pow(row[0] * lab[0] + row[1] * lab[1] + row[2] * lab[2], 3));
  const linear = LMS_TO_LINEAR_RGB.map(
    (row) => row[0] * lms[0] + row[1] * lms[1] + row[2] * lms[2],
  );
  return linear.map((v) => Math.round(Math.min(1, Math.max(0, fromLinear(v))) * 255)) as Rgb;
}

function oklabToOklch([L, a, b]: [number, number, number]): [number, number, number] {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, h];
}

function oklchToOklab([L, C, h]: [number, number, number]): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}

function mixOklab(c1: Rgb, c2: Rgb, weight: number): Rgb {
  const a = rgbToOklab(c1);
  const b = rgbToOklab(c2);
  return oklabToRgb([a[0] * weight + b[0] * (1 - weight), a[1] * weight + b[1] * (1 - weight), a[2] * weight + b[2] * (1 - weight)]);
}

function mixOklch(c1: Rgb, c2: Rgb, weight: number): Rgb {
  const a = oklabToOklch(rgbToOklab(c1));
  const b = oklabToOklch(rgbToOklab(c2));
  let dh = a[2] - b[2];
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return oklabToRgb(oklchToOklab([a[0] * weight + b[0] * (1 - weight), a[1] * weight + b[1] * (1 - weight), b[2] + dh * weight]));
}

function relativeLuminance([r, g, b]: Rgb): number {
  const [rl, gl, bl] = [r, g, b].map(toLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ------------------------------------------------------------------ */
/* Token resolution: var() / color-mix() / named colors                */
/* ------------------------------------------------------------------ */

function splitTopLevelArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  args.push(cur);
  return args.map((a) => a.trim()).filter(Boolean);
}

function resolve(color: string, theme: "light" | "dark"): Rgb {
  const tokens = theme === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
  const c = color.trim();
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) return hexToRgb(c);
  if (c === "black") return [0, 0, 0];
  if (c === "white") return [255, 255, 255];
  const v = c.match(/^var\(--([a-z0-9-]+)\)$/i);
  if (v) {
    const value = tokens.get(v[1]);
    if (!value) throw new Error(`unknown token --${v[1]} in ${theme} theme`);
    return resolve(value, theme);
  }
  if (c.startsWith("color-mix(")) {
    const space = /color-mix\(in\s+(\w+)/.exec(c)?.[1] ?? "oklab";
    const inner = c.replace(/^color-mix\(in\s+\w+\s*,\s*/, "").replace(/\)\s*$/, "");
    const args = splitTopLevelArgs(inner);
    if (args.length !== 2) throw new Error(`bad color-mix: ${c}`);
    const w1 = /([\d.]+)%/.exec(args[0]);
    const w2 = /([\d.]+)%/.exec(args[1]);
    if (w1 && w2) throw new Error(`both args weighted: ${c}`);
    const c1 = resolve(args[0].replace(/\s*[\d.]+%\s*$/, ""), theme);
    const c2 = resolve(args[1].replace(/\s*[\d.]+%\s*$/, ""), theme);
    const mix = space === "oklch" ? mixOklch : mixOklab;
    if (w1) return mix(c1, c2, parseFloat(w1[1]) / 100);
    if (w2) return mix(c2, c1, parseFloat(w2[1]) / 100);
    return mix(c1, c2, 0.5);
  }
  throw new Error(`unresolved color: ${color}`);
}

/* ------------------------------------------------------------------ */
/* Pair matrix                                                         */
/* ------------------------------------------------------------------ */

const TEXT_MIN = 4.5;
const UI_MIN = 3;

interface Pair {
  name: string;
  fg: string;
  bg: string;
  min: number;
}

// /10–/30 chip tints (bg-success/10, dark:bg-warn/20, hover:bg-destructive/15,
// bg-muted/50, …) composite the token over the surface it sits on — modeled
// as an OKLab color-mix with --card, matching how the audit measured them.
const chip = (colorName: string, pct: number) =>
  `color-mix(in oklab, var(--${colorName}) ${pct}%, var(--card))`;
// Badge interiors from lib/animals/status-badge.ts (SUCCESS_TINT & co):
// text = mix(color X%, foreground), surface = mix(color Y%, card).
const tint = (colorName: string, textPct: number, bgPct: number) => ({
  fg: `color-mix(in oklab, var(--${colorName}) ${textPct}%, var(--foreground))`,
  bg: `color-mix(in oklab, var(--${colorName}) ${bgPct}%, var(--card))`,
});
const SUCCESS_TINT = tint("success", 78, 16);
const WARN_TINT = tint("warn", 74, 14);
const META_TINT = tint("meta", 74, 14);
const PRIMARY_TINT = tint("primary", 74, 14);

const LIGHT_PAIRS: Pair[] = [
  { name: "foreground/background", fg: "var(--foreground)", bg: "var(--background)", min: TEXT_MIN },
  { name: "card-foreground/card", fg: "var(--card-foreground)", bg: "var(--card)", min: TEXT_MIN },
  { name: "muted-foreground/background", fg: "var(--muted-foreground)", bg: "var(--background)", min: TEXT_MIN },
  { name: "muted-foreground/card", fg: "var(--muted-foreground)", bg: "var(--card)", min: TEXT_MIN },
  { name: "muted-foreground/muted", fg: "var(--muted-foreground)", bg: "var(--muted)", min: TEXT_MIN },
  { name: "muted-foreground/bg-muted/50 over card", fg: "var(--muted-foreground)", bg: chip("muted", 50), min: TEXT_MIN },
  { name: "primary-foreground/primary", fg: "var(--primary-foreground)", bg: "var(--primary)", min: TEXT_MIN },
  { name: "primary-foreground/primary hover (mix→black 8%)", fg: "var(--primary-foreground)", bg: "var(--accent-hover)", min: TEXT_MIN },
  { name: "primary-foreground/primary active (mix→black 14%)", fg: "var(--primary-foreground)", bg: "var(--accent-active)", min: TEXT_MIN },
  { name: "accent-foreground/accent", fg: "var(--accent-foreground)", bg: "var(--accent)", min: TEXT_MIN },
  { name: "destructive-foreground/destructive", fg: "var(--destructive-foreground)", bg: "var(--destructive)", min: TEXT_MIN },
  { name: "destructive/bg-destructive/10 chip", fg: "var(--destructive)", bg: chip("destructive", 10), min: TEXT_MIN },
  { name: "destructive/bg-destructive/15 hover", fg: "var(--destructive)", bg: chip("destructive", 15), min: TEXT_MIN },
  { name: "sidebar-foreground/sidebar", fg: "var(--sidebar-foreground)", bg: "var(--sidebar)", min: TEXT_MIN },
  { name: "sidebar-accent-foreground/sidebar-accent (30% wash)", fg: "var(--sidebar-accent-foreground)", bg: "var(--sidebar-accent)", min: TEXT_MIN },
  { name: "sidebar-primary-foreground/sidebar-primary", fg: "var(--sidebar-primary-foreground)", bg: "var(--sidebar-primary)", min: TEXT_MIN },
  { name: "success/background", fg: "var(--success)", bg: "var(--background)", min: TEXT_MIN },
  { name: "success/card", fg: "var(--success)", bg: "var(--card)", min: TEXT_MIN },
  { name: "success/bg-success/10 chip", fg: "var(--success)", bg: chip("success", 10), min: TEXT_MIN },
  { name: "warn/background", fg: "var(--warn)", bg: "var(--background)", min: TEXT_MIN },
  { name: "warn/card", fg: "var(--warn)", bg: "var(--card)", min: TEXT_MIN },
  { name: "warn/bg-warn/10 chip", fg: "var(--warn)", bg: chip("warn", 10), min: TEXT_MIN },
  { name: "danger/background", fg: "var(--danger)", bg: "var(--background)", min: TEXT_MIN },
  { name: "danger/card", fg: "var(--danger)", bg: "var(--card)", min: TEXT_MIN },
  { name: "danger/bg-danger/10 chip", fg: "var(--danger)", bg: chip("danger", 10), min: TEXT_MIN },
  { name: "meta/bg-meta/10 chip", fg: "var(--meta)", bg: chip("meta", 10), min: TEXT_MIN },
  { name: "SUCCESS_TINT badge (text on surface)", fg: SUCCESS_TINT.fg, bg: SUCCESS_TINT.bg, min: TEXT_MIN },
  { name: "WARN_TINT badge (text on surface)", fg: WARN_TINT.fg, bg: WARN_TINT.bg, min: TEXT_MIN },
  { name: "META_TINT badge (text on surface)", fg: META_TINT.fg, bg: META_TINT.bg, min: TEXT_MIN },
  { name: "PRIMARY_TINT badge (text on surface)", fg: PRIMARY_TINT.fg, bg: PRIMARY_TINT.bg, min: TEXT_MIN },
  { name: "active indicator bar (primary)/sidebar", fg: "var(--primary)", bg: "var(--sidebar)", min: UI_MIN },
  { name: "ring/background (focus indicator)", fg: "var(--ring)", bg: "var(--background)", min: UI_MIN },
  { name: "sidebar-ring/sidebar (focus indicator)", fg: "var(--sidebar-ring)", bg: "var(--sidebar)", min: UI_MIN },
];

const DARK_PAIRS: Pair[] = [
  { name: "foreground/background", fg: "var(--foreground)", bg: "var(--background)", min: TEXT_MIN },
  { name: "card-foreground/card", fg: "var(--card-foreground)", bg: "var(--card)", min: TEXT_MIN },
  { name: "muted-foreground/muted", fg: "var(--muted-foreground)", bg: "var(--muted)", min: TEXT_MIN },
  { name: "muted-foreground/background", fg: "var(--muted-foreground)", bg: "var(--background)", min: TEXT_MIN },
  { name: "muted-foreground/card", fg: "var(--muted-foreground)", bg: "var(--card)", min: TEXT_MIN },
  { name: "muted-foreground/bg-muted/50 over card", fg: "var(--muted-foreground)", bg: chip("muted", 50), min: TEXT_MIN },
  { name: "primary-foreground/primary", fg: "var(--primary-foreground)", bg: "var(--primary)", min: TEXT_MIN },
  { name: "primary-foreground/primary hover (mix→white 12%)", fg: "var(--primary-foreground)", bg: "var(--accent-hover)", min: TEXT_MIN },
  { name: "primary-foreground/primary active (mix→white 20%)", fg: "var(--primary-foreground)", bg: "var(--accent-active)", min: TEXT_MIN },
  { name: "accent-foreground/accent", fg: "var(--accent-foreground)", bg: "var(--accent)", min: TEXT_MIN },
  { name: "destructive-foreground/destructive", fg: "var(--destructive-foreground)", bg: "var(--destructive)", min: TEXT_MIN },
  { name: "destructive/bg-destructive/20 chip", fg: "var(--destructive)", bg: chip("destructive", 20), min: TEXT_MIN },
  { name: "destructive/bg-destructive/15 hover", fg: "var(--destructive)", bg: chip("destructive", 15), min: TEXT_MIN },
  { name: "sidebar-foreground/sidebar", fg: "var(--sidebar-foreground)", bg: "var(--sidebar)", min: TEXT_MIN },
  { name: "sidebar-accent-foreground/sidebar-accent (kit 12%)", fg: "var(--sidebar-accent-foreground)", bg: "var(--sidebar-accent)", min: TEXT_MIN },
  { name: "sidebar-primary-foreground/sidebar-primary", fg: "var(--sidebar-primary-foreground)", bg: "var(--sidebar-primary)", min: TEXT_MIN },
  { name: "success/background", fg: "var(--success)", bg: "var(--background)", min: TEXT_MIN },
  { name: "success/card", fg: "var(--success)", bg: "var(--card)", min: TEXT_MIN },
  { name: "success/bg-success/10 chip", fg: "var(--success)", bg: chip("success", 10), min: TEXT_MIN },
  { name: "success/bg-success/20 chip", fg: "var(--success)", bg: chip("success", 20), min: TEXT_MIN },
  { name: "warn/background", fg: "var(--warn)", bg: "var(--background)", min: TEXT_MIN },
  { name: "warn/card", fg: "var(--warn)", bg: "var(--card)", min: TEXT_MIN },
  { name: "warn/bg-warn/10 chip", fg: "var(--warn)", bg: chip("warn", 10), min: TEXT_MIN },
  { name: "warn/bg-warn/20 chip", fg: "var(--warn)", bg: chip("warn", 20), min: TEXT_MIN },
  { name: "danger/background", fg: "var(--danger)", bg: "var(--background)", min: TEXT_MIN },
  { name: "danger/card", fg: "var(--danger)", bg: "var(--card)", min: TEXT_MIN },
  { name: "danger/bg-danger/10 chip", fg: "var(--danger)", bg: chip("danger", 10), min: TEXT_MIN },
  { name: "danger/bg-danger/20 chip", fg: "var(--danger)", bg: chip("danger", 20), min: TEXT_MIN },
  { name: "meta/bg-meta/10 chip", fg: "var(--meta)", bg: chip("meta", 10), min: TEXT_MIN },
  { name: "meta/bg-meta/20 chip", fg: "var(--meta)", bg: chip("meta", 20), min: TEXT_MIN },
  { name: "SUCCESS_TINT badge (text on surface)", fg: SUCCESS_TINT.fg, bg: SUCCESS_TINT.bg, min: TEXT_MIN },
  { name: "WARN_TINT badge (text on surface)", fg: WARN_TINT.fg, bg: WARN_TINT.bg, min: TEXT_MIN },
  { name: "META_TINT badge (text on surface)", fg: META_TINT.fg, bg: META_TINT.bg, min: TEXT_MIN },
  { name: "PRIMARY_TINT badge (text on surface)", fg: PRIMARY_TINT.fg, bg: PRIMARY_TINT.bg, min: TEXT_MIN },
  { name: "active indicator bar (primary)/sidebar", fg: "var(--primary)", bg: "var(--sidebar)", min: UI_MIN },
  { name: "ring/background (focus indicator)", fg: "var(--ring)", bg: "var(--background)", min: UI_MIN },
  { name: "sidebar-ring/sidebar (focus indicator)", fg: "var(--sidebar-ring)", bg: "var(--sidebar)", min: UI_MIN },
];

function ratios(theme: "light" | "dark", pairs: Pair[]): Array<Pair & { ratio: number }> {
  return pairs.map((p) => ({ ...p, ratio: contrastRatio(resolve(p.fg, theme), resolve(p.bg, theme)) }));
}

describe("dark-mode token contrast (audit #154)", () => {
  it.each(ratios("light", LIGHT_PAIRS))("light: $name ≥ $min", ({ ratio, min, name }) => {
    expect(ratio, `${name}: ${ratio.toFixed(2)}:1 (needs ${min}:1)`).toBeGreaterThanOrEqual(min);
  });

  it.each(ratios("dark", DARK_PAIRS))("dark: $name ≥ $min", ({ ratio, min, name }) => {
    expect(ratio, `${name}: ${ratio.toFixed(2)}:1 (needs ${min}:1)`).toBeGreaterThanOrEqual(min);
  });

  // Regression pins: reproduce the two ratios pre-documented in globals.css
  // comments ("verified ~5.9:1 against #b33a3a", "verified ~6.7:1 against
  // #e58079") and re-verified by the audit report (5.86 / 6.73). Any future
  // destructive-token change must consciously update these.
  it("light destructive-foreground/destructive reproduces the documented ~5.9:1", () => {
    const ratio = contrastRatio(resolve("var(--destructive-foreground)", "light"), resolve("var(--destructive)", "light"));
    expect(ratio).toBeGreaterThan(5.7);
    expect(ratio).toBeLessThan(6.0);
  });

  it("dark destructive-foreground/destructive reproduces the documented ~6.7:1", () => {
    const ratio = contrastRatio(resolve("var(--destructive-foreground)", "dark"), resolve("var(--destructive)", "dark"));
    expect(ratio).toBeGreaterThan(6.6);
    expect(ratio).toBeLessThan(6.9);
  });
});

/* ------------------------------------------------------------------ */
/* Focus-visible / keyboard coverage (bespoke pieces)                  */
/* ------------------------------------------------------------------ */

describe("focus-visible / keyboard-nav coverage (audit #154)", () => {
  it("keeps the kit's global focus-visible halo in globals.css", () => {
    expect(globalsCss).toContain(":where(a, button, input, select, textarea, [tabindex]):focus-visible");
    expect(globalsCss).toContain("box-shadow: var(--focus-ring)");
    expect(globalsCss).toContain("outline: none");
  });

  it("keeps `dark:` wired to the [data-theme] attribute, not prefers-color-scheme", () => {
    expect(globalsCss).toContain('@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))');
  });

  it("Button focus ring stays full-opacity (the /50-alpha ring failed 1.7:1)", () => {
    expect(buttonSrc).toContain("focus-visible:ring-3");
    expect(buttonSrc).toContain("focus-visible:ring-ring");
    expect(buttonSrc).not.toContain("focus-visible:ring-ring/50");
  });

  it("sidebar active state carries focus-visible ring + active wash/text (data-active)", () => {
    expect(sidebarSrc).toContain("focus-visible:ring-2");
    expect(sidebarSrc).toContain("ring-sidebar-ring");
    expect(sidebarSrc).toContain("data-[active=true]:bg-sidebar-accent");
    expect(sidebarSrc).toContain("data-[active=true]:text-sidebar-accent-foreground");
  });

  it("pill tag row: status-badge tints are wired and urgent-need links are real anchors", () => {
    for (const tintName of ["SUCCESS_TINT", "WARN_TINT", "META_TINT", "PRIMARY_TINT"]) {
      expect(statusBadgeSrc).toContain(`${tintName} =`);
    }
    expect(statusBadgeSrc).toContain("className: SUCCESS_TINT");
    expect(statusBadgeSrc).toContain("className: WARN_TINT");
    expect(statusBadgeSrc).toContain("className: META_TINT");
    expect(statusBadgeSrc).toContain("export const PRIMARY_TINT");
    expect(urgentNeedsSrc).toContain("<Link");
    expect(urgentNeedsSrc).toContain("href={item.href}");
  });

  it("badge link-hover tint stays on a contrast-safe tint (destructive)", () => {
    expect(badgeSrc).toContain("[a]:hover:bg-destructive/15");
    expect(badgeSrc).not.toContain("[a]:hover:bg-destructive/20");
    expect(badgeSrc).not.toContain("[a]:hover:bg-destructive/30");
  });

  it("icon-only topbar buttons are real buttons with accessible names (global halo applies)", () => {
    expect(orgLayoutSrc).toContain('<Button');
    expect(orgLayoutSrc).toContain('size="icon"');
    expect(orgLayoutSrc).toContain('aria-label={t("title")}');
    expect(orgLayoutSrc).toContain('<SidebarTrigger');
  });
});
