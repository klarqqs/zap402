import React from "react";
import { useNavigate } from "react-router-dom";

import Card from "@/components/primitives/Card";
import { useInteractionHistoryStore } from "@/state/interactionHistoryStore";

const InteractionHistoryPanel: React.FC = () => {
  const navigate = useNavigate();
  const journeys = useInteractionHistoryStore((s) => s.journeys);
  const setActiveJourneyId = useInteractionHistoryStore((s) => s.setActiveJourneyId);
  const completedJourneys = journeys.filter((journey) => journey.events.length > 0);

  if (completedJourneys.length === 0) {
    return (
      <Card variant="editorial" className="space-y-2">
        <p className="font-body text-sm font-semibold text-zap-ink">No interactions yet</p>
        <p className="text-sm text-zap-ink-muted">
          History appears after at least one chat/request event is recorded.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {completedJourneys.map((journey) => (
        <Card key={journey.id} variant="editorial" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-body text-sm font-semibold text-zap-ink">{journey.title}</p>
            <span className="text-zap-ink-faint">·</span>
            <span className="font-body text-[11px] uppercase tracking-[0.1em] text-zap-ink-muted">
              {journey.type === "single-model" ? "Single model" : "Multi model compare"}
            </span>
          </div>
          <p className="font-body text-xs text-zap-ink-faint">
            Models: {journey.modelHandles.join(", ")} · {journey.events.length} events
          </p>
          <div className="flex justify-end border-t border-[var(--card-border-soft)] pt-3">
            <button
              type="button"
              onClick={() => {
                setActiveJourneyId(journey.id);
                navigate("/terminal/chat");
              }}
              className="inline-flex rounded-full border border-zap-bg-alt bg-zap-bg-alt px-3 py-1.5 font-body text-xs font-semibold text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay"
            >
              Resume conversation
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default InteractionHistoryPanel;
