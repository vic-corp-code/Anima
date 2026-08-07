"use client";

// Announcement composer: animal picker (registry data) + story/personality/
// ideal-home text + photo upload on the left, a live multi-channel preview
// on the right. The preview column subscribes to the SAME form state via
// useWatch — typing in any field updates all three platform previews at
// once. The form is the single source of truth; nothing is hardcoded per
// platform (see MultiChannelPreview + announcementContent).
//
// Persistence reuses the existing mutations: announcements.create drafts the
// announcement, announcements.update persists title + composed description,
// animals.update persists the form's photos to the registry record (the
// announcements table has no media field of its own).
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id, type Doc } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PhotoUpload,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useForm,
  useWatch,
  z,
  zodResolver,
} from "@anima/ui";
import { MultiChannelPreview } from "./MultiChannelPreview";
import {
  composeDescription,
  splitDescription,
  type AnnouncementFormValues,
} from "./announcementContent";

interface AnnouncementFormProps {
  mode: "create" | "edit";
  organizationId: Id<"organizations">;
  animals?: Doc<"animals">[];
  // Edit mode: the announcement with its joined animal (api.announcements.get).
  announcement?: (Doc<"announcements"> & { animal: Doc<"animals"> | null }) | null;
  orgName?: string;
  uploadFile: (file: File) => Promise<string>;
}

type FormValues = {
  animalId: string;
  title: string;
  story: string;
  personality: string;
  idealHome: string;
  photoUrls: string[];
};

export function AnnouncementForm({
  mode,
  organizationId,
  animals,
  announcement,
  orgName,
  uploadFile,
}: AnnouncementFormProps) {
  const t = useTranslations("announcements");
  const locale = useLocale() as "fr" | "es";
  const router = useRouter();

  const createAnnouncement = useMutation(api.announcements.create);
  const updateAnnouncement = useMutation(api.announcements.update);
  const updateAnimal = useMutation(api.animals.update);

  const isLocked =
    mode === "edit" &&
    announcement !== null &&
    announcement !== undefined &&
    (announcement.status === "closed" || announcement.status === "archived");

  // Localized validation messages — the schema needs `t`, so it's built
  // inside the component (stable per render, cheap to recreate).
  const schema = useMemo(
    () =>
      z.object({
        animalId: z.string().min(1, t("new.animalRequired")),
        title: z.string().min(1, t("new.titleRequired")),
        story: z.string(),
        personality: z.string(),
        idealHome: z.string(),
        photoUrls: z.array(z.string()),
      }),
    [t]
  );

  const initialValues = useMemo<FormValues>(() => {
    if (mode === "edit" && announcement) {
      const split = splitDescription(announcement.description);
      return {
        animalId: announcement.animalId,
        title: announcement.title,
        story: split.story,
        personality: split.personality,
        idealHome: split.idealHome,
        photoUrls: announcement.animal?.photoUrls ?? [],
      };
    }
    return {
      animalId: "",
      title: "",
      story: "",
      personality: "",
      idealHome: "",
      photoUrls: [],
    };
  }, [mode, announcement]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  // Live preview state — the whole form is watched, so every keystroke and
  // every picker change flows straight into all three platform previews.
  const watched = useWatch({ control: form.control });
  const previewValues: AnnouncementFormValues = {
    animalId: watched.animalId ?? "",
    title: watched.title ?? "",
    story: watched.story ?? "",
    personality: watched.personality ?? "",
    idealHome: watched.idealHome ?? "",
    photoUrls: watched.photoUrls ?? [],
  };
  const selectedAnimalId = previewValues.animalId;
  const selectedAnimal =
    mode === "edit"
      ? announcement?.animal ?? null
      : (animals?.find((animal) => animal._id === selectedAnimalId) ?? null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleAnimalChange = (animalId: string) => {
    form.setValue("animalId", animalId, { shouldValidate: true });
    const animal = animals?.find((a) => a._id === animalId);
    if (!animal) return;
    const breed = animal.breed ? ` (${animal.breed})` : "";
    form.setValue("title", t("new.titleDraft", { name: animal.name }));
    form.setValue(
      "story",
      animal.story?.trim() ||
        t("new.storyFallback", {
          name: animal.name,
          species: t(`species.${animal.species}`),
          breed,
        })
    );
    form.setValue("personality", animal.characterNotes?.trim() || "");
    form.setValue("idealHome", "");
    form.setValue("photoUrls", animal.photoUrls);
  };

  const handleSubmit = async (values: FormValues) => {
    // Re-entry guard: the submit button's `disabled` doesn't stop
    // Enter-key submission, and createAnnouncement is not idempotent —
    // a second call while the first is in flight would duplicate the draft.
    if (isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const description = composeDescription(values, {
        personality: t("preview.personality"),
        idealHome: t("preview.idealHome"),
      });
      const animalId = values.animalId as Id<"animals">;
      // The announcements table has no media field of its own, so the
      // form's photos persist to the registry record (animals.update).
      // An empty array is never written — clearing the photos in the
      // composer must not wipe the photos shown on the animal's profile.
      // Ordering differs by mode so a failure never leaves a half-applied
      // change:
      // - create: photos first — if the photo write fails nothing was
      //   created, a clean abort that leaves no draft behind.
      // - edit: announcement first — the announcement write can throw
      //   (closed/archived between render and submit), so no animal photo
      //   change is left behind if it does.
      if (mode === "create") {
        if (values.photoUrls.length > 0) {
          await updateAnimal({ animalId, photoUrls: values.photoUrls });
        }
        const announcementId = await createAnnouncement({ animalId });
        await updateAnnouncement({
          announcementId,
          title: values.title.trim(),
          description,
        });
        router.push(
          `/organizations/${organizationId}/announcements/${announcementId}`
        );
      } else if (announcement) {
        await updateAnnouncement({
          announcementId: announcement._id,
          title: values.title.trim(),
          description,
        });
        if (values.photoUrls.length > 0) {
          await updateAnimal({ animalId, photoUrls: values.photoUrls });
        }
        router.push(
          `/organizations/${organizationId}/announcements/${announcement._id}`
        );
      }
    } catch {
      setSubmitError(t("error"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
          noValidate
        >
          {isLocked && (
            <Card className="border-warn/40 bg-warn/5">
              <CardContent className="pt-6 text-sm text-warn">
                {t("editPage.locked")}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("new.sectionAnimal")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="animalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("new.selectLabel")}</FormLabel>
                    <FormControl>
                      {mode === "create" ? (
                        <Select
                          value={field.value || undefined}
                          onValueChange={handleAnimalChange}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t("new.selectPlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(animals ?? []).map((animal) => (
                              <SelectItem key={animal._id} value={animal._id}>
                                {animal.species === "dog" ? "🐶" : "🐱"}{" "}
                                {animal.name}
                                {animal.breed ? ` — ${animal.breed}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        // The announcement's animal is fixed when editing —
                        // updateAnnouncement takes no animalId, so an
                        // enabled-looking Select would do nothing.
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
                          <span className="text-lg leading-none">
                            {announcement?.animal?.species === "dog"
                              ? "🐶"
                              : "🐱"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {announcement?.animal?.name}
                            </p>
                            {announcement?.animal?.breed && (
                              <p className="truncate text-xs text-muted-foreground">
                                {announcement.animal.breed}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("new.sectionStory")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("new.titleLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("new.titleDraft", { name: "…" })}
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("new.storyLabel")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={5}
                        placeholder={t("new.storyPlaceholder")}
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormDescription>{t("new.storyHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("new.personalityLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("new.personalityPlaceholder")}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="idealHome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("new.idealHomeLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("new.idealHomePlaceholder")}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("new.sectionPhotos")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("new.photosHint")}
              </p>
              {!isLocked && (
                <FormField
                  control={form.control}
                  name="photoUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhotoUpload
                          // Remount on animal change so the internal photo
                          // list follows the newly selected registry photos.
                          key={selectedAnimalId || "none"}
                          onPhotosChange={(urls) =>
                            field.onChange(urls)
                          }
                          uploadFile={uploadFile}
                          initialPhotos={field.value}
                          locale={locale}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isLocked}
            className="w-full sm:w-auto"
          >
            {isSubmitting
              ? t("new.saving")
              : mode === "create"
                ? t("new.saveDraft")
                : t("editPage.save")}
          </Button>
        </form>
      </Form>

      <div className="h-fit xl:sticky xl:top-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{t("preview.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("preview.subtitle")}</p>
        </div>
        <MultiChannelPreview
          values={previewValues}
          animal={selectedAnimal}
          orgName={orgName}
        />
      </div>
    </div>
  );
}
