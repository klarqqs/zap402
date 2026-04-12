import React from "react";

/** Shown on NETWORK rows when the row’s creator address matches the connected wallet. */
const NetworkMineBadge: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full border border-zap-bg-alt/55 bg-zap-brand/8 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zap-brand ${className}`}
    title="This is your creator account"
    aria-label="Your account"
  >
    MINE
  </span>
);

export default NetworkMineBadge;
