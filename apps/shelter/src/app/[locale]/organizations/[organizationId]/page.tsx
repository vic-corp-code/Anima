import { fetchQuery } from "convex/nextjs";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Megaphone, PawPrint } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@anima/ui";
import { Link } from "@/i18n/navigation";
import { StatCard } from "./StatCard";
import { UrgentNeedsCard, type UrgentNeedItem } from "./UrgentNeedsCard";
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
  const orgId = organizationId as Id<"organizations">;

  // Dashboard data comes entirely from existing org-scoped list queries — no
  // new queries, no new tables. Urgent needs are derived client-side of the
  // backend (see below): active cagnottes still under their goal + animals
  // with health notes.
  //
  // Org first, then the lists: organizations.get returns null (not a throw)
  // for a nonexistent org, so notFound() below restores the 404 contract. The
  // list queries call assertOrgAccess and would throw on a bad id — they must
  // not run until the org is known to exist.
  const organization = await fetchQuery(
    api.organizations.get,
    { organizationId: orgId },
    { token },
  );

  if (!organization) notFound();

  const [animals, announcements, cagnottes] = await Promise.all([
    fetchQuery(api.animals.list, { organizationId: orgId }, { token }),
    fetchQuery(
      api.announcements.list,
      { organizationId: orgId, status: "published" },
      { token },
    ),
    fetchQuery(api.cagnottes.list, { organizationId: orgId, status: "active" }, { token }),
  ]);

  const urgentNeeds: UrgentNeedItem[] = [
    // Cagnottes still under their goal — "urgent" (funding need).
    ...cagnottes
      .filter(
        (cagnotte) =>
          cagnotte.targetAmount !== undefined && cagnotte.currentAmount < cagnotte.targetAmount,
      )
      .map((cagnotte) => {
        const progress = Math.round((cagnotte.currentAmount / cagnotte.targetAmount!) * 100);
        return {
          kind: "cagnotte" as const,
          title: cagnotte.title,
          meta: t("urgentNeedsCagnotteProgress", { progress }),
          priority: "urgent" as const,
          href: `/organizations/${organizationId}/cagnottes/${cagnotte._id}`,
        };
      }),
    // Animals with health notes — "high" (medical follow-up).
    ...animals
      .filter((animal) => animal.healthNotes?.trim())
      .map((animal) => ({
        kind: "animal" as const,
        title: animal.name,
        meta: t("urgentNeedsAnimalMeta"),
        priority: "high" as const,
        href: `/organizations/${organizationId}/animals/${animal._id}`,
      })),
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("orgInfoTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="font-medium text-muted-foreground">{t("typeLabel")}</dt>
              <dd>{organization.type}</dd>
              <dt className="font-medium text-muted-foreground">{t("countryLabel")}</dt>
              <dd>{organization.country}</dd>
              <dt className="font-medium text-muted-foreground">{t("addressLabel")}</dt>
              <dd>{organization.address}</dd>
            </dl>
          </CardContent>
        </Card>
        <VerificationCard
          organizationId={orgId}
          verificationStatus={organization.verificationStatus}
          registryNumber={organization.registryNumber}
        />
      </div>

      <section aria-label={t("statsTitle")} className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label={t("statAnimalsTitle")}
            value={animals.length}
            description={t("statAnimalsDescription")}
            icon={PawPrint}
          />
          <StatCard
            label={t("statAnnouncementsTitle")}
            value={announcements.length}
            description={t("statAnnouncementsDescription")}
            icon={Megaphone}
          />
        </div>
      </section>

      <UrgentNeedsCard
        items={urgentNeeds}
        title={t("urgentNeedsTitle")}
        emptyText={t("urgentNeedsEmpty")}
        createCagnotteLabel={t("urgentNeedsCreateCagnotte")}
        cagnottesHref={`/organizations/${organizationId}/cagnottes`}
        priorityUrgentLabel={t("urgentNeedsPriority.urgent")}
        priorityHighLabel={t("urgentNeedsPriority.high")}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/organizations/${organizationId}/animals`}>
            {t("manageAnimalsLink")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/organizations/${organizationId}/members`}>
            {t("manageMembersLink")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/organizations/${organizationId}/announcements`}>
            {t("manageAnnouncementsLink")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/organizations/${organizationId}/cagnottes`}>
            {t("manageCagnottesLink")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/organizations/${organizationId}/news`}>
            {t("manageNewsLink")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
