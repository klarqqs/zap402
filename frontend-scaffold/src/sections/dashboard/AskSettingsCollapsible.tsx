import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ASK_DEFAULT_REQUEST_TYPE_ID,
  ASK_REQUEST_TYPES,
  formatAskRequestTitle,
} from "@/constants/askRequestTypes";

type ResponseMode = "AI_ASSISTED" | "DIRECT";

export interface AskSettingsCollapsibleProps {
  /**
   * `embedded` — collapsible block (e.g. under Content).
   * `page` — full Ask route: always expanded, single card.
   */
  layout?: "embedded" | "page";
}

/**
 * Pay-to-ask configuration (local UI state — wire to API when available).
 */
const AskSettingsCollapsible: React.FC<AskSettingsCollapsibleProps> = ({
  layout = "embedded",
}) => {
  const isPage = layout === "page";
  const [askExpanded, setAskExpanded] = useState(isPage);
  const [responseMode, setResponseMode] = useState<ResponseMode>("AI_ASSISTED");
  const [selectedRequestTypeId, setSelectedRequestTypeId] = useState(
    ASK_DEFAULT_REQUEST_TYPE_ID,
  );
  const [askPrice, setAskPrice] = useState("0.50");
  const [personaPrompt, setPersonaPrompt] = useState("");
  const [savedStatus, setSavedStatus] = useState("");

  const priceNum = Number.parseFloat(askPrice);
  const askActive = Number.isFinite(priceNum) && priceNum > 0;
  const selectedRequestType = ASK_REQUEST_TYPES.find(
    (t) => t.id === selectedRequestTypeId,
  );

  const handleSaveAskSettings = useCallback(() => {
    setSavedStatus("Saved");
    window.setTimeout(() => setSavedStatus(""), 3500);
  }, []);

  const formInner = (
    <>
      <div className="mb-5">
        <p className="mb-2.5 font-body text-xs font-semibold text-zap-ink">Response mode</p>

        <label
          className={`mb-2 flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 ${
            responseMode === "AI_ASSISTED"
              ? "border-zap-accent bg-zap-accent-dim/40"
              : "border-[var(--card-border-soft)] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="responseMode"
            value="AI_ASSISTED"
            checked={responseMode === "AI_ASSISTED"}
            onChange={() => setResponseMode("AI_ASSISTED")}
            className="mt-0.5 accent-zap-accent"
          />
          <div>
            <p className="mb-0.5 font-body text-sm font-semibold text-zap-ink">
              AI-assisted — instant reply
            </p>
            <p className="font-body text-[11px] leading-relaxed text-zap-ink-muted">
              Claude responds instantly in your voice. You can review and edit within 24h.
            </p>
          </div>
        </label>

        <label
          className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 ${
            responseMode === "DIRECT"
              ? "border-zap-accent bg-zap-accent-dim/40"
              : "border-[var(--card-border-soft)] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="responseMode"
            value="DIRECT"
            checked={responseMode === "DIRECT"}
            onChange={() => setResponseMode("DIRECT")}
            className="mt-0.5 accent-zap-accent"
          />
          <div>
            <p className="mb-0.5 font-body text-sm font-semibold text-zap-ink">
              Direct — you reply manually
            </p>
            <p className="font-body text-[11px] leading-relaxed text-zap-ink-muted">
              You respond within 48h. Fan gets automatic refund if you don&apos;t reply.
            </p>
          </div>
        </label>
      </div>

      <div className="mb-5">
        <label className="mb-2 block font-body text-xs font-semibold text-zap-ink">
          Request type
        </label>
        <select
          value={selectedRequestTypeId}
          onChange={(e) => {
            const next = e.target.value;
            setSelectedRequestTypeId(next);
            const type = ASK_REQUEST_TYPES.find((t) => t.id === next);
            if (type) setAskPrice(type.defaultPriceUsdc);
          }}
          className="h-10 w-full max-w-[360px] rounded-[10px] border border-[var(--card-border-soft)] bg-zap-bg-alt px-3 font-body text-sm text-zap-ink shadow-none focus:border-zap-accent focus:outline-none"
        >
          {ASK_REQUEST_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {formatAskRequestTitle(type)}
            </option>
          ))}
        </select>
        <p className="mt-1 font-body text-[11px] tracking-[0.06em] text-zap-ink-faint">
          Up to {ASK_REQUEST_TYPES.length} request types. Start with low-friction asks and raise heavier
          tasks.
        </p>
      </div>

      <div className="mb-5">
        <label className="mb-2 block font-body text-xs font-semibold text-zap-ink">
          Price for this request (USDC)
        </label>
        <input
          type="number"
          value={askPrice}
          onChange={(e) => setAskPrice(e.target.value)}
          min={0.01}
          max={10}
          step={0.01}
          className="h-10 max-w-[200px] rounded-[10px] border border-[var(--card-border-soft)] bg-zap-bg-alt px-3 font-body text-sm text-zap-ink shadow-none focus:border-zap-accent focus:outline-none"
        />
        <p className="mt-1 font-body text-[11px] tracking-[0.06em] text-zap-ink-faint">
          Min $0.01 · Max $10.00 · Default for "{selectedRequestType?.label ?? "request"}" is $
          {selectedRequestType?.defaultPriceUsdc ?? "0.50"}
        </p>
      </div>

      {responseMode === "AI_ASSISTED" ? (
        <div className="mb-5">
          <label className="mb-2 block font-body text-xs font-semibold text-zap-ink">
            Your persona
            <span className="ml-2 font-normal text-zap-ink-muted">
              The model answers in your voice using this.
            </span>
          </label>
          <textarea
            value={personaPrompt}
            onChange={(e) => setPersonaPrompt(e.target.value)}
            rows={5}
            placeholder={
              "Who are you? What do you talk about? What’s your tone? What are you expert in?\nExample: I’m a Lagos-based music producer…"
            }
            className="min-h-[120px] w-full resize-y rounded-[10px] border border-[var(--card-border-soft)] bg-zap-bg-alt px-3 py-2 font-body text-sm text-zap-ink shadow-none focus:border-zap-accent focus:outline-none"
          />
          <p className="mt-1 font-body text-[11px] tracking-[0.06em] text-zap-ink-faint">
            Be specific. The more detail, the better Claude sounds like you.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--card-border-soft)] pt-4">
        <button
          type="button"
          onClick={handleSaveAskSettings}
          className="inline-flex items-center justify-center rounded-full bg-zap-ink px-5 py-2.5 font-body text-sm font-semibold text-zap-bg transition hover:opacity-90"
        >
          Save settings
        </button>
        <Link
          to="/terminal/ask#inbox-preview"
          className="font-body text-sm font-semibold text-zap-teal no-underline hover:opacity-90"
        >
          Open inbox preview
        </Link>
        {savedStatus ? (
          <span className="ml-auto font-body text-[11px] tracking-[0.06em] text-zap-ink-faint">
            {savedStatus}
          </span>
        ) : null}
      </div>
    </>
  );

  if (isPage) {
    return (
      <div className="kofi-dashboard-card overflow-hidden shadow-none">
        <div className="border-b border-[var(--card-border-soft)] bg-zap-bg-alt/60 px-5 py-4">
          <p className="font-body text-sm font-semibold text-zap-ink">Pay-to-ask</p>
          <p className="mt-0.5 font-body text-xs text-zap-ink-muted">
            ${Number.isFinite(priceNum) ? priceNum.toFixed(2) : "0.00"} per question ·{" "}
            <span className={askActive ? "text-zap-teal" : "text-zap-ink-faint"}>
              {askActive ? "Active" : "Inactive"}
            </span>
          </p>
        </div>
        <div className="p-5 md:p-6">{formInner}</div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-[var(--card-border-soft)] pt-8">
      <h2 className="mb-3 font-body text-lg font-semibold text-zap-ink">Ask settings</h2>

      <button
        type="button"
        onClick={() => setAskExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between border border-[var(--card-border-soft)] bg-zap-bg-alt px-4 py-3.5 text-left transition-colors hover:bg-zap-bg-overlay"
        aria-expanded={askExpanded}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <span className="font-body text-sm font-semibold tracking-tight text-zap-ink">
            Pay-to-ask inbox
          </span>
          <span className="font-body text-[11px] tracking-[0.06em] text-zap-ink-muted">
            ${Number.isFinite(priceNum) ? priceNum.toFixed(2) : "0.00"}/question
          </span>
          <span
            className={`font-body text-[10px] uppercase tracking-[0.1em] ${
              askActive ? "text-[#00D68F]" : "text-zap-ink-faint"
            }`}
          >
            {askActive ? "● ACTIVE" : "○ INACTIVE"}
          </span>
        </div>
        <span
          className={`shrink-0 font-body text-sm text-zap-ink-muted transition-transform duration-150 ease-out ${
            askExpanded ? "rotate-90" : ""
          }`}
          aria-hidden
        >
          ►
        </span>
      </button>

      {askExpanded ? (
        <div className="border border-t-0 border-[var(--card-border-soft)] bg-zap-bg-raised p-5">
          {formInner}
        </div>
      ) : null}
    </div>
  );
};

export default AskSettingsCollapsible;
