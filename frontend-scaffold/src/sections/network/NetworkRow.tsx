import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import Avatar from "@/components/primitives/Avatar";
import type { NetworkEntry } from "@/types/contract";
import {
  formatNetworkEarningsUsdc,
  formatNetworkJoined,
} from "@/utils/format";
import NetworkMineBadge from "./NetworkMineBadge";

export interface NetworkRowProps {
  entry: NetworkEntry;
  rank: number;
  rowIndex: number;
  /** True when this row’s creator is the connected wallet. */
  isMine?: boolean;
}

function displayNameFromUsername(username: string): string {
  return username
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const NetworkRow: React.FC<NetworkRowProps> = ({
  entry,
  rank,
  rowIndex,
  isMine = false,
}) => {
  const navigate = useNavigate();

  const go = useCallback(() => {
    navigate(`/@${entry.username}`, { replace: true });
  }, [navigate, entry.username]);

  const zapsLabel =
    entry.totalTipsCount != null
      ? entry.totalTipsCount.toLocaleString()
      : "—";

  return (
    <tr
      className="network-row-in cursor-pointer border-b transition-colors duration-150"
      style={{
        borderColor: "var(--color-border)",
        animationDelay: `${rowIndex * 40}ms`,
      }}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      tabIndex={0}
      role="link"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-alt)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <td
        className="w-[60px] px-6 py-4 font-body text-base font-bold tabular-nums"
        style={{ color: "var(--color-ink-muted)" }}
      >
        {rank}
      </td>
      <td className="px-6 py-4">
        <Link
          to={`/@${entry.username}`}
          replace
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 text-left"
        >
          <Avatar
            address={entry.address}
            alt={entry.username}
            fallback={entry.username}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p
                className="font-body text-[15px] font-bold leading-tight"
                style={{ color: "var(--color-ink)" }}
              >
                {displayNameFromUsername(entry.username)}
              </p>
              {isMine ? <NetworkMineBadge /> : null}
            </div>
            <p
              className="font-body text-[13px] leading-tight"
              style={{ color: "var(--color-ink-muted)" }}
            >
              @{entry.username}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <span className="font-mono text-base font-semibold tabular-nums text-zap-brand">
          {formatNetworkEarningsUsdc(entry.totalTipsReceived)}
        </span>
      </td>
      <td className="px-6 py-4 font-mono text-sm text-zap-ink">{zapsLabel}</td>
      <td className="px-6 py-4 font-mono text-xs text-zap-ink-muted">
        {formatNetworkJoined(entry.registeredAt)}
      </td>
    </tr>
  );
};

export default NetworkRow;
