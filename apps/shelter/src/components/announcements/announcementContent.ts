// Content derivation shared by the announcement form and its multi-channel
// previews. Every preview reads the SAME form state and derives its text from
// it here — nothing is hardcoded per platform.
import type { Doc } from "@anima/backend/convex/_generated/dataModel";

export interface AnnouncementFormValues {
  animalId: string;
  title: string;
  story: string;
  personality: string;
  idealHome: string;
  photoUrls: string[];
}

export function speciesEmoji(animal: Pick<Doc<"animals">, "species">): string {
  return animal.species === "dog" ? "🐶" : "🐱";
}

// Facts line for the compact card format (F3 in shelter-app.md):
// species (breed) · age · sex · sterilized · chip.
export function factsLine(
  animal: Pick<
    Doc<"animals">,
    "species" | "breed" | "sex" | "sterilized" | "chipId" | "birthDate" | "estimatedAge"
  >,
  labels: {
    species: string;
    sex: string;
    sterilized: string;
    chip: string;
    age: string;
  }
): string {
  const parts = [
    `${labels.species}${animal.breed ? ` ${animal.breed}` : ""}`,
    labels.age,
    labels.sex,
    ...(animal.sterilized ? [labels.sterilized] : []),
    ...(animal.chipId ? [labels.chip] : []),
  ];
  return parts.join(" · ");
}

export function formatAge(
  animal: Pick<Doc<"animals">, "birthDate" | "estimatedAge">,
  labels: {
    unknown: string;
    years: (count: number) => string;
    months: (count: number) => string;
  }
): string {
  if (animal.estimatedAge) return animal.estimatedAge;
  const birthDate = animal.birthDate;
  if (!birthDate || birthDate === "unknown") return labels.unknown;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return labels.unknown;
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  if (years >= 1) return labels.years(years);
  return labels.months(Math.max(months, 1));
}

// The stored announcement description is composed from the three text
// fields so the announcement detail page and the compact card stay readable
// outside the composer. The ✨/🏡 line markers are language-independent and
// let `splitDescription` recover the fields on the edit route.
export function composeDescription(
  values: Pick<AnnouncementFormValues, "story" | "personality" | "idealHome">,
  labels: { personality: string; idealHome: string }
): string {
  const parts = [values.story.trim()];
  if (values.personality.trim()) {
    parts.push(`✨ ${labels.personality} : ${values.personality.trim()}`);
  }
  if (values.idealHome.trim()) {
    parts.push(`🏡 ${labels.idealHome} : ${values.idealHome.trim()}`);
  }
  return parts.join("\n\n");
}

const MARKER = /^([✨🏡])\s*[^:]*:\s*(.*)$/u;

export function splitDescription(description: string): {
  story: string;
  personality: string;
  idealHome: string;
} {
  // The composer appends at most one 🏡 block, then at most one ✨ block,
  // at the very end of the description — so the parser accepts exactly
  // that shape from the trailing region and treats everything before it
  // as story. Marker-looking lines anywhere inside the story (pet stories
  // use emoji bullets all the time, AI drafts too) are never touched,
  // keeping the round trip lossless. Only ambiguity left: a story whose
  // own last line matches the marker format with no real block behind it
  // is re-emitted as a block on the next save (text preserved, boundary
  // shifted).
  const lines = description.trimEnd().split("\n");
  let personality = "";
  let idealHome = "";
  let i = lines.length - 1;
  while (i >= 0 && !lines[i].trim()) i--;
  if (i >= 0) {
    const match = MARKER.exec(lines[i].trim());
    if (match && match[1] === "🏡") {
      idealHome = match[2];
      i--;
    }
  }
  while (i >= 0 && !lines[i].trim()) i--;
  if (i >= 0) {
    const match = MARKER.exec(lines[i].trim());
    if (match && match[1] === "✨") {
      personality = match[2];
      i--;
    }
  }
  return {
    story: lines.slice(0, i + 1).join("\n").trim(),
    personality,
    idealHome,
  };
}
