"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

type ClerkAppearance = ComponentProps<typeof SignIn>["appearance"];

/* Palette v2 (#155) mapped onto Clerk's appearance variables. Values trace to
   the tokens in app/globals.css (kit sources in comments). The app toggles
   themes via next-themes (data-theme="dark" on <html>), so the active
   appearance is picked from the resolved theme like everything else. */

const lightAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#9b5b32", // --primary
    colorPrimaryForeground: "#ffffff", // --accent-on
    colorForeground: "#201914", // --foreground
    colorBackground: "#fbf6ee", // --background
    colorInput: "#fffdf8", // --input (== --card, decision 6)
    colorInputForeground: "#201914", // --foreground
    colorMuted: "#f1e3cf", // --muted
    colorMutedForeground: "#7a6d63", // --muted-foreground
    colorBorder: "#ded2c3", // --border
    colorRing: "#9b5b32", // --ring (rendered at 15% opacity, close to --focus-ring)
    colorDanger: "#b33a3a", // --destructive
    colorSuccess: "#4f8a4f", // --success
    colorWarning: "#c9822f", // --warn
    colorNeutral: "#201914", // light themes want dark neutrals
    borderRadius: "8px", // Clerk's xl (card) doubles the base: 16px == --radius
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif", // --font-sans
  },
};

const darkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#d9925c", // --primary
    colorPrimaryForeground: "#1a130d", // --accent-on
    colorForeground: "#f4ece1", // --foreground
    colorBackground: "#17120e", // --background
    colorInput: "#1f1913", // --input
    colorInputForeground: "#f4ece1", // --foreground
    colorMuted: "#2c231a", // --muted
    colorMutedForeground: "#9e9081", // --muted-foreground
    colorBorder: "#4d4036", // --border
    colorRing: "#d9925c", // --ring
    colorDanger: "#e58079", // --destructive
    colorSuccess: "#7cbb7c", // --success
    colorWarning: "#e0a24f", // --warn
    colorNeutral: "#f4ece1", // dark themes want light neutrals
    borderRadius: "8px",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif", // --font-sans
  },
};

export function useClerkAppearance(): ClerkAppearance {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? darkAppearance : lightAppearance;
}
