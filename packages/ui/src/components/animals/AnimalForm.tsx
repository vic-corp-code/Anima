"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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

export function AnimalForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  locale = "fr",
}: AnimalFormProps) {
  const [formData, setFormData] = useState<AnimalFormData>({
    name: initialData?.name || "",
    species: initialData?.species || "cat",
    breed: initialData?.breed || "",
    sex: initialData?.sex || "unknown",
    chipId: initialData?.chipId || "",
    identificationMethod: initialData?.identificationMethod || undefined,
    birthDate: initialData?.birthDate || "",
    estimatedAge: initialData?.estimatedAge || "",
    arrivalDate: (initialData?.arrivalDate ?? new Date().toISOString().split("T")[0]) as string,
    sterilized: initialData?.sterilized ?? false,
    healthNotes: initialData?.healthNotes || "",
    characterNotes: initialData?.characterNotes || "",
    compatibilityKids: initialData?.compatibilityKids ?? false,
    compatibilityCats: initialData?.compatibilityCats ?? false,
    compatibilityDogs: initialData?.compatibilityDogs ?? false,
    story: initialData?.story || "",
    photoUrls: initialData?.photoUrls || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const t = (fr: string, es: string) => (locale === "fr" ? fr : es);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newWarnings: string[] = [];

    // Required fields
    if (!formData.name.trim()) {
      newErrors["name"] = t("Le nom est requis", "El nombre es requerido");
    }
    if (!formData.arrivalDate) {
      newErrors["arrivalDate"] = t(
        "La date d'arrivée est requise",
        "La fecha de llegada es requerida"
      );
    }

    // French legal validation
    if (!formData.chipId && locale === "fr") {
      newWarnings.push(
        t(
          "Le numéro I-CAD est légalement requis pour les chiens et chats en France",
          "El número I-CAD es legalmente requerido para perros y gatos en Francia"
        )
      );
    }

    if (
      formData.chipId &&
      formData.identificationMethod === "none" &&
      locale === "fr"
    ) {
      newWarnings.push(
        t(
          "La méthode d'identification doit être spécifiée si un numéro I-CAD est fourni",
          "El método de identificación debe especificarse si se proporciona un número I-CAD"
        )
      );
    }

    // I-CAD format validation (15 digits, starts with 250 for France)
    if (formData.chipId) {
      const cleaned = formData.chipId.replace(/[\s-]/g, "");
      if (cleaned.length !== 15 || !/^\d{15}$/.test(cleaned)) {
        newErrors["chipId"] = t(
          "Le numéro I-CAD doit comporter 15 chiffres",
          "El número I-CAD debe tener 15 dígitos"
        );
      }
    }

    // Arrival date validation (string comparison avoids UTC-vs-local
    // timezone drift between the date-only input value and `new Date()`)
    if (formData.arrivalDate) {
      const todayStr = new Date().toISOString().split("T")[0] as string;
      if (formData.arrivalDate > todayStr) {
        newErrors["arrivalDate"] = t(
          "La date d'arrivée ne peut pas être dans le futur",
          "La fecha de llegada no puede estar en el futuro"
        );
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Failed to submit form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (
    field: keyof AnimalFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Informations de base", "Información básica")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Nom *", "Nombre *")}
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                updateField("name", (e.target as HTMLInputElement).value)
              }
              className={errors["name"] ? "border-red-500" : ""}
            />
            {errors["name"] && (
              <p className="text-sm text-red-500 mt-1">{errors["name"]}</p>
            )}
          </div>

          {/* Species & Sex */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Espèce *", "Especie *")}
              </label>
              <select
                value={formData.species}
                onChange={(e) =>
                  updateField(
                    "species",
                    (e.target as HTMLSelectElement).value
                  )
                }
                className="w-full rounded border px-3 py-2"
              >
                {SPECIES_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Sexe *", "Sexo *")}
              </label>
              <select
                value={formData.sex}
                onChange={(e) =>
                  updateField("sex", (e.target as HTMLSelectElement).value)
                }
                className="w-full rounded border px-3 py-2"
              >
                {SEX_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Race (optionnel)", "Raza (opcional)")}
            </label>
            <Input
              value={formData.breed}
              onChange={(e) =>
                updateField("breed", (e.target as HTMLInputElement).value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("Identification", "Identificación")}
            {locale === "fr" && (
              <span className="text-xs text-muted-foreground ml-2">
                (Requis légal)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* I-CAD Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Numéro I-CAD", "Número I-CAD")}
            </label>
            <Input
              value={formData.chipId}
              onChange={(e) =>
                updateField("chipId", (e.target as HTMLInputElement).value)
              }
              placeholder={t(
                "250XXXXXXXXXXXXX",
                "250XXXXXXXXXXXXX"
              )}
              className={errors["chipId"] ? "border-red-500" : ""}
            />
            {errors["chipId"] && (
              <p className="text-sm text-red-500 mt-1">{errors["chipId"]}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "15 chiffres requis pour France",
                "15 dígitos requeridos para Francia"
              )}
            </p>
          </div>

          {/* Identification Method */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Méthode d'identification", "Método de identificación")}
            </label>
            <select
              value={formData.identificationMethod || ""}
              onChange={(e) => {
                const value = (e.target as HTMLSelectElement).value;
                updateField("identificationMethod", value || "");
              }}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">
                {t("Sélectionner...", "Seleccionar...")}
              </option>
              {IDENTIFICATION_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[locale]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Age */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Âge", "Edad")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Date de naissance", "Fecha de nacimiento")}
            </label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) =>
                updateField("birthDate", (e.target as HTMLInputElement).value)
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("Ou", "O")}{" "}
              <span className="italic">{t("Âge estimé ↓", "Edad estimada ↓")}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Âge estimé", "Edad estimada")}
            </label>
            <Input
              value={formData.estimatedAge}
              onChange={(e) =>
                updateField(
                  "estimatedAge",
                  (e.target as HTMLInputElement).value
                )
              }
              placeholder={t("ex: 1 an, 6 mois...", "ej: 1 año, 6 meses...")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Health & Character */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("Santé et caractère", "Salud y carácter")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sterilized */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sterilized"
              checked={formData.sterilized}
              onChange={(e) =>
                updateField("sterilized", (e.target as HTMLInputElement).checked)
              }
              className="rounded"
            />
            <label htmlFor="sterilized" className="text-sm font-medium">
              {t("Stérilisé", "Esterilizado")}
            </label>
          </div>

          {/* Health Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Notes de santé", "Notas de salud")}
            </label>
            <textarea
              value={formData.healthNotes}
              onChange={(e) =>
                updateField(
                  "healthNotes",
                  (e.target as HTMLTextAreaElement).value
                )
              }
              rows={3}
              className="w-full rounded border px-3 py-2"
              placeholder={t(
                "Maladies, traitements, vaccinations...",
                "Enfermedades, tratamientos, vacunas..."
              )}
            />
          </div>

          {/* Character Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Caractère", "Carácter")}
            </label>
            <textarea
              value={formData.characterNotes}
              onChange={(e) =>
                updateField(
                  "characterNotes",
                  (e.target as HTMLTextAreaElement).value
                )
              }
              rows={3}
              className="w-full rounded border px-3 py-2"
              placeholder={t(
                "Comportement, tempérament...",
                "Comportamiento, temperamento..."
              )}
            />
          </div>

          {/* Compatibility */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Compatibilité", "Compatibilidad")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "compatibilityKids", label: { fr: "Enfants", es: "Niños" } },
                { key: "compatibilityCats", label: { fr: "Chats", es: "Gatos" } },
                { key: "compatibilityDogs", label: { fr: "Chiens", es: "Perros" } },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={formData[item.key as keyof typeof formData] as boolean}
                    onChange={(e) =>
                      updateField(
                        item.key as keyof typeof formData,
                        (e.target as HTMLInputElement).checked
                      )
                    }
                    className="rounded"
                  />
                  <span className="text-sm">{item.label[locale]}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <PhotoUpload
        onPhotosChange={(urls) => setFormData((prev) => ({ ...prev, photoUrls: urls }))}
        initialPhotos={formData.photoUrls}
        maxPhotos={10}
        maxSizeMB={5}
        locale={locale}
      />

      {/* Arrival */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("Arrivée", "Llegada")} *
            {locale === "fr" && (
              <span className="text-xs text-muted-foreground ml-2">
                (Requis légal)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Date d'arrivée *", "Fecha de llegada *")}
            </label>
            <Input
              type="date"
              value={formData.arrivalDate}
              onChange={(e) =>
                updateField("arrivalDate", (e.target as HTMLInputElement).value)
              }
              className={errors["arrivalDate"] ? "border-red-500" : ""}
            />
            {errors["arrivalDate"] && (
              <p className="text-sm text-red-500 mt-1">
                {errors["arrivalDate"]}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Story (Public) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Histoire publique", "Historia pública")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t(
                "Histoire pour les adoptants",
                "Historia para adoptantes"
              )}
            </label>
            <textarea
              value={formData.story}
              onChange={(e) =>
                updateField("story", (e.target as HTMLTextAreaElement).value)
              }
              rows={4}
              className="w-full rounded border px-3 py-2"
              placeholder={t(
                "Racontez l'histoire de cet animal pour aider à trouver une famille...",
                "Cuenta la historia de este animal para ayudar a encontrar una familia..."
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "Ce texte sera visible sur l'annonce d'adoption",
                "Este texto será visible en el anuncio de adopción"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <p key={index} className="text-sm text-yellow-800">
                  ⚠️ {warning}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
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
  );
}
