"use client";

import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import {
  optimisticallySendMessage,
  useUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import type { ToolUIPart } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, Input } from "@anima/ui";

interface OrgChatProps {
  organizationId: Id<"organizations">;
}

const TOOL_LABELS: Record<string, Record<string, string>> = {
  list_animals: { status: "status" },
  get_animal: { animalId: "animalId" },
  create_animal: { name: "name", species: "species", sex: "sex", breed: "breed", sterilized: "sterilized", arrivalDate: "arrivalDate", chipId: "chipId", identificationMethod: "identificationMethod", birthDate: "birthDate", estimatedAge: "estimatedAge", healthNotes: "healthNotes", characterNotes: "characterNotes" },
  update_animal: { animalId: "animalId", name: "name", status: "status", breed: "breed" },
  mark_animal_deceased: { animalId: "animalId" },
  get_timeline: { animalId: "animalId" },
  add_event: { animalId: "animalId", eventType: "eventType", eventDate: "eventDate", notes: "notes" },
  update_event: { eventId: "eventId", eventType: "eventType", eventDate: "eventDate", notes: "notes" },
  remove_event: { eventId: "eventId" },
  create_announcement: { animalId: "animalId" },
  update_announcement: { announcementId: "announcementId", title: "title", description: "description" },
  publish_announcement: { announcementId: "announcementId" },
  close_announcement: { announcementId: "announcementId" },
  archive_announcement: { announcementId: "announcementId" },
  create_cagnotte: { title: "title", goalDescription: "goalDescription", targetAmount: "targetAmount", externalUrl: "externalUrl", deadline: "deadline" },
  update_cagnotte: { cagnotteId: "cagnotteId", title: "title", goalDescription: "goalDescription" },
  update_cagnotte_progress: { cagnotteId: "cagnotteId", currentAmount: "currentAmount" },
  close_cagnotte: { cagnotteId: "cagnotteId" },
  reopen_cagnotte: { cagnotteId: "cagnotteId" },
  archive_cagnotte: { cagnotteId: "cagnotteId" },
  create_news_post: { title: "title", text: "text" },
  update_news_post: { newsPostId: "newsPostId", title: "title", text: "text" },
};

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  list_animals: "Rechercher des animaux",
  get_animal: "Consulter un animal",
  create_animal: "Enregistrer un animal",
  update_animal: "Modifier un animal",
  mark_animal_deceased: "Marquer l'animal comme décédé",
  get_timeline: "Consulter l'historique",
  add_event: "Ajouter un événement",
  update_event: "Modifier un événement",
  remove_event: "Supprimer un événement",
  list_announcements: "Rechercher des annonces",
  create_announcement: "Créer une annonce",
  update_announcement: "Modifier une annonce",
  publish_announcement: "Publier une annonce",
  close_announcement: "Clôturer une annonce",
  archive_announcement: "Archiver une annonce",
  list_cagnottes: "Rechercher des cagnottes",
  create_cagnotte: "Créer une cagnotte",
  update_cagnotte: "Modifier une cagnotte",
  update_cagnotte_progress: "Mettre à jour la progression",
  close_cagnotte: "Clôturer une cagnotte",
  reopen_cagnotte: "Réouvrir une cagnotte",
  archive_cagnotte: "Archiver une cagnotte",
  list_news_posts: "Rechercher des actualités",
  create_news_post: "Publier une actualité",
  update_news_post: "Modifier une actualité",
};

export function OrgChat({ organizationId }: OrgChatProps) {
  const t = useTranslations("orgChat");
  const { isAuthenticated } = useConvexAuth();

  const createThread = useMutation(api.animalChat.createAnimalIntakeThread);
  const [threadId, setThreadId] = useState<string | null>(null);
  const threadRequested = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || threadRequested.current) return;
    threadRequested.current = true;
    void createThread({ organizationId }).then(setThreadId);
  }, [isAuthenticated, createThread, organizationId]);

  if (!threadId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t("loadingThread")}
      </div>
    );
  }

  return <Chat threadId={threadId} organizationId={organizationId} />;
}

function Chat({
  threadId,
  organizationId,
}: {
  threadId: string;
  organizationId: Id<"organizations">;
}) {
  const t = useTranslations("orgChat");
  const locale = useLocale() as "fr" | "es";

  const { results: messages, status, loadMore } = useUIMessages(
    api.animalChat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );

  const sendMessage = useMutation(api.animalChat.sendMessage).withOptimisticUpdate(
    optimisticallySendMessage(api.animalChat.listThreadMessages),
  );
  const submitApproval = useMutation(api.animalChat.submitApproval);
  const triggerContinuation = useMutation(api.animalChat.triggerContinuation);

  const lastApprovalMessageIdRef = useRef<string | null>(null);
  const continuationTriggeredRef = useRef(false);

  const hasPendingApprovals = messages.some((m) =>
    m.parts.some(
      (p: { type: string }) => p.type.startsWith("tool-") && (p as ToolUIPart).state === "approval-requested",
    ),
  );

  useEffect(() => {
    if (
      !hasPendingApprovals &&
      lastApprovalMessageIdRef.current &&
      !continuationTriggeredRef.current
    ) {
      continuationTriggeredRef.current = true;
      void triggerContinuation({
        threadId,
        lastApprovalMessageId: lastApprovalMessageIdRef.current,
        locale,
      });
      lastApprovalMessageIdRef.current = null;
    }
    if (hasPendingApprovals) {
      continuationTriggeredRef.current = false;
    }
  }, [hasPendingApprovals, threadId, triggerContinuation, locale]);

  async function handleApproval(args: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) {
    const { messageId } = await submitApproval({ threadId, ...args });
    lastApprovalMessageIdRef.current = messageId;
  }

  const [prompt, setPrompt] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSendClicked() {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setSendError(null);
    setIsSending(true);
    setPrompt("");
    try {
      await sendMessage({ threadId, prompt: trimmed, locale });
    } catch {
      setPrompt(trimmed);
      setSendError(t("error"));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {t("greeting")}
          </div>
        ) : (
          <>
            {status === "CanLoadMore" && (
              <button
                className="mx-auto block text-sm text-muted-foreground hover:underline"
                onClick={() => loadMore(10)}
              >
                {t("loadMore")}
              </button>
            )}
            {messages.map((m) => (
              <Message
                key={m.key}
                message={m}
                organizationId={organizationId}
                onApproval={handleApproval}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {hasPendingApprovals && (
        <p className="border-t px-4 py-2 text-sm text-muted-foreground">
          {t("waitingForApproval")}
        </p>
      )}

      {sendError && <p className="px-4 text-sm text-red-600">{sendError}</p>}

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSendClicked();
              }
            }}
            placeholder={t("inputPlaceholder")}
            disabled={isSending || hasPendingApprovals}
            className="flex-1"
          />
          <Button
            onClick={() => void onSendClicked()}
            disabled={isSending || hasPendingApprovals || !prompt.trim()}
          >
            {isSending ? t("sending") : t("send")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Message({
  message,
  organizationId,
  onApproval,
}: {
  message: UIMessage;
  organizationId: Id<"organizations">;
  onApproval: (args: { approvalId: string; approved: boolean; reason?: string }) => Promise<void>;
}) {
  const isUser = message.role === "user";
  const toolParts = message.parts.filter((p): p is ToolUIPart => p.type.startsWith("tool-"));

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Card
        className={`max-w-[85%] p-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {toolParts.map((tool) => (
          <ToolProposal
            key={tool.toolCallId}
            tool={tool}
            organizationId={organizationId}
            onApproval={onApproval}
          />
        ))}
        {message.text && <div className="whitespace-pre-wrap text-sm">{message.text}</div>}
        {!message.text && toolParts.length === 0 && "…"}
      </Card>
    </div>
  );
}

function ToolProposal({
  tool,
  organizationId,
  onApproval,
}: {
  tool: ToolUIPart;
  organizationId: Id<"organizations">;
  onApproval: (args: { approvalId: string; approved: boolean; reason?: string }) => Promise<void>;
}) {
  const t = useTranslations("orgChat");
  const router = useRouter();

  const [denyReason, setDenyReason] = useState("");
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);

  const approvalId = getApprovalId(tool);
  const input = "input" in tool && tool.input ? (tool.input as Record<string, unknown>) : null;

  const toolName = tool.toolCallId.split(":")[0];
  const displayName = TOOL_DISPLAY_NAMES[toolName] ?? toolName;
  const labelMap = TOOL_LABELS[toolName] ?? {};

  async function handleApprove() {
    if (!approvalId) return;
    setRespondError(null);
    setIsResponding(true);
    try {
      await onApproval({ approvalId, approved: true });
    } catch {
      setRespondError(t("error"));
    } finally {
      setIsResponding(false);
    }
  }

  async function handleDeny() {
    if (!approvalId) return;
    setRespondError(null);
    setIsResponding(true);
    try {
      await onApproval({ approvalId, approved: false, reason: denyReason || undefined });
      setShowDenyInput(false);
    } catch {
      setRespondError(t("proposal.denialFailed"));
    } finally {
      setIsResponding(false);
    }
  }

  return (
    <div className="mb-2 rounded border bg-background p-3 text-sm">
      <p className="mb-2 font-medium">{displayName}</p>
      {input && (
        <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {Object.entries(input).map(([key, value]) => {
            if (value === undefined || value === null || value === "") return null;
            const label = labelMap[key] ?? key;
            return (
              <div key={key}>
                <span className="text-xs text-muted-foreground">{label}: </span>
                <span>{String(value)}</span>
              </div>
            );
          })}
        </div>
      )}

      {tool.state === "approval-requested" && approvalId && (
        <div className="mt-2">
          {showDenyInput ? (
            <div className="flex items-center gap-2">
              <Input
                value={denyReason}
                onChange={(e) => setDenyReason((e.target as HTMLInputElement).value)}
                placeholder={t("proposal.denyReasonPlaceholder")}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={handleDeny} disabled={isResponding}>
                {t("proposal.deny")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDenyInput(false)}>
                {t("proposal.cancelDeny")}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApprove} disabled={isResponding}>
                {isResponding ? t("proposal.approving") : t("proposal.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDenyInput(true)}
                disabled={isResponding}
              >
                {t("proposal.deny")}
              </Button>
            </div>
          )}
          {respondError && <p className="mt-1 text-xs text-red-600">{respondError}</p>}
        </div>
      )}

      {tool.state === "output-denied" && (
        <p className="mt-1 text-xs text-red-600">{t("proposal.denied")}</p>
      )}

      {tool.state === "output-available" &&
        (isToolOutputError(tool) ? (
          <p className="mt-1 text-xs text-red-600">{t("error")}</p>
        ) : (
          <div className="mt-1 flex items-center gap-2 text-xs text-green-700">
            <span>&#10003; {t("proposal.done")}</span>
          </div>
        ))}

      {tool.state === "output-error" && (
        <p className="mt-1 text-xs text-red-600">{t("error")}</p>
      )}
    </div>
  );
}

function getApprovalId(tool: ToolUIPart): string | undefined {
  if (tool.state !== "approval-requested" || !("approval" in tool)) return undefined;
  return tool.approval?.id;
}

function getToolOutput(tool: ToolUIPart): unknown {
  if (tool.state !== "output-available") return undefined;
  return (tool as { output?: unknown }).output;
}

// A thrown error inside a tool's execute() can surface as a normal
// "output-available" state with the output being just the error's string
// form, rather than as "output-error" — every real tool here returns an
// object (an id, a list, etc.) on success, never a bare string.
function isToolOutputError(tool: ToolUIPart): boolean {
  return typeof getToolOutput(tool) === "string";
}
