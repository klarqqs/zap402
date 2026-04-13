import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import CloneAISettingsModal, {
  type WhoCanMessage,
} from "@/components/clone/CloneAISettingsModal";
import CloneMessagesLayout from "@/components/clone/CloneMessagesLayout";
import { useToastStore } from "@/state/toastStore";
import type { AskThread } from "@/components/clone/CloneMessagesLayout";
import { useWallet } from "@/hooks/useWallet";
import {
  getCreatorAskRequests,
  replyToAskRequest,
  replyToAskRequestWithVideo,
  uploadAskReplyVideo,
  updateAskRequestStatus,
} from "@/services/ask.service";
import {
  ASK_REQUEST_TYPES,
  formatAskRequestTitle,
} from "@/constants/askRequestTypes";
import type { AskRequest } from "@/types/ask.types";

const EMAIL_CLONE_KEY = "zap402.clone.emailOnMessage";

const REQUEST_TYPE_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  ASK_REQUEST_TYPES.map((t) => [t.id, formatAskRequestTitle(t)]),
);

/**
 * Requests tab shows a small “starter” deliverables set (everything else can come later).
 * Inbox stays focused on chat-style paid questions.
 */
const STARTER_DELIVERABLE_TYPE_IDS = new Set<string>([
  "voice_note_reply",
  "video_reply",
  "thread_rewrite",
  "hook_generator",
  "caption_pack",
  "content_feedback",
]);

function getVideoDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = Number(v.duration);
      URL.revokeObjectURL(url);
      if (!Number.isFinite(d) || d <= 0) {
        reject(new Error("Could not read video duration."));
        return;
      }
      resolve(d);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata."));
    };
    v.src = url;
  });
}

function readEmailPref(): boolean {
  try {
    return localStorage.getItem(EMAIL_CLONE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeEmailPref(v: boolean) {
  try {
    localStorage.setItem(EMAIL_CLONE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export type AskTerminalPanelVariant = "ask" | "inbox";

export interface AskTerminalPanelProps {
  variant?: AskTerminalPanelVariant;
}

/**
 * Ask (and Inbox route) — product is not live yet; we show an honest “coming soon”
 * plus the inbox UI preview so creators know where paid threads will land.
 */
const AskTerminalPanel: React.FC<AskTerminalPanelProps> = ({
  variant = "ask",
}) => {
  const location = useLocation();
  const { publicKey } = useWallet();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestRows, setRequestRows] = useState<AskRequest[]>([]);
  /** One-time: open the first inbox thread when data first loads (does not override explicit close). */
  const didInitialInboxSelect = useRef(false);

  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant reflecting the creator's tone and expertise. Stay on-topic and safe.",
  );
  const [pricePerMessageUsdc, setPricePerMessageUsdc] = useState("0.05");
  const [enabled, setEnabled] = useState(false);
  const [whoCanMessage, setWhoCanMessage] = useState<WhoCanMessage>("anyone_paid");
  const [emailOnMessage, setEmailOnMessage] = useState(readEmailPref);

  const { addToast } = useToastStore();

  const setEmailPref = useCallback((v: boolean) => {
    setEmailOnMessage(v);
    writeEmailPref(v);
  }, []);

  const handleSave = useCallback(() => {
    addToast({
      type: "success",
      message: "AI & message settings saved locally (beta — on-chain config next).",
      duration: 4000,
    });
    setSettingsOpen(false);
  }, [addToast]);

  const isQuestionType = useCallback((typeId: string) => typeId === "answer_question", []);

  const handleMarkDone = useCallback(
    async (threadId: string) => {
      const target = requestRows.find((r) => r.requestId === threadId);
      if (!target) return;
      const updated = await updateAskRequestStatus({
        requestId: threadId,
        status: "done_notified",
      });
      setRequestRows((prev) => prev.map((r) => (r.requestId === threadId ? updated : r)));
      setSelectedId(null);
      addToast({
        type: "success",
        message: "Marked complete — fan notified.",
        duration: 3500,
      });
    },
    [addToast, requestRows],
  );

  const handleSendReply = useCallback(
    async (threadId: string, body: string) => {
      const updated = await replyToAskRequest({ requestId: threadId, body });
      setRequestRows((prev) => prev.map((r) => (r.requestId === threadId ? updated : r)));
      addToast({
        type: "success",
        message: "Reply sent.",
        duration: 2500,
      });
    },
    [addToast],
  );

  const handleSendVideoReply = useCallback(
    async (threadId: string, file: File, durationSec: number) => {
      const uploaded = await uploadAskReplyVideo(file);
      const updated = await replyToAskRequestWithVideo({
        requestId: threadId,
        videoUrl: uploaded.url,
        durationSec,
      });
      setRequestRows((prev) => prev.map((r) => (r.requestId === threadId ? updated : r)));
      setSelectedId(null);
      addToast({
        type: "success",
        message: "Video reply sent (30s+) — marked done and fan notified.",
        duration: 3500,
      });
    },
    [addToast],
  );

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    const load = () =>
      void getCreatorAskRequests(publicKey)
        .then((rows) => {
          if (cancelled) return;
          setRequestRows(rows);
        })
        .catch(() => {
          if (cancelled) return;
          setRequestRows([]);
        });
    load();
    const poll = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [publicKey]);

  const threads = useMemo<AskThread[]>(() => {
    const source = requestRows.filter((r) => isQuestionType(r.type));
    return source.map((r) => ({
      id: r.requestId,
      title: `Fan · ${r.fanAddress.slice(0, 4)}…${r.fanAddress.slice(-4)}`,
      preview: r.messageText || `Request ${r.type}`,
      timeLabel: new Date(r.updatedAt).toLocaleDateString(),
      unread: r.status !== "done_notified" && r.status !== "refunded",
      requestTypeId: r.type,
      requestTypeLabel: REQUEST_TYPE_LABEL_BY_ID[r.type] ?? r.type,
      amountUsdc: r.price.toFixed(2),
      status:
        r.status === "done_notified" || r.status === "refunded"
          ? "done"
          : "pending",
      messages:
        r.messages?.map((m) => ({
          ...m,
          timeLabel: new Date(m.timeLabel).toLocaleString(),
        })) ?? [
          {
            id: `${r.requestId}_fan`,
            role: "fan",
            body: r.messageText || "(No message body recorded)",
            timeLabel: new Date(r.createdAt).toLocaleString(),
          },
        ],
    }));
  }, [isQuestionType, requestRows]);

  const nonQuestionRequests = useMemo(
    () =>
      requestRows.filter(
        (r) => !isQuestionType(r.type) && STARTER_DELIVERABLE_TYPE_IDS.has(r.type),
      ),
    [isQuestionType, requestRows],
  );
  const requestStats = useMemo(() => {
    const total = nonQuestionRequests.length;
    const active = nonQuestionRequests.filter((r) =>
      r.status === "pending_payment" ||
      r.status === "paid_escrowed" ||
      r.status === "in_progress",
    ).length;
    const completed = nonQuestionRequests.filter(
      (r) => r.status === "done_notified" || r.status === "refunded",
    ).length;
    const revenue = nonQuestionRequests
      .filter(
        (r) =>
          r.status === "paid_escrowed" ||
          r.status === "in_progress" ||
          r.status === "done_notified",
      )
      .reduce((sum, r) => sum + (Number.isFinite(r.price) ? r.price : 0), 0);
    return { total, active, completed, revenue };
  }, [nonQuestionRequests]);

  useEffect(() => {
    if (location.hash !== "#inbox-preview") return;
    const id = window.setTimeout(() => {
      document.getElementById("inbox-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(id);
  }, [location.hash, location.pathname]);

  const isInboxRoute = variant === "inbox";
  /** Valid selection only — do not force-open the first thread (so “mark done” can close the pane). */
  const selectedIdResolved =
    selectedId && threads.some((t) => t.id === selectedId) ? selectedId : null;

  useEffect(() => {
    if (!isInboxRoute || didInitialInboxSelect.current || threads.length === 0) return;
if (selectedId === null) {
  Promise.resolve().then(() => {
    setSelectedId(threads[0]!.id);
    didInitialInboxSelect.current = true;
  });
}
  }, [isInboxRoute, threads, selectedId]);
  const totalUsdc = threads
    .reduce((sum, t) => sum + Number.parseFloat(t.amountUsdc || "0"), 0)
    .toFixed(2);
  const messagesCount = threads.length;

  return (
    <div className="space-y-6">
      <DashboardTabPageHeader
        kicker={isInboxRoute ? "INBOX" : "REQUESTS"}
        title={isInboxRoute ? "INBOX" : "REQUESTS"}
        description={
          isInboxRoute
            ? "Handle paid question threads from fans. Reply in chat, then mark done + notify."
            : "Track paid non-chat requests from fans and mark them complete when fulfilled."
        }
      />

      {!isInboxRoute ? (
        <div className="rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg-alt/25 p-4 dark:border-white/[0.06] dark:bg-zap-bg/30">
          <p className="font-body text-[13px] leading-relaxed text-zap-ink-muted">
            Fans can pay for deliverable requests (starter set: {STARTER_DELIVERABLE_TYPE_IDS.size}{" "}
            types). Fulfill the work, send a reply, then mark done + notify. More request types can
            come later.
          </p>
        </div>
      ) : null}

      {!isInboxRoute ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: "TOTAL REQUESTS", value: String(requestStats.total) },
            { label: "ACTIVE", value: String(requestStats.active) },
            { label: "COMPLETED", value: String(requestStats.completed) },
            {
              label: "EARNED",
              value: `$${requestStats.revenue.toFixed(2)} USDC`,
              highlight: requestStats.revenue > 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="kofi-dashboard-card px-4 py-3.5 shadow-none"
            >
              <p className="mb-1 font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-muted">
                {stat.label}
              </p>
              <p
                className={`font-body text-[22px] leading-none ${
                  stat.highlight ? "text-zap-teal" : "text-zap-ink"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {!isInboxRoute ? (
        <div className="overflow-x-auto rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg-raised/90 shadow-none dark:border-white/[0.06] dark:bg-zap-bg-alt/30">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--card-border-soft)] bg-zap-bg-alt/60 dark:border-white/[0.06]">
                {["Request", "Type", "Price", "From", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-body text-[10px] font-medium uppercase tracking-[0.12em] text-zap-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nonQuestionRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-body text-sm text-zap-ink-muted">
                    No paid requests yet.
                  </td>
                </tr>
              ) : (
                nonQuestionRequests.map((r) => (
                  <tr
                    key={r.requestId}
                    className="border-b border-[var(--card-border-soft)] last:border-b-0 dark:border-white/[0.05]"
                  >
                    <td className="px-4 py-3.5 align-middle font-body text-sm text-zap-ink">
                      {r.messageText || "Request"}
                    </td>
                    <td className="px-4 py-3.5 align-middle font-body text-[11px] uppercase tracking-[0.08em] text-zap-ink-muted">
                      {REQUEST_TYPE_LABEL_BY_ID[r.type] ?? r.type}
                    </td>
                    <td className="px-4 py-3.5 align-middle font-body text-sm tabular-nums text-zap-ink">
                      {r.price.toFixed(2)} USDC
                    </td>
                    <td className="px-4 py-3.5 align-middle font-body text-xs text-zap-ink-muted">
                      {r.fanAddress.slice(0, 6)}...{r.fanAddress.slice(-6)}
                    </td>
                    <td className="px-4 py-3.5 align-middle font-body text-[11px] uppercase tracking-[0.08em] text-zap-ink-muted">
                      {r.status}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      {r.status !== "done_notified" ? (
                        r.type === "video_reply" ? (
                          <label className="inline-flex cursor-pointer items-center rounded-full border border-zap-bg-alt px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.08em] text-zap-brand hover:bg-zap-bg-alt">
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/webm"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                void getVideoDurationSec(file)
                                  .then((durationSec) => {
                                    if (durationSec < 30) {
                                      throw new Error("Video must be at least 30 seconds.");
                                    }
                                    return handleSendVideoReply(r.requestId, file, durationSec);
                                  })
                                  .catch((err) => {
                                    window.alert(
                                      err instanceof Error
                                        ? err.message
                                        : "Unable to send video reply.",
                                    );
                                  });
                              }}
                            />
                            Send 30s+ video & notify
                          </label>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleMarkDone(r.requestId)}
                            className="border-0 bg-transparent p-0 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-teal"
                          >
                            Mark done + notify
                          </button>
                        )
                      ) : (
                        <span className="font-body text-[11px] uppercase tracking-[0.08em] text-[#00D68F]">
                          Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {isInboxRoute ? (
        <div id="inbox-preview" className="scroll-mt-24">
        <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-zap-ink-faint">
          {isInboxRoute ? "Request queue" : "Inbox preview"}
        </p>
          <CloneMessagesLayout
            threads={threads}
            selectedId={selectedIdResolved}
            onSelectThread={setSelectedId}
            onOpenSettings={() => setSettingsOpen(true)}
            totalUsdc={totalUsdc}
            messagesCount={messagesCount}
            onMarkDone={handleMarkDone}
            onSendReply={(id, body) => void handleSendReply(id, body)}
            onSendVideoReply={(id, file, durationSec) =>
              void handleSendVideoReply(id, file, durationSec)
            }
          />
        </div>
      ) : null}

      <CloneAISettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSave}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        pricePerMessageUsdc={pricePerMessageUsdc}
        onPriceChange={setPricePerMessageUsdc}
        enabled={enabled}
        onEnabledChange={setEnabled}
        whoCanMessage={whoCanMessage}
        onWhoCanMessageChange={setWhoCanMessage}
        emailOnMessage={emailOnMessage}
        onEmailOnMessageChange={setEmailPref}
      />
    </div>
  );
};

export default AskTerminalPanel;
