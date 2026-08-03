"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AnnouncementCard, Button, Card, CardContent } from "@anima/ui";

const STATUS_OPTIONS = ["draft", "published", "closed"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

export default function AnnouncementsListPage() {
  const t = useTranslations("announcements");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);

  const announcements = useQuery(
    api.announcements.list,
    !isAuthenticated
      ? "skip"
      : statusFilter
      ? { organizationId, status: statusFilter }
      : { organizationId }
  );

  // Announcements don't carry the animal's name/species/photo directly, so
  // look each one up to feed the presentational card component.
  const animals = useQuery(
    api.animals.list,
    isAuthenticated ? { organizationId } : "skip"
  );
  const animalById = new Map((animals ?? []).map((a) => [a._id, a]));

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href={`/organizations/${organizationId}/announcements/new`}>
            {t("createDraft")}
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("statusFilterLabel")}
              </label>
              <select
                value={statusFilter ?? ""}
                onChange={(e) =>
                  setStatusFilter((e.target.value || null) as Status | null)
                }
                className="w-full rounded border px-3 py-2"
              >
                <option value="">{t("allStatuses")}</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {announcements === undefined ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((announcement) => {
            const animal = animalById.get(announcement.animalId);
            return (
              <AnnouncementCard
                key={announcement._id}
                title={announcement.title}
                description={announcement.description}
                status={announcement.status}
                statusLabel={t(`status.${announcement.status}`)}
                animalName={animal?.name ?? ""}
                animalSpeciesLabel={animal ? t(`species.${animal.species}`) : ""}
                photoUrl={animal?.photoUrls?.[0]}
                onClick={() =>
                  router.push(
                    `/organizations/${organizationId}/announcements/${announcement._id}`
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
