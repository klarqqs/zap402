import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MessageRole = "user" | "assistant" | "system";
export type MessagePhase = "free" | "paid" | "payment_request" | "payment_confirmed";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  phase: MessagePhase;
  timestamp: number;
  imageUrl?: string;
  priceQuote?: number;
  txHash?: string;
  resultCards?: ResultCard[];
  nextActions?: NextAction[];
};

export type ResultCard = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  price?: string;
  link?: string;
  details?: string;
  meta?: Record<string, any>;
};

export type NextAction = {
  id: string;
  label: string;
  price: number;
  icon?: string;
};

export type Chat = {
  id: string;
  title: string;
  category: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  phase: "free" | "awaiting_payment" | "paid";
  pendingPrice?: number;
  pendingDetails?: string;
};

type ChatStore = {
  chats: Chat[];
  activeChatId: string | null;
  createChat: (category?: string) => string;
  addMessage: (chatId: string, msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateChat: (id: string, patch: Partial<Chat>) => void;
  setActiveChat: (id: string | null) => void;
  getActiveChat: () => Chat | null;
  deleteChat: (id: string) => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      createChat: (category = "general") => {
        const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = Date.now();
        set((s) => ({
          chats: [
            {
              id,
              title: "New conversation",
              category,
              messages: [],
              createdAt: now,
              updatedAt: now,
              phase: "free",
            },
            ...s.chats,
          ],
          activeChatId: id,
        }));
        return id;
      },
      addMessage: (chatId, msg) => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, { ...msg, id, timestamp: Date.now() }],
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
      },
      updateChat: (id, patch) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
          ),
        }));
      },
      setActiveChat: (id) => set({ activeChatId: id }),
      getActiveChat: () => {
        const { chats, activeChatId } = get();
        return chats.find((c) => c.id === activeChatId) ?? null;
      },
      deleteChat: (id) => {
        set((s) => ({
          chats: s.chats.filter((c) => c.id !== id),
          activeChatId: s.activeChatId === id ? null : s.activeChatId,
        }));
      },
    }),
    { name: "sumr-chats" }
  )
);