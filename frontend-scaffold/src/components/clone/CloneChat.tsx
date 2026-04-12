import React, { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import Textarea from "@/components/primitives/Textarea";
import Button from "@/components/primitives/Button";
import TransactionStatus from "@/components/feedback/TransactionStatus";
import AskConfirm from "@/components/clone/AskConfirm";
import { useZapPayment } from "@/hooks/useZapPayment";
import {
  createAskRequest,
  confirmAskRequestPayment,
  updateAskRequestStatus,
  getFanAskRequests,
} from "@/services/ask.service";
import { requestCloneReply } from "@/services/cloneChatApi";
import { buildAskTipMessage, parseAskTipHex } from "@/utils/askOnChain";
import { useWallet } from "@/hooks/useWallet";
import {
  ASK_DEFAULT_REQUEST_TYPE_ID,
  ASK_REQUEST_TYPES,
  formatAskRequestTitle,
} from "@/constants/askRequestTypes";
import type { AskRequest } from "@/types/ask.types";
import { useInteractionHistoryStore } from "@/state/interactionHistoryStore";

/**
 * Starter set (keeps UX focused):
 * - 1 chat-friendly type (Inbox): answer_question
 * - 6 deliverables (Requests queue): voice/video/thread/hooks/captions/feedback
 */
const FEATURED_REQUEST_IDS = new Set([
  "answer_question",
  "rewrite_text",
  "summarize_content",
  "generate_thread",
  "analyze_idea",
]);

export interface CloneChatProps {
  creatorName: string;
  creatorAddress: string;
  pricePerMessageUsdc?: string;
  /** When false, show coming-soon state */
  demoMode?: boolean;
  /** Compact embed for Zap page where outer section already has heading/copy. */
  compact?: boolean;
  capabilitySnippets?: string[];
}

const CloneChat: React.FC<CloneChatProps> = ({
  creatorName,
  creatorAddress,
  pricePerMessageUsdc = "0.01",
  demoMode = true,
  compact = false,
  capabilitySnippets = [],
}) => {
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState<Array<{ id: string; role: "user" | "assistant"; text: string }>>([]);
  const [reply, setReply] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState(ASK_DEFAULT_REQUEST_TYPE_ID);
  const [selectedQuickId, setSelectedQuickId] = useState<string>("req-answer_question");
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fanRequests, setFanRequests] = useState<AskRequest[]>([]);
  const { payToAsk, connected, connect, resetLayer23, layer23 } = useZapPayment();
  const { publicKey } = useWallet();
  const activeJourneyId = useInteractionHistoryStore((s) => s.activeJourneyId);
  const startJourney = useInteractionHistoryStore((s) => s.startJourney);
  const addEvent = useInteractionHistoryStore((s) => s.addEvent);
  const setActiveJourneyId = useInteractionHistoryStore((s) => s.setActiveJourneyId);
  const [busy, setBusy] = useState(false);
  const selectedType =
    ASK_REQUEST_TYPES.find((t) => t.id === selectedTypeId) ?? ASK_REQUEST_TYPES[0];
  const selectedPriceUsdc = selectedType?.defaultPriceUsdc ?? pricePerMessageUsdc;
  const featuredRequests = ASK_REQUEST_TYPES.filter((t) =>
    FEATURED_REQUEST_IDS.has(t.id),
  );
  const visibleRequests = showAllRequests ? ASK_REQUEST_TYPES : featuredRequests;
  const emojiQuickSet = ["🔥", "🙏", "💡", "🚀", "❤️", "👏", "😂", "🎯"];
  const requestTxStatus =
    layer23.status === "signing"
      ? "signing"
      : layer23.status === "confirming"
        ? "submitting"
        : layer23.status === "verifying"
          ? "confirming"
          : layer23.status === "success"
            ? "success"
            : layer23.status === "error"
              ? "error"
              : "idle";
  const estimateChargeUsdc = (text: string): string => {
    const base = Number.parseFloat(selectedPriceUsdc) || 0.50;
    const len = text.trim().length;
    const extra = Math.min(0.10, Math.floor(len / 220) * 0.02);
    return (base + extra).toFixed(2);
  };
  const effectivePriceUsdc = useMemo(() => estimateChargeUsdc(message), [message, selectedPriceUsdc]);
  const unifiedQuickStarts = useMemo(
    () => [
      ...visibleRequests.map((type) => ({
        id: `req-${type.id}`,
        label: type.label,
        priceUsdc: type.defaultPriceUsdc,
        requestTypeId: type.id,
      })),
      ...capabilitySnippets.map((snippet, idx) => ({
        id: `cap-${idx}`,
        label: snippet,
        priceUsdc: 1.2,
        requestTypeId: selectedTypeId,
      })),
    ].slice(0, 7),
    [visibleRequests, capabilitySnippets, selectedTypeId],
  );

  const getOrCreateJourneyId = (): string => {
    if (activeJourneyId) return activeJourneyId;
    const journeyId = startJourney({
      type: "single-model",
      source: "discover",
      title: `${creatorName} journey`,
      modelHandles: [creatorName],
    });
    setActiveJourneyId(journeyId);
    return journeyId;
  };

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    const load = () =>
      void getFanAskRequests(publicKey)
        .then((rows) => {
          if (cancelled) return;
          setFanRequests(rows);
        })
        .catch(() => {
          if (cancelled) return;
          setFanRequests([]);
        });
    load();
    const poll = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [publicKey]);

  const creatorRequests = useMemo(
    () =>
      fanRequests
        .filter((r) => r.creatorAddress === creatorAddress)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 3),
    [fanRequests, creatorAddress],
  );

  const runAsk = async () => {
    if (!connected) {
      await connect();
      return;
    }
    if (!message.trim()) return;
    setBusy(true);
    setReply(null);
    setApiError(null);
    resetLayer23();
    try {
      if (!publicKey) {
        throw new Error("Wallet address not available.");
      }
      const onChainMsg = await buildAskTipMessage(message.trim());
      const msgHash = parseAskTipHex(onChainMsg);
      if (!msgHash) {
        throw new Error("Unable to build ask hash.");
      }

      const row = await createAskRequest({
        type: selectedTypeId,
        price: Number.parseFloat(effectivePriceUsdc),
        fanAddress: publicKey,
        creatorAddress,
        messageHash: msgHash,
        messageText: message.trim(),
      });

      const txHash = await payToAsk(creatorAddress, message, effectivePriceUsdc);
      if (!txHash) return;

      await confirmAskRequestPayment({ requestId: row.requestId, txHash });
      setLastRequestId(row.requestId);
      const prompt = message.trim();
      setMessage("");

      // Get real AI response after payment is confirmed
      let aiReply: string;
      try {
        const aiResp = await requestCloneReply({ message: prompt, creatorName });
        aiReply = aiResp.reply;
        await updateAskRequestStatus({ requestId: row.requestId, status: "done_notified" });
      } catch {
        aiReply =
          selectedTypeId === "answer_question"
            ? "Payment confirmed. The agent is processing your question."
            : "Payment confirmed. The agent will process this request shortly.";
      }

      setReply(aiReply);
      const userMsg = { id: `u-${Date.now()}`, role: "user" as const, text: prompt };
      const agentMsg = { id: `a-${Date.now()}`, role: "assistant" as const, text: aiReply };
      setThread((prev) => [...prev, userMsg, agentMsg]);
      const journeyId = getOrCreateJourneyId();
      addEvent(journeyId, {
        role: "user",
        model: creatorName,
        contentType: "request",
        text: prompt,
      });
      addEvent(journeyId, {
        role: "assistant",
        model: creatorName,
        contentType: "chat",
        text: aiReply,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setApiError(msg);
    } finally {
      setBusy(false);
    }
  };

  const openConfirm = async () => {
    if (!message.trim()) return;
    if (!connected) {
      await connect();
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div
      className={
        compact
          ? "space-y-5"
          : "card-editorial space-y-5 rounded-3xl p-6 md:p-8"
      }
    >
      {!compact ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles size={20} className="text-zap-brand" aria-hidden />
            <h2 className="font-body text-xl font-semibold tracking-tight text-zap-ink md:text-2xl">
              Ask {creatorName}
            </h2>
            <span className="rounded-full border border-zap-bg-alt bg-zap-bg-alt px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-zap-ink
              {demoMode ? "Demo" : "Live"}
            </span>
          </div>

          <p className="font-body text-sm leading-relaxed text-zap-ink
            Pick a request type, pay a small fee, and send it directly to {creatorName}. Each request
            triggers payment before inference.
          </p>
        </>
      ) : null}

      <div className="border-t border-[var(--card-border-soft)] pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-zap-ink-faint">
            Active model: {creatorName} · {Number(selectedPriceUsdc).toFixed(2)} USDC / chat
          </p>
          <Button
            type="button"
            variant="editorialGhost"
            size="sm"
            onClick={() => {
              setMessage("");
              setReply(null);
              setApiError(null);
              setLastRequestId(null);
              setThread([]);
            }}
            className="!w-auto !min-w-[7.25rem] flex-none"
          >
            New chat
          </Button>
        </div>
      </div>

      <div className="space-y-2 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink
            Quick start (hot)
          </p>
          {/* <button
            type="button"
            onClick={() => setShowAllRequests((v) => !v)}
            className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-teal"
          >
            {showAllRequests ? "Show featured" : `Show all ${ASK_REQUEST_TYPES.length}`}
          </button> */}
        </div>
        <div className="flex flex-wrap gap-2">
          {unifiedQuickStarts.map((item) => {
            const active = item.id === selectedQuickId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedQuickId(item.id);
                  setSelectedTypeId(item.requestTypeId);
                  // setMessage(item.label);
                }}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-2 text-left font-body text-[11px] font-semibold leading-snug tracking-[0.02em] transition-colors ${
                  active
                    ? "border-zap-accent bg-zap-accent/12 text-zap-ink shadow-[0_0_0_1px_rgba(234,88,12,0.15)] dark:shadow-[0_0_0_1px_rgba(255,94,91,0.2)]"
                    : "border-zap-bg-alt bg-zap-bg-alt text-zap-ink:border-zap-bg-alt-bright hover:bg-zap-bg-overlay"
                }`}
              >
                <span className="min-w-0">
                  {item.label} · {Number(item.priceUsdc).toFixed(2)} USDC
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {thread.length > 0 ? (
        <div className="max-h-[38vh] space-y-2 overflow-y-auto rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg-alt/30 p-3">
          {thread.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.role === "user"
                  ? "ml-auto w-fit max-w-[90%] rounded-2xl border border-zap-bg-alt bg-transparent px-3 py-2"
                  : "mr-auto w-fit max-w-[92%] rounded-2xl border border-[var(--card-border-soft)] bg-zap-surface px-3 py-2"
              }
            >
              <p className="mb-1 font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-faint">
                {msg.role === "user" ? "You" : creatorName}
              </p>
              <p className="text-sm leading-relaxed text-zap-ink">{msg.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg-alt/30 p-3">
          <p className="text-sm text-zap-ink
            Say hi to start. Continue in the same single-agent conversation thread.
          </p>
        </div>
      )}

      <Textarea
        label=""
        variant="editorial"
        placeholder={`Message ${creatorName}... (e.g. "hi")`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        maxLength={160}
        className="resize-none"
      />
      <p className="font-body text-xs text-zap-ink
        Estimated charge: {effectivePriceUsdc} USDC (cheap model-like pricing, adjusted by prompt length).
      </p>
      {/* <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-[10px] uppercase tracking-[0.08em] text-zap-ink-faint">
          Quick emoji
        </span>
        {emojiQuickSet.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setMessage((prev) => `${prev}${emoji}`)}
            className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-alt px-2 text-sm transition-colors hover:bg-zap-bg-overlay"
            aria-label={`Add ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div> */}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
        <Button
          type="button"
          variant="editorial"
          size="sm"
          disabled={busy}
          loading={busy}
          onClick={() => void openConfirm()}
          className="!h-10 !min-h-10 !max-h-10 !w-full shrink-0 sm:!w-auto sm:min-w-[11rem]"
        >
          Send
        </Button>
      </div>

      {apiError && (
        <div
          className="rounded-2xl border border-zap-bg-alt bg-zap-bg-alt px-4 py-3 font-body text-sm text-zap-ink"
          role="alert"
        >
          {apiError}
        </div>
      )}

      {requestTxStatus !== "idle" ? (
        <TransactionStatus
          variant="editorial"
          status={requestTxStatus}
          txHash={layer23.txHash ?? undefined}
          errorMessage={layer23.error ?? undefined}
        />
      ) : null}

      {reply && (
        <div className="rounded-2xl border border-zap-bg-alt bg-zap-bg px-4 py-4">
          <p className="text-label-caps mb-2 text-zap-brand">Reply</p>
          <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-zap-ink">
            {reply}
          </p>
          {lastRequestId ? (
            <p className="mt-2 font-body text-[11px] text-zap-ink-faint">
              Request ID: {lastRequestId}
            </p>
          ) : null}
        </div>
      )}

      <AskConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void runAsk();
        }}
        creatorName={creatorName}
        creatorAddress={creatorAddress}
        requestLabel={formatAskRequestTitle(selectedType)}
        priceUsdc={selectedPriceUsdc}
        message={message.trim()}
        connected={connected}
        publicKey={publicKey}
        submitting={busy}
        onConnectWallet={() => {
          void connect();
        }}
      />
    </div>
  );
};

export default CloneChat;
