import React, { useState, useCallback } from "react";
import {
  CheckCircle2,
  GitCompare,
  ChevronRight,
  Zap,
  ExternalLink,
  RotateCcw,
  MessageSquare,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";

// ─── Types (mirrored from TerminalChatPage) ───────────────────────────────────

type CategoryType = "chat" | "research" | "code" | "image" | "video" | "general";

interface ConvMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId: string;
  agentName: string;
  agentProvider: string;
  timestamp: number;
  txHash?: string;
  category?: CategoryType;
  phase: "pending_payment" | "paid" | "free";
}

interface Conversation {
  id: string;
  title: string;
  category: CategoryType;
  createdAt: number;
  updatedAt: number;
  messages: ConvMessage[];
  usedAgentIds: string[];
}

interface AgentOption {
  id: string;
  name: string;
  handle: string;
  provider: string;
  category: string;
  imageUrl?: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "zap402_conversations_v2";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function shortTx(tx: string) {
  return `${tx.slice(0, 6)}…${tx.slice(-4)}`;
}

function providerColor(provider: string): string {
  const p = provider.toLowerCase();
  if (p.includes("anthropic") || p.includes("claude")) return "#f59e0b";
  if (p.includes("openai") || p.includes("gpt")) return "#10b981";
  if (p.includes("google") || p.includes("gemini")) return "#3b82f6";
  if (p.includes("perplexity")) return "#8b5cf6";
  if (p.includes("deepseek")) return "#06b6d4";
  if (p.includes("midjourney")) return "#ec4899";
  if (p.includes("runway")) return "#f97316";
  if (p.includes("meta") || p.includes("llama")) return "#60a5fa";
  return "#6b7280";
}

function providerInitials(provider: string): string {
  const map: Record<string, string> = {
    anthropic: "CL", openai: "GP", google: "GM", perplexity: "PX",
    deepseek: "DS", midjourney: "MJ", runway: "RW", meta: "MT", mistral: "MS",
  };
  const p = provider.toLowerCase();
  for (const [k, v] of Object.entries(map)) if (p.includes(k)) return v;
  return provider.slice(0, 2).toUpperCase();
}

function catMeta(cat: CategoryType) {
  const m: Record<CategoryType, { emoji: string; label: string }> = {
    chat: { emoji: "💬", label: "Chat" },
    research: { emoji: "🔬", label: "Research" },
    code: { emoji: "⌨️", label: "Code" },
    image: { emoji: "🎨", label: "Image" },
    video: { emoji: "🎬", label: "Video" },
    general: { emoji: "⚡", label: "General" },
  };
  return m[cat] ?? m.general;
}

// ─── Static agent registry for compare (subset of known agents) ──────────────
// In production this comes from useOnChainAgents — we read from localStorage here
// so PurchasesTab doesn't need the hook. It navigates to TerminalChatPage with state.

const KNOWN_AGENTS: AgentOption[] = [
  { id: "claude", name: "Claude Agent", handle: "claude_agent", provider: "Anthropic", category: "research" },
  { id: "chatgpt", name: "ChatGPT Agent", handle: "chatgpt_agent", provider: "OpenAI", category: "research" },
  { id: "gemini", name: "Gemini Agent", handle: "gemini_agent", provider: "Google", category: "research" },
  { id: "perplexity", name: "Perplexity Agent", handle: "perplexity_agent", provider: "On-chain", category: "research" },
  { id: "grok", name: "Grok Agent", handle: "grok_agent", provider: "On-chain", category: "chat" },
  { id: "deepseek", name: "DeepSeek Agent", handle: "deepseek_agent", provider: "On-chain", category: "chat" },
  { id: "llama", name: "Llama Agent", handle: "llama_agent", provider: "Meta", category: "chat" },
  { id: "codex", name: "Codex Agent", handle: "codex_agent", provider: "On-chain", category: "code" },
  { id: "cursor", name: "Cursor Agent", handle: "cursor_agent", provider: "On-chain", category: "code" },
  { id: "copilot", name: "Copilot Agent", handle: "copilot_agent", provider: "On-chain", category: "code" },
  { id: "midjourney", name: "Midjourney Agent", handle: "midjourney_agent", provider: "On-chain", category: "image" },
  { id: "flux", name: "FLUX Agent", handle: "flux_agent", provider: "On-chain", category: "image" },
  { id: "dalle", name: "DALL·E Agent", handle: "dalle_agent", provider: "OpenAI", category: "image" },
  { id: "pika", name: "Pika Agent", handle: "pika_agent", provider: "On-chain", category: "video" },
  { id: "sora", name: "Sora Agent", handle: "sora_agent", provider: "On-chain", category: "video" },
];

// ─── Compare Modal ────────────────────────────────────────────────────────────

const CompareModal: React.FC<{
  conv: Conversation;
  onSelect: (agent: AgentOption) => void;
  onClose: () => void;
}> = ({ conv, onSelect, onClose }) => {
  const availableAgents = KNOWN_AGENTS.filter(
    a => a.category === conv.category && !conv.usedAgentIds.includes(a.id)
  );

  // Fallback: show all agents not used if category has no match
  const candidates = availableAgents.length > 0
    ? availableAgents
    : KNOWN_AGENTS.filter(a => !conv.usedAgentIds.includes(a.id)).slice(0, 6);

  const { emoji, label } = catMeta(conv.category);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-zap-bg rounded-2xl border border-zap-bg-alt overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zap-bg-alt flex items-center justify-between">
          <div>
            <p className="font-body text-[13px] font-semibold text-zap-ink">
              Compare in {emoji} {label}
            </p>
            <p className="font-body text-[10px] text-zap-ink-faint mt-0.5">
              Same prompt · Different agent · New payment
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-zap-ink-faint hover:text-zap-ink transition-colors">
            ✕
          </button>
        </div>

        {candidates.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-body text-sm text-zap-ink-faint">
              You've already compared with all available agents in this category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zap-border/20 max-h-72 overflow-y-auto">
            {candidates.map(agent => (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSelect(agent)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zap-bg-alt transition-colors text-left"
              >
                <span
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
                  style={{ background: providerColor(agent.provider) }}
                >
                  {providerInitials(agent.provider)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-semibold text-zap-ink">{agent.name}</p>
                  <p className="font-body text-[10px] text-zap-ink-faint">@{agent.handle} · {agent.provider}</p>
                </div>
                <ChevronRight size={14} strokeWidth={1.75} className="text-zap-ink-faint shrink-0" />
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-zap-bg-alt">
          <p className="font-body text-[10px] text-zap-ink-faint text-center">
            A new payment will be required when you send the compare request
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Conversation Card ────────────────────────────────────────────────────────

const ConvCard: React.FC<{
  conv: Conversation;
  onResume: (conv: Conversation) => void;
  onCompare: (conv: Conversation, agent: AgentOption) => void;
}> = ({ conv, onResume, onCompare }) => {
  const [expanded, setExpanded] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const { emoji, label } = catMeta(conv.category);

  // Extract useful message counts
  const userMessages = conv.messages.filter(m => m.role === "user");
  const agentResponses = conv.messages.filter(m =>
    m.role === "assistant" && !m.content.startsWith("__TX_CONFIRMED__:")
  );
  const txMessages = conv.messages.filter(m =>
    m.role === "assistant" && m.content.startsWith("__TX_CONFIRMED__:")
  );

  // Total spent
  const totalSpent = txMessages.reduce((sum, m) => {
    const parts = m.content.split(":");
    return sum + parseFloat(parts[2] ?? "0");
  }, 0);

  // Last user prompt
  const lastUserMsg = userMessages[userMessages.length - 1];
  const lastResponse = agentResponses[agentResponses.length - 1];

  // Agents used
  const usedAgentNames = [...new Set(agentResponses.map(m => m.agentName))];

  // Available compare candidates
  const compareAvailable = KNOWN_AGENTS.filter(
    a => a.category === conv.category && !conv.usedAgentIds.includes(a.id)
  ).length > 0;

  return (
    <>
      <div className="rounded-2xl border border-zap-bg-alt bg-zap-bg-raised overflow-hidden transition-colors hover:border-zap-bg-alt">
        {/* Card header — always visible */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b border-zap-bg-alt hover:bg-zap-bg-alt transition-colors text-left"
        >
          {/* Status icon */}
          <CheckCircle2 size={13} strokeWidth={2} className="shrink-0 text-emerald-500" />

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <p className="font-body text-[13px] font-semibold text-zap-ink truncate leading-tight">
              {conv.title}
            </p>
            <p className="font-body text-[10px] text-zap-ink-faint mt-0.5">
              {emoji} {label}
              {usedAgentNames.length > 0 && ` · ${usedAgentNames.slice(0, 2).join(", ")}${usedAgentNames.length > 2 ? ` +${usedAgentNames.length - 2}` : ""}`}
              {totalSpent > 0 && ` · $${totalSpent.toFixed(2)} USDC`}
            </p>
          </div>

          {/* Time + expand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] text-zap-ink-faint hidden sm:inline">
              {timeAgo(conv.updatedAt)}
            </span>
            <ChevronRight
              size={14}
              strokeWidth={1.75}
              className={`text-zap-ink-faint transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            />
          </div>
        </button>

        {/* Expanded body */}
        {expanded && (
          <div className="px-4 py-4 space-y-4 bg-zap-bg/30">
            {/* Last prompt */}
            {lastUserMsg && (
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint mb-1.5">
                  Last prompt
                </p>
                <p className="font-body text-sm text-zap-ink-muted leading-relaxed line-clamp-3">
                  {lastUserMsg.content.replace("[Image attached]\n", "")}
                </p>
              </div>
            )}

            {/* Agent responses summary */}
            {agentResponses.length > 0 && (
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint mb-2">
                  {agentResponses.length} response{agentResponses.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {agentResponses.slice(-3).map(msg => (
                    <div key={msg.id} className="flex items-start gap-2.5">
                      <span
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[7px] font-bold text-black shrink-0 mt-0.5"
                        style={{ background: providerColor(msg.agentProvider) }}
                      >
                        {providerInitials(msg.agentProvider)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[10px] font-semibold text-zap-ink">
                          {msg.agentName}
                        </p>
                        <p className="font-body text-[11px] text-zap-ink-muted leading-relaxed line-clamp-2">
                          {msg.content}
                        </p>
                        {msg.txHash && (
                          <p className="font-mono text-[9px] text-zap-ink-faint mt-1">
                            TX · {shortTx(msg.txHash)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 pt-1 border-t border-zap-bg-alt flex-wrap">
              {totalSpent > 0 && (
                <div className="inline-flex items-center gap-1 font-body text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Zap size={11} strokeWidth={2} />
                  <span>${totalSpent.toFixed(2)} USDC spent</span>
                </div>
              )}
              <span className="font-body text-[11px] text-zap-ink-faint">
                {userMessages.length} prompt{userMessages.length !== 1 ? "s" : ""}
              </span>
              <span className="font-body text-[11px] text-zap-ink-faint">
                {formatDate(conv.createdAt)}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap pt-1">
              {/* Continue */}
              <button
                type="button"
                onClick={() => onResume(conv)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zap-ink px-4 py-2 font-body text-[12px] font-semibold text-zap-bg hover:opacity-80 transition-opacity"
              >
                <MessageSquare size={12} strokeWidth={2} />
                Continue
              </button>

              {/* Compare — always available, shows modal */}
              <button
                type="button"
                onClick={() => setShowCompare(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zap-bg-alt/60 bg-zap-bg px-4 py-2 font-body text-[12px] font-semibold text-zap-ink-muted hover:border-zap-bg-alt hover:text-zap-ink transition-all"
              >
                <GitCompare size={12} strokeWidth={2} />
                Compare in {label}
              </button>
            </div>
          </div>
        )}
      </div>

      {showCompare && (
        <CompareModal
          conv={conv}
          onSelect={agent => { setShowCompare(false); onCompare(conv, agent); }}
          onClose={() => setShowCompare(false)}
        />
      )}
    </>
  );
};

// ─── PurchasesTab ─────────────────────────────────────────────────────────────

const PurchasesTab: React.FC = () => {
  const navigate = useNavigate();
  const [conversations] = useState<Conversation[]>(loadConversations);

  const completedConvs = conversations
    .filter(c => c.messages.some(m => m.role === "assistant" && !m.content.startsWith("__TX_CONFIRMED__:")))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // Stats
  const totalDeals = completedConvs.reduce((sum, c) => {
    return sum + c.messages.filter(m => m.content.startsWith("__TX_CONFIRMED__:")).length;
  }, 0);

  const totalSpent = completedConvs.reduce((sum, c) => {
    return sum + c.messages
      .filter(m => m.content.startsWith("__TX_CONFIRMED__:"))
      .reduce((s, m) => s + parseFloat(m.content.split(":")[2] ?? "0"), 0);
  }, 0);

  const handleResume = useCallback((conv: Conversation) => {
    navigate("/terminal/chat", { state: { resumeConvId: conv.id } });
  }, [navigate]);

  const handleCompare = useCallback((conv: Conversation, agent: AgentOption) => {
    // Navigate to chat with the conversation resumed + the compare agent pre-selected
    // TerminalChatPage will see resumeConvId and load the conv, agent triggers compare flow
    navigate("/terminal/chat", {
      state: {
        resumeConvId: conv.id,
        agent,
        comparePrompt: conv.messages.filter(m => m.role === "user").slice(-1)[0]?.content ?? "",
      },
    });
  }, [navigate]);

  return (
    <div className="w-full space-y-5">
      <DashboardTabPageHeader
        kicker="HISTORY"
        title="Deal history"
        description="View all chats history here"
      />

      {/* Stats row */}
      {completedConvs.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="rounded-xl border border-zap-bg-alt bg-zap-bg-raised px-3 py-2">
            <p className="font-body text-[9px] uppercase tracking-[0.1em] text-zap-ink-faint mb-0.5">Total deals</p>
            <p className="font-body text-[18px] font-semibold text-zap-ink leading-none">{totalDeals}</p>
          </div>
          <div className="rounded-xl border border-zap-bg-alt bg-zap-bg-raised px-3 py-2">
            <p className="font-body text-[9px] uppercase tracking-[0.1em] text-zap-ink-faint mb-0.5">USDC spent</p>
            <p className="font-body text-[18px] font-semibold text-zap-ink leading-none">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-zap-bg-alt bg-zap-bg-raised px-3 py-2">
            <p className="font-body text-[9px] uppercase tracking-[0.1em] text-zap-ink-faint mb-0.5">Conversations</p>
            <p className="font-body text-[18px] font-semibold text-zap-ink leading-none">{completedConvs.length}</p>
          </div>
        </div>
      )}

      {completedConvs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zap-bg-alt px-6 py-12 text-center">
          <p className="font-body text-sm font-semibold text-zap-ink mb-1">No chat history yet</p>
          <p className="font-body text-xs text-zap-ink-muted">
            Your chats appear here after your first response.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-faint">
            {completedConvs.length} {completedConvs.length === 1 ? "conversation" : "conversations"}
          </p>
          {completedConvs.map(conv => (
            <ConvCard
              key={conv.id}
              conv={conv}
              onResume={handleResume}
              onCompare={handleCompare}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchasesTab;