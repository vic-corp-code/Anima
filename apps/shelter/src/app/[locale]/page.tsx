"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Home() {
  const t = useTranslations("common");
  const { isSignedIn } = useUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        {t("appName")}
      </h1>
      <nav aria-label={t("languageSwitcher.label")} className="flex gap-4">
        {routing.locales.map((locale) => (
          <Link key={locale} href="/" locale={locale}>
            {t(`languageSwitcher.${locale}`)}
          </Link>
        ))}
      </nav>
      <div className="flex gap-4">
        {isSignedIn ? (
          <>
            <Link
              href="/organizations"
              className="rounded bg-black px-4 py-2 text-white dark:bg-zinc-50 dark:text-black"
            >
              {t("goToOrganizations")}
            </Link>
            <UserButton />
          </>
        ) : (
          <>
            <SignInButton forceRedirectUrl="/organizations" />
            <SignUpButton forceRedirectUrl="/organizations" />
          </>
        )}
      </div>
    </div>
  );
}
