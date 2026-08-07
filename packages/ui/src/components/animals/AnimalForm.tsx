"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  zodResolver,
} from "../ui/form";
import { PhotoUpload } from "./PhotoUpload";

// Types matching the Convex schema
interface AnimalFormData {
  name: string;
  species: "dog" | "cat";
  breed?: string;
  sex: "male" | "female" | "unknown";
  chipId?: string;
  identificationMethod?: "chip" | "tattoo" | "none";
  birthDate?: string;
  estimatedAge?: string;
  arrivalDate: string;
  sterilized: boolean;
  healthNotes?: string;
  characterNotes?: string;
  compatibilityKids: boolean;
  compatibilityCats: boolean;
  compatibilityDogs: boolean;
  story?: string;
  photoUrls: string[];
}

interface AnimalFormProps {
  initialData?: Partial<AnimalFormData>;
  onSubmit: (data: AnimalFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  locale?: "fr" | "es";
  // Forwarded to PhotoUpload — see its own prop comment.
  uploadFile: (file: File) => Promise<string>;
}

// RHF values differ from the payload: the identification method select
// carries "" for "not set" (empty strings aren't valid for the Convex
// union), and every field is always present.
interface AnimalFormValues {
  name: string;
  species: "dog" | "cat";
  breed: string;
  sex: "male" | "female" | "unknown";
  chipId: string;
  identificationMethod: "" | "chip" | "tattoo" | "none";
  birthDate: string;
  estimatedAge: string;
  arrivalDate: string;
  sterilized: boolean;
  healthNotes: string;
  characterNotes: string;
  compatibilityKids: boolean;
  compatibilityCats: boolean;
  compatibilityDogs: boolean;
  story: string;
  photoUrls: string[];
}

const SPECIES_OPTIONS = [
  { value: "dog", label: { fr: "Chien", es: "Perro" } },
  { value: "cat", label: { fr: "Chat", es: "Gato" } },
] as const;

const SEX_OPTIONS = [
  { value: "male", label: { fr: "Mâle", es: "Macho" } },
  { value: "female", label: { fr: "Femelle", es: "Hembra" } },
  { value: "unknown", label: { fr: "Inconnu", es: "Desconocido" } },
] as const;

const IDENTIFICATION_METHOD_OPTIONS = [
  { value: "chip", label: { fr: "Puce (I-CAD)", es: "Chip (I-CAD)" } },
  { value: "tattoo", label: { fr: "Tatouage", es: "Tatuaje" } },
  { value: "none", label: { fr: "Aucune", es: "Ninguno" } },
] as const;

function buildSchema(locale: "fr" | "es") {
  const t = (fr: string, es: string) => (locale === "fr" ? fr : es);
  const isRequired = t("Champ requis", "Campo requerido");

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("Le nom est requis", "El nombre es requerido")),
      species: z.enum(["dog", "cat"]),
      breed: z.string(),
      sex: z.enum(["male", "female", "unknown"]),
      chipId: z.string(),
      identificationMethod: z.enum(["chip", "tattoo", "none"]).or(z.literal("")),
      birthDate: z.string(),
      estimatedAge: z.string(),
      arrivalDate: z.string().min(1, isRequired),
      sterilized: z.boolean(),
      healthNotes: z.string(),
      characterNotes: z.string(),
      compatibilityKids: z.boolean(),
      compatibilityCats: z.boolean(),
      compatibilityDogs: z.boolean(),
      story: z.string(),
      photoUrls: z.array(z.string()),
    })
    .superRefine((values, ctx) => {
      // I-CAD format validation (15 digits)
      if (values.chipId) {
        const cleaned = values.chipId.replace(/[\s-]/g, "");
        if (cleaned.length !== 15 || !/^\d{15}$/.test(cleaned)) {
          ctx.addIssue({
            code: "custom",
            path: ["chipId"],
            message: t(
              "Le numéro I-CAD doit comporter 15 chiffres",
              "El número I-CAD debe tener 15 dígitos"
            ),
          });
        }
      }

      // Arrival date validation (string comparison avoids UTC-vs-local
      // timezone drift between the date-only input value and `new Date()`)
      if (values.arrivalDate) {
        const todayStr = new Date().toISOString().split("T")[0] as string;
        if (values.arrivalDate > todayStr) {
          ctx.addIssue({
            code: "custom",
            path: ["arrivalDate"],
            message: t(
              "La date d'arrivée ne peut pas être dans le futur",
              "La fecha de llegada no puede estar en el futuro"
            ),
          });
        }
      }
    });
}

export function AnimalForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  locale = "fr",
  uploadFile,
}: AnimalFormProps) {
  const t = (fr: string, es: string) => (locale === "fr" ? fr : es);

  const schema = useMemo(() => buildSchema(locale), [locale]);

  const form = useForm<AnimalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      species: initialData?.species ?? "cat",
      breed: initialData?.breed ?? "",
      sex: initialData?.sex ?? "unknown",
      chipId: initialData?.chipId ?? "",
      identificationMethod: initialData?.identificationMethod ?? "",
      birthDate: initialData?.birthDate ?? "",
      estimatedAge: initialData?.estimatedAge ?? "",
      arrivalDate:
        (initialData?.arrivalDate ?? new Date().toISOString().split("T")[0]) as string,
      sterilized: initialData?.sterilized ?? false,
      healthNotes: initialData?.healthNotes ?? "",
      characterNotes: initialData?.characterNotes ?? "",
      compatibilityKids: initialData?.compatibilityKids ?? false,
      compatibilityCats: initialData?.compatibilityCats ?? false,
      compatibilityDogs: initialData?.compatibilityDogs ?? false,
      story: initialData?.story ?? "",
      photoUrls: initialData?.photoUrls ?? [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const chipId = form.watch("chipId");
  const identificationMethod = form.watch("identificationMethod");

  // Non-blocking French legal warnings (validation errors are handled by zod)
  const warnings: string[] = [];
  if (locale === "fr") {
    if (!chipId) {
      warnings.push(
        t(
          "Le numéro I-CAD est légalement requis pour les chiens et chats en France",
          "El número I-CAD es legalmente requerido para perros y gatos en Francia"
        )
      );
    } else if (identificationMethod === "none") {
      warnings.push(
        t(
          "La méthode d'identification doit être spécifiée si un numéro I-CAD est fourni",
          "El método de identificación debe especificarse si se proporciona un número I-CAD"
        )
      );
    }
  }

  const handleSubmit = async (values: AnimalFormValues) => {
    const payload: AnimalFormData = {
      ...values,
      // "" isn't a valid Convex union value — omit it entirely
      identificationMethod: values.identificationMethod || undefined,
    };

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      console.error("Failed to submit form:", error);
      setSubmitError(
        t(
          "Une erreur est survenue. Réessayez.",
          "Se produjo un error. Inténtalo de nuevo."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Identité", "Identidad")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("Nom *", "Nombre *")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Espèce *", "Especie *")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPECIES_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label[locale]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Sexe *", "Sexo *")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEX_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label[locale]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("Race (optionnel)", "Raza (opcional)")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chipId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Numéro I-CAD", "Número I-CAD")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="250XXXXXXXXXXXXX"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      "15 chiffres requis pour France",
                      "15 dígitos requeridos para Francia"
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identificationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("Méthode d'identification", "Método de identificación")}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("Sélectionner...", "Seleccionar...")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">
                        {t("Sélectionner...", "Seleccionar...")}
                      </SelectItem>
                      {IDENTIFICATION_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label[locale]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("Date de naissance", "Fecha de nacimiento")}
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("Ou", "O")}{" "}
                    <em>{t("âge estimé ci-dessous", "edad estimada abajo")}</em>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Âge estimé", "Edad estimada")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("ex: 1 an, 6 mois...", "ej: 1 año, 6 meses...")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="arrivalDate"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    {t("Date d'arrivée *", "Fecha de llegada *")}
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  {locale === "fr" && (
                    <FormDescription>
                      {t("(Requis légal)", "(Requisito legal)")}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Health */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Santé", "Salud")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="sterilized"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>{t("Stérilisé", "Esterilizado")}</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="healthNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Notes de santé", "Notas de salud")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t(
                        "Maladies, traitements, vaccinations...",
                        "Enfermedades, tratamientos, vacunas..."
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Comportement", "Comportamiento")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="characterNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Caractère", "Carácter")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t(
                        "Comportement, tempérament...",
                        "Comportamiento, temperamento..."
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compatibilityKids"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>{t("Enfants", "Niños")}</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compatibilityCats"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>{t("Chats", "Gatos")}</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compatibilityDogs"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>{t("Chiens", "Perros")}</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Médias", "Medios")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="story"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("Histoire pour les adoptants", "Historia para adoptantes")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={t(
                        "Racontez l'histoire de cet animal pour aider à trouver une famille...",
                        "Cuenta la historia de este animal para ayudar a encontrar una familia..."
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      "Ce texte sera visible sur l'annonce d'adoption",
                      "Este texto será visible en el anuncio de adopción"
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PhotoUpload
              onPhotosChange={(urls) => form.setValue("photoUrls", urls)}
              uploadFile={uploadFile}
              initialPhotos={initialData?.photoUrls ?? []}
              maxPhotos={10}
              maxSizeMB={5}
              locale={locale}
              bare
            />
          </CardContent>
        </Card>

        {/* French legal warnings (non-blocking) */}
        {warnings.length > 0 && (
          <Alert className="border-warn/40 bg-warn/10">
            <AlertTitle className="text-warn">
              {t("À noter", "A tener en cuenta")}
            </AlertTitle>
            <AlertDescription className="text-warn/90">
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit error */}
        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting
              ? t("Enregistrement...", "Guardando...")
              : submitLabel || t("Enregistrer", "Guardar")}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t("Annuler", "Cancelar")}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
