// Data-level checks for the BO accent system (issue #191): the accent set is
// the mockup's 9 pairs plus the app's own brand default, the boot script is
// in lockstep with the runtime apply, and lookups degrade to "brand" when
// localStorage is unavailable. No DOM needed — accents.ts touches
// document/localStorage only at call time.

import { describe, expect, it } from "vitest";
import {
  ACCENT_BOOT_SCRIPT,
  ACCENT_STORAGE_KEY,
  ACCENTS,
  getSavedAccent,
} from "./accents";

describe("ACCENTS", () => {
  it("has exactly 10 entries with unique ids in the expected order", () => {
    const ids = ACCENTS.map((a) => a.id);
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    expect(ids).toEqual([
      "brand",
      "ocean",
      "forest",
      "sunset",
      "plum",
      "amber",
      "rose",
      "sky",
      "teal",
      "slate",
    ]);
  });

  it("contains the 9 mockup accent hexes verbatim", () => {
    const byId = Object.fromEntries(ACCENTS.map((a) => [a.id, a.accent]));
    expect(byId).toMatchObject({
      ocean: "#032f62",
      forest: "#065f46",
      sunset: "#c2410c",
      plum: "#6b21a8",
      amber: "#b45309",
      rose: "#be123c",
      sky: "#0369a1",
      teal: "#0f766e",
      slate: "#334155",
    });
  });

  it("uses well-formed hex colors throughout", () => {
    for (const { id, accent, secondary } of ACCENTS) {
      expect(accent, `${id} accent`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(secondary, `${id} secondary`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("ACCENT_BOOT_SCRIPT", () => {
  it("embeds the storage key and every accent id", () => {
    expect(ACCENT_BOOT_SCRIPT).toContain(ACCENT_STORAGE_KEY);
    for (const { id } of ACCENTS) {
      expect(ACCENT_BOOT_SCRIPT).toContain(JSON.stringify(id));
    }
  });
});

describe("getSavedAccent", () => {
  it("returns 'brand' when localStorage is unavailable", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("localStorage unavailable");
      },
    });
    expect(getSavedAccent()).toBe("brand");
  });
});
