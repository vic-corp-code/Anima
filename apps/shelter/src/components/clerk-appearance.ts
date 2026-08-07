import { SignIn } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type ClerkAppearance = ComponentProps<typeof SignIn>["appearance"];

/* Palette v2 (#155) mapped onto Clerk's appearance variables via live CSS
   custom properties — the values flip per theme on their own, since the app
   toggles `data-theme="dark"` on <html> (next-themes). Tokens are defined in
   app/globals.css; a single static object means no second source of truth.

   Clerk's documented pattern for auto light/dark switching is exactly this:
   colorPrimary: 'var(--brand-primary)' with the var flipped inside the dark
   block. Note: --font-sans can't be referenced — the @theme inline block
   inlines it and never emits the variable — so the Inter stack stays literal. */

export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--accent-on)",
    colorForeground: "var(--foreground)",
    colorBackground: "var(--background)",
    colorInput: "var(--input)",
    colorInputForeground: "var(--foreground)",
    colorMuted: "var(--muted)",
    colorMutedForeground: "var(--muted-foreground)",
    colorBorder: "var(--border)",
    colorRing: "var(--ring)",
    colorDanger: "var(--destructive)",
    colorSuccess: "var(--success)",
    colorWarning: "var(--warn)",
    colorNeutral: "var(--foreground)", // light wants dark neutrals, dark wants light — already encoded in the token
    borderRadius: "calc(var(--radius) / 2)", // Clerk's xl (card) doubles the base: 16px == --radius
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif", // --font-sans
  },
};
