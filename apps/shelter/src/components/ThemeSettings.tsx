"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Palette, Sun } from "lucide-react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Switch,
} from "@anima/ui";
import {
  ACCENTS,
  applyAccent,
  getSavedAccent,
  subscribeAccent,
} from "@/lib/accents";

// Single settings surface for the BO's visual preferences: dark mode (the
// next-themes toggle, as before) plus the BO-wide accent picker (issue #191).
// Opens upward from the sidebar footer; z-[60] keeps it above the mobile
// sidebar Sheet (z-50) when it renders inside the Sheet.
export function ThemeSettings() {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  // Icon + label are toggled via the `dark:` variant ([data-theme=dark],
  // see globals.css custom-variant) instead of JS state: next-themes has no
  // theme on the server, so a state-driven render would mismatch between SSR
  // and client (hydration failure, #210). The attribute is present in the
  // SSR HTML, so both sides agree. (Also avoids setState-in-effect lint.)
  // External-store read: server snapshot is "brand" (no localStorage on the
  // server, and it keeps SSR/hydration data-state consistent), the client
  // snapshot is the saved accent. Apply the STORED accent directly on mount
  // (getSavedAccent), not the store value: the hydration pass carries the
  // server snapshot "brand" and an effect keyed on the store would persist
  // that brand over the real saved accent before the client snapshot ever
  // surfaces (boot script applies it, mount then wipes it — #210). Picks
  // from the RadioGroup apply via applyAccent directly, which notifies the
  // store and re-renders the selection.
  const accent = useSyncExternalStore(
    subscribeAccent,
    getSavedAccent,
    () => "brand",
  );
  useEffect(() => {
    applyAccent(getSavedAccent());
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          aria-label={t("toggle")}
        >
          <Sun className="hidden size-4 dark:block" aria-hidden="true" />
          <Moon className="size-4 dark:hidden" aria-hidden="true" />
          <span className="dark:hidden">{t("dark")}</span>
          <span className="hidden dark:block">{t("light")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="z-[60] w-64 gap-3 p-3"
      >
        <PopoverHeader>
          <PopoverTitle>{t("appearance")}</PopoverTitle>
          <PopoverDescription className="text-xs">
            {t("appearanceDescription")}
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm">
            <Moon className="size-4 text-muted-foreground" aria-hidden="true" />
            {t("darkMode")}
          </span>
          <Switch
            checked={isDark}
            onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
            aria-label={t("toggle")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Palette className="size-3.5" aria-hidden="true" />
            {t("accent")}
          </span>
          <RadioGroup
            value={accent}
            onValueChange={(id) => applyAccent(id)}
            className="grid-cols-5"
          >
            {ACCENTS.map((a) => (
              <RadioGroupItem
                key={a.id}
                value={a.id}
                style={{
                  background: `linear-gradient(135deg, ${a.accent} 0%, ${a.secondary} 100%)`,
                }}
                aria-label={t(`accentNames.${a.id}`)}
                title={t(`accentNames.${a.id}`)}
                className="size-7 rounded-full border-0 shadow-none data-[state=checked]:ring-2 data-[state=checked]:ring-ring data-[state=checked]:ring-offset-2 data-[state=checked]:ring-offset-popover [&_[data-slot=radio-group-indicator]]:hidden"
              />
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
