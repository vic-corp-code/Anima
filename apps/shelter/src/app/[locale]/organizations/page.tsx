"use client";

import { useTranslations } from "next-intl";
import { useConvexAuth, useQuery } from "convex/react";
import { Link } from "@/i18n/navigation";
import { api } from "@anima/backend/convex/_generated/api";

export default function OrganizationsPage() {
  const t = useTranslations("organizations.index");
  const { isAuthenticated } = useConvexAuth();
  const organizations = useQuery(api.organizations.listForUser, isAuthenticated ? {} : "skip");

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 font-sans dark:bg-black p-8">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        {t("title")}
      </h1>

      {organizations === undefined ? (
        <p className="text-zinc-500">{t("loading")}</p>
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
          <Link
            href="/organizations/new"
            className="rounded bg-black px-4 py-2 text-white dark:bg-zinc-50 dark:text-black"
          >
            {t("createFirst")}
          </Link>
        </div>
      ) : (
        <ul className="flex w-full max-w-md flex-col gap-3">
          {organizations.map(
            (org) =>
              org && (
                <li key={org._id}>
                  <Link
                    href={`/organizations/${org._id}`}
                    className="block rounded border border-zinc-200 p-4 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <h2 className="font-medium text-black dark:text-zinc-50">
                      {org.name}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t(`type.${org.type}`)}
                    </p>
                  </Link>
                </li>
              ),
          )}
        </ul>
      )}
    </div>
  );
}
