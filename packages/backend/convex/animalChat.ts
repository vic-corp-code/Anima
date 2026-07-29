import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  createThread,
  listUIMessages,
  saveMessage,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import {
  ActionCtx,
  internalAction,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { assertOrgAccess } from "./access";
import { animalIntakeAgent, animalIntakeSystemPrompt } from "./agents/animalIntake";

// Looks up which organization a thread belongs to (stored in our own table —
// the agent component's thread schema has no room for app-specific fields)
// and checks the caller is a member of it. Works from a query or mutation ctx.
async function authorizeThreadAccess(
  ctx: Parameters<typeof assertOrgAccess>[0],
  threadId: string,
) {
  const mapping = await ctx.db
    .query("animalIntakeThreads")
    .withIndex("by_thread", (q) => q.eq("threadId", threadId))
    .unique();
  if (!mapping) throw new Error("Conversation not found");
  await assertOrgAccess(ctx, mapping.organizationId);
  return mapping;
}

export const createAnimalIntakeThread = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const membership = await assertOrgAccess(ctx, organizationId);
    const threadId = await createThread(ctx, components.agent, {
      userId: membership.userId,
    });
    await ctx.db.insert("animalIntakeThreads", {
      threadId,
      organizationId,
      createdBy: membership.userId,
    });
    return threadId;
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    locale: v.union(v.literal("fr"), v.literal("es")),
  },
  handler: async (ctx, { threadId, prompt, locale }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.animalChat.generateResponse, {
      threadId,
      promptMessageId: messageId,
      locale,
    });
    return { messageId };
  },
});

async function runGeneration(
  ctx: ActionCtx,
  args: {
    threadId: string;
    promptMessageId: string;
    locale: "fr" | "es";
  },
) {
  const mapping = await ctx.runQuery(internal.animalChat.getThreadOrg, {
    threadId: args.threadId,
  });
  const today = new Date().toISOString().split("T")[0] as string;

  const result = await animalIntakeAgent().streamText(
    { ...ctx, organizationId: mapping.organizationId },
    { threadId: args.threadId },
    {
      promptMessageId: args.promptMessageId,
      system: animalIntakeSystemPrompt(args.locale, today),
    },
    { saveStreamDeltas: { chunking: "word", throttleMs: 100 } },
  );
  await result.consumeStream();
}

export const generateResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    locale: v.union(v.literal("fr"), v.literal("es")),
  },
  handler: async (ctx, args) => {
    await runGeneration(ctx, args);
  },
});

export const continueAfterApprovals = internalAction({
  args: {
    threadId: v.string(),
    lastApprovalMessageId: v.string(),
    locale: v.union(v.literal("fr"), v.literal("es")),
  },
  handler: async (ctx, args) => {
    await runGeneration(ctx, {
      threadId: args.threadId,
      promptMessageId: args.lastApprovalMessageId,
      locale: args.locale,
    });
  },
});

// Internal — only called by generateResponse/continueAfterApprovals above,
// which already run inside a scheduled/authorized flow.
export const getThreadOrg = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const mapping = await ctx.db
      .query("animalIntakeThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .unique();
    if (!mapping) throw new Error("Conversation not found");
    return { organizationId: mapping.organizationId };
  },
});

export const submitApproval = mutation({
  args: {
    threadId: v.string(),
    approvalId: v.string(),
    approved: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, approvalId, approved, reason }): Promise<{ messageId: string }> => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = approved
      ? await animalIntakeAgent().approveToolCall(ctx, { threadId, approvalId, reason })
      : await animalIntakeAgent().denyToolCall(ctx, { threadId, approvalId, reason });
    return { messageId };
  },
});

export const triggerContinuation = mutation({
  args: {
    threadId: v.string(),
    lastApprovalMessageId: v.string(),
    locale: v.union(v.literal("fr"), v.literal("es")),
  },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, args.threadId);
    await ctx.scheduler.runAfter(0, internal.animalChat.continueAfterApprovals, args);
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, args.threadId);
    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });
    const paginated = await listUIMessages(ctx, components.agent, args);
    return { ...paginated, streams };
  },
});
