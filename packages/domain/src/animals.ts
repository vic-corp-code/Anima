// Domain types and logic for animal registry

/**
 * Animal species (extensible for future customers)
 */
export type AnimalSpecies = "dog" | "cat";

/**
 * Animal identification methods
 */
export type IdentificationMethod = "chip" | "tattoo" | "none";

/**
 * Animal sex
 */
export type AnimalSex = "male" | "female" | "unknown";

/**
 * Animal status lifecycle
 */
export type AnimalStatus =
  | "in_care"
  | "adoptable"
  | "adoption_pending"
  | "adopted"
  | "fostered"
  | "transferred"
  | "deceased";

/**
 * Animal event types for timeline
 */
export type AnimalEventType =
  | "arrived"
  | "vet_visit"
  | "sterilized"
  | "fostered"
  | "transferred"
  | "adopted"
  | "deceased"
  | "status_change"
  | "other";

/**
 * Valid status transitions
 * Ensures status lifecycle follows business rules
 */
export const validTransitions: Record<AnimalStatus, AnimalStatus[]> = {
  in_care: ["adoptable", "fostered", "deceased", "transferred"],
  adoptable: ["adoption_pending", "fostered", "in_care", "deceased", "transferred"],
  adoption_pending: ["adopted", "adoptable", "in_care"],
  adopted: [], // Terminal state
  fostered: ["in_care", "adoptable", "deceased", "transferred", "adopted"],
  transferred: [], // Terminal state (leaves system)
  deceased: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  from: AnimalStatus,
  to: AnimalStatus
): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Get next valid statuses for a given current status
 */
export function getNextValidStatuses(current: AnimalStatus): AnimalStatus[] {
  return validTransitions[current] ?? [];
}

/**
 * Animal data structure (matches Convex schema)
 */
export interface Animal {
  organizationId: string;
  name: string;
  species: AnimalSpecies;
  breed?: string;
  sex: AnimalSex;
  chipId?: string;
  identificationMethod?: IdentificationMethod;
  birthDate?: string;
  estimatedAge?: string;
  status: AnimalStatus;
  arrivalDate: string;
  sterilized: boolean;
  healthNotes?: string;
  characterNotes?: string;
  compatibilityKids: boolean;
  compatibilityCats: boolean;
  compatibilityDogs: boolean;
  photoUrls: string[];
  story?: string;
}

/**
 * Animal event structure
 */
export interface AnimalEvent {
  animalId: string;
  organizationId: string;
  eventType: AnimalEventType;
  eventDate: string;
  notes?: string;
  relatedId?: string;
}

/**
 * AI extraction result with confidence scoring
 */
export interface AIExtractionResult {
  animals: Animal[];
  confidence: {
    overall: number;
    fields: Record<string, number>;
  };
  clarifications?: string[];
}
