"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { Archive, CircleX, MoreVertical, Pencil, Send } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { Link, useRouter } from "@/i18n/navigation";
import {
  AnnouncementCard,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@anima/ui";

const STATUS_OPTIONS = ["draft", "published", "closed", "archived"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

export default function AnnouncementsListPage() {
  const t = useTranslations("announcements");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [pendingId, setPendingId] = useState<Id<"announcements"> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // The archive mutation is admin-only — fetch the caller's role so editors
  // don't see an action that will be rejected server-side.
  const memberships = useQuery(
    api.memberships.listForOrg,
    isAuthenticated ? { organizationId } : "skip"
  );
  const isAdmin = memberships?.callerRole === "admin";

  const publishAnnouncement = useMutation(api.announcements.publish);
  const closeAnnouncement = useMutation(api.announcements.close);
  const archiveAnnouncement = useMutation(api.announcements.archive);

  const runAction = async (
    announcementId: Id<"announcements">,
    action: (args: {
      announcementId: Id<"announcements">;
    }) => Promise<unknown>
  ) => {
    setPendingId(announcementId);
    setActionError(null);
    try {
      await action({ announcementId });
    } catch {
      setActionError(t("error"));
    } finally {
      setPendingId(null);
    }
  };

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
          <label className="mb-1 block text-sm font-medium">
            {t("statusFilterLabel")}
          </label>
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? null : (value as Status))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {actionError && (
        <p className="mb-4 text-sm text-destructive">{actionError}</p>
      )}

      {announcements === undefined ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {announcements.map((announcement) => {
            const animal = animalById.get(announcement.animalId);
            const detailHref = `/organizations/${organizationId}/announcements/${announcement._id}`;
            return (
              <div key={announcement._id} className="relative">
                <AnnouncementCard
                  title={announcement.title}
                  description={announcement.description}
                  status={announcement.status}
                  statusLabel={t(`status.${announcement.status}`)}
                  animalName={animal?.name ?? ""}
                  animalSpeciesLabel={animal ? t(`species.${animal.species}`) : ""}
                  photoUrl={animal?.photoUrls?.[0]}
                  onClick={() => router.push(detailHref)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("rowActions")}
                      disabled={pendingId === announcement._id}
                      className="absolute right-3 top-3 z-10 rounded-full bg-background/80 shadow-sm backdrop-blur-sm"
                    >
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => router.push(detailHref)}
                    >
                      <Pencil />
                      {t("edit")}
                    </DropdownMenuItem>
                    {announcement.status === "draft" && (
                      <DropdownMenuItem
                        onSelect={() =>
                          runAction(announcement._id, publishAnnouncement)
                        }
                        disabled={pendingId === announcement._id}
                      >
                        <Send />
                        {t("publish")}
                      </DropdownMenuItem>
                    )}
                    {announcement.status === "published" && (
                      <DropdownMenuItem
                        onSelect={() =>
                          runAction(announcement._id, closeAnnouncement)
                        }
                        disabled={pendingId === announcement._id}
                      >
                        <CircleX />
                        {t("close")}
                      </DropdownMenuItem>
                    )}
                    {isAdmin && announcement.status !== "archived" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            runAction(announcement._id, archiveAnnouncement)
                          }
                          disabled={pendingId === announcement._id}
                        >
                          <Archive />
                          {t("archive")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
