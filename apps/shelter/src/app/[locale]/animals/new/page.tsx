"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@anima/backend/convex/_generated/api";
import { AnimalChat, AnimalForm, Button } from "@anima/ui";
import type { Animal } from "@anima/domain";

type InputMode = "ai" | "manual";

// AnimalForm doesn't include status (defaults to "in_care" on create)
type AnimalFormData = Omit<Animal, "organizationId" | "status">;

export default function NewAnimalPage() {
  const router = useRouter();
  const extractAnimalData = useAction(api.ai.extractAnimalData);
  const createAnimal = useMutation(api.animals.create);

  const [inputMode, setInputMode] = useState<InputMode>("ai");

  // Get the first available organization for demo purposes
  const organizations = useQuery(api.organizations.list);
  const organizationId = organizations?.[0]?._id;

  const handleComplete = (animals: Animal[]) => {
    // Redirect to animal list or show success
    console.log("Created animals:", animals);
    router.push("/animals");
  };

  const handleManualSubmit = async (data: AnimalFormData) => {
    if (!organizationId) {
      console.error("No organization available");
      return;
    }
    await createAnimal({
      organizationId,
      ...data,
    });
    router.push("/animals");
  };

  // Show loading state while organizations are being fetched
  if (organizations === undefined) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  // Show error if no organizations available
  if (!organizationId) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12 text-red-500">
          Aucune organisation disponible. Veuillez d&apos;abord créer une organisation.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ajouter un animal</h1>
        <p className="text-muted-foreground">
          Choisissez votre mode de saisie : IA pour une entrée rapide, ou formulaire manuel pour plus de précision
        </p>
      </div>

      {/* Mode selector */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={inputMode === "ai" ? "default" : "outline"}
          onClick={() => setInputMode("ai")}
        >
          🤖 Entrée IA
        </Button>
        <Button
          variant={inputMode === "manual" ? "default" : "outline"}
          onClick={() => setInputMode("manual")}
        >
          📝 Formulaire manuel
        </Button>
      </div>

      {/* Content */}
      {inputMode === "ai" ? (
        <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
          <AnimalChat
            extractAnimalData={extractAnimalData}
            createAnimal={createAnimal}
            organizationId={organizationId}
            locale="fr"
            onComplete={handleComplete}
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <AnimalForm
            onSubmit={handleManualSubmit}
            onCancel={() => router.back()}
            submitLabel="Créer l'animal"
            locale="fr"
          />
        </div>
      )}
    </div>
  );
}
