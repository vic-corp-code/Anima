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

// --- Animals ---

const createAnimalInputSchema = z.object({
  name: z.string().describe("Nom de l'animal, ou 'Inconnu' si non précisé"),
  species: z.enum(["dog", "cat"]),
  breed: z.string().optional().describe("Race si précisée"),
  sex: z.enum(["male", "female", "unknown"]),
  chipId: z.string().optional().describe("Numéro I-CAD (15 chiffres) si mentionné"),
  identificationMethod: z.enum(["chip", "tattoo", "none"]).optional(),
  birthDate: z.string().optional().describe("Date de naissance ISO YYYY-MM-DD si connue"),
  estimatedAge: z.string().optional().describe("Âge estimé, ex: '1 an', '6 mois'"),
  sterilized: z.boolean().describe("Stérilisé/e — false si non précisé"),
  healthNotes: z.string().optional().describe("Notes de santé"),
  characterNotes: z.string().optional().describe("Notes de comportement/caractère"),
  arrivalDate: z.string().describe("Date d'arrivée ISO YYYY-MM-DD"),
});

const updateAnimalInputSchema = z.object({
  animalId: z.string().describe("ID de l'animal à modifier"),
  name: z.string().optional(),
  breed: z.string().optional(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  chipId: z.string().optional(),
  identificationMethod: z.enum(["chip", "tattoo", "none"]).optional(),
  birthDate: z.string().optional(),
  estimatedAge: z.string().optional(),
  status: z.enum(["in_care", "adoptable", "adoption_pending", "adopted", "fostered", "transferred", "deceased"]).optional(),
  sterilized: z.boolean().optional(),
  healthNotes: z.string().optional(),
  characterNotes: z.string().optional(),
  compatibilityKids: z.boolean().optional(),
  compatibilityCats: z.boolean().optional(),
  compatibilityDogs: z.boolean().optional(),
  story: z.string().optional(),
});

const eventTypeSchema = z.enum([
  "arrived", "vet_visit", "sterilized", "fostered",
  "transferred", "adopted", "deceased", "status_change", "other",
]);

// --- Announcements ---

const updateAnnouncementInputSchema = z.object({
  announcementId: z.string().describe("ID de l'annonce"),
  title: z.string().optional().describe("Nouveau titre"),
  description: z.string().optional().describe("Nouvelle description"),
});

// --- Cagnottes ---

const updateCagnotteInputSchema = z.object({
  cagnotteId: z.string().describe("ID de la cagnotte"),
  title: z.string().optional(),
  goalDescription: z.string().optional(),
  targetAmount: z.number().optional(),
  externalUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  deadline: z.string().optional(),
});

// --- News Posts ---

const updateNewsPostInputSchema = z.object({
  newsPostId: z.string().describe("ID de l'article"),
  title: z.string().optional(),
  text: z.string().optional(),
  linkedAnimalIds: z.array(z.string()).optional(),
  linkedCagnotteId: z.string().optional(),
});

// --- Tool definitions ---

const createAnimalTool = createTool<
  z.infer<typeof createAnimalInputSchema>,
  { animalId: string; name: string },
  AnimalIntakeCtx
>({
  description: "Enregistre un nouvel animal dans le registre de l'organisation. À n'appeler qu'une fois que les informations essentielles (espèce, sexe, date d'arrivée) sont connues.",
  inputSchema: createAnimalInputSchema,
  needsApproval: () => true,
  execute: async (ctx, input) => {
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

const listAnimalsTool = createTool<
  { status?: "in_care" | "adoptable" | "adoption_pending" | "adopted" | "fostered" | "transferred" | "deceased" },
  unknown[],
  AnimalIntakeCtx
>({
  description: "Liste les animaux de l'organisation, avec filtre optionnel par statut.",
  inputSchema: z.object({ status: z.enum(["in_care", "adoptable", "adoption_pending", "adopted", "fostered", "transferred", "deceased"]).optional() }),
  execute: async (ctx, args) => {
    return await ctx.runQuery(internal.animals.listInternal, {
      organizationId: ctx.organizationId,
      status: args.status,
    });
  },
});

const getAnimalTool = createTool<
  { animalId: string },
  unknown,
  AnimalIntakeCtx
>({
  description: "Récupère les détails d'un animal par son ID.",
  inputSchema: z.object({ animalId: z.string() }),
  execute: async (ctx, args) => {
    return await ctx.runQuery(internal.animals.getInternal, {
      animalId: args.animalId as Id<"animals">,
    });
  },
});

const updateAnimalTool = createTool<
  z.infer<typeof updateAnimalInputSchema>,
  { animalId: string },
  AnimalIntakeCtx
>({
  description: "Modifie les informations d'un animal existant.",
  inputSchema: updateAnimalInputSchema,
  needsApproval: () => true,
  execute: async (ctx, args) => {
    const animalId = await ctx.runMutation(internal.animals.updateInternal, {
      ...args,
      animalId: args.animalId as Id<"animals">,
    });
    return { animalId };
  },
});

const archiveAnimalTool = createTool<
  { animalId: string },
  { animalId: string },
  AnimalIntakeCtx
>({
  description: "Archive un animal (passe le statut à 'deceased'). Action irréversible.",
  inputSchema: z.object({ animalId: z.string() }),
  needsApproval: () => true,
  execute: async (ctx, args) => {
    const animalId = await ctx.runMutation(internal.animals.archiveInternal, {
      animalId: args.animalId as Id<"animals">,
    });
    return { animalId };
  },
});

const getTimelineTool = createTool<
  { animalId: string },
  unknown[],
  AnimalIntakeCtx
>({
  description: "Récupère l'historique (timeline) d'événements d'un animal.",
  inputSchema: z.object({ animalId: z.string() }),
  execute: async (ctx, args) => {
    return await ctx.runQuery(internal.animals.getTimelineInternal, {
      animalId: args.animalId as Id<"animals">,
    });
  },
});

const addEventTool = createTool<
  { animalId: string; eventType: z.infer<typeof eventTypeSchema>; eventDate: string; notes?: string },
  { eventId: string },
  AnimalIntakeCtx
>({
  description: "Ajoute un événement manuel à la timeline d'un animal (visite vétérinaire, stérilisation, etc.).",
  inputSchema: z.object({
    animalId: z.string(),
    eventType: eventTypeSchema,
    eventDate: z.string().describe("Date ISO YYYY-MM-DD"),
    notes: z.string().optional(),
  }),
  execute: async (ctx, args) => {
    const eventId = await ctx.runMutation(internal.animals.addEventInternal, {
      animalId: args.animalId as Id<"animals">,
      eventType: args.eventType,
      eventDate: args.eventDate,
      notes: args.notes,
    });
    return { eventId };
  },
});

const updateEventTool = createTool<
  { eventId: string; eventType?: z.infer<typeof eventTypeSchema>; eventDate?: string; notes?: string },
  { eventId: string },
  AnimalIntakeCtx
>({
  description: "Modifie un événement de la timeline d'un animal.",
  inputSchema: z.object({
    eventId: z.string(),
    eventType: eventTypeSchema.optional(),
    eventDate: z.string().optional(),
    notes: z.string().optional(),
  }),
  execute: async (ctx, args) => {
    const eventId = await ctx.runMutation(internal.animals.updateEventInternal, {
      eventId: args.eventId as Id<"animalEvents">,
      eventType: args.eventType,
      eventDate: args.eventDate,
      notes: args.notes,
    });
    return { eventId };
  },
});

const removeEventTool = createTool<
  { eventId: string },
  { eventId: string },
  AnimalIntakeCtx
>({
  description: "Supprime un événement manuel de la timeline. Impossible pour les événements auto-générés.",
  inputSchema: z.object({ eventId: z.string() }),
  needsApproval: () => true,
  execute: async (ctx, args) => {
    const eventId = await ctx.runMutation(internal.animals.removeEventInternal, {
      eventId: args.eventId as Id<"animalEvents">,
    });
    return { eventId };
  },
});

// --- Announcements ---

const listAnnouncementsTool = createTool<Record<string, never>, unknown[], AnimalIntakeCtx>({
  description: "Liste les annonces de l'organisation.",
  inputSchema: z.object({}),
  execute: async (ctx) => {
    return await ctx.runQuery(internal.announcements.listInternal, {
      organizationId: ctx.organizationId,
    });
  },
});

const createAnnouncementTool = createTool<
  { animalId: string },
  { announcementId: string },
  AnimalIntakeCtx
>({
  description: "Crée une annonce d'adoption (brouillon) pour un animal.",
  inputSchema: z.object({ animalId: z.string() }),
  execute: async (ctx, args) => {
    const announcementId = await ctx.runMutation(internal.announcements.createInternal, {
      animalId: args.animalId as Id<"animals">,
    });
    return { announcementId };
  },
});

const updateAnnouncementTool = createTool<
  z.infer<typeof updateAnnouncementInputSchema>,
  { announcementId: string },
  AnimalIntakeCtx
>({
  description: "Modifie le titre ou la description d'une annonce (brouillon ou publiée).",
  inputSchema: updateAnnouncementInputSchema,
  execute: async (ctx, args) => {
    await ctx.runMutation(internal.announcements.updateInternal, {
      announcementId: args.announcementId as Id<"announcements">,
      title: args.title,
      description: args.description,
    });
    return { announcementId: args.announcementId };
  },
});

const publishAnnouncementTool = createTool<
  { announcementId: string },
  { announcementId: string },
  AnimalIntakeCtx
>({
  description: "Publie une annonce (doit être en brouillon).",
  inputSchema: z.object({ announcementId: z.string() }),
  needsApproval: () => true,
  execute: async (ctx, args) => {
    const announcementId = await ctx.runMutation(internal.announcements.publishInternal, {
      announcementId: args.announcementId as Id<"announcements">,
    });
    return { announcementId };
  },
});

const closeAnnouncementTool = createTool<
  { announcementId: string },
  { announcementId: string },
  AnimalIntakeCtx
>({
  description: "Clôt une annonce publiée.",
  inputSchema: z.object({ announcementId: z.string() }),
  execute: async (ctx, args) => {
    const announcementId = await ctx.runMutation(internal.announcements.closeInternal, {
      announcementId: args.announcementId as Id<"announcements">,
    });
    return { announcementId };
  },
});

const archiveAnnouncementTool = createTool<
  { announcementId: string },
  { announcementId: string },
  AnimalIntakeCtx
>({
  description: "Archive une annonce (la masque sans la supprimer).",
  inputSchema: z.object({ announcementId: z.string() }),
  execute: async (ctx, args) => {
    const announcementId = await ctx.runMutation(internal.announcements.archiveInternal, {
      announcementId: args.announcementId as Id<"announcements">,
    });
    return { announcementId };
  },
});

// --- Cagnottes ---

const listCagnottesTool = createTool<Record<string, never>, unknown[], AnimalIntakeCtx>({
  description: "Liste les cagnottes de l'organisation.",
  inputSchema: z.object({}),
  execute: async (ctx) => {
    return await ctx.runQuery(internal.cagnottes.listInternal, {
      organizationId: ctx.organizationId,
    });
  },
});

const createCagnotteTool = createTool<
  { title: string; goalDescription: string; targetAmount?: number; externalUrl: string; photoUrl?: string; deadline?: string },
  { cagnotteId: string },
  AnimalIntakeCtx
>({
  description: "Crée une cagnotte (collecte de fonds).",
  inputSchema: z.object({
    title: z.string(),
    goalDescription: z.string(),
    targetAmount: z.number().optional(),
    externalUrl: z.string().describe("URL externe vers la page de don"),
    photoUrl: z.string().optional(),
    deadline: z.string().optional(),
  }),
  needsApproval: () => true,
  execute: async (ctx, args) => {
    const cagnotteId = await ctx.runMutation(internal.cagnottes.createInternal, {
      organizationId: ctx.organizationId,
      ...args,
    });
    return { cagnotteId };
  },
});

const updateCagnotteTool = createTool<
  z.infer<typeof updateCagnotteInputSchema>,
  { cagnotteId: string },
  AnimalIntakeCtx
>({
  description: "Modifie les détails d'une cagnotte.",
  inputSchema: updateCagnotteInputSchema,
  execute: async (ctx, args) => {
    await ctx.runMutation(internal.cagnottes.updateInternal, {
      ...args,
      cagnotteId: args.cagnotteId as Id<"cagnottes">,
    });
    return { cagnotteId: args.cagnotteId };
  },
});

const updateCagnotteProgressTool = createTool<
  { cagnotteId: string; currentAmount: number },
  { cagnotteId: string },
  AnimalIntakeCtx
>({
  description: "Met à jour le montant actuel d'une cagnotte.",
  inputSchema: z.object({
    cagnotteId: z.string(),
    currentAmount: z.number().describe("Montant actuel collecté"),
  }),
  execute: async (ctx, args) => {
    await ctx.runMutation(internal.cagnottes.updateProgressInternal, {
      cagnotteId: args.cagnotteId as Id<"cagnottes">,
      currentAmount: args.currentAmount,
    });
    return { cagnotteId: args.cagnotteId };
  },
});

const closeCagnotteTool = createTool<
  { cagnotteId: string },
  { cagnotteId: string },
  AnimalIntakeCtx
>({
  description: "Clôt une cagnotte active.",
  inputSchema: z.object({ cagnotteId: z.string() }),
  execute: async (ctx, args) => {
    await ctx.runMutation(internal.cagnottes.closeInternal, {
      cagnotteId: args.cagnotteId as Id<"cagnottes">,
    });
    return { cagnotteId: args.cagnotteId };
  },
});

const reopenCagnotteTool = createTool<
  { cagnotteId: string },
  { cagnotteId: string },
  AnimalIntakeCtx
>({
  description: "Réouvre une cagnotte clôturée.",
  inputSchema: z.object({ cagnotteId: z.string() }),
  execute: async (ctx, args) => {
    await ctx.runMutation(internal.cagnottes.reopenInternal, {
      cagnotteId: args.cagnotteId as Id<"cagnottes">,
    });
    return { cagnotteId: args.cagnotteId };
  },
});

const archiveCagnotteTool = createTool<
  { cagnotteId: string },
  { cagnotteId: string },
  AnimalIntakeCtx
>({
  description: "Archive une cagnotte.",
  inputSchema: z.object({ cagnotteId: z.string() }),
  execute: async (ctx, args) => {
    await ctx.runMutation(internal.cagnottes.archiveInternal, {
      cagnotteId: args.cagnotteId as Id<"cagnottes">,
    });
    return { cagnotteId: args.cagnotteId };
  },
});

// --- News Posts ---

const listNewsPostsTool = createTool<Record<string, never>, unknown[], AnimalIntakeCtx>({
  description: "Liste les articles de l'organisation.",
  inputSchema: z.object({}),
  execute: async (ctx) => {
    return await ctx.runQuery(internal.newsPosts.listInternal, {
      organizationId: ctx.organizationId,
    });
  },
});

const createNewsPostTool = createTool<
  { title: string; text: string; linkedAnimalIds?: string[]; linkedCagnotteId?: string },
  { newsPostId: string },
  AnimalIntakeCtx
>({
  description: "Crée un article d'actualité.",
  inputSchema: z.object({
    title: z.string(),
    text: z.string(),
    linkedAnimalIds: z.array(z.string()).optional(),
    linkedCagnotteId: z.string().optional(),
  }),
  needsApproval: () => true,
  execute: async (ctx, args) => {
    const newsPostId = await ctx.runMutation(internal.newsPosts.createInternal, {
      organizationId: ctx.organizationId,
      ...args,
      linkedAnimalIds: args.linkedAnimalIds?.map((id) => id as Id<"animals">),
      linkedCagnotteId: args.linkedCagnotteId as Id<"cagnottes"> | undefined,
    });
    return { newsPostId };
  },
});

const updateNewsPostTool = createTool<
  z.infer<typeof updateNewsPostInputSchema>,
  { newsPostId: string },
  AnimalIntakeCtx
>({
  description: "Modifie un article d'actualité.",
  inputSchema: updateNewsPostInputSchema,
  execute: async (ctx, args) => {
    await ctx.runMutation(internal.newsPosts.updateInternal, {
      ...args,
      newsPostId: args.newsPostId as Id<"newsPosts">,
      linkedAnimalIds: args.linkedAnimalIds?.map((id) => id as Id<"animals">),
      linkedCagnotteId: args.linkedCagnotteId as Id<"cagnottes"> | undefined,
    });
    return { newsPostId: args.newsPostId };
  },
});

// --- Agent ---

// Built lazily: OPENROUTER_API_KEY only exists in the deployment, not at
// module-import time.
let agentInstance: Agent<{ organizationId: Id<"organizations"> }> | undefined;
export function animalIntakeAgent(): Agent<{ organizationId: Id<"organizations"> }> {
  agentInstance ??= new Agent<{ organizationId: Id<"organizations"> }>(components.agent, {
    name: "Assistant d'accueil",
    languageModel: openrouterModel(),
    tools: {
      // Animals
      create_animal: createAnimalTool,
      list_animals: listAnimalsTool,
      get_animal: getAnimalTool,
      update_animal: updateAnimalTool,
      archive_animal: archiveAnimalTool,
      // Events
      get_timeline: getTimelineTool,
      add_event: addEventTool,
      update_event: updateEventTool,
      remove_event: removeEventTool,
      // Announcements
      list_announcements: listAnnouncementsTool,
      create_announcement: createAnnouncementTool,
      update_announcement: updateAnnouncementTool,
      publish_announcement: publishAnnouncementTool,
      close_announcement: closeAnnouncementTool,
      archive_announcement: archiveAnnouncementTool,
      // Cagnottes
      list_cagnottes: listCagnottesTool,
      create_cagnotte: createCagnotteTool,
      update_cagnotte: updateCagnotteTool,
      update_cagnotte_progress: updateCagnotteProgressTool,
      close_cagnotte: closeCagnotteTool,
      reopen_cagnotte: reopenCagnotteTool,
      archive_cagnotte: archiveCagnotteTool,
      // News Posts
      list_news_posts: listNewsPostsTool,
      create_news_post: createNewsPostTool,
      update_news_post: updateNewsPostTool,
    },
    stopWhen: stepCountIs(10),
  });
  return agentInstance;
}

export function animalIntakeSystemPrompt(locale: "fr" | "es", today: string) {
  const lang = locale === "fr" ? "French" : "Spanish";
  const legal =
    locale === "fr"
      ? "Rappel légal France : le numéro d'identification (I-CAD), la date d'arrivée et la méthode d'identification sont légalement requis. Signale-le si l'information manque, mais n'empêche pas la création pour autant — l'équipe la complètera."
      : "Recordatorio legal España: la identificación y la fecha de llegada son obligatorias. Indícalo si falta la información, pero no impidas la creación por ello — el equipo la completará después.";

  return `Tu es l'assistant d'un refuge animalier. Tu aides l'équipe à gérer les animaux, les événements, les annonces d'adoption, les cagnottes et les articles d'actualité. Réponds en ${lang}, de façon brève et directe.

Nous sommes le ${today}. Utilise cette date comme défaut si l'utilisateur ne précise pas de date.

Animaux :
- Si l'utilisateur décrit un ou plusieurs animaux, appelle "create_animal" une fois par animal dès que tu as au minimum l'espèce, le sexe et une date d'arrivée — ne pose pas dix questions avant d'agir, la validation humaine se fait après ton appel d'outil.
- Utilise "list_animals" pour chercher des animaux existants, "get_animal" pour les détails, "update_animal" pour les modifier.
- "archive_animal" archive un animal (statut décédé) — action irréversible nécessitant validation.

Événements (timeline) :
- "get_timeline" pour voir l'historique, "add_event" pour ajouter (visite vétérinaire, stérilisation, etc.), "update_event" pour modifier, "remove_event" pour supprimer un événement manuel.

Annonces d'adoption :
- "create_announcement" crée un brouillon pour un animal, "update_announcement" pour éditer, "publish_announcement" pour publier (nécessite validation), "close_announcement" pour clôturer, "archive_announcement" pour archiver.

Cagnottes (collectes de fonds) :
- "create_cagnotte" pour créer (nécessite validation), "update_cagnotte" pour modifier, "update_cagnotte_progress" pour mettre à jour le montant, "close_cagnotte"/"reopen_cagnotte" pour le cycle de vie, "archive_cagnotte" pour archiver.

Articles d'actualité :
- "create_news_post" pour créer (nécessite validation), "update_news_post" pour modifier.

Après un appel d'outil nécessitant validation, résume en une phrase ce qui a été proposé et laisse la personne valider ou refuser — ne dis jamais que c'est déjà enregistré tant que ce n'est pas confirmé.
- ${legal}`;
}
