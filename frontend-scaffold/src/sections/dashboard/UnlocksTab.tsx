import React, { useMemo, useState } from "react";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import Button from "@/components/primitives/Button";
import Modal from "@/components/primitives/Modal";
import { UnlockForm } from "@/components/unlock/UnlockForm";
import type { CreatorUnlocksApi } from "@/hooks/useUnlock";
import { useWallet } from "@/hooks/useWallet";
import type { CreateUnlockItemInput, UnlockItem } from "@/types/unlock.types";

const TYPE_LABEL: Record<UnlockItem["contentType"], string> = {
  FILE: "FILE_DOWNLOAD",
  TEXT: "PRIVATE_POST",
  LINK: "PRIVATE_LINK",
  PROMPT: "PROMPT_PACK",
};

function typeColorClass(contentType: UnlockItem["contentType"]): string {
  switch (contentType) {
    case "PROMPT":
      return "text-zap-gold";
    case "FILE":
      return "text-zap-teal";
    case "LINK":
      return "text-zap-accent";
    case "TEXT":
      return "text-zap-ink-muted";
    default:
      return "text-zap-ink-muted";
  }
}

function statusDisplay(row: UnlockItem): { text: string; className: string } {
  if (row.status === "PUBLISHED") {
    return { text: "● LIVE", className: "text-[#00D68F]" };
  }
  if (row.status === "DRAFT") {
    return { text: "◌ DRAFT", className: "text-zap-ink-faint" };
  }
  return { text: "× ARCHIVED", className: "text-zap-error" };
}

export interface UnlocksTabProps {
  unlocks: CreatorUnlocksApi;
}

const UnlocksTab: React.FC<UnlocksTabProps> = ({ unlocks }) => {
  const { publicKey } = useWallet();
  const {
    items,
    loading,
    error,
    createItem,
    updateItem,
    archiveItem,
    publishItem,
    deleteItem,
    refetch,
  } = unlocks;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UnlockItem | null>(null);

  const visible = useMemo(
    () => items.filter((i) => i.status !== "ARCHIVED"),
    [items],
  );

  const archived = useMemo(
    () => items.filter((i) => i.status === "ARCHIVED"),
    [items],
  );

  const summary = useMemo(() => {
    const revenue = visible.reduce((acc, i) => acc + i.totalEarned, 0);
    const published = visible.filter((i) => i.status === "PUBLISHED").length;
    const drafts = visible.filter((i) => i.status === "DRAFT").length;
    const totalUnlocks = visible.reduce((acc, i) => acc + i.purchaseCount, 0);
    return { revenue, published, drafts, total: visible.length, totalUnlocks };
  }, [visible]);

  const archivedSummary = useMemo(() => {
    const revenue = archived.reduce((acc, i) => acc + i.totalEarned, 0);
    const totalUnlocks = archived.reduce((acc, i) => acc + i.purchaseCount, 0);
    return { revenue, total: archived.length, totalUnlocks };
  }, [archived]);

  /** Full catalog (active + archived): item count, all purchases, all revenue. */
  const allSummary = useMemo(() => {
    const totalItems = items.length;
    const totalUnlocks = items.reduce((acc, i) => acc + i.purchaseCount, 0);
    const totalRevenue = items.reduce((acc, i) => acc + i.totalEarned, 0);
    return { totalItems, totalUnlocks, totalRevenue };
  }, [items]);

  const resetForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = async (row: UnlockItem) => {
    if (row.purchaseCount > 0) {
      window.alert("This item has purchases and cannot be deleted. Archive it instead.");
      return;
    }
    const ok = window.confirm(`Delete "${row.title}" permanently? This cannot be undone.`);
    if (!ok) return;
    await deleteItem(row.id);
  };

  return (
    <div className="space-y-6">
      <DashboardTabPageHeader
        kicker="CONTENT"
        title="CONTENT"
        description="Sell files, links, posts, and prompt packs."
        action={
          <Button
            type="button"
            variant="editorial"
            size="sm"
            onClick={() => openCreate()}
            className="!w-auto shrink-0"
          >
            Create item
          </Button>
        }
      />

      {error ? (
        <p className="mb-6 font-body text-sm text-zap-error" role="alert">
          {error}{" "}
          <button
            type="button"
            onClick={() => void refetch()}
            className="font-semibold underline decoration-zap-error/50 underline-offset-2"
          >
            Retry
          </button>
        </p>
      ) : null}

      <Modal
        isOpen={formOpen}
        onClose={resetForm}
        title={editing ? "Edit item" : "Create item"}
        wide
      >
        <UnlockForm
          key={editing?.id ?? "create"}
          embedded
          creatorAddress={publicKey}
          mode={editing ? "edit" : "create"}
          initial={
            editing
              ? {
                  id: editing.id,
                  title: editing.title,
                  description: editing.description,
                  contentType: editing.contentType,
                  price: editing.price,
                  content: editing.content,
                  fileUrl: editing.fileUrl,
                  externalLink: editing.externalLink,
                  previewText: editing.previewText,
                }
              : undefined
          }
          onPublish={async (input: CreateUnlockItemInput) => {
            if (editing) {
              await updateItem(editing.id, input);
            } else {
              await createItem(input, "PUBLISHED");
            }
            resetForm();
          }}
          onSaveDraft={
            editing
              ? undefined
              : async (input: CreateUnlockItemInput) => {
                  await createItem(input, "DRAFT");
                  resetForm();
                }
          }
          onCancel={resetForm}
        />
      </Modal>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {[
          {
            label: "TOTAL ITEMS",
            value: loading ? "—" : String(allSummary.totalItems),
            highlight: false,
          },
          {
            label: "PUBLISHED",
            value: loading ? "—" : String(summary.published),
            highlight: false,
          },
          {
            label: "ARCHIVED",
            value: loading ? "—" : String(archivedSummary.total),
            highlight: false,
          },
       
          {
            label: "REVENUE",
            value: loading ? "—" : `$${allSummary.totalRevenue.toFixed(2)} USDC`,
            highlight: true,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="kofi-dashboard-card px-4 py-3.5 shadow-none"
          >
            <p className="mb-1 font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-muted">
              {stat.label}
            </p>
            <p
              className={`font-body text-[22px] leading-none ${
                stat.highlight && !loading && allSummary.totalRevenue > 0
                  ? "text-zap-teal"
                  : "text-zap-ink"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
        </div>

      <div>
        <h2 className="mb-3 font-body text-lg font-semibold text-zap-ink">Gated items</h2>

        <div className="kofi-dashboard-card overflow-x-auto bg-zap-bg-raised shadow-none [scrollbar-width:none] [&::-webkit-scrollbar]:h-0">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-zap-bg-alt bg-zap-bg-alt">
                {["Title", "Type", "Price", "Unlocks", "Earned", "Status", ""].map((h, idx) => (
                  <th
                    key={`h-${idx}`}
                    className={`px-4 py-2.5 text-left font-body text-[10px] font-medium uppercase tracking-[0.12em] text-zap-ink-muted ${
                      idx === 0 ? "w-[28%]" : ""
                    }`}
                  >
                    {h || "—"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center font-body text-sm text-zap-ink-muted"
                  >
                    Loading unlock items…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center align-middle">
                    <p className="mb-2 font-body text-xl font-semibold text-zap-ink-muted">
                      No items yet
                    </p>
                    <p className="mb-5 font-body text-sm text-zap-ink-muted">
                      Create your first gated item. Fans pay once to unlock — files, links, posts, or
                      prompts.
                    </p>
        <Button
          type="button"
                      variant="editorial"
                      size="sm"
                      onClick={() => openCreate()}
                      className="!w-auto"
                    >
                      Create item
        </Button>
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const st = statusDisplay(row);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-zap-bg-alt transition-colors last:border-b-0 hover:bg-zap-bg-alt"
                    >
                      <td className="w-[28%] px-4 py-3.5 align-middle">
                        <p className="line-clamp-2 break-words font-body text-[13px] text-zap-ink">
                          {row.title}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-[10px] uppercase tracking-[0.1em] ${typeColorClass(row.contentType)}`}
                        >
                          {TYPE_LABEL[row.contentType]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="font-body text-sm tabular-nums text-zap-ink">
                          {row.price.toFixed(2)} USDC
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-sm tabular-nums ${row.purchaseCount > 0 ? "text-zap-ink" : "text-zap-ink-faint"
                            }`}
                        >
                          {row.purchaseCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-sm tabular-nums ${row.totalEarned > 0 ? "text-zap-teal" : "text-zap-ink-faint"
                            }`}
                        >
                          ${row.totalEarned.toFixed(2)} USDC
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-[11px] uppercase tracking-[0.08em] ${st.className}`}
                        >
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(row);
                              setFormOpen(true);
                            }}
                            className="cursor-crosshair border-0 bg-transparent p-0 font-body text-[11px] uppercase tracking-[0.08em] text-zap-teal"
                          >
                            EDIT
                          </button>
                          {row.status === "DRAFT" ? (
                            <button
                              type="button"
                              onClick={() => void publishItem(row.id)}
                              className="cursor-crosshair border-0 bg-transparent p-0 font-body text-[11px] uppercase tracking-[0.08em] text-zap-teal"
                            >
                              PUBLISH
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void archiveItem(row.id)}
                            className="cursor-crosshair border-0 bg-transparent p-0 font-body text-[11px] uppercase tracking-[0.08em] text-zap-ink-faint"
                          >
                            ARCHIVE
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            className="cursor-crosshair border-0 bg-transparent p-0 font-body text-[11px] uppercase tracking-[0.08em] text-zap-error"
                          >
                            DELETE
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading ? (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-6">
          {/* <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-body text-xs font-medium text-zap-ink-muted">Revenue (all)</span>
              <span
                className={`font-body text-lg tabular-nums ${
                  allSummary.totalRevenue > 0 ? "text-zap-teal" : "text-zap-ink-faint"
                }`}
              >
                ${allSummary.totalRevenue.toFixed(2)} USDC
              </span>
            </div>
            <span className="font-body text-sm text-zap-ink-muted">
              {allSummary.totalItems} items · {summary.published} live · {summary.drafts} drafts
              {archivedSummary.total > 0 ? (
                <>
                  {" "}
                  · {archivedSummary.total} archived
                  {archivedSummary.totalUnlocks > 0 || archivedSummary.revenue > 0
                    ? ` (${archivedSummary.totalUnlocks} unlocks · $${archivedSummary.revenue.toFixed(2)} USDC)`
                    : ""}
                </>
              ) : null}
            </span>
          </div>
          <span className="font-body text-sm text-zap-ink-faint">
            Withdraw from the Earnings tab.
          </span> */}
        </div>
      ) : null}

      {!loading && archived.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-body text-lg font-semibold text-zap-ink">Archived</h2>
          <p className="font-body text-sm text-zap-ink-muted">
            Archived items stay hidden from your public page. 
          </p>

          <div className="kofi-dashboard-card overflow-x-auto bg-zap-bg-raised shadow-none [scrollbar-width:none] [&::-webkit-scrollbar]:h-0">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zap-bg-alt bg-zap-bg-alt">
                  {["Title", "Type", "Price", "Unlocks", "Earned", "Status", "Actions"].map(
                    (h, idx) => (
                      <th
                        key={`ah-${idx}`}
                        className={`px-4 py-2.5 text-left font-body text-[10px] font-medium uppercase tracking-[0.12em] text-zap-ink-muted ${
                          idx === 0 ? "w-[28%]" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {archived.map((row) => {
                  const st = statusDisplay(row);
                  return (
                    <tr
              key={row.id}
                      className="border-b border-zap-bg-alt transition-colors last:border-b-0 hover:bg-zap-bg-alt"
                    >
                      <td className="w-[28%] px-4 py-3.5 align-middle">
                        <p className="line-clamp-2 break-words font-body text-[13px] text-zap-ink">
                          {row.title}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-[10px] uppercase tracking-[0.1em] ${typeColorClass(row.contentType)}`}
                        >
                          {TYPE_LABEL[row.contentType]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="font-body text-sm tabular-nums text-zap-ink">
                          {row.price.toFixed(2)} USDC
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-sm tabular-nums ${row.purchaseCount > 0 ? "text-zap-ink" : "text-zap-ink-faint"
                            }`}
                        >
                          {row.purchaseCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-sm tabular-nums ${row.totalEarned > 0 ? "text-zap-teal" : "text-zap-ink-faint"
                            }`}
                        >
                          ${row.totalEarned.toFixed(2)} USDC
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`font-body text-[11px] uppercase tracking-[0.08em] ${st.className}`}
                        >
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <button
                          type="button"
                          onClick={() => void publishItem(row.id)}
                          className="cursor-crosshair border-0 bg-transparent p-0 font-body text-[11px] uppercase tracking-[0.08em] text-zap-teal"
                        >
                          RESTORE
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          className="ml-3 cursor-crosshair border-0 bg-transparent p-0 font-body text-[11px] uppercase tracking-[0.08em] text-zap-error"
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
              </div>
        </div>
      ) : null}
    </div>
  );
};

export default UnlocksTab;
