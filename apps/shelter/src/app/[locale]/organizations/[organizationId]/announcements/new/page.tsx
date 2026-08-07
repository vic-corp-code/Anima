"use client";

import { useParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { useUploadPhoto } from "@/lib/useUploadPhoto";
import { Button, Card, CardContent } from "@anima/ui";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";

export default function NewAnnouncementPage() {
  const t = useTranslations("announcements");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();

  const animals = useQuery(
    api.animals.list,
    isAuthenticated ? { organizationId } : "skip"
  );
  const organization = useQuery(
    api.organizations.get,
    isAuthenticated ? { organizationId } : "skip"
  );
  const uploadFile = useUploadPhoto();

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(`/organizations/${organizationId}/announcements`)
          }
          className="mb-4"
        >
          &larr; {t("new.backToList")}
        </Button>
        <h1 className="text-2xl font-bold">{t("new.title")}</h1>
        <p className="text-muted-foreground">{t("new.subtitle")}</p>
      </div>

      {animals === undefined ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : animals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("new.noAnimals")}
          </CardContent>
        </Card>
      ) : (
        <AnnouncementForm
          mode="create"
          organizationId={organizationId}
          animals={animals}
          orgName={organization?.name}
          uploadFile={uploadFile}
        />
      )}
    </div>
  );
}
