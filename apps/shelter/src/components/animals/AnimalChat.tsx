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

interface AnimalChatProps {
  organizationId: Id<"organizations">;
}

// The animal fields the create_animal tool proposes — kept in display order.
const PROPOSAL_FIELDS = [
  "name",
  "species",
  "sex",
  "breed",
  "sterilized",
  "arrivalDate",
  "chipId",
  "identificationMethod",
  "birthDate",
  "estimatedAge",
  "healthNotes",
  "characterNotes",
] as const;

export function AnimalChat({ organizationId }: AnimalChatProps) {
  const t = useTranslations("animalChat");
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
  const t = useTranslations("animalChat");
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
      (p) => p.type.startsWith("tool-") && (p as ToolUIPart).state === "approval-requested",
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
  const t = useTranslations("animalChat");
  const tField = useTranslations("animalChat.field");
  const tAnimals = useTranslations("animals");
  const router = useRouter();

  const [denyReason, setDenyReason] = useState("");
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);

  const approvalId = getApprovalId(tool);
  const input = "input" in tool && tool.input ? (tool.input as Record<string, unknown>) : null;

  const fieldValue = (key: (typeof PROPOSAL_FIELDS)[number]): string | null => {
    if (!input) return null;
    const raw = input[key];
    if (raw === undefined || raw === null || raw === "") return null;
    if (key === "species") return tAnimals(`species.${raw as "dog" | "cat"}`);
    if (key === "sex") return tAnimals(`sex.${raw as "male" | "female" | "unknown"}`);
    if (key === "identificationMethod") {
      return tAnimals(`identificationMethod.${raw as "chip" | "tattoo" | "none"}`);
    }
    if (key === "sterilized") return raw ? tAnimals("yes") : tAnimals("no");
    return String(raw);
  };

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
      {input && (
        <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {PROPOSAL_FIELDS.map((key) => {
            const value = fieldValue(key);
            if (value === null) return null;
            return (
              <div key={key}>
                <span className="text-xs text-muted-foreground">{tField(key)}: </span>
                <span>{value}</span>
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
        (() => {
          const animalId = getCreatedAnimalId(tool);
          // A thrown error inside execute() can surface here as a successful
          // tool result whose output is just the error's string form, rather
          // than as `output-error` — so success is judged by whether the
          // output actually has the shape we expect, not by state alone.
          if (!animalId) {
            return <p className="mt-1 text-xs text-red-600">{t("error")}</p>;
          }
          return (
            <div className="mt-1 flex items-center gap-2 text-xs text-green-700">
              <span>✓ {t("proposal.created")}</span>
              <button
                className="underline"
                onClick={() =>
                  router.push(`/organizations/${organizationId}/animals/${animalId}`)
                }
              >
                {t("proposal.viewAnimal")}
              </button>
            </div>
          );
        })()}

      {tool.state === "output-error" && (
        <p className="mt-1 text-xs text-red-600">
          {"errorText" in tool ? tool.errorText : t("error")}
        </p>
      )}
    </div>
  );
}

function getApprovalId(tool: ToolUIPart): string | undefined {
  if (tool.state !== "approval-requested" || !("approval" in tool)) return undefined;
  return tool.approval?.id;
}

function getCreatedAnimalId(tool: ToolUIPart): string | undefined {
  if (tool.state !== "output-available") return undefined;
  const output = tool.output as unknown;
  if (!output || typeof output !== "object" || !("animalId" in output)) return undefined;
  const animalId = (output as { animalId: unknown }).animalId;
  return typeof animalId === "string" ? animalId : undefined;
}
