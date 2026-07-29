import { Agent, createTool, stepCountIs, type ToolCtx } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod/v3";
import { components, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Extra context every tool call needs beyond what ToolCtx provides — see
// the `CustomCtx` pattern in @convex-dev/agent's createTool.d.ts. Threaded
// through from wherever generateText/streamText is called (see chat.ts).
export type AnimalIntakeCtx = ToolCtx & { organizationId: Id<"organizations"> };

function openrouterModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  const openrouter = createOpenRouter({ apiKey });
  return openrouter.chat(process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite");
}

const createAnimalInputSchema = z.object({
  name: z.string().describe("Nom de l'animal, ou 'Inconnu' si non précisé"),
  species: z.enum(["dog", "cat"]),
  breed: z.string().optional().describe("Race si précisée"),
  sex: z.enum(["male", "female", "unknown"]),
  chipId: z
    .string()
    .optional()
    .describe("Numéro d'identification I-CAD (15 chiffres) si mentionné"),
  identificationMethod: z.enum(["chip", "tattoo", "none"]).optional(),
  birthDate: z
    .string()
    .optional()
    .describe("Date de naissance au format ISO YYYY-MM-DD si connue"),
  estimatedAge: z
    .string()
    .optional()
    .describe("Âge estimé si la date de naissance est inconnue, ex: '1 an', '6 mois'"),
  sterilized: z.boolean().describe("Stérilisé/e — false si non précisé"),
  healthNotes: z.string().optional().describe("Notes de santé"),
  characterNotes: z.string().optional().describe("Notes de comportement/caractère"),
  arrivalDate: z.string().describe("Date d'arrivée au format ISO YYYY-MM-DD"),
});

// Always requires explicit human approval before it runs (see the frontend's
// approve/deny UI) — this is the safety gate that replaces the old
// preview-then-confirm-button flow, but built on the framework's native
// tool-approval mechanism instead of a bespoke one.
const createAnimalTool = createTool<
  z.infer<typeof createAnimalInputSchema>,
  { animalId: string; name: string },
  AnimalIntakeCtx
>({
  description:
    "Enregistre un nouvel animal dans le registre de l'organisation. À n'appeler qu'une fois que les informations essentielles (espèce, sexe, date d'arrivée) sont connues.",
  inputSchema: createAnimalInputSchema,
  needsApproval: () => true,
  execute: async (ctx, input): Promise<{ animalId: string; name: string }> => {
    const animalId: Id<"animals"> = await ctx.runMutation(internal.animals.createInternal, {
      organizationId: ctx.organizationId,
      ...input,
      compatibilityKids: false,
      compatibilityCats: false,
      compatibilityDogs: false,
    });
    return { animalId, name: input.name };
  },
});

// Built lazily: OPENROUTER_API_KEY only exists in the deployment, not at
// module-import time.
let agentInstance: Agent<{ organizationId: Id<"organizations"> }> | undefined;
export function animalIntakeAgent(): Agent<{ organizationId: Id<"organizations"> }> {
  agentInstance ??= new Agent<{ organizationId: Id<"organizations"> }>(components.agent, {
    name: "Assistant d'accueil",
    languageModel: openrouterModel(),
    tools: { create_animal: createAnimalTool },
    stopWhen: stepCountIs(5),
  });
  return agentInstance;
}

export function animalIntakeSystemPrompt(locale: "fr" | "es", today: string) {
  const lang = locale === "fr" ? "French" : "Spanish";
  const legal =
    locale === "fr"
      ? "Rappel légal France : le numéro d'identification (I-CAD), la date d'arrivée et la méthode d'identification sont légalement requis. Signale-le si l'information manque, mais n'empêche pas la création pour autant — l'équipe la complètera."
      : "Recordatorio legal España: la identificación y la fecha de llegada son obligatorias. Indícalo si falta la información, pero no impidas la creación por ello — el equipo la completará después.";

  return `Tu es l'assistant d'accueil d'un refuge animalier, tu aides à enregistrer rapidement les nouveaux arrivants pendant que l'équipe est sur le terrain. Réponds en ${lang}, de façon brève et directe (SMS, pas un article).

Nous sommes le ${today}. Utilise cette date pour "arrivalDate" si l'utilisateur ne précise pas de date d'arrivée.

- Si l'utilisateur décrit un ou plusieurs animaux, appelle "create_animal" une fois par animal dès que tu as au minimum l'espèce, le sexe et une date d'arrivée (utilise aujourd'hui par défaut) — ne pose pas dix questions avant d'agir, la validation humaine se fait après ton appel d'outil.
- Si une information cruciale manque (espèce notamment), demande-la avant d'appeler l'outil.
- Après un appel d'outil, résume en une phrase ce qui a été proposé et laisse la personne valider ou refuser dans l'interface — ne dis jamais que c'est déjà enregistré tant que ce n'est pas confirmé.
- ${legal}`;
}
