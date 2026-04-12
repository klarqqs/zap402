import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Gauge,
  Trash2,
} from "lucide-react";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import Button from "@/components/primitives/Button";
import { DashboardSectionHeader } from "@/sections/dashboard/DashboardSectionHeader";
import { dashboardSectionIconLucideProps } from "@/sections/dashboard/DashboardSectionIcon";
import { useToastStore } from "@/state/toastStore";
import type { Profile } from "@/types";

const SPENDING_LIMIT_STORAGE_KEY = "zap402.settings.spending-limit";
type SpendingWindow = "daily" | "weekly" | "monthly";
type SpendingLimit = { window: SpendingWindow; amountUsdc: string };

interface SettingsTabProps {
  profile: Profile;
}

const settingsActionBtnClass = "w-full justify-center sm:w-auto";

/** One height for all Settings actions (overrides editorial SCSS min-height 48px on primary/ghost base). */
const settingsUniformH = "!min-h-10 !h-10 max-h-10 shrink-0";

const SettingsTab: React.FC<SettingsTabProps> = ({ profile }) => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [spendingLimit, setSpendingLimit] = useState<SpendingLimit>(() => {
    if (typeof window === "undefined") {
      return { window: "weekly", amountUsdc: "25" };
    }
    try {
      const raw = localStorage.getItem(SPENDING_LIMIT_STORAGE_KEY);
      if (!raw) return { window: "weekly", amountUsdc: "25" };
      const parsed = JSON.parse(raw) as Partial<SpendingLimit>;
      return {
        window:
          parsed.window === "daily" || parsed.window === "weekly" || parsed.window === "monthly"
            ? parsed.window
            : "weekly",
        amountUsdc: typeof parsed.amountUsdc === "string" ? parsed.amountUsdc : "25",
      };
    } catch {
      return { window: "weekly", amountUsdc: "25" };
    }
  });
  const [savedSpendingLimit, setSavedSpendingLimit] = useState<SpendingLimit>(() => {
    if (typeof window === "undefined") {
      return { window: "weekly", amountUsdc: "25" };
    }
    try {
      const raw = localStorage.getItem(SPENDING_LIMIT_STORAGE_KEY);
      if (!raw) return { window: "weekly", amountUsdc: "25" };
      const parsed = JSON.parse(raw) as Partial<SpendingLimit>;
      return {
        window:
          parsed.window === "daily" || parsed.window === "weekly" || parsed.window === "monthly"
            ? parsed.window
            : "weekly",
        amountUsdc: typeof parsed.amountUsdc === "string" ? parsed.amountUsdc : "25",
      };
    } catch {
      return { window: "weekly", amountUsdc: "25" };
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#my-purchases") {
      navigate("/terminal/history", { replace: true });
    }
  }, [navigate]);

  const spendingLimitDirty =
    spendingLimit.window !== savedSpendingLimit.window ||
    spendingLimit.amountUsdc !== savedSpendingLimit.amountUsdc;

  const saveSpendingLimit = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SPENDING_LIMIT_STORAGE_KEY, JSON.stringify(spendingLimit));
      setSavedSpendingLimit(spendingLimit);
      addToast({
        type: "success",
        message: `Spending limit saved: ${spendingLimit.window} · ${spendingLimit.amountUsdc || "0"} USDC`,
        duration: 2600,
      });
    } catch {
      addToast({
        type: "error",
        message: "Could not save spending limit on this device.",
        duration: 3200,
      });
    }
  };

  return (
    <div className="space-y-6">
      <DashboardTabPageHeader
        kicker="SETTINGS"
        title="SETTINGS"
        description="Safety controls and account options."
      />

      <div className="kofi-dashboard-card space-y-4 rounded-3xl p-5 shadow-none md:p-6">
        <DashboardSectionHeader
          icon={<Gauge {...dashboardSectionIconLucideProps} aria-hidden />}
          title="Spending limits"
        >
          <p className="max-w-xl text-pretty text-sm font-medium leading-relaxed text-zap-ink-muted">
            Set a cap for how much you can spend on paid requests and unlocks.
          </p>
        </DashboardSectionHeader>
        <div className="grid gap-3 rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg/25 p-4 dark:bg-zap-bg/10 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="settings-limit-window"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted"
            >
              Window
            </label>
            <select
              id="settings-limit-window"
              value={spendingLimit.window}
              onChange={(e) =>
                setSpendingLimit((prev) => ({
                  ...prev,
                  window: e.target.value as SpendingWindow,
                }))
              }
              className="h-10 w-full rounded-xl border border-[var(--card-border-soft)] bg-zap-surface px-3 text-sm text-zap-ink"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="settings-limit-amount"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted"
            >
              Limit (USDC)
            </label>
            <input
              id="settings-limit-amount"
              type="number"
              min="0"
              step="0.01"
              value={spendingLimit.amountUsdc}
              onChange={(e) =>
                setSpendingLimit((prev) => ({
                  ...prev,
                  amountUsdc: e.target.value,
                }))
              }
              className="h-10 w-full rounded-xl border border-[var(--card-border-soft)] bg-zap-surface px-3 text-sm text-zap-ink"
              placeholder="25.00"
            />
          </div>
        </div>
        <p className="text-xs text-zap-ink-faint">
          Saved on this device. Request payments beyond this cap should be blocked in future payment
          checks.
        </p>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="editorial"
            size="sm"
            disabled={!spendingLimitDirty}
            onClick={saveSpendingLimit}
            className="!h-10 !min-h-10 !max-h-10 !w-full sm:!w-auto sm:min-w-[10rem]"
          >
            {spendingLimitDirty ? "Save limit" : "Saved"}
          </Button>
        </div>
      </div>

      <div className="kofi-dashboard-card space-y-4 rounded-3xl border border-zap-error/35 bg-zap-error-dim/40 p-5 shadow-none md:p-6 dark:bg-zap-error-dim/25">
        <DashboardSectionHeader
          icon={<AlertTriangle {...dashboardSectionIconLucideProps} aria-hidden />}
          title="Danger zone"
          iconVariant="danger"
          dangerTitle
        >
          <p className="text-pretty text-sm font-medium leading-relaxed text-zap-ink">
            Deregistering removes your agent profile from Zap402. There is no on-chain deregister
            call in the scaffold yet — this action will be wired after the contract supports it.
          </p>
        </DashboardSectionHeader>
        <Button
          type="button"
          variant="editorialGhost"
          size="sm"
          className={`${settingsActionBtnClass} ${settingsUniformH} text-zap-error hover:text-zap-error`}
          icon={<Trash2 size={16} className="text-zap-error" aria-hidden />}
          disabled
        >
          Delete my agent account
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
