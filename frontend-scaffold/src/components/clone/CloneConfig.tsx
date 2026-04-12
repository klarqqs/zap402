import React from "react";
import { Bot } from "lucide-react";

import Textarea from "@/components/primitives/Textarea";
import Input from "@/components/primitives/Input";
import Card from "@/components/primitives/Card";
import {
  DashboardSectionIcon,
  dashboardSectionIconLucideProps,
} from "@/sections/dashboard/DashboardSectionIcon";

export interface CloneConfigProps {
  systemPrompt: string;
  onSystemPromptChange: (v: string) => void;
  pricePerMessageUsdc: string;
  onPriceChange: (v: string) => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
}

const CloneConfig: React.FC<CloneConfigProps> = ({
  systemPrompt,
  onSystemPromptChange,
  pricePerMessageUsdc,
  onPriceChange,
  enabled,
  onEnabledChange,
}) => {
  return (
    <Card variant="editorial" hover className="space-y-6" padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zap-bg-alt pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <DashboardSectionIcon>
            <Bot {...dashboardSectionIconLucideProps} aria-hidden />
          </DashboardSectionIcon>
          <h3 className="font-body text-xl font-semibold tracking-tight text-zap-ink">
            AI Clone
          </h3>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200/90 bg-amber-50/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
          Beta
        </span>
      </div>

      <p className="text-pretty text-sm font-medium leading-relaxed text-zap-ink-muted">
        You earn per paid question. When you can’t reply live, an optional model (dev build: Claude
        via server API) can answer in your style under the system prompt below—real payouts and
        creator inbox wiring are still ahead.
      </p>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zap-bg-alt bg-zap-bg-alt/50 p-4 transition-colors hover:border-zap-bg-alt/25 dark:bg-zinc-900/40">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zap-bg-alt text-zap-brand focus:ring-zap-brand/30"
        />
        <span className="text-sm font-semibold text-zap-ink">Clone live on profile</span>
      </label>

      <Textarea
        variant="editorial"
        label="System prompt (persona)"
        placeholder="You are… niche, tone, boundaries, expertise."
        value={systemPrompt}
        onChange={(e) => onSystemPromptChange(e.target.value)}
        rows={6}
      />

      <Input
        variant="editorial"
        label="Price per message (USDC)"
        type="text"
        inputMode="decimal"
        value={pricePerMessageUsdc}
        onChange={(e) => onPriceChange(e.target.value)}
      />
    </Card>
  );
};

export default CloneConfig;
