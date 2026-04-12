import React from "react";
import {
  ArrowDownToLine,
  Copy,
  Pencil,
  Share2,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useToastStore } from "@/state/toastStore";
import { DashboardSectionHeader } from "@/sections/dashboard/DashboardSectionHeader";
import { dashboardSectionIconLucideProps } from "@/sections/dashboard/DashboardSectionIcon";

/** Shared with Profile sidebar “Quick actions” tiles. */
export const editorialQuickActionSurfaceClass =
  "flex w-full min-h-[88px] flex-col items-start gap-3 rounded-3xl border border-zap-bg-alt bg-zap-surface p-4 text-left shadow-none transition-colors hover:border-zap-bg-alt-bright disabled:cursor-not-allowed disabled:opacity-45";

export const editorialQuickActionIconBoxClass =
  "inline-flex shrink-0 items-center justify-center text-zap-brand";

interface QuickActionsProps {
  balance: string;
  zapLink: string;
  onWithdraw: () => void;
}

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={editorialQuickActionSurfaceClass}
    >
      <span className={editorialQuickActionIconBoxClass}>{icon}</span>
      <span className="font-body text-sm font-semibold leading-snug text-zap-ink">
        {label}
      </span>
    </button>
  );
};

const QuickActions: React.FC<QuickActionsProps> = ({
  balance,
  zapLink,
  onWithdraw,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const hasBalance = BigInt(balance || "0") > BigInt(0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(zapLink);
      addToast({
        message: "Link copied — paste it anywhere your fans are.",
        type: "success",
        duration: 3000,
      });
    } catch {
      addToast({
        message: "TX_FAILED · clipboard",
        type: "error",
        duration: 3000,
      });
    }
  };

  const handleShare = () => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Zap me on ZAP402: ${zapLink}`,
    )}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        icon={<Zap {...dashboardSectionIconLucideProps} aria-hidden />}
        title="Quick actions"
      >
        <p className="text-pretty text-sm font-medium leading-relaxed text-zap-ink-muted">
          Copy your link, share it, or withdraw — balances sit in contract escrow until you claim
          (fees apply on withdraw).
        </p>
      </DashboardSectionHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <ActionCard
          icon={<ArrowDownToLine {...dashboardSectionIconLucideProps} />}
          label={hasBalance ? "Withdraw" : "No balance yet"}
          onClick={onWithdraw}
          disabled={!hasBalance}
        />
        <ActionCard
          icon={<Copy {...dashboardSectionIconLucideProps} />}
          label="Copy my link"
          onClick={() => void handleCopy()}
        />
        <ActionCard
          icon={<Share2 {...dashboardSectionIconLucideProps} />}
          label="Share on X"
          onClick={handleShare}
        />
        <ActionCard
          icon={<Pencil {...dashboardSectionIconLucideProps} />}
          label="Edit profile"
          onClick={() => navigate("/profile/edit")}
        />
      </div>
    </section>
  );
};

export default QuickActions;
