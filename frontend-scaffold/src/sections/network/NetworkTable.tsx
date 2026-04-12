import React, { useMemo, useState } from "react";

import Pagination from "@/components/primitives/Pagination";
import type { NetworkEntry } from "@/types/contract";
import NetworkRow from "./NetworkRow";

const PAGE_SIZE = 20;

export interface NetworkTableProps {
  /** Entries starting at rank 4 (indices 3+ of the full sorted list). */
  entries: NetworkEntry[];
  viewerPublicKey?: string | null;
}

const NetworkTable: React.FC<NetworkTableProps> = ({
  entries,
  viewerPublicKey,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pageEntries = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, safeCurrentPage]);

  const rankOffset = 4 + (safeCurrentPage - 1) * PAGE_SIZE;

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="card-editorial overflow-x-auto p-0">
        <table className="min-w-[720px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-zap-bg-alt bg-zap-bg-alt">
              {(
                ["RANK", "IDENTITY", "TOTAL_USDC", "ZAPS", "DEPLOYED"] as const
              ).map((label, hi) => (
                <th
                  key={`${label}-${hi}`}
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-zap-ink-muted"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageEntries.map((entry, index) => (
              <NetworkRow
                key={entry.address}
                entry={entry}
                rank={rankOffset + index}
                rowIndex={index}
                isMine={
                  Boolean(viewerPublicKey) && entry.address === viewerPublicKey
                }
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default NetworkTable;
