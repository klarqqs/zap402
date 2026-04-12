import React, { useState } from "react";
import {
  ChevronRight,
  FileText,
  Link as LinkIcon,
  Lock,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

import type { UnlockItem, UnlockPurchase } from "@/types/unlock.types";
import {
  UnlockModal,
  type UnlockCreatorSummary,
} from "@/components/unlock/UnlockModal";
import { unlockAssetHref } from "@/utils/unlockAssetUrl";

const CONTENT_TYPE_LABEL: Record<string, string> = {
  FILE: "FILE_DOWNLOAD",
  TEXT: "PRIVATE_POST",
  LINK: "PRIVATE_LINK",
  PROMPT: "PROMPT_PACK",
};

function typeVisualMeta(contentType: UnlockItem["contentType"]): {
  tone: string;
  Icon: LucideIcon;
} {
  switch (contentType) {
    case "FILE":
      return { tone: "from-zap-accent/30 via-zap-accent/10 to-transparent", Icon: FileText };
    case "LINK":
      return { tone: "from-zap-brand/25 via-zap-brand/10 to-transparent", Icon: LinkIcon };
    case "PROMPT":
      return { tone: "from-zap-gold/30 via-zap-gold/10 to-transparent", Icon: ScrollText };
    case "TEXT":
    default:
      return { tone: "from-zap-ink/15 via-zap-ink/5 to-transparent", Icon: FileText };
  }
}

export interface UnlockCardProps {
  item: UnlockItem;
  hasAccess: boolean;
  /** Logged-in wallet is the listing creator (cannot self-purchase; sees own content). */
  isOwner?: boolean;
  /** Stellar address for signed dev-API file downloads (`/api/unlock/assets/...`). */
  viewerAddress?: string | null;
  /** Zap page creator — unlock confirm matches zap confirm layout. */
  creator?: UnlockCreatorSummary | null;
  onPurchase: (
    itemId: string,
    txHash: string,
    amount: number,
  ) => Promise<{ purchase: UnlockPurchase; content: UnlockItem }>;
}

export function UnlockCard({
  item,
  hasAccess,
  isOwner,
  viewerAddress,
  creator,
  onPurchase,
}: UnlockCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [revealedContent, setRevealedContent] = useState<UnlockItem | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handlePurchaseSuccess = async (txHash: string, amount: number) => {
    const result = await onPurchase(item.id, txHash, amount);
    setRevealedContent(result.content);
    setModalOpen(false);
    setExpanded(true);
  };

  const displayItem = revealedContent ?? item;
  const canSeeContent = hasAccess || revealedContent || isOwner;
  const panelId = `unlock-card-panel-${item.id}`;
  const previewImage = String(item.thumbnailUrl || "").trim();
  const { tone, Icon } = typeVisualMeta(item.contentType);

  return (
    <>
      <div
        className="flex flex-col gap-4 break-inside-avoid rounded-2xl border border-zap-bg-alt bg-zap-surface p-5 md:p-6"
        style={{ opacity: item.status === "ARCHIVED" ? 0.5 : 1 }}
      >
        <div className="relative overflow-hidden rounded-xl border border-zap-bg-alt bg-zap-bg-alt">
          {previewImage ? (
            <img
              src={previewImage}
              alt=""
              className="h-28 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`relative h-24 w-full bg-gradient-to-br ${tone}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.35),transparent_55%)]" />
              <Icon
                size={18}
                className="absolute bottom-3 right-3 text-zap-ink-muted/80"
                aria-hidden
              />
            </div>
          )}
          {!canSeeContent ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-zap-bg-alt bg-zap-bg-raised/90 px-2.5 py-1 font-body text-[10px] uppercase tracking-[0.08em] text-zap-ink-muted backdrop-blur-sm">
              <Lock size={12} aria-hidden />
              Locked
            </span>
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="h-2 w-2 shrink-0 rounded-full bg-zap-live" aria-hidden />
              <span className="font-body text-[10px] uppercase tracking-[0.2em] text-zap-ink-muted">
                {CONTENT_TYPE_LABEL[item.contentType]}
              </span>
            </div>
            <h3 className="font-body text-[1.6rem] font-semibold uppercase leading-[1.05] tracking-tight text-zap-ink">
              {item.title}
            </h3>
          </div>
          <span className="shrink-0 font-body text-[12px] text-zap-ink-faint">
            {item.price.toFixed(2)} USDC
          </span>
        </div>

        {item.previewText ? (
          <p className="text-sm font-medium leading-relaxed text-zap-ink-muted">
            {item.previewText}
          </p>
        ) : null}

        <p className="font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-faint">
          {item.purchaseCount} unlock{item.purchaseCount === 1 ? "" : "s"}
        </p>

        {!canSeeContent ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary mt-1 flex w-full items-center justify-center !h-10 !min-h-10 !max-h-10 !py-2 !px-5 text-sm font-medium normal-case tracking-normal"
          >
            <span className="tabular-nums">{item.price.toFixed(2)} USDC</span>
          </button>
        ) : null}

        {canSeeContent ? (
          <>
            <button
              type="button"
              id={`unlock-card-toggle-${item.id}`}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex w-fit items-center gap-1.5 border-0 bg-transparent p-0 font-body text-[11px] uppercase tracking-[0.1em] text-zap-teal"
            >
              <ChevronRight
                size={16}
                className={`transition-transform ${expanded ? "rotate-90" : ""}`}
                aria-hidden
              />
              {expanded ? "Hide content" : "View content"}
            </button>
            {expanded ? (
              <div id={panelId} role="region" aria-labelledby={`unlock-card-toggle-${item.id}`}>
                <UnlockRevealedContent item={displayItem} viewerAddress={viewerAddress} />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <UnlockModal
        isOpen={modalOpen}
        item={item}
        creator={creator}
        isOwner={isOwner}
        onClose={() => setModalOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </>
  );
}

/** Full unlocked body (text, prompt, link, file) — same rules as the zap page. */
export function UnlockRevealedContent({
  item,
  viewerAddress,
}: {
  item: UnlockItem;
  viewerAddress?: string | null;
}) {
  return (
    <div className="mt-2 border-l-2 border-zap-teal pl-3">
      <p className="mb-3 font-body text-[10px] uppercase tracking-[0.12em] text-zap-teal">
        ● ACCESS_GRANTED
      </p>

      {item.contentType === "TEXT" ? (
        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-zap-ink">
          {item.content}
        </p>
      ) : null}

      {item.contentType === "PROMPT" ? (
        <pre className="whitespace-pre-wrap border border-zap-bg-alt bg-zap-bg-alt p-3 font-body text-xs leading-relaxed text-zap-ink">
          {item.content}
        </pre>
      ) : null}

      {item.contentType === "LINK" && item.externalLink ? (
        <a
          href={item.externalLink}
          target="_blank"
          rel="noreferrer"
          className="font-body text-xs uppercase tracking-[0.08em] text-zap-teal no-underline hover:opacity-90"
        >
          OPEN_LINK ↗
        </a>
      ) : null}

      {item.contentType === "FILE" && item.fileUrl ? (
        (() => {
          const needsWallet =
            item.fileUrl.startsWith("/api/unlock/assets/") && !viewerAddress;
          if (needsWallet) {
            return (
              <p className="font-body text-xs text-zap-ink-muted">
                Connect your wallet to download this file.
              </p>
            );
          }
          const href = unlockAssetHref(item.fileUrl, viewerAddress) ?? item.fileUrl;
          return (
            <a
              href={href}
              download
              target="_blank"
              rel="noreferrer"
              className="font-body text-xs uppercase tracking-[0.08em] text-zap-teal no-underline hover:opacity-90"
            >
              Download file
            </a>
          );
        })()
      ) : null}
    </div>
  );
}

export default UnlockCard;
