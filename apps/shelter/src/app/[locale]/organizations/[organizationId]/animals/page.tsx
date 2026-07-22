"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@anima/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@anima/ui";
import { Input } from "@anima/ui";
import type { AnimalStatus } from "@anima/domain";

const STATUS_OPTIONS = [
  { value: "in_care", label: "En soins", color: "bg-yellow-100 text-yellow-800" },
  { value: "adoptable", label: "Adoptable", color: "bg-green-100 text-green-800" },
  { value: "adoption_pending", label: "Adoption en cours", color: "bg-blue-100 text-blue-800" },
  { value: "adopted", label: "Adopté", color: "bg-purple-100 text-purple-800" },
  { value: "fostered", label: "En famille d'accueil", color: "bg-orange-100 text-orange-800" },
  { value: "transferred", label: "Transféré", color: "bg-yellow-100 text-yellow-800" },
  { value: "deceased", label: "Décédé", color: "bg-gray-100 text-gray-800" },
] as const;

const SPECIES_OPTIONS = [
  { value: "dog", label: "Chiens" },
  { value: "cat", label: "Chats" },
] as const;

export default function AnimalsListPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const animals = useQuery(
    api.animals.list,
    !isAuthenticated
      ? "skip"
      : statusFilter
      ? { organizationId, status: statusFilter as AnimalStatus }
      : { organizationId }
  );

  const filteredAnimals = animals?.filter((animal) => {
    if (speciesFilter && animal.species !== speciesFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        animal.name.toLowerCase().includes(query) ||
        animal.breed?.toLowerCase().includes(query) ||
        animal.healthNotes?.toLowerCase().includes(query)
      );
    }
    return true;
  }) ?? [];

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Animaux</h1>
        <p className="text-muted-foreground">
          Gérez le registre des animaux de votre organisation
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1">Rechercher</label>
              <Input
                placeholder="Nom, race, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              />
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={statusFilter ?? ""}
                onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value || null)}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">Tous les statuts</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Species filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Espèce</label>
              <select
                value={speciesFilter ?? ""}
                onChange={(e) => setSpeciesFilter((e.target as HTMLSelectElement).value || null)}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">Toutes les espèces</option>
                {SPECIES_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Add animal button */}
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => router.push(`/organizations/${organizationId}/animals/new`)}
              >
                + Ajouter un animal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animals list */}
      {filteredAnimals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {animals?.length === 0
              ? "Aucun animal enregistré. Commencez par en ajouter un !"
              : "Aucun animal ne correspond aux filtres."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnimals.map((animal) => (
            <Card
              key={animal._id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/organizations/${organizationId}/animals/${animal._id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{animal.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {animal.species === "dog" ? "Chien" : "Chat"}
                      {animal.breed && ` • ${animal.breed}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(animal.status)}`}>
                    {getStatusLabel(animal.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sexe:</span>
                    <span>
                      {animal.sex === "male" ? "Mâle" : animal.sex === "female" ? "Femelle" : "Inconnu"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stérilisé:</span>
                    <span>{animal.sterilized ? "Oui" : "Non"}</span>
                  </div>
                  {animal.estimatedAge && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Âge estimé:</span>
                      <span>{animal.estimatedAge}</span>
                    </div>
                  )}
                  {animal.arrivalDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Arrivée:</span>
                      <span>{new Date(animal.arrivalDate).toLocaleDateString("fr-FR")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
