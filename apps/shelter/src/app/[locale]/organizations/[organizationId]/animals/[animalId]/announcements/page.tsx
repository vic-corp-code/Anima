"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { AnnouncementCard, Button, Card, CardContent } from "@anima/ui";

export default function AnimalAnnouncementsPage() {
  const t = useTranslations("announcements");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const animalId = params.animalId as Id<"animals">;
  const { isAuthenticated } = useConvexAuth();

  const animal = useQuery(api.animals.get, isAuthenticated ? { animalId } : "skip");
  const announcements = useQuery(
    api.announcements.listForAnimal,
    isAuthenticated ? { animalId } : "skip"
  );
  const createAnnouncement = useMutation(api.announcements.create);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateDraft = async () => {
    setCreateError(null);
    try {
      const announcementId = await createAnnouncement({ animalId });
      router.push(`/organizations/${organizationId}/announcements/${announcementId}`);
    } catch {
      setCreateError(t("error"));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {animal ? t("forAnimal.title", { name: animal.name }) : t("title")}
          </h1>
        </div>
        <Button onClick={handleCreateDraft}>{t("createDraft")}</Button>
      </div>

      {createError && <p className="text-sm text-red-600 mb-4">{createError}</p>}

      {announcements === undefined ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("forAnimal.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((announcement) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
