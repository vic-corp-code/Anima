import { fetchQuery } from "convex/nextjs";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { Link } from "@/i18n/navigation";
import { VerificationCard } from "./VerificationCard";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const t = await getTranslations("organizations.show");
  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;
  const organization = await fetchQuery(
    api.organizations.get,
    { organizationId: organizationId as Id<"organizations"> },
    { token },
  );

  if (!organization) notFound();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        {t("createdTitle")}: {organization.name}
      </h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="font-medium">{t("typeLabel")}</dt>
        <dd>{organization.type}</dd>
        <dt className="font-medium">{t("countryLabel")}</dt>
        <dd>{organization.country}</dd>
        <dt className="font-medium">{t("addressLabel")}</dt>
        <dd>{organization.address}</dd>
      </dl>
      <VerificationCard
        organizationId={organizationId as Id<"organizations">}
        verificationStatus={organization.verificationStatus}
        registryNumber={organization.registryNumber}
      />
      <div className="flex gap-3">
        <Link
          href={`/organizations/${organizationId}/animals`}
          className="rounded bg-black px-4 py-2 text-white dark:bg-zinc-50 dark:text-black"
        >
          {t("manageAnimalsLink")}
        </Link>
        <Link
          href={`/organizations/${organizationId}/members`}
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          {t("manageMembersLink")}
        </Link>
        <Link
          href={`/organizations/${organizationId}/announcements`}
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          {t("manageAnnouncementsLink")}
        </Link>
        <Link
          href={`/organizations/${organizationId}/cagnottes`}
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          {t("manageCagnottesLink")}
        </Link>
        <Link
          href={`/organizations/${organizationId}/news`}
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          {t("manageNewsLink")}
        </Link>
      </div>
    </div>
  );
}
