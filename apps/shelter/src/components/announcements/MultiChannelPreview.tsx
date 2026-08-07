"use client";

// Multi-channel live preview for the announcement composer. All three
// platform previews (Facebook, Instagram, shelter site) derive their content
// from the SAME form state passed in via `values` — there is no per-platform
// hardcoding (the old static mockup cards were the anti-pattern this replaces).
import { useTranslations } from "next-intl";
import { Badge, Card, CardContent } from "@anima/ui";
import {
  BadgeCheck,
  Bookmark,
  Facebook,
  Globe,
  Heart,
  Instagram,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import type { Doc } from "@anima/backend/convex/_generated/dataModel";
import {
  factsLine,
  formatAge,
  speciesEmoji,
  type AnnouncementFormValues,
} from "./announcementContent";

interface MultiChannelPreviewProps {
  values: AnnouncementFormValues;
  animal?: Doc<"animals"> | null;
  orgName?: string;
}

export function MultiChannelPreview({
  values,
  animal,
  orgName,
}: MultiChannelPreviewProps) {
  const t = useTranslations("announcements");

  if (!animal) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          {t("preview.empty")}
        </CardContent>
      </Card>
    );
  }

  const emoji = speciesEmoji(animal);
  const age = formatAge(animal, {
    unknown: t("preview.ageUnknown"),
    years: (count) => t("preview.ageYears", { count }),
    months: (count) => t("preview.ageMonths", { count }),
  });
  const facts = factsLine(animal, {
    species: t(`species.${animal.species}`),
    sex: t(`preview.sex.${animal.sex}`),
    sterilized: t("preview.sterilized"),
    chip: t("preview.chip"),
    age,
  });

  // Shared content blocks — the exact text that gets persisted as the
  // announcement description (see composeDescription), re-used verbatim
  // across the three previews.
  const blocks = [
    values.story.trim(),
    values.personality.trim()
      ? `✨ ${t("preview.personality")} : ${values.personality.trim()}`
      : "",
    values.idealHome.trim()
      ? `🏡 ${t("preview.idealHome")} : ${values.idealHome.trim()}`
      : "",
  ].filter(Boolean);
  const bodyText = blocks.join("\n\n");

  const photo = values.photoUrls[0];
  const orgInitial = orgName?.charAt(0).toUpperCase() ?? "🐾";
  const compat = [
    { key: "compatibilityKids", icon: "🧒", label: t("preview.compat.kids") },
    { key: "compatibilityCats", icon: "🐱", label: t("preview.compat.cats") },
    { key: "compatibilityDogs", icon: "🐶", label: t("preview.compat.dogs") },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ---- Facebook ---- */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Facebook className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("preview.facebook")}</h3>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {orgInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {orgName ?? t("preview.site")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("preview.today")}
                </p>
              </div>
              <MoreHorizontal className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="mt-4 whitespace-pre-line text-sm">
              <p className="font-semibold">
                {emoji} {values.title}
              </p>
              {bodyText && <p className="mt-2">{bodyText}</p>}
            </div>

            {photo ? (
              <img
                src={photo}
                alt={values.title}
                className="mt-3 aspect-[4/3] w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mt-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                {t("preview.noPhoto")}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 border-t border-border-soft pt-3 text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              <Heart className="h-4 w-4" />
              <MessageCircle className="h-4 w-4" />
              <Share2 className="ml-auto h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Instagram ---- */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Instagram className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("preview.instagram")}</h3>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {orgInitial}
              </div>
              <p className="truncate text-sm font-semibold">
                {orgName ?? t("preview.site")}
              </p>
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
              <MoreHorizontal className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            {photo ? (
              <img
                src={photo}
                alt={values.title}
                className="mt-3 aspect-square w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mt-3 flex aspect-square w-full items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                {t("preview.noPhoto")}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-muted-foreground">
              <Heart className="h-5 w-5" />
              <MessageCircle className="h-5 w-5" />
              <Send className="h-5 w-5" />
              <Bookmark className="ml-auto h-5 w-5" />
            </div>

            <div className="mt-3 whitespace-pre-line text-sm">
              <p>
                <span className="font-semibold">
                  {emoji} {t("preview.igCta", { name: animal.name })}
                </span>{" "}
                {facts}
              </p>
              {bodyText && <p className="mt-2">{bodyText}</p>}
              {orgName && (
                <p className="mt-2 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {orgName}
                </p>
              )}
              <p className="mt-1 text-muted-foreground">{t("preview.igHashtags")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Shelter site (compact card format, F3) ---- */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("preview.site")}</h3>
        </div>
        <Card className="overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={animal.name}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              {t("preview.noPhoto")}
            </div>
          )}
          <CardContent className="pt-5">
            <h4 className="text-lg font-semibold leading-tight">{animal.name}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{facts}</p>
            {values.story.trim() && (
              <p className="mt-3 line-clamp-3 text-sm">{values.story.trim()}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {compat.map((item) => (
                <Badge
                  key={item.key}
                  variant="outline"
                  className={
                    animal[item.key] ? "" : "opacity-40 grayscale"
                  }
                >
                  {item.icon} {item.label}
                </Badge>
              ))}
            </div>
            {values.personality.trim() && (
              <p className="mt-3 text-sm">
                <span className="font-medium">
                  {t("preview.personality")} :
                </span>{" "}
                {values.personality.trim()}
              </p>
            )}
            {values.idealHome.trim() && (
              <p className="mt-1 text-sm">
                <span className="font-medium">{t("preview.idealHome")} :</span>{" "}
                {values.idealHome.trim()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
