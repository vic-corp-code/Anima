"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Card, CardContent, AnnouncementCard } from "@anima/ui";
import { useRouter } from "@/i18n/navigation";

const SPECIES_OPTIONS = ["dog", "cat"] as const;
type Species = (typeof SPECIES_OPTIONS)[number];

export default function DirectoryPage() {
  const t = useTranslations("hub");
  const tAnnouncements = useTranslations("announcements");
  const router = useRouter();
  const [species, setSpecies] = useState<Species | null>(null);

  const announcements = useQuery(api.hub.listPublishedAnnouncements, {
    species: species ?? undefined,
  });

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <label className="block text-sm font-medium mb-1">
            {t("speciesFilterLabel")}
          </label>
          <select
            value={species ?? ""}
            onChange={(e) => setSpecies((e.target.value || null) as Species | null)}
            className="w-full max-w-xs rounded border px-3 py-2"
          >
            <option value="">{t("allSpecies")}</option>
            {SPECIES_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {tAnnouncements(`species.${option}`)}
              </option>
            ))}
          </select>
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
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              title={announcement.title}
              description={announcement.description}
              status={announcement.status}
              statusLabel={tAnnouncements(`status.${announcement.status}`)}
              animalName={announcement.animalName}
              animalSpeciesLabel={tAnnouncements(`species.${announcement.animalSpecies}`)}
              photoUrl={announcement.photoUrl}
              onClick={() => router.push(`/animals/${announcement._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
