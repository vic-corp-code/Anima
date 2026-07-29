"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useUploadPhoto } from "@/lib/useUploadPhoto";
import { AnimalForm } from "@anima/ui";
import type { Animal } from "@anima/domain";

// AnimalForm doesn't manage status — that's changed via the detail page's
// status buttons, not the edit form.
type AnimalFormData = Omit<Animal, "organizationId" | "status">;

export default function EditAnimalPage() {
  const t = useTranslations("animals");
  const locale = useLocale() as "fr" | "es";
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const animalId = params.animalId as Id<"animals">;
  const { isAuthenticated } = useConvexAuth();

  const animal = useQuery(api.animals.get, isAuthenticated ? { animalId } : "skip");
  const updateAnimal = useMutation(api.animals.update);
  const uploadFile = useUploadPhoto();

  const handleSubmit = async (data: AnimalFormData) => {
    await updateAnimal({ animalId, ...data });
    router.push(`/organizations/${organizationId}/animals/${animalId}`);
  };

  if (!animal) {
    return <div className="container mx-auto p-4">{t("edit.loading")}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("edit.title", { name: animal.name })}</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <AnimalForm
          initialData={animal}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/organizations/${organizationId}/animals/${animalId}`)}
          submitLabel={t("edit.submitLabel")}
          locale={locale}
          uploadFile={uploadFile}
        />
      </div>
    </div>
  );
}
