// src/state/agentStore.ts
// Global Zustand store so selected agent syncs across ALL pages

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgentOption {
  id: string;
  name: string;
  handle: string;
  provider: string;
  category: string;
  imageUrl?: string;
  walletAddress?: string;
  priceUsdc?: number;
}

const CLAUDE_DEFAULT: AgentOption = {
  id: "claude-default",
  name: "Claude",
  handle: "claude_agent",
  provider: "Anthropic",
  category: "research",
  priceUsdc: 0.02,
};

interface AgentStore {
  selectedAgent: AgentOption;
  setSelectedAgent: (agent: AgentOption) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      selectedAgent: CLAUDE_DEFAULT,
      setSelectedAgent: (agent) => set({ selectedAgent: agent }),
    }),
    {
      name: "zap402_selected_agent",
    }
  )
);