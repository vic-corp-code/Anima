"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";

// Types for the chat interface
interface Message {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  data?: any; // For AI responses with extracted data
}

interface ExtractAnimalDataFn {
  (args: { userInput: string; locale: "fr" | "es" }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    fallback?: any;
  }>;
}

interface CreateAnimalFn {
  (args: any): Promise<string>;
}

interface AnimalChatProps {
  extractAnimalData: ExtractAnimalDataFn;
  createAnimal: CreateAnimalFn;
  organizationId: string;
  locale?: "fr" | "es";
  onComplete?: (animals: any[]) => void;
}

export function AnimalChat({ extractAnimalData, createAnimal, organizationId, locale = "fr", onComplete }: AnimalChatProps) {

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "system",
      content:
        locale === "fr"
          ? "Bonjour! Décrivez les animaux qui viennent d'arriver (ex: '3 chats viennent d'arriver, 1 mâle et 2 femelles...')"
          : "¡Hola! Describe los animales que acaban de llegar (ej: '3 gatos acaban de llegar, 1 macho y 2 hembras...')",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Call the real AI extraction action
      const result = await extractAnimalData({
        userInput,
        locale,
      });

      if (!result.success) {
        // Handle AI failure
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: locale === "fr"
            ? "Erreur lors du traitement IA. Veuillez réessayer ou utiliser le formulaire manuel."
            : "Error al procesar con IA. Por favor, inténtelo de nuevo o use el formulario manual.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // AI extraction successful
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: locale === "fr"
          ? `J'ai extrait ${result.data.animals.length} animal(s):`
          : `He extraído ${result.data.animals.length} animal(es):`,
        timestamp: new Date(),
        data: result.data,
      };

      setMessages((prev) => [...prev, aiResponse]);
      setPreviewData(result.data);
      setIsLoading(false);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: locale === "fr"
          ? "Erreur lors du traitement. Veuillez réessayer ou utiliser le formulaire manuel."
          : "Error al procesar. Por favor, inténtelo de nuevo o use el formulario manual.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    setIsCreating(true);

    try {
      // Create each animal using the Convex mutation
      const createdAnimals = await Promise.all(
        previewData.animals.map(async (animal: any) => {
          try {
            const animalId = await createAnimal({
              organizationId,
              name: animal.name,
              species: animal.species,
              breed: animal.breed,
              sex: animal.sex,
              chipId: animal.chipId,
              identificationMethod: animal.identificationMethod,
              birthDate: animal.birthDate,
              estimatedAge: animal.estimatedAge,
              arrivalDate: animal.arrivalDate,
              sterilized: animal.sterilized,
              healthNotes: animal.healthNotes,
              characterNotes: animal.characterNotes,
              compatibilityKids: false, // Default values
              compatibilityCats: false,
              compatibilityDogs: false,
            });

            return { success: true, id: animalId, animal };
          } catch (error) {
            // Log error silently - in production this would go to error tracking
            return { success: false, animal, error };
          }
        })
      );

      // Check if all creations succeeded
      const failures = createdAnimals.filter((result) => !result.success);

      if (failures.length > 0) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: locale === "fr"
            ? `Erreur lors de la création de ${failures.length} animal(s). Certains ont été créés avec succès.`
            : `Error al crear ${failures.length} animal(es). Algunos fueron creados con éxito.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: locale === "fr"
            ? `✅ ${createdAnimals.length} animal(s) créé(s) avec succès!`
            : `✅ ${createdAnimals.length} animal(es) creado(s) con éxito!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      }

      // Call onComplete callback with created animals
      if (onComplete) {
        onComplete(createdAnimals.filter((r) => r.success));
      }

      setPreviewData(null);
      setInput(""); // Clear input for next entry
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: locale === "fr"
          ? "Erreur lors de la création des animaux. Veuillez réessayer."
          : "Error al crear los animales. Por favor, inténtelo de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsCreating(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-[80%] p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.role === "system"
                  ? "bg-muted"
                  : "bg-card"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              {message.data && (
                <div className="mt-4 space-y-2">
                  {message.data.animals?.map((animal: any, idx: number) => (
                    <div key={idx} className="border rounded p-2 bg-background">
                      <div className="font-medium">
                        {animal.name} ({animal.species === "dog" ? "Chien" : "Chat"})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {animal.sex === "male" ? "Mâle" : "Femelle"} • {animal.sterilized ? "Stérilisé" : "Non stérilisé"}
                      </div>
                      <div className="text-xs">
                        Âge estimé: {animal.estimatedAge}
                      </div>
                      {animal.colors && (
                        <div className="text-xs">
                          Couleurs: {animal.colors.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Confidence indicators */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium mb-1">Confiance:</div>
                    <div className={`text-lg font-bold ${getConfidenceColor(message.data.confidence.overall)}`}>
                      {message.data.confidence.overall}%
                    </div>

                    {message.data.clarifications && (
                      <div className="mt-2 text-xs text-yellow-600">
                        {message.data.clarifications.map((note: string, i: number) => (
                          <div key={i}>⚠️ {note}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-muted p-3">
              <div className="text-sm">Analyse en cours...</div>
            </Card>
          </div>
        )}
      </div>

      {/* Preview Actions */}
      {previewData && (
        <div className="border-t p-4 bg-muted">
          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={isCreating} className="flex-1">
              {isCreating
                ? (locale === "fr" ? "Création..." : "Creando...")
                : (locale === "fr" ? "Confirmer et créer" : "Confirmar y crear")
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewData(null)}
              disabled={isCreating}
              className="flex-1"
            >
              {locale === "fr" ? "Modifier" : "Modificar"}
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput((e.target as HTMLInputElement).value)}
            onKeyPress={(e) => (e.key === "Enter" && !e.shiftKey && handleSendMessage())}
            placeholder={locale === "fr" ? "Décrivez les animaux..." : "Describe los animales..."}
            disabled={isLoading || isCreating}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || isCreating || !input.trim()}>
            {locale === "fr" ? "Envoyer" : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
