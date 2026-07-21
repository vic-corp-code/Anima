// French legal compliance validation for animal registry
// Based on Code rural et de la pêche maritime requirements

/**
 * I-CAD identification number format validation
 * Must be 15 digits: 250 (France) + species code + unique identifier
 */
export function validateICADNumber(chipId: string): {
  valid: boolean;
  error?: string;
} {
  if (!chipId) {
    return { valid: false, error: "Identification number required" };
  }

  // Remove any spaces or hyphens
  const cleaned = chipId.replace(/[\s-]/g, "");

  // Check length (should be 15 digits)
  if (cleaned.length !== 15) {
    return { valid: false, error: "I-CAD number must be 15 digits" };
  }

  // Check if numeric
  if (!/^\d{15}$/.test(cleaned)) {
    return { valid: false, error: "I-CAD number must be numeric" };
  }

  // Check country code (first 3 digits should be 250 for France)
  if (!cleaned.startsWith("250")) {
    return { valid: false, error: "I-CAD number must start with 250 (France)" };
  }

  // Species codes:
  // 26 = dogs and cats (domestic carnivores)
  // 22 = non-domestic species
  const speciesCode = cleaned.substring(3, 5);
  const validSpeciesCodes = ["26", "22"];

  if (!validSpeciesCodes.includes(speciesCode)) {
    return { valid: false, error: "Invalid species code in I-CAD number" };
  }

  return { valid: true };
}

/**
 * Validate arrival date (French legal requirement)
 * Must be a valid date and not in the future
 */
export function validateArrivalDate(arrivalDate: string): {
  valid: boolean;
  error?: string;
} {
  if (!arrivalDate) {
    return { valid: false, error: "Arrival date is required (legal requirement)" };
  }

  const date = new Date(arrivalDate);

  // Check if valid date
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  // Check if not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return { valid: false, error: "Arrival date cannot be in the future" };
  }

  return { valid: true };
}

/**
 * Validate required fields for French legal compliance
 */
export function validateFrenchLegalRequirements(animal: {
  arrivalDate?: string;
  chipId?: string;
  identificationMethod?: string;
}): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Arrival date is mandatory
  if (!animal.arrivalDate) {
    errors.push("Arrival date is required (French legal requirement)");
  } else {
    const arrivalValidation = validateArrivalDate(animal.arrivalDate);
    if (!arrivalValidation.valid) {
      errors.push(arrivalValidation.error || "Invalid arrival date");
    }
  }

  // Identification method (if chipId provided, method must be specified)
  if (animal.chipId && !animal.identificationMethod) {
    errors.push("Identification method must be specified when chip ID is provided");
  }

  // Warning: I-CAD identification is legally required for dogs/cats
  if (!animal.chipId) {
    warnings.push(
      "I-CAD identification number is legally required for dogs and cats in France"
    );
  }

  // Warning: Tattoos applied before July 3, 2011 are still valid
  if (
    animal.identificationMethod === "tattoo" &&
    !animal.chipId
  ) {
    warnings.push(
      "Tattoo identification must be accompanied by identification number"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Confidence score thresholds for AI-suggested legal fields
 */
export const CONFIDENCE_THRESHOLDS = {
  AUTO_ACCEPT: 90, // ≥90%: can auto-accept
  FLAG_CONFIRM: 70, // 70-89%: require explicit confirmation
  MANUAL_ENTRY: 0, // <70%: require manual entry
};

/**
 * Check if confidence score requires user confirmation
 */
export function getConfidenceLevel(score: number): "auto" | "flag" | "manual" {
  if (score >= CONFIDENCE_THRESHOLDS.AUTO_ACCEPT) return "auto";
  if (score >= CONFIDENCE_THRESHOLDS.FLAG_CONFIRM) return "flag";
  return "manual";
}

/**
 * Fields that are legally required (need explicit confirmation)
 */
export const LEGAL_REQUIRED_FIELDS = [
  "chipId",
  "arrivalDate",
  "identificationMethod",
  "sex",
  "species",
];

/**
 * Check if a field is legally required
 */
export function isLegalRequiredField(field: string): boolean {
  return LEGAL_REQUIRED_FIELDS.includes(field);
}
