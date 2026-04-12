import React from "react";
import { Inbox, MessageCircle, Settings, Sparkles } from "lucide-react";

export type AskThreadMessage = {
  id: string;
  role: "fan" | "you";
  body: string;
  timeLabel: string;
};

export type AskThread = {
  id: string;
  title: string;
  preview: string;
  timeLabel: string;
  unread?: boolean;
  requestTypeId?: string;
  requestTypeLabel?: string;
  amountUsdc?: string;
  status?: "pending" | "done";
  messages: AskThreadMessage[];
};

export interface CloneMessagesLayoutProps {
  threads: AskThread[];
  selectedId: string | null;
  onSelectThread: (id: string) => void;
  onOpenSettings: () => void;
  totalUsdc: string;
  messagesCount: number;
  onMarkDone?: (id: string) => void;
  onSendReply?: (id: string, body: string) => void;
  onSendVideoReply?: (id: string, file: File, durationSec: number) => void;
}

const listBtnBase =
  "flex w-full flex-col items-start gap-1 rounded-2xl border border-transparent px-3 py-3 text-left transition-[background-color,border-color] hover:bg-zap-bg-overlay/80";

/** Empty / idle panels — shared icon, title, and body copy (left list vs right pane). */
const askEmptyIconClass = "h-10 w-10 shrink-0 text-zap-ink-faint";
const askEmptyIconStroke = 1.25;
const askEmptyTitleClass =
  "font-body text-sm font-semibold leading-snug tracking-tight text-zap-ink";
const askEmptyDescClass =
  "max-w-[min(100%,20rem)] text-pretty font-body text-xs leading-relaxed text-zap-ink";

const CloneMessagesLayout: React.FC<CloneMessagesLayoutProps> = ({
  threads,
  selectedId,
  onSelectThread,
  onOpenSettings,
  totalUsdc,
  messagesCount,
  onMarkDone,
  onSendReply,
  onSendVideoReply,
}) => {
  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const [replyDraft, setReplyDraft] = React.useState("");
  const [videoUploading, setVideoUploading] = React.useState(false);
  const isVideoRequest = selected?.requestTypeId === "video_reply";

  const getVideoDurationSec = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
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

  return (
    <div className="kofi-dashboard-card overflow-hidden bg-zap-bg-raised shadow-none">
      {/* Header — Ko-fi Messages strip */}
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-[var(--card-border-soft)] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <MessageCircle className="h-5 w-5 shrink-0 text-zap-ink" strokeWidth={1.75} aria-hidden />
          <h2 className="font-body text-lg font-semibold tracking-tight text-zap-ink md:text-xl">
            Messages
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-alt/80 text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay hover:text-zap-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand/30"
          aria-label="AI settings"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="flex min-h-[min(520px,70vh)] flex-col md:flex-row">
        {/* Thread list */}
        <div className="flex w-full shrink-0 flex-col border-zap-bg-alt md:w-[min(300px,100%)] md:border-r">
          <div className="border-b border-zap-bg-alt px-3 py-2.5">
            <p className="px-1 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-zap-ink-faint">
              Inbox
            </p>
          </div>
          <div className="max-h-[280px] min-h-[200px] flex-1 overflow-y-auto overscroll-y-contain p-2 md:max-h-none">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                <Inbox className={askEmptyIconClass} strokeWidth={askEmptyIconStroke} aria-hidden />
                <p className={askEmptyTitleClass}>No conversations yet</p>
                <p className={askEmptyDescClass}>
                  When fans send paid questions, threads appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {threads.map((t) => {
                  const active = t.id === selectedId;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onSelectThread(t.id)}
                        className={`${listBtnBase} ${
                          active
                            ? "border-zap-bg-alt bg-zap-bg-overlay text-zap-ink"
                            : "text-zap-ink"
                        }`}
                      >
                        <span className="flex w-full items-start justify-between gap-2">
                          <span className="min-w-0 truncate font-body text-sm font-semibold text-zap-ink">
                            {t.title}
                          </span>
                          {t.unread ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-zap-brand" aria-hidden />
                          ) : (
                            <span className="shrink-0 font-body text-[11px] text-zap-ink-faint">
                              {t.timeLabel}
                            </span>
                          )}
                        </span>
                        <span className="line-clamp-2 w-full font-body text-xs leading-snug text-zap-ink">
                          {t.preview}
                        </span>
                        <span className="mt-1 inline-flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.08em]">
                          {t.requestTypeLabel ? (
                            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-zap-bg-alt bg-zap-bg px-2 py-0.5 font-body text-[9px] font-medium uppercase leading-tight tracking-[0.06em] text-zap-ink">
                              <Sparkles size={9} className="shrink-0 opacity-70" aria-hidden />
                              <span className="truncate">{t.requestTypeLabel}</span>
                            </span>
                          ) : null}
                          {t.amountUsdc ? (
                            <span className="font-semibold tabular-nums text-zap-ink">
                              {t.amountUsdc} USDC
                            </span>
                          ) : null}
                          <span
                            className={
                              t.status === "done"
                                ? "text-[#00D68F]"
                                : "text-zap-ink-faint"
                            }
                          >
                            {t.status === "done"
                              ? "● Completed"
                              : "○ Awaiting reply"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-auto border-t border-zap-bg-alt bg-zap-bg-alt px-4 py-3 dark:bg-zap-bg/25">
            <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-zap-ink-faint">
              Ask earnings
            </p>
            <p className="mt-1 font-body text-xl font-semibold tabular-nums text-zap-ink">
              {totalUsdc}{" "}
              <span className="text-sm font-medium text-zap-ink">USDC</span>
            </p>
            <p className="mt-0.5 font-body text-xs text-zap-ink">
              {messagesCount} paid message{messagesCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Thread body */}
        <div className="flex min-h-[280px] min-w-0 flex-1 flex-col bg-zap-bg/20 dark:bg-zap-bg/10">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <MessageCircle
                className={askEmptyIconClass}
                strokeWidth={askEmptyIconStroke}
                aria-hidden
              />
              <p className={askEmptyTitleClass}>Select a conversation</p>
              <p className={askEmptyDescClass}>
                Pick a thread on the left to read messages. Use the gear to tune your AI persona and
                pricing.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-zap-bg-alt bg-zap-surface/80 px-4 py-3 dark:bg-zap-bg-raised/50">
                <p className="font-body text-base font-semibold text-zap-ink">{selected.title}</p>
                <p className="mt-0.5 font-body text-xs text-zap-ink">{selected.preview}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {selected.requestTypeLabel ? (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-zap-bg-alt bg-zap-bg px-2 py-0.5 font-body text-[9px] font-medium uppercase leading-tight tracking-[0.06em] text-zap-ink">
                      <Sparkles size={9} className="shrink-0 opacity-70" aria-hidden />
                      <span className="truncate">{selected.requestTypeLabel}</span>
                    </span>
                  ) : null}
                  {selected.amountUsdc ? (
                    <span className="font-body text-xs tabular-nums text-zap-ink">
                      Fee: {selected.amountUsdc} USDC
                    </span>
                  ) : null}
                  <span
                    className={`font-body text-[10px] uppercase tracking-[0.08em] ${
                      selected.status === "done" ? "text-[#00D68F]" : "text-zap-ink-faint"
                    }`}
                  >
                    {selected.status === "done"
                      ? "● Fan notified"
                      : "○ Awaiting reply"}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-4 py-5">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "fan" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[min(100%,420px)] rounded-3xl px-4 py-3 font-body text-sm leading-relaxed shadow-none ${
                        m.role === "fan"
                          ? "rounded-tl-md border border-zap-bg-alt bg-zap-bg-raised text-zap-ink"
                          : "rounded-tr-md bg-zap-ink text-zap-bg"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-2 text-[10px] font-medium uppercase tracking-wide ${
                          m.role === "fan" ? "text-zap-ink-faint" : "text-zap-bg/70"
                        }`}
                      >
                        {m.role === "fan" ? "Fan" : "You / AI"} · {m.timeLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-zap-bg-alt bg-zap-surface/90 px-4 py-3 dark:bg-zap-bg-raised/40">
                {onSendReply ? (
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Reply to fan..."
                      className="h-10 flex-1 rounded-xl border border-zap-bg-alt bg-zap-bg px-3 font-body text-sm text-zap-ink"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = replyDraft.trim();
                        if (!v) return;
                        onSendReply(selected.id, v);
                        setReplyDraft("");
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-zap-bg-alt px-3 font-body text-xs font-semibold uppercase tracking-[0.08em] text-zap-teal"
                    >
                      Send
                    </button>
                  </div>
                ) : null}
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <p className="min-w-0 flex-1 text-pretty text-center font-body text-xs text-zap-ink sm:text-left">
                    Messages sync from paid on-chain asks. Mark done to notify fans and continue payout flow.
                  </p>
                  {isVideoRequest && onSendVideoReply && selected.status !== "done" ? (
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-zap-bg-alt px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-brand hover:bg-zap-bg-alt">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        className="sr-only"
                        disabled={videoUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file || !selected) return;
                          setVideoUploading(true);
                          void getVideoDurationSec(file)
                            .then((durationSec) => {
                              if (durationSec < 30) {
                                throw new Error("Video must be at least 30 seconds.");
                              }
                              onSendVideoReply(selected.id, file, durationSec);
                            })
                            .catch((err) => {
                              window.alert(
                                err instanceof Error ? err.message : "Video upload failed.",
                              );
                            })
                            .finally(() => {
                              setVideoUploading(false);
                            });
                        }}
                      />
                      {videoUploading ? "Uploading..." : "Send 30s+ video & notify"}
                    </label>
                  ) : null}
                  {selected.status !== "done" && onMarkDone ? (
                    <button
                      type="button"
                      onClick={() => onMarkDone(selected.id)}
                      className="inline-flex shrink-0 whitespace-nowrap items-center justify-center rounded-full border border-zap-bg-alt px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-teal hover:bg-zap-bg-alt"
                    >
                      Mark done + notify fan
                    </button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloneMessagesLayout;
