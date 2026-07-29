"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@anima/ui";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
} as const;

export default function AnnouncementDetailPage() {
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
  const updateAnnouncement = useMutation(api.announcements.update);
  const publishAnnouncement = useMutation(api.announcements.publish);
  const closeAnnouncement = useMutation(api.announcements.close);

  // Edits start out `null` (meaning "not yet touched, show the server
  // value"). This avoids syncing the query result into state via an
  // effect — the field just falls back to `announcement`'s value until
  // the user types something.
  const [titleEdit, setTitleEdit] = useState<string | null>(null);
  const [descriptionEdit, setDescriptionEdit] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  if (announcement === undefined) {
    return <div className="container mx-auto p-4">{t("loading")}</div>;
  }

  if (announcement === null) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("notFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClosed = announcement.status === "closed";
  const title = titleEdit ?? announcement.title;
  const description = descriptionEdit ?? announcement.description;

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await updateAnnouncement({ announcementId, title, description });
    } catch {
      setSaveError(t("error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setTransitionError(null);
    setIsTransitioning(true);
    try {
      await publishAnnouncement({ announcementId });
    } catch {
      setTransitionError(t("error"));
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleClose = async () => {
    setTransitionError(null);
    setIsTransitioning(true);
    try {
      await closeAnnouncement({ announcementId });
    } catch {
      setTransitionError(t("error"));
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              `/organizations/${organizationId}/animals/${announcement.animalId}`
            )
          }
          className="mb-4"
        >
          ← {t("backToAnimal")}
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{announcement.title}</h1>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[announcement.status]}`}
          >
            {t(`status.${announcement.status}`)}
          </span>
        </div>
        {announcement.publishedAt && (
          <p className="text-sm text-muted-foreground mt-1">
            {t("publishedAt")}{" "}
            {new Date(announcement.publishedAt).toLocaleDateString("fr-FR")}
          </p>
        )}
        {announcement.closedAt && (
          <p className="text-sm text-muted-foreground">
            {t("closedAt")}{" "}
            {new Date(announcement.closedAt).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("titleLabel")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitleEdit(e.target.value)}
              disabled={isClosed}
              className="w-full rounded border px-3 py-2 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("descriptionLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescriptionEdit(e.target.value)}
              disabled={isClosed}
              rows={6}
              className="w-full rounded border px-3 py-2 disabled:opacity-60"
            />
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          {transitionError && <p className="text-sm text-red-600">{transitionError}</p>}
          <div className="flex gap-2">
            {!isClosed && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? t("saving") : t("save")}
              </Button>
            )}
            {announcement.status === "draft" && (
              <Button
                variant="outline"
                onClick={handlePublish}
                disabled={isTransitioning}
              >
                {t("publish")}
              </Button>
            )}
            {announcement.status === "published" && (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isTransitioning}
              >
                {t("close")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
