import React, { useMemo, useState } from "react";

import EmptyState from "@/components/primitives/EmptyState";
import Table from "@/components/primitives/Table";
import { useZaps } from "@/hooks/useZaps";
import { useWalletStore } from "@/state/walletStore";
import { formatZapAmountAsUsdc } from "@/utils/format";
import Loader from "@/components/primitives/Loader";
import Pagination from "@/components/primitives/Pagination";
import ActivityMini from "./ActivityMini";
import { DashboardSectionHeader } from "@/sections/dashboard/DashboardSectionHeader";
import { dashboardSectionIconLucideProps } from "@/sections/dashboard/DashboardSectionIcon";
import { Activity } from "lucide-react";

const PAGE_SIZE = 20;

const zapFilterLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted";

const filterInputClass =
  "filter-row-input h-10 w-full min-w-0 rounded-[10px] border border-[var(--card-border-soft)] bg-zap-bg-alt px-3 py-2 font-body text-xs font-medium text-zap-ink placeholder:text-zap-ink-muted/70 shadow-none focus:border-zap-accent focus:outline-none";

export type ZapsTabVariant = "full" | "earnings";

export interface ZapsTabProps {
  variant?: ZapsTabVariant;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateSender(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

/** On-chain feed is zaps only until unlock/ask rows are typed. */
function tipRowType(): "ZAP" | "UNLOCK" | "ASK" {
  return "ZAP";
}

const ZapsTab: React.FC<ZapsTabProps> = ({ variant = "full" }) => {
  const isEarnings = variant === "earnings";
  const { publicKey } = useWalletStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [senderSearch, setSenderSearch] = useState("");

  const { tips, totalCount, loading, error } = useZaps(publicKey || "", "creator", 100);

  const filtered = useMemo(() => {
    return tips.filter((tip) => {
      if (startDate) {
        const start = new Date(startDate).getTime();
        if (tip.timestamp * 1000 < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
        if (tip.timestamp * 1000 > end) return false;
      }
      if (senderSearch.trim()) {
        const q = senderSearch.trim().toLowerCase();
        if (!tip.tipper.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tips, startDate, endDate, senderSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length);
  const paginated = filtered.slice(startIdx, endIdx);

  const columnsFull = [
    { key: "date", label: "Date" },
    { key: "tipper", label: "Sender" },
    { key: "amount", label: "Amount", align: "right" as const },
    { key: "message", label: "Message" },
  ];

  if (loading && tips.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="lg" text="Loading transactions…" />
      </div>
    );
  }

  if (error && tips.length === 0) {
    return (
      <div className="py-20">
        <EmptyState title="Couldn’t load transactions" description={error} />
      </div>
    );
  }

  /** Date + sender filters. Type tabs (ALL / ZAP / UNLOCK / ASK) removed until unlock & ask rows exist in-feed — see git history to restore. */
  const filterRow = (
    <div className={`filter-row flex flex-wrap items-end gap-4 ${isEarnings ? "mb-3" : ""}`}>
        <div className="flex flex-col gap-1.5">
          <label className={zapFilterLabelClass} htmlFor="zap-filter-from">
            From date
          </label>
          <input
            id="zap-filter-from"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
          className={filterInputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={zapFilterLabelClass} htmlFor="zap-filter-to">
            To date
          </label>
          <input
            id="zap-filter-to"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
          className={filterInputClass}
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-col gap-1.5">
            <label className={zapFilterLabelClass} htmlFor="zap-filter-sender">
              Search by sender
            </label>
            <input
              id="zap-filter-sender"
              type="text"
              placeholder="Paste sender address…"
              value={senderSearch}
              onChange={(e) => {
                setSenderSearch(e.target.value);
                setCurrentPage(1);
              }}
            className={filterInputClass}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
  );

  const transactionsHeader = isEarnings ? (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-body text-lg font-semibold text-zap-ink">Transactions</h3>
      <p className="font-body text-sm text-zap-ink-muted">
        Showing {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  ) : null;

  if (isEarnings) {
    const count = filtered.length;

    return (
      <div className="kofi-dashboard-card space-y-4 p-5 shadow-none">
        {filterRow}
        {transactionsHeader}

        {count === 0 ? (
          <div className="overflow-hidden rounded-[10px] border border-[var(--card-border-soft)] bg-zap-bg-raised">
            <table className="transactions-table w-full border-collapse">
              <thead>
                <tr className="border-b border-zap-bg-alt bg-zap-bg-alt">
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Sender
                  </th>
                  <th className="px-4 py-2.5 text-right font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center font-body text-xs tracking-[0.08em] text-zap-ink-faint"
                  >
                    No transactions match these filters.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-[var(--card-border-soft)]">
            <table className="transactions-table w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-zap-bg-alt bg-zap-bg-alt">
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Sender
                  </th>
                  <th className="px-4 py-2.5 text-right font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-left font-body text-[10px] font-normal uppercase tracking-[0.15em] text-zap-ink-muted">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((tip, i) => {
                  const txType = tipRowType();
                  const typeColor =
                    txType === "ZAP"
                      ? "text-zap-accent"
                      : txType === "UNLOCK"
                        ? "text-zap-teal"
                        : "text-zap-gold";
                  return (
                    <tr
                      key={`${tip.id}-${tip.timestamp}-${i}`}
                      className="border-b border-zap-bg-alt transition-colors hover:bg-zap-bg-alt"
                    >
                      <td className="px-4 py-3 font-body text-xs">
                        <span
                          className={`text-[10px] font-medium uppercase tracking-[0.1em] ${typeColor}`}
                        >
                          {txType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-zap-ink">
                        {formatTimestamp(tip.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zap-ink">
                        {truncateSender(tip.tipper)}
                      </td>
                      <td className="px-4 py-3 text-right font-body text-sm font-semibold tabular-nums text-zap-accent">
                        +{formatZapAmountAsUsdc(tip.amount)} USDC
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-body text-xs text-zap-ink-muted">
                        {tip.message || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {count > 0 ? (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </div>
    );
  }

  /* --- full variant (Home / legacy zap log) --- */

  return (
    <div className="space-y-5">
      <div className="kofi-dashboard-card space-y-4 p-5 shadow-none md:p-6">
        {filterRow}

      {filtered.length > 0 && (
        <p className="text-sm font-medium text-zap-ink-muted">
            Showing {startIdx + 1}–{endIdx} of {filtered.length} zap
            {filtered.length !== 1 ? "s" : ""}
          {totalCount > tips.length && ` (from ${tips.length} recently loaded)`}
        </p>
      )}

      {paginated.length === 0 ? (
        <EmptyState
            title={tips.length === 0 ? "No zaps yet" : "No matches"}
            description={
              tips.length === 0
                ? "Share your profile link so fans can send their first zap."
                : "Try widening the date range or clearing the sender search."
            }
        />
      ) : (
          <div className="overflow-x-auto rounded-[10px] border border-[var(--card-border-soft)]">
            <Table
              columns={columnsFull}
              data={paginated.map((tip) => ({
                date: formatTimestamp(tip.timestamp),
                tipper: truncateSender(tip.tipper),
                amount: formatZapAmountAsUsdc(tip.amount),
                message: tip.message || "—",
              }))}
              variant="editorial"
            />
        </div>
      )}

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      </div>

      {publicKey && tips.length > 0 && (
        <section className="kofi-dashboard-card space-y-4 p-5 shadow-none md:p-6">
          <div>
            <DashboardSectionHeader
              icon={<Activity {...dashboardSectionIconLucideProps} aria-hidden />}
              title="Zap log"
            >
              <p className="text-pretty text-sm font-medium text-zap-ink-muted">
                Same feed as the table above, compact.
              </p>
            </DashboardSectionHeader>
          </div>
          <ActivityMini tips={tips} />
        </section>
      )}
    </div>
  );
};

export default ZapsTab;
