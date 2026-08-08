"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { Card, CardContent } from "@anima/ui";
import { Link } from "@/i18n/navigation";

export default function AnimalPage() {
  const t = useTranslations("hub");
  const tAnnouncements = useTranslations("announcements");
  const params = useParams();
  const announcementId = params.announcementId as Id<"announcements">;

  const result = useQuery(api.hub.getPublishedAnnouncement, { announcementId });

  if (result === undefined) {
    return <div className="container mx-auto p-4">{t("loading")}</div>;
  }

  if (result === null) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Link href="/" className="text-sm underline">
          {t("backToDirectory")}
        </Link>
      </div>
    );
  }

  const { title, description, animal, organization } = result;
  const isVerified = organization.verificationStatus !== "unverified";

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Link href="/" className="text-sm underline mb-4 inline-block">
        {t("backToDirectory")}
      </Link>

      {animal.photoUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
          {animal.photoUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`${animal.name} ${index + 1}`}
              className="h-48 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-1">{title}</h1>
      <p className="text-muted-foreground mb-4">
        {animal.name} • {tAnnouncements(`species.${animal.species}`)}
        {animal.breed ? ` (${animal.breed})` : ""}
      </p>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-1">{t("organizationLabel")}</p>
          <p>{organization.name}</p>
          <p className="text-sm text-muted-foreground">{organization.address}</p>
          <span
            className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
              isVerified
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isVerified ? t("verifiedBadge") : t("unverifiedBadge")}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap">{animal.story || description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
