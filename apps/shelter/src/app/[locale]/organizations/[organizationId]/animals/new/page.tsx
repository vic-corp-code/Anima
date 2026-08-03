"use client";

import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUploadPhoto } from "@/lib/useUploadPhoto";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { AnimalForm } from "@anima/ui";
import type { Animal } from "@anima/domain";

// AnimalForm doesn't include status (defaults to "in_care" on create)
type AnimalFormData = Omit<Animal, "organizationId" | "status">;

export default function NewAnimalPage() {
  const t = useTranslations("animals");
  const locale = useLocale() as "fr" | "es";
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const createAnimal = useMutation(api.animals.create);
  const uploadFile = useUploadPhoto();

  const handleManualSubmit = async (data: AnimalFormData) => {
    await createAnimal({
      organizationId,
      ...data,
    });
    router.push(`/organizations/${organizationId}/animals`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("new.title")}</h1>
        <p className="text-muted-foreground">{t("new.subtitle")}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <AnimalForm
          onSubmit={handleManualSubmit}
          onCancel={() => router.back()}
          submitLabel={t("new.submitLabel")}
          locale={locale}
          uploadFile={uploadFile}
        />
      </div>
    </div>
  );
}
