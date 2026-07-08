import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function Home() {
  const t = useTranslations("common");

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
    </div>
  );
}
