"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, CardContent } from "@anima/ui";

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
  const createAnnouncement = useMutation(api.announcements.create);
  const [creatingAnimalId, setCreatingAnimalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectAnimal = async (animalId: Id<"animals">) => {
    setError(null);
    setCreatingAnimalId(animalId);
    try {
      const announcementId = await createAnnouncement({ animalId });
      router.push(
        `/organizations/${organizationId}/announcements/${announcementId}`
      );
    } catch {
      setError(t("error"));
      setCreatingAnimalId(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/organizations/${organizationId}/announcements`)}
          className="mb-4"
        >
          &larr; {t("new.backToList")}
        </Button>
        <h1 className="text-2xl font-bold">{t("new.title")}</h1>
        <p className="text-muted-foreground">{t("new.subtitle")}</p>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {animals === undefined ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : animals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("new.noAnimals")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animals.map((animal) => (
            <Card
              key={animal._id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelectAnimal(animal._id as Id<"animals">)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {animal.photoUrls?.[0] ? (
                    <img
                      src={animal.photoUrls[0]}
                      alt={animal.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg">
                      {animal.species === "dog" ? "🐶" : "🐱"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{animal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(`species.${animal.species}`)}
                    </p>
                  </div>
                  {creatingAnimalId === animal._id && (
                    <span className="ml-auto text-sm text-muted-foreground">
                      {t("new.creating")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
