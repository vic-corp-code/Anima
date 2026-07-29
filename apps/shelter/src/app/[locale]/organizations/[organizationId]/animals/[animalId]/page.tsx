"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useParams } from "next/navigation.js";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@anima/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@anima/ui";
import { useState } from "react";
import Image from "next/image";
import type { AnimalStatus } from "@anima/domain";

const STATUS_VALUES: AnimalStatus[] = [
  "in_care",
  "adoptable",
  "adoption_pending",
  "adopted",
  "fostered",
  "transferred",
  "deceased",
];

const EVENT_COLORS = {
  arrived: "bg-blue-100 text-blue-800 border-blue-200",
  vet_visit: "bg-purple-100 text-purple-800 border-purple-200",
  sterilized: "bg-green-100 text-green-800 border-green-200",
  fostered: "bg-orange-100 text-orange-800 border-orange-200",
  transferred: "bg-yellow-100 text-yellow-800 border-yellow-200",
  adopted: "bg-pink-100 text-pink-800 border-pink-200",
  deceased: "bg-gray-100 text-gray-800 border-gray-200",
  status_change: "bg-indigo-100 text-indigo-800 border-indigo-200",
  other: "bg-slate-100 text-slate-800 border-slate-200",
} as const;

export default function AnimalDetailPage() {
  const t = useTranslations("animals");
  const params = useParams();
  const router = useRouter();
  const animalId = params.animalId as Id<"animals">;
  const { isAuthenticated } = useConvexAuth();

  const animal = useQuery(api.animals.get, isAuthenticated ? { animalId } : "skip");
  const timeline = useQuery(api.animals.getTimeline, isAuthenticated ? { animalId } : "skip");
  const organizationId = params.organizationId as Id<"organizations">;
  const membership = useQuery(
    api.memberships.listForOrg,
    isAuthenticated ? { organizationId } : "skip"
  );
  const isAdmin = membership?.callerRole === "admin";

  const updateAnimal = useMutation(api.animals.update);
  const removeAnimal = useMutation(api.animals.remove);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!animal) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("detail.notFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: AnimalStatus) => {
    setIsUpdating(true);
    try {
      await updateAnimal({
        animalId,
        status: newStatus,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("detail.deleteConfirm", { name: animal.name }))) {
      return;
    }
    setIsDeleting(true);
    try {
      await removeAnimal({ animalId });
      router.push(`/organizations/${organizationId}/animals`);
    } catch (error) {
      console.error("Failed to delete animal:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← {t("detail.back")}
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{animal.name}</h1>
            <p className="text-muted-foreground">
              {t(`species.${animal.species}`)}
              {animal.breed && ` • ${animal.breed}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/organizations/${organizationId}/animals/${animalId}/announcements`)}
            >
              {t("detail.announcementsButton")}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/organizations/${organizationId}/animals/${animalId}/edit`)}
            >
              {t("detail.edit")}
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? t("detail.deleting") : t("detail.delete")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.statusTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {t(`status.${animal.status}`)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_VALUES.map((value) => (
                  <Button
                    key={value}
                    variant={animal.status === value ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating || animal.status === value}
                    onClick={() => handleStatusChange(value)}
                  >
                    {t(`status.${value}`)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Identification */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.identificationTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">{t("sexLabel")}</span>
                  <p className="font-medium">{t(`sex.${animal.sex}`)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t("sterilizedLabel")}</span>
                  <p className="font-medium">{animal.sterilized ? t("yes") : t("no")}</p>
                </div>
                {animal.chipId && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("detail.chipIdLabel")}</span>
                    <p className="font-medium">{animal.chipId}</p>
                  </div>
                )}
                {animal.identificationMethod && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("detail.methodLabel")}</span>
                    <p className="font-medium">
                      {t(`identificationMethod.${animal.identificationMethod}`)}
                    </p>
                  </div>
                )}
                {animal.birthDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("detail.birthDateLabel")}</span>
                    <p className="font-medium">{new Date(animal.birthDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
                {animal.estimatedAge && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("estimatedAgeLabel")}</span>
                    <p className="font-medium">{animal.estimatedAge}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">{t("detail.arrivalDateLabel")}</span>
                  <p className="font-medium">{new Date(animal.arrivalDate).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health & character */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.healthTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">{t("detail.healthNotesLabel")}</span>
                <p className="mt-1">{animal.healthNotes || t("detail.noNote")}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t("detail.characterLabel")}</span>
                <p className="mt-1">{animal.characterNotes || t("detail.noNote")}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t("detail.compatibilityLabel")}</span>
                <div className="mt-1 flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${animal.compatibilityKids ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {t("detail.compatibilityKids")}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${animal.compatibilityCats ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {t("detail.compatibilityCats")}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${animal.compatibilityDogs ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {t("detail.compatibilityDogs")}
                  </span>
                </div>
              </div>
              {animal.story && (
                <div>
                  <span className="text-sm text-muted-foreground">{t("detail.storyLabel")}</span>
                  <p className="mt-1 text-sm italic">{animal.story}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          {animal.photoUrls && animal.photoUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.photosTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {animal.photoUrls.map((url, index) => (
                    <div key={index} className="relative w-full h-32">
                      <Image
                        src={url}
                        alt={t("detail.photoAlt", { name: animal.name, index: index + 1 })}
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{t("detail.historyTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline && timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event._id} className="relative">
                      {/* Timeline line */}
                      {index < timeline.length - 1 && (
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                      )}

                      <div className="flex gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${EVENT_COLORS[event.eventType].split(" ")[0]}`}>
                          <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[event.eventType].split(" ")[1].replace("text-", "bg-")}`} />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${EVENT_COLORS[event.eventType]}`}>
                            {t(`eventType.${event.eventType}`)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.eventDate).toLocaleDateString("fr-FR")}
                          </p>
                          {event.notes && (
                            <p className="text-sm mt-1">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("detail.noEvents")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
