import React from "react";

export interface EditorialPageHeroProps {
  /** When false, eyebrow / title / description are omitted (PROFILE / TERMINAL shells). @default true */
  showIntro?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  /**
   * NETWORK-style RPC pills (● LIVE_RPC · ✓ SYNCED). Omit on PROFILE / TERMINAL where it’s redundant.
   * @default true
   */
  showRpcStatus?: boolean;
  /** When `showRpcStatus` and false: CONTRACT_NOT_CONFIGURED instead of LIVE_RPC / SYNCED */
  liveRpc?: boolean;
  /** Optional block below description (e.g. PROFILE identity card); left-aligned, full width within container */
  belowDescription?: React.ReactNode;
  /** Optional row below status (e.g. TERMINAL wallet + links) */
  footer?: React.ReactNode;
}

/**
 * Full-width hero strip: optional // eyebrow + title + subcopy; optional LIVE_RPC row.
 */
const EditorialPageHero: React.FC<EditorialPageHeroProps> = ({
  showIntro = true,
  eyebrow,
  title,
  description,
  showRpcStatus = true,
  liveRpc = true,
  belowDescription,
  footer,
}) => {
  const hasIntroCopy =
    showIntro &&
    Boolean(
      eyebrow?.trim() && title?.trim() && description?.trim(),
    );
  const hasTopCenter = hasIntroCopy || showRpcStatus;
  const belowSpacing =
    hasIntroCopy || showRpcStatus ? "mt-10" : "mt-0";
  const footerSpacing =
    hasIntroCopy || showRpcStatus || belowDescription ? "mt-10" : "mt-8";

  const hasContent =
    hasTopCenter || belowDescription != null || footer != null;
  if (!hasContent) {
    return null;
  }

  return (
    <section className="border-b border-zap-bg-alt bg-zap-bg-raised py-14 md:py-20">
      <div className="editorial-container">
        {hasTopCenter ? (
          <div className="mx-auto max-w-4xl text-center">
            {hasIntroCopy ? (
              <>
                <p className="text-label-caps text-label-caps--accent mb-4">
                  {eyebrow}
                </p>
                <h1 className="font-body text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[0.95] text-zap-ink">
                  {title}
                </h1>
                <p className="mx-auto mt-6 max-w-xl font-body text-[13px] leading-[1.9] text-zap-ink-muted">
                  {description}
                </p>
              </>
            ) : null}
            {showRpcStatus ? (
              <div
                className={`flex flex-row flex-wrap items-center justify-center gap-6 font-body text-[12px] uppercase tracking-[0.1em] md:gap-10 ${hasIntroCopy ? "mt-6" : ""}`}
              >
                {liveRpc ? (
                  <>
                    <span className="text-zap-teal">● LIVE_RPC</span>
                    <span className="text-zap-ink-faint">·</span>
                    <span className="text-zap-teal">✓ SYNCED</span>
                  </>
                ) : (
                  <span className="text-zap-ink-muted">
                    ● CONTRACT_NOT_CONFIGURED
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        {belowDescription ? (
          <div
            className={`mx-auto w-full max-w-4xl text-left ${belowSpacing}`}
          >
            {belowDescription}
          </div>
        ) : null}
        {footer ? (
          <div className={`mx-auto w-full max-w-4xl px-0 ${footerSpacing}`}>
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default EditorialPageHero;
