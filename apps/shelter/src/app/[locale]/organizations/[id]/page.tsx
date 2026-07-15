import { fetchQuery } from "convex/nextjs";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("organizations.show");
  const organization = await fetchQuery(api.organizations.get, {
    organizationId: id as Id<"organizations">,
  });

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
    </div>
  );
}
