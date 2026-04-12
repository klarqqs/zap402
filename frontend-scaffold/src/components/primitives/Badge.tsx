import React from "react";

import { BadgeTier } from "@/utils/badge";

interface BadgeProps {
  tier: BadgeTier;
  score?: number;
  className?: string;
}

/** Tier label — text color only, no chip container */
const tierConfig: Record<BadgeTier, { label: string; textClass: string }> = {
  new: { label: "NEW", textClass: "text-zap-ink-muted" },
  bronze: { label: "BRONZE", textClass: "text-zap-gold" },
  silver: { label: "SILVER", textClass: "text-zap-ink-muted" },
  gold: { label: "GOLD", textClass: "text-zap-gold" },
  diamond: { label: "DIAMOND", textClass: "text-zap-teal" },
};

const Badge: React.FC<BadgeProps> = ({ tier, score, className = "" }) => {
  const config = tierConfig[tier];

  return (
    <span
      className={`inline-flex items-center gap-1 font-body text-[11px] font-normal uppercase tracking-[0.12em] ${config.textClass} ${className}`}
    >
      <span aria-hidden>●</span>
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="tabular-nums text-zap-ink-faint">({score})</span>
      )}
    </span>
  );
};

export default Badge;
