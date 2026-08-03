"use client";

import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const NAV_ITEMS = [
  { key: "animals", path: "animals", icon: "🐾" },
  { key: "announcements", path: "announcements", icon: "📢" },
  { key: "cagnottes", path: "cagnottes", icon: "💰" },
  { key: "news", path: "news", icon: "📰" },
  { key: "members", path: "members", icon: "👥" },
] as const;

export function OrgNav() {
  const t = useTranslations("organizations.nav");
  const params = useParams();
  const organizationId = params.organizationId as string;
  const pathname = usePathname();

  // Match on the path segment right after the org id, not a raw substring —
  // otherwise a nested route like animals/[animalId]/announcements would
  // light up both "Animals" and "Announcements" at once.
  const segments = pathname.split("/").filter(Boolean);
  const orgSegmentIndex = segments.indexOf(organizationId);
  const activeSegment = orgSegmentIndex !== -1 ? segments[orgSegmentIndex + 1] : undefined;
  const isActive = (path: string) => activeSegment === path;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:w-52 md:flex-col md:gap-1 border-r bg-zinc-50 dark:bg-zinc-950 px-3 py-4">
        <Link
          href={`/organizations/${organizationId}`}
          className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
            !NAV_ITEMS.some((item) => isActive(item.path))
              ? "bg-primary/10 text-primary"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground"
          }`}
        >
          {t("overview")}
        </Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={`/organizations/${organizationId}/${item.path}`}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
              isActive(item.path)
                ? "bg-primary/10 text-primary"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground"
            }`}
          >
            <span>{item.icon}</span>
            {t(item.key)}
          </Link>
        ))}
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-zinc-950 px-2 py-1">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={`/organizations/${organizationId}/${item.path}`}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                isActive(item.path)
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {t(item.key)}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
