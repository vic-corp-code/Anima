"use client";

import { useParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { useUploadPhoto } from "@/lib/useUploadPhoto";
import { Button, Card, CardContent } from "@anima/ui";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";

export default function EditAnnouncementPage() {
  const t = useTranslations("announcements");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const announcementId = params.announcementId as Id<"announcements">;
  const { isAuthenticated } = useConvexAuth();

  const announcement = useQuery(
    api.announcements.get,
    isAuthenticated ? { announcementId } : "skip"
  );
  const organization = useQuery(
    api.organizations.get,
    isAuthenticated ? { organizationId } : "skip"
  );
  const uploadFile = useUploadPhoto();

  const backToList = (
    <Button
      variant="ghost"
      onClick={() =>
        router.push(
          `/organizations/${organizationId}/announcements/${announcementId}`
        )
      }
      className="mb-4"
    >
      <ChevronLeft className="size-4" aria-hidden="true" /> {t("editPage.backToList")}
    </Button>
  );

  if (announcement === undefined) {
    return (
      <div className="container mx-auto p-4">
        {backToList}
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (announcement === null || !announcement.animal) {
    return (
      <div className="container mx-auto p-4">
        {backToList}
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("notFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        {backToList}
        <h1 className="text-2xl font-bold">{t("editPage.title")}</h1>
        <p className="text-muted-foreground">{t("editPage.subtitle")}</p>
      </div>

      <AnnouncementForm
        mode="edit"
        organizationId={organizationId}
        announcement={announcement}
        orgName={organization?.name}
        uploadFile={uploadFile}
      />
    </div>
  );
}
