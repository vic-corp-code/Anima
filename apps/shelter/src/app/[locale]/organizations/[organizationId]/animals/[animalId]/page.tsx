"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  useConvexAuth,
  useMutation,
  useQuery_experimental as useQuery,
} from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, CircleX, ImageIcon, X } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import {
  Alert,
  AlertTitle,
  Badge,
  badgeVariants,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@anima/ui";
import type { VariantProps } from "class-variance-authority";
import type { AnimalEventType, AnimalStatus } from "@anima/domain";
import {
  META_TINT,
  PRIMARY_TINT,
  STATUS_BADGE,
  SUCCESS_TINT,
  WARN_TINT,
} from "@/lib/animals/status-badge";

// Event-type badge mapping for the timeline, tinted with the same kit-token
// pattern as the status mapping in `@/lib/animals/status-badge`.
const EVENT_BADGE: Record<
  AnimalEventType,
  {
    variant: VariantProps<typeof badgeVariants>["variant"];
    className?: string;
    dot: string;
  }
> = {
  arrived: { variant: "secondary", dot: "bg-muted-foreground/50" },
  vet_visit: { variant: "outline", className: PRIMARY_TINT, dot: "bg-primary" },
  sterilized: { variant: "outline", className: SUCCESS_TINT, dot: "bg-[var(--success)]" },
  fostered: { variant: "outline", className: META_TINT, dot: "bg-[var(--meta)]" },
  transferred: { variant: "default", dot: "bg-primary" },
  adopted: { variant: "outline", className: SUCCESS_TINT, dot: "bg-[var(--success)]" },
  deceased: { variant: "destructive", dot: "bg-destructive" },
  status_change: { variant: "outline", className: WARN_TINT, dot: "bg-[var(--warn)]" },
  other: { variant: "outline", dot: "bg-muted-foreground/50" },
};

const STATUS_VALUES = Object.keys(STATUS_BADGE) as AnimalStatus[];

function formatDate(value: string | undefined, locale: string): string | null {
  if (!value || value === "unknown") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function CompatBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "outline" : "secondary"} className={ok ? SUCCESS_TINT : ""}>
      {ok ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
      {label}
    </Badge>
  );
}

export default function AnimalDetailPage() {
  const t = useTranslations("animals");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const animalId = params.animalId as Id<"animals">;
  const { isAuthenticated } = useConvexAuth();

  const animalQuery = useQuery({
    query: api.animals.get,
    args: !isAuthenticated ? "skip" : { animalId },
  });
  const timelineQuery = useQuery({
    query: api.animals.getTimeline,
    args: !isAuthenticated ? "skip" : { animalId },
  });
  const membershipQuery = useQuery({
    query: api.memberships.listForOrg,
    args: !isAuthenticated ? "skip" : { organizationId },
  });

  const animal = animalQuery.status === "success" ? animalQuery.data : undefined;
  const timeline = timelineQuery.status === "success" ? timelineQuery.data : undefined;
  const isAdmin = membershipQuery.status === "success"
    ? membershipQuery.data.callerRole === "admin"
    : undefined;

  const updateAnimal = useMutation(api.animals.update);
  const removeAnimal = useMutation(api.animals.remove);

  const [activePhoto, setActivePhoto] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // getTimeline returns events oldest-first; the history tab shows the most
  // recent activity at the top.
  const events = useMemo(
    () => (timeline ? [...timeline].reverse() : undefined),
    [timeline]
  );

  const handleStatusChange = async (newStatus: AnimalStatus) => {
    if (newStatus === animal?.status) return;
    setStatusError(null);
    setIsUpdating(true);
    try {
      await updateAnimal({ animalId, status: newStatus });
    } catch {
      setStatusError(t("error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!animal) return;
    if (!window.confirm(t("show.actions.deleteConfirm", { name: animal.name }))) {
      return;
    }
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await removeAnimal({ animalId });
      router.push(`/organizations/${organizationId}/animals`);
    } catch {
      setDeleteError(t("error"));
      setIsDeleting(false);
    }
  };

  if (animalQuery.status === "error") {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <CircleX className="size-4" aria-hidden="true" />
          <AlertTitle>{t("error")}</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (animal === null) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("show.notFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const badge = STATUS_BADGE[animal.status];
  const photoCount = animal.photoUrls.length;
  const activePhotoIndex = photoCount > 0 ? activePhoto % photoCount : 0;
  const birthDate = formatDate(animal.birthDate, locale);
  const arrivalDate = formatDate(animal.arrivalDate, locale);

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t("show.back")}
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{animal.name}</h1>
              <Badge variant={badge.variant} className={badge.className}>
                {t(`status.${animal.status}`)}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {t(`species.${animal.species}`)}
              {animal.breed ? ` • ${animal.breed}` : ""}
              {" • "}
              {t(`sex.${animal.sex}`)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/organizations/${organizationId}/animals/${animalId}/announcements`
                )
              }
            >
              {t("show.actions.announcements")}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/organizations/${organizationId}/animals/${animalId}/edit`
                )
              }
            >
              {t("show.actions.edit")}
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? t("show.actions.deleting") : t("show.actions.delete")}
              </Button>
            )}
          </div>
        </div>
        {deleteError && (
          <p className="mt-2 text-sm text-destructive">{deleteError}</p>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="gap-4">
          <TabsTrigger value="overview">{t("show.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="history">{t("show.tabs.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Photo gallery */}
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{t("show.gallery.title")}</CardTitle>
                  {photoCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {activePhotoIndex + 1} / {photoCount}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {photoCount > 0 ? (
                    <>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                        <Image
                          src={animal.photoUrls[activePhotoIndex]}
                          alt={t("show.gallery.alt", {
                            name: animal.name,
                            index: activePhotoIndex + 1,
                          })}
                          fill
                          className="object-cover"
                        />
                        {photoCount > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                              onClick={() =>
                                setActivePhoto(
                                  (activePhotoIndex - 1 + photoCount) % photoCount
                                )
                              }
                              aria-label={t("show.gallery.previous")}
                            >
                              <ChevronLeft className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                              onClick={() =>
                                setActivePhoto((activePhotoIndex + 1) % photoCount)
                              }
                              aria-label={t("show.gallery.next")}
                            >
                              <ChevronRight className="size-4" aria-hidden="true" />
                            </Button>
                          </>
                        )}
                      </div>
                      {photoCount > 1 && (
                        <div className="flex flex-wrap gap-2">
                          {animal.photoUrls.map((url, index) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => setActivePhoto(index)}
                              aria-label={t("show.gallery.alt", {
                                name: animal.name,
                                index: index + 1,
                              })}
                              className={cn(
                                "relative size-14 overflow-hidden rounded-md border transition-all",
                                index === activePhotoIndex
                                  ? "border-primary ring-2 ring-primary/40"
                                  : "opacity-70 hover:opacity-100"
                              )}
                            >
                              <Image src={url} alt="" fill className="object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border bg-muted/40 text-muted-foreground">
                      <ImageIcon className="size-8" aria-hidden="true" />
                      <span className="text-sm">{t("show.gallery.empty")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Health & character */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("show.health.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {t("show.health.healthNotes")}
                    </span>
                    <p className="mt-1">{animal.healthNotes || t("show.health.none")}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {t("show.health.character")}
                    </span>
                    <p className="mt-1">{animal.characterNotes || t("show.health.none")}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {t("show.health.compatibility")}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CompatBadge ok={animal.compatibilityKids} label={t("show.health.kids")} />
                      <CompatBadge ok={animal.compatibilityCats} label={t("show.health.cats")} />
                      <CompatBadge ok={animal.compatibilityDogs} label={t("show.health.dogs")} />
                    </div>
                  </div>
                  {animal.story && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {t("show.health.story")}
                      </span>
                      <p className="mt-1 text-sm italic">{animal.story}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Identification */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("show.facts.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {!animal.identificationMethod && (
                    <div
                      className={cn(
                        "mb-4 rounded-md border px-3 py-2 text-sm",
                        WARN_TINT
                      )}
                    >
                      {t("show.facts.identificationPending")}
                    </div>
                  )}
                  <dl className="space-y-3 text-sm">
                    <FactRow label={t("show.facts.species")}>
                      {t(`species.${animal.species}`)}
                    </FactRow>
                    <FactRow label={t("show.facts.sex")}>
                      {t(`sex.${animal.sex}`)}
                    </FactRow>
                    <FactRow label={t("show.facts.sterilized")}>
                      {animal.sterilized ? t("yes") : t("no")}
                    </FactRow>
                    {animal.chipId && (
                      <FactRow label={t("show.facts.chipId")}>{animal.chipId}</FactRow>
                    )}
                    {animal.identificationMethod && (
                      <FactRow label={t("show.facts.method")}>
                        {t(`identificationMethod.${animal.identificationMethod}`)}
                      </FactRow>
                    )}
                    {birthDate ? (
                      <FactRow label={t("show.facts.birthDate")}>{birthDate}</FactRow>
                    ) : (
                      animal.estimatedAge && (
                        <FactRow label={t("show.facts.estimatedAge")}>
                          {animal.estimatedAge}
                        </FactRow>
                      )
                    )}
                    <FactRow label={t("show.facts.arrivalDate")}>
                      {arrivalDate ?? animal.arrivalDate}
                    </FactRow>
                  </dl>
                </CardContent>
              </Card>

              {/* Status change */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("show.status.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <label
                    htmlFor="animal-status-select"
                    className="mb-1 block text-sm font-medium"
                  >
                    {t("show.status.change")}
                  </label>
                  <Select
                    value={animal.status}
                    onValueChange={(value) => handleStatusChange(value as AnimalStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="animal-status-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`status.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statusError && (
                    <p className="mt-2 text-sm text-destructive">{statusError}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("show.timeline.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {events === undefined ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="flex gap-4">
                      <Skeleton className="size-3.5 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32 rounded-full" />
                        <Skeleton className="h-3.5 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("show.timeline.empty")}</p>
              ) : (
                <ol className="space-y-0">
                  {events.map((event, index) => {
                    const eventBadge = EVENT_BADGE[event.eventType];
                    const isLast = index === events.length - 1;
                    return (
                      <li key={event._id} className="relative flex gap-4 pb-6 last:pb-0">
                        {!isLast && (
                          <span
                            className="absolute left-[7px] top-5 bottom-0 w-px bg-border"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={cn("mt-1 size-3.5 shrink-0 rounded-full", eventBadge.dot)}
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={eventBadge.variant} className={eventBadge.className}>
                              {t(`eventType.${event.eventType}`)}
                            </Badge>
                            <time
                              className="text-xs text-muted-foreground"
                              dateTime={event.eventDate}
                            >
                              {formatDate(event.eventDate, locale) ?? event.eventDate}
                            </time>
                          </div>
                          {event.notes && <p className="mt-1 text-sm">{event.notes}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
