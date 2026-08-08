import Script from "next/script";
import { ACCENT_BOOT_SCRIPT } from "@/lib/accents";

// Inline before-hydration script for the saved accent (#191/#210). Rendered
// via next/script with strategy="beforeInteractive" (injected into <head> and
// run before hydration) rather than a raw <script> in the body, which React
// 19/Next 16 flags ("Encountered a script tag while rendering React
// component" — overlay + Fast Refresh reloads in dev).
export function AccentBootScript() {
  return (
    <Script
      id="anima-accent-boot"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: ACCENT_BOOT_SCRIPT }}
    />
  );
}
