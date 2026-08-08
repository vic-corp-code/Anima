"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import {
  Badge,
  badgeVariants,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Textarea,
} from "@anima/ui";
import type { VariantProps } from "class-variance-authority";

const SUCCESS_TINT =
  "border-[color-mix(in_oklab,var(--success)_32%,var(--card))] bg-[color-mix(in_oklab,var(--success)_16%,var(--card))] text-[color-mix(in_oklab,var(--success)_78%,var(--foreground))]";
const META_TINT =
  "border-[color-mix(in_oklab,var(--meta)_30%,var(--card))] bg-[color-mix(in_oklab,var(--meta)_14%,var(--card))] text-[color-mix(in_oklab,var(--meta)_74%,var(--foreground))]";

const STATUS_BADGE: Record<
  "draft" | "published" | "closed" | "archived",
  { variant: VariantProps<typeof badgeVariants>["variant"]; className?: string }
> = {
  draft: { variant: "secondary" },
  published: { variant: "outline", className: SUCCESS_TINT },
  closed: { variant: "outline", className: META_TINT },
  archived: { variant: "outline" },
};

export default function AnnouncementDetailPage() {
  const t = useTranslations("announcements");
  const locale = useLocale();
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
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
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

  const badge = STATUS_BADGE[announcement.status];
  const isClosed =
    announcement.status === "closed" || announcement.status === "archived";
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
          <ChevronLeft className="size-4" aria-hidden="true" /> {t("backToAnimal")}
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{announcement.title}</h1>
          <Badge variant={badge.variant} className={badge.className}>
            {t(`status.${announcement.status}`)}
          </Badge>
        </div>
        {announcement.publishedAt && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("publishedAt")}{" "}
            <span className="font-medium text-foreground">
              {new Date(announcement.publishedAt).toLocaleDateString(locale)}
            </span>
          </p>
        )}
        {announcement.closedAt && (
          <p className="text-sm text-muted-foreground">
            {t("closedAt")}{" "}
            <span className="font-medium text-foreground">
              {new Date(announcement.closedAt).toLocaleDateString(locale)}
            </span>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("titleLabel")}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitleEdit(e.target.value)}
              disabled={isClosed}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("descriptionLabel")}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescriptionEdit(e.target.value)}
              disabled={isClosed}
              rows={6}
            />
          </div>

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          {transitionError && (
            <p className="text-sm text-destructive">{transitionError}</p>
          )}
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
