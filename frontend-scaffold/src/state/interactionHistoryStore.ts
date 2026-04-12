import { create } from "zustand";

export type InteractionModel = string;

export type InteractionJourneyType = "single-model" | "multi-model-compare";

export type InteractionEvent = {
  id: string;
  role: "user" | "assistant";
  model: InteractionModel;
  contentType: "chat" | "request" | "content";
  text: string;
  promptKey?: string;
  createdAt: number;
};

export type InteractionJourney = {
  id: string;
  startedAt: number;
  updatedAt: number;
  type: InteractionJourneyType;
  source: "discover" | "chat";
  title: string;
  modelHandles: string[];
  events: InteractionEvent[];
};

type InteractionHistoryState = {
  journeys: InteractionJourney[];
  activeJourneyId: string | null;
  startJourney: (
    input: Pick<InteractionJourney, "type" | "source" | "title" | "modelHandles">,
  ) => string;
  setActiveJourneyId: (journeyId: string | null) => void;
  upsertJourney: (journey: InteractionJourney) => void;
  addEvent: (
    journeyId: string,
    event: Omit<InteractionEvent, "id" | "createdAt">,
  ) => void;
};

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function compactText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 56);
}

function buildSmartJourneyTitle(events: InteractionEvent[]): string | null {
  const firstUser = events.find((e) => e.role === "user" && e.text.trim());
  if (!firstUser) return null;
  return `Ask: ${compactText(firstUser.text)}`;
}

export const useInteractionHistoryStore = create<InteractionHistoryState>(
  (set) => ({
    journeys: [],
    activeJourneyId: null,
    startJourney: (input) => {
      const id = makeId("journey");
      const now = Date.now();
      const journey: InteractionJourney = {
        id,
        startedAt: now,
        updatedAt: now,
        type: input.type,
        source: input.source,
        title: input.title,
        modelHandles: input.modelHandles,
        events: [],
      };
      set((state) => ({
        journeys: [journey, ...state.journeys],
        activeJourneyId: id,
      }));
      return id;
    },
    setActiveJourneyId: (journeyId) => set(() => ({ activeJourneyId: journeyId })),
    upsertJourney: (journey) =>
      set((state) => {
        const idx = state.journeys.findIndex((j) => j.id === journey.id);
        if (idx === -1) return { journeys: [journey, ...state.journeys] };
        const next = [...state.journeys];
        next[idx] = journey;
        return { journeys: next.sort((a, b) => b.updatedAt - a.updatedAt) };
      }),
    addEvent: (journeyId, event) =>
      set((state) => {
        const next = state.journeys.map((j) => {
          if (j.id !== journeyId) return j;
          const now = Date.now();
          return {
            ...j,
            updatedAt: now,
            title:
              buildSmartJourneyTitle([
                ...j.events,
                { ...event, id: "preview", createdAt: now },
              ]) ?? j.title,
            modelHandles: j.modelHandles.includes(event.model)
              ? j.modelHandles
              : [...j.modelHandles, event.model],
            events: [
              ...j.events,
              { ...event, id: makeId("event"), createdAt: now },
            ],
          };
        });
        return { journeys: next.sort((a, b) => b.updatedAt - a.updatedAt) };
      }),
  }),
);
