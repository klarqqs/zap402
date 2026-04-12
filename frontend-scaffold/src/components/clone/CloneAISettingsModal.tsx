import React from "react";
import { Bot } from "lucide-react";

import Modal from "@/components/primitives/Modal";
import Button from "@/components/primitives/Button";
import Textarea from "@/components/primitives/Textarea";
import Input from "@/components/primitives/Input";
import {
  DashboardSectionIcon,
  dashboardSectionIconLucideProps,
} from "@/sections/dashboard/DashboardSectionIcon";

export type WhoCanMessage = "anyone_paid" | "supporters_only" | "off";

export interface CloneAISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  systemPrompt: string;
  onSystemPromptChange: (v: string) => void;
  pricePerMessageUsdc: string;
  onPriceChange: (v: string) => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  whoCanMessage: WhoCanMessage;
  onWhoCanMessageChange: (v: WhoCanMessage) => void;
  emailOnMessage: boolean;
  onEmailOnMessageChange: (v: boolean) => void;
}

const whoOptions: { value: WhoCanMessage; label: string }[] = [
  { value: "anyone_paid", label: "Anyone who pays per message" },
  { value: "supporters_only", label: "Supporters only (when wired)" },
  { value: "off", label: "Off — no AI / paid ask" },
];

/**
 * Ko-fi–style settings sheet: AI persona, access, notifications — rounded, calm hierarchy.
 */
const CloneAISettingsModal: React.FC<CloneAISettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  systemPrompt,
  onSystemPromptChange,
  pricePerMessageUsdc,
  onPriceChange,
  enabled,
  onEnabledChange,
  whoCanMessage,
  onWhoCanMessageChange,
  emailOnMessage,
  onEmailOnMessageChange,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-zap-bg-alt bg-zap-bg-alt px-4 py-3 dark:bg-zap-bg/30">
          <DashboardSectionIcon>
            <Bot {...dashboardSectionIconLucideProps} aria-hidden />
          </DashboardSectionIcon>
          <p className="min-w-0 flex-1 text-pretty text-sm font-medium leading-relaxed text-zap-ink">
            Configure how your AI assistant answers paid questions on your page. On-chain routing is
            still in progress — choices apply to this device for now.
          </p>
          <span className="shrink-0 rounded-full border border-amber-200/90 bg-amber-50/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
            Beta
          </span>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="clone-who-messages"
            className="block font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink"
          >
            Who can message me?
          </label>
          <select
            id="clone-who-messages"
            value={whoCanMessage}
            onChange={(e) => onWhoCanMessageChange(e.target.value as WhoCanMessage)}
            className="w-full rounded-2xl border border-zap-bg-alt bg-zap-surface px-4 py-3 font-body text-sm font-medium text-zap-ink shadow-none outline-none transition-colors focus:border-zap-bg-alt/40 focus:ring-2 focus:ring-zap-brand/20 dark:bg-zap-bg-raised"
          >
            {whoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zap-bg-alt bg-zap-bg-alt/50 p-4 transition-colors hover:border-zap-bg-alt/25 dark:bg-zinc-900/40">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zap-bg-alt text-zap-brand focus:ring-zap-brand/30"
          />
          <span className="text-sm font-semibold text-zap-ink">AI / paid Ask enabled on profile</span>
        </label>

        <Textarea
          variant="editorial"
          label="System prompt (persona)"
          placeholder="You are… niche, tone, boundaries, expertise."
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          rows={5}
        />

        <Input
          variant="editorial"
          label="Price per message (USDC)"
          type="text"
          inputMode="decimal"
          value={pricePerMessageUsdc}
          onChange={(e) => onPriceChange(e.target.value)}
        />

        <div className="space-y-3 rounded-2xl border border-zap-bg-alt bg-zap-bg/30 p-4 dark:bg-zap-bg/15">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink">
            Notifications
          </p>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zap-bg-alt bg-zap-surface px-3 py-3 dark:bg-zap-bg-raised">
            <span className="text-sm font-medium text-zap-ink">Email me when I get a message</span>
            <input
              type="checkbox"
              checked={emailOnMessage}
              onChange={(e) => onEmailOnMessageChange(e.target.checked)}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-zap-bg-alt text-zap-brand focus:ring-2 focus:ring-zap-brand/30 focus:ring-offset-2 focus:ring-offset-zap-surface"
            />
          </label>
          <p className="text-pretty text-xs font-medium text-zap-ink">
            Saved on this device until email delivery is connected.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zap-bg-alt pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="editorialGhost" size="md" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            variant="brandCta"
            size="md"
            onClick={onSave}
            className="w-full sm:w-auto"
          >
            Save settings
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CloneAISettingsModal;
