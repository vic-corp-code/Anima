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
import { Bot, Check, Clock3, Send, Sparkles, X } from "lucide-react";
import {
  Badge,
  Button,
  Input,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@anima/ui";

interface OrgChatProps {
  organizationId: Id<"organizations">;
}

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

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="shrink-0 gap-0.5 border-b border-border-soft px-4 py-3 pr-12">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-primary">
            <Bot className="size-4" />
          </span>
          <SheetTitle className="text-sm font-semibold">{t("title")}</SheetTitle>
        </div>
        <SheetDescription className="text-xs">{t("description")}</SheetDescription>
      </SheetHeader>

      {threadId ? (
        <Chat threadId={threadId} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Clock3 className="size-4 animate-pulse" />
            {t("loadingThread")}
          </span>
        </div>
      )}
    </div>
  );
}

function Chat({
  threadId,
}: {
  threadId: string;
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {t("greeting")}
          </div>
        ) : (
          <>
            {status === "CanLoadMore" && (
              <Button
                variant="link"
                size="sm"
                className="mx-auto block h-auto p-0 text-muted-foreground"
                onClick={() => loadMore(10)}
              >
                {t("loadMore")}
              </Button>
            )}
            {messages.map((m) => (
              <Message key={m.key} message={m} onApproval={handleApproval} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {hasPendingApprovals && (
        <div className="flex shrink-0 items-center gap-2 border-t border-border-soft bg-warn/10 px-4 py-2 text-xs font-medium text-warn dark:bg-warn/20">
          <Clock3 className="size-3.5 shrink-0" />
          {t("waitingForApproval")}
        </div>
      )}

      {sendError && (
        <p className="shrink-0 px-4 py-1.5 text-xs text-destructive">{sendError}</p>
      )}

      <div className="shrink-0 border-t border-border-soft p-3">
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
            aria-label={t("inputPlaceholder")}
            disabled={isSending || hasPendingApprovals}
            className="flex-1"
          />
          <Button
            onClick={() => void onSendClicked()}
            disabled={isSending || hasPendingApprovals || !prompt.trim()}
            className="shrink-0"
          >
            {isSending ? (
              t("sending")
            ) : (
              <>
                <Send />
                {t("send")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Message({
  message,
  onApproval,
}: {
  message: UIMessage;
  onApproval: (args: { approvalId: string; approved: boolean; reason?: string }) => Promise<void>;
}) {
  const isUser = message.role === "user";
  const toolParts = message.parts.filter((p): p is ToolUIPart => p.type.startsWith("tool-"));

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs ${
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border-soft bg-muted text-foreground"
        }`}
      >
        {toolParts.map((tool) => (
          <ToolProposal
            key={tool.toolCallId}
            tool={tool}
            onApproval={onApproval}
          />
        ))}
        {message.text && (
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        )}
        {!message.text && toolParts.length === 0 && (
          <p className="text-muted-foreground">…</p>
        )}
      </div>
    </div>
  );
}

function ToolProposal({
  tool,
  onApproval,
}: {
  tool: ToolUIPart;
  onApproval: (args: { approvalId: string; approved: boolean; reason?: string }) => Promise<void>;
}) {
  const t = useTranslations("orgChat");

  const [denyReason, setDenyReason] = useState("");
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);

  const approvalId = getApprovalId(tool);
  const input = "input" in tool && tool.input ? (tool.input as Record<string, unknown>) : null;

  const toolName = tool.toolCallId.split(":")[0];
  const displayName = t(`toolNames.${toolName}`, { defaultMessage: toolName });

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

  const statusBadge = getStatusBadge(tool, t);

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-border-soft bg-card shadow-xs last:mb-0">
      <div className="flex items-center justify-between gap-2 border-b border-border-soft bg-background/60 px-3 py-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{displayName}</span>
        </p>
        {statusBadge}
      </div>

      <div className="p-3">
        {input && (
          <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {Object.entries(input).map(([key, value]) => {
              if (value === undefined || value === null || value === "") return null;
              const label = t(`toolFields.${key}`, { defaultMessage: key });
              return (
                <div key={key} className="min-w-0">
                  <span className="text-xs text-muted-foreground">{label}: </span>
                  <span className="break-words font-medium">{String(value)}</span>
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
                <Button size="sm" variant="destructive" onClick={handleDeny} disabled={isResponding}>
                  {t("proposal.deny")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDenyInput(false)}>
                  {t("proposal.cancelDeny")}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleApprove} disabled={isResponding}>
                  <Check />
                  {isResponding ? t("proposal.approving") : t("proposal.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDenyInput(true)}
                  disabled={isResponding}
                >
                  <X />
                  {t("proposal.deny")}
                </Button>
              </div>
            )}
            {respondError && <p className="mt-1.5 text-xs text-destructive">{respondError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusBadge(
  tool: ToolUIPart,
  t: (key: string) => string,
): React.ReactNode {
  const isError =
    tool.state === "output-error" ||
    (tool.state === "output-available" && isToolOutputError(tool));

  if (tool.state === "approval-requested") {
    return (
      <Badge variant="secondary" className="shrink-0 bg-warn/10 text-warn dark:bg-warn/20">
        <Clock3 className="size-3" />
        {t("proposal.pending")}
      </Badge>
    );
  }
  if (tool.state === "output-denied") {
    return (
      <Badge variant="secondary" className="shrink-0 bg-destructive/10 text-destructive dark:bg-destructive/20">
        <X className="size-3" />
        {t("proposal.denied")}
      </Badge>
    );
  }
  if (isError) {
    return (
      <Badge variant="secondary" className="shrink-0 bg-destructive/10 text-destructive dark:bg-destructive/20">
        {t("error")}
      </Badge>
    );
  }
  if (tool.state === "output-available") {
    return (
      <Badge variant="secondary" className="shrink-0 bg-success/10 text-success dark:bg-success/20">
        <Check className="size-3" />
        {t("proposal.done")}
      </Badge>
    );
  }
  return null;
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
