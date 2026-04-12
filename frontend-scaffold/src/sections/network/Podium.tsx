import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Avatar from "@/components/primitives/Avatar";
import type { NetworkEntry } from "@/types/contract";
import {
  formatNetworkEarningsUsdc,
  formatNetworkJoined,
} from "@/utils/format";
import NetworkMineBadge from "./NetworkMineBadge";

interface PodiumProps {
  creators: NetworkEntry[];
  /** When set, the matching creator card shows a MINE badge. */
  viewerPublicKey?: string | null;
}

const slots = [
  { rank: 2 as const, delay: 0.1 },
  { rank: 1 as const, delay: 0.2 },
  { rank: 3 as const, delay: 0.1 },
];

function displayNameFromUsername(username: string): string {
  return username
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const Podium: React.FC<PodiumProps> = ({ creators, viewerPublicKey }) => {
  const topThree = creators.slice(0, 3);
  const ordered = [topThree[1], topThree[0], topThree[2]].filter(
    (e): e is NetworkEntry => Boolean(e),
  );
  const navigate = useNavigate();

  /** Replace Network in history so Back from profile skips this board (e.g. returns to Search). */
  const goToCreator = useCallback(
    (username: string) => {
      navigate(`/@${username}`, { replace: true });
    },
    [navigate],
  );

  if (ordered.length === 0) return null;

  return (
    <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-3">
      {ordered.map((creator, index) => {
        const slot = slots[index];
        const rank = slot.rank;
        const isFirst = rank === 1;
        const badgeBg =
          rank === 1
            ? "var(--color-gold)"
            : rank === 2
              ? "var(--color-ink)"
              : "var(--color-ink-muted)";
        const badgeLabel = rank === 1 ? "👑 #1" : `#${rank}`;
        const isMine =
          Boolean(viewerPublicKey) && creator.address === viewerPublicKey;

        return (
          <motion.div
            key={creator.address}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: slot.delay }}
            className={isFirst ? "md:z-[1] md:-mt-2" : ""}
          >
            <div
              role="link"
              tabIndex={0}
              className="group flex h-full min-h-[300px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-zap-bg-alt bg-white p-6 text-center outline-none transition-opacity hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-zap-brand dark:bg-zap-bg"
              onClick={() => goToCreator(creator.username)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToCreator(creator.username);
                }
              }}
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 font-body text-xs font-bold tracking-wide text-white"
                  style={{ backgroundColor: badgeBg }}
                >
                  {badgeLabel}
                </span>
                {isMine ? <NetworkMineBadge /> : null}
              </div>

              <div className="mt-5 flex flex-col items-center">
                <Avatar
                  address={creator.address}
                  alt={creator.username}
                  fallback={creator.username}
                  size="lg"
                />
                <Link
                  to={`/@${creator.username}`}
                  replace
                  onClick={(e) => e.stopPropagation()}
                  className="font-body mt-4 max-w-full truncate px-1 text-xl font-bold tracking-tight text-zap-ink hover:underline"
                >
                  {displayNameFromUsername(creator.username)}
                </Link>
                <p className="mt-1 max-w-full truncate px-2 font-body text-sm text-zap-ink-muted">
                  @{creator.username}
                </p>
                <p className="mt-5 font-body text-[28px] font-bold tabular-nums leading-none text-zap-brand">
                  {formatNetworkEarningsUsdc(creator.totalTipsReceived)}
                </p>
                <p className="mt-2 font-body text-[13px] text-zap-ink-muted">
                  {creator.totalTipsCount != null
                    ? `${creator.totalTipsCount.toLocaleString()} zap${creator.totalTipsCount === 1 ? "" : "s"}`
                    : "—"}
                </p>
                {creator.registeredAt != null && (
                  <p className="mt-1 font-mono text-[11px] text-zap-ink-muted/90">
                    Deployed {formatNetworkJoined(creator.registeredAt)}
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-1 flex-col justify-end pt-6">
                <span className="inline-flex items-center justify-center gap-1.5 rounded-none border border-zap-bg-alt bg-zap-bg-alt/70 px-4 py-2.5 font-body text-xs font-bold uppercase tracking-[0.12em] text-zap-ink transition-colors group-hover:border-zap-bg-alt/35 dark:bg-zap-bg-alt">
                  View profile
                  <ArrowRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Podium;
