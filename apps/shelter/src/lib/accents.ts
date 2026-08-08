// BO-wide accent override (issue #191): the user picks one of a small set of
// preset accents, persisted under a single localStorage key and applied as
// inline CSS custom properties on <html> — the same mechanism as the theme
// picker in docs/tech/design-mockups/index.html (which used the key
// `spa-theme` with default "ocean"; we use our own key and default to
// "brand", i.e. no override, so design tokens apply as authored).
//
// Only the --primary family is set: --ring, --sidebar-primary,
// --sidebar-ring and --meta are hardcoded to the same hex as --primary in
// globals.css, so they must follow. The color-mix() tokens (--accent-hover,
// --accent-active, --sidebar-accent) derive from --primary automatically and
// must NOT be set. --focus-ring is a decorative halo by design (audit #154)
// and is not touched either.

export const ACCENT_STORAGE_KEY = "anima-accent";

export interface Accent {
  id: string;
  accent: string;
  secondary: string;
}

// Order matters: index 0 is the default ("brand" = no inline override).
export const ACCENTS: Accent[] = [
  { id: "brand", accent: "#9b5b32", secondary: "#d9925c" },
  { id: "ocean", accent: "#032f62", secondary: "#0a4a8a" },
  { id: "forest", accent: "#065f46", secondary: "#047857" },
  { id: "sunset", accent: "#c2410c", secondary: "#dc2626" },
  { id: "plum", accent: "#6b21a8", secondary: "#7e22ce" },
  { id: "amber", accent: "#b45309", secondary: "#d97706" },
  { id: "rose", accent: "#be123c", secondary: "#e11d48" },
  { id: "sky", accent: "#0369a1", secondary: "#0284c7" },
  { id: "teal", accent: "#0f766e", secondary: "#14b8a6" },
  { id: "slate", accent: "#334155", secondary: "#475569" },
];

// Shared by applyAccent and ACCENT_BOOT_SCRIPT so the two can't diverge.
const PRIMARY_VARS = [
  "--primary",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
  "--meta",
];

// White text passes AA on all nine non-brand accents; dark mode's #1a130d
// only fits the default #d9925c, so it is replaced with "brand" is not
// selected. Cleared together with the primary family when brand is picked.
const FOREGROUND_VARS = [
  "--primary-foreground",
  "--accent-on",
  "--sidebar-primary-foreground",
];

const ACCENT_BY_ID: Record<string, string> = Object.fromEntries(
  ACCENTS.map((a) => [a.id, a.accent]),
);

// Minimal external-store wiring for useSyncExternalStore (ThemeSettings):
// applyAccent notifies listeners after writing, so the RadioGroup stays in
// sync with localStorage without setState-in-effect (react-hooks rule).
const accentListeners = new Set<() => void>();

export function subscribeAccent(listener: () => void): () => void {
  accentListeners.add(listener);
  return () => {
    accentListeners.delete(listener);
  };
}

function notifyAccent(): void {
  for (const listener of accentListeners) listener();
}

export function getSavedAccent(): string {
  try {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
    return saved && ACCENT_BY_ID[saved] ? saved : "brand";
  } catch {
    return "brand";
  }
}

export function applyAccent(id: string): void {
  const root = document.documentElement;
  const accent = ACCENT_BY_ID[id];
  // "brand" means no override — ACCENT_BY_ID holds its hex too, so it must be
  // excluded explicitly or the clear-branch below would be unreachable and
  // "Défaut" would force the light tokens over the audited dark ones.
  if (id !== "brand" && accent) {
    for (const name of PRIMARY_VARS) root.style.setProperty(name, accent);
    for (const name of FOREGROUND_VARS) root.style.setProperty(name, "#ffffff");
  } else {
    for (const name of [...PRIMARY_VARS, ...FOREGROUND_VARS]) {
      root.style.removeProperty(name);
    }
  }
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, id);
  } catch {
    // localStorage unavailable (private mode etc.) — the override still
    // applies for this session.
  }
  notifyAccent();
}

// Inlined into the SSR HTML before hydration ([locale]/layout.tsx) so the
// saved accent is applied before first paint, avoiding a flash of the
// default brand accent. Foreground tokens are included too: white is the
// light-mode default, but dark mode ships #1a130d (for the lightened
// #d9925c brand accent) — on a dark user accent it fails, so it must be
// overridden here as well. Self-contained: the id→accent map is baked in
// via JSON.stringify at module load.
export const ACCENT_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  ACCENT_STORAGE_KEY,
)};var m=${JSON.stringify(ACCENT_BY_ID)};var v=localStorage.getItem(k);if(!v||v==="brand"||!m[v])return;var r=document.documentElement;${PRIMARY_VARS.map(
  (name) => `r.style.setProperty(${JSON.stringify(name)},m[v])`,
).join(";")};${FOREGROUND_VARS.map(
  (name) => `r.style.setProperty(${JSON.stringify(name)},"#ffffff")`,
).join(";")};}catch(e){}})();`;
