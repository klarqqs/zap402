import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ImageIcon,
  Mic,
  MicOff,
  Send,
  Loader2,
  Zap,
  Square,
  ChevronDown,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MarkdownRenderer from "@/components/primitives/MarkdownRenderer";
import { useWallet } from "@/hooks/useWallet";
import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import { useZapPayment } from "@/hooks/useZapPayment";
import { useProfileStore } from "@/state/profileStore";
import { useOnChainAgents } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryType = "chat" | "research" | "code" | "image" | "video" | "general";

interface AgentOption {
  id: string;
  name: string;
  handle: string;
  provider: string;
  category: string;
  imageUrl?: string;
  walletAddress?: string;
  priceUsdc?: number;
}

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
  mediaSrc?: string;
  mediaType?: "image" | "video";
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

// ─── Category Prompt Suggestions ─────────────────────────────────────────────

const CATEGORY_PROMPTS: Record<CategoryType, string[]> = {
  chat: [
    "Give me advice on building better daily habits",
    "Help me write a compelling cold outreach message",
    "What are the best mental models for decision making?",
    "Help me prepare for a difficult conversation",
    "Suggest a 30-day personal growth challenge",
  ],
  research: [
    "Analyze the competitive landscape for fintech apps in Africa",
    "What are the biggest consumer trends shaping 2025?",
    "Give me a SWOT analysis framework for my e-commerce business",
    "Find the top 5 fastest-growing industries in emerging markets",
    "Research the best markets to launch a DTC brand in",
  ],
  code: [
    "Build a React hook for real-time data fetching with caching",
    "Write a Solidity smart contract for a simple NFT marketplace",
    "Create a Python script to automate CSV data processing",
    "Debug this TypeScript generic type error and explain the fix",
    "Design a REST API architecture for a multi-tenant SaaS app",
  ],
  image: [
    "Generate a cinematic product shot for a luxury watch brand",
    "Create a minimalist logo concept for a fintech startup",
    "Design a dark-mode UI mockup for a crypto dashboard",
    "Generate a photorealistic portrait in studio lighting",
    "Create abstract generative art with geometric patterns",
  ],
  video: [
    "Create a cinematic intro animation for my brand",
    "Animate a product showcase with smooth transitions",
    "Generate a looping motion graphic for social media",
    "Produce a dramatic title sequence with particle effects",
    "Create a short explainer video animation concept",
  ],
  general: [
    "Help me think through a complex problem step by step",
    "Summarize and extract key insights from a long document",
    "Create a structured plan for a new project",
    "Give me a framework for evaluating important decisions",
    "Help me brainstorm creative solutions to a challenge",
  ],
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CLAUDE_DEFAULT: AgentOption = {
  id: "claude-default",
  name: "Claude",
  handle: "claude_agent",
  provider: "Anthropic",
  category: "research",
  priceUsdc: 0.50,
};

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

const ACTIVE_CONV_KEY = "zap402_active_conv_id";
const DRAFT_INPUT_KEY = "zap402_draft_input";

function loadActiveConvId(): string | null {
  try { return localStorage.getItem(ACTIVE_CONV_KEY); } catch { return null; }
}
function saveActiveConvId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_CONV_KEY, id);
    else localStorage.removeItem(ACTIVE_CONV_KEY);
  } catch { }
}
function loadDraftInput(): string {
  try { return localStorage.getItem(DRAFT_INPUT_KEY) ?? ""; } catch { return ""; }
}
function saveDraftInput(val: string) {
  try { localStorage.setItem(DRAFT_INPUT_KEY, val); } catch { }
}

// ─── Category Classifier ──────────────────────────────────────────────────────

const CATEGORY_SIGNALS: Record<CategoryType, string[]> = {
  code: [
    "code", "javascript", "python", "typescript", "rust", "solidity", "function", "class",
    "debug", "error", "bug", "compile", "programming", "algorithm", "syntax", "variable",
    "loop", "implement", "script", "api", "endpoint", "database", "sql", "git", "deploy",
    "docker", "backend", "frontend", "react", "component", "hook", "async", "await", "promise",
    "array", "object", "interface", "type", "null", "undefined", "stack", "overflow", "refactor",
  ],
  image: [
    "image", "picture", "photo", "draw", "drawing", "design", "artwork", "visual", "logo",
    "illustrate", "illustration", "generate image", "create image", "render", "style",
    "color palette", "ui", "mockup", "banner", "poster", "icon", "avatar", "wallpaper",
    "midjourney", "dalle", "stable diffusion", "flux", "portrait", "landscape", "abstract",
  ],
  video: [
    "video", "movie", "clip", "animation", "motion", "scene", "footage", "edit video",
    "produce", "film", "record", "stream", "youtube", "tiktok", "reel", "sora", "runway",
    "pika", "animate", "frame", "fps", "cinematic", "montage",
  ],
  research: [
    "explain", "research", "analyze", "analysis", "define", "what is", "how does", "why",
    "theory", "concept", "information", "knowledge", "understand", "describe", "elaborate",
    "discuss", "compare", "contrast", "difference", "history", "origin", "meaning", "impact",
    "study", "report", "data", "statistics", "trends", "market", "competitive", "swot",
    "summary", "overview", "deep dive", "breakdown", "insight",
  ],
  chat: [
    "hello", "hi", "hey", "talk", "chat", "discuss", "conversation", "help me", "advice",
    "opinion", "think", "feel", "suggest", "recommend", "idea", "plan", "strategy", "what do you",
    "can you", "could you", "please", "thanks", "tell me", "show me", "give me",
  ],
  general: [],
};

const AI_VIDEOS = [
  "/mp4/ai_generated/2efbb3a7-5587-4bdb-a1a1-20dac38edf11_hd.mp4",
  "/mp4/ai_generated/27ce2a85-0476-4bbf-bdc0-e8ad69118939_hd.mp4",
  "/mp4/ai_generated/46eb54ab-5c9e-4eb7-b06d-764307949ac7_hd.mp4",
  "/mp4/ai_generated/735bc51e-7102-4eab-aa09-1c862921f1cf_hd.mp4",
  "/mp4/ai_generated/05829d7a-9f2f-4bdb-86e3-57e136991896_hd.mp4",
  "/mp4/ai_generated/b3bfcdaf-6d51-4509-8e60-65f58f515a52_hd.mp4",
  "/mp4/ai_generated/c1f5e07e-13c4-432e-9cd8-b5623b948008_hd.mp4",
  "/mp4/ai_generated/cf4abeca-f4a1-4ef3-a014-8c8961cdb722_hd.mp4",
  "/mp4/ai_generated/d6be8b7b-a399-422e-85c7-9a0083811b0e_hd.mp4",
  "/mp4/ai_generated/d9abba25-4bda-4e86-a153-54fb806efd76_hd.mp4",
  "/mp4/ai_generated/e38c30d2-1855-4a50-b511-81fff8b2ea18.mp4",
];

const AI_IMAGES = [
  "/img/ai_generated/1.jpg",
  "/img/ai_generated/2.jpg",
  "/img/ai_generated/3.jpg",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function classifyCategory(text: string): CategoryType {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const scores: Record<CategoryType, number> = {
    code: 0, image: 0, video: 0, research: 0, chat: 0, general: 0,
  };
  for (const [cat, signals] of Object.entries(CATEGORY_SIGNALS) as [CategoryType, string[]][]) {
    if (cat === "general") continue;
    for (const signal of signals) {
      if (lower.includes(signal)) {
        const earlyBonus = words.slice(0, 5).some(w => w.includes(signal.split(" ")[0])) ? 1.5 : 1;
        scores[cat] += earlyBonus;
      }
    }
  }
  if (/`[^`]+`|[a-z][A-Z]|[a-z]_[a-z]|\w+\(|\{[\s\S]*\}/.test(text)) scores.code += 3;
  if (/\bof a\b|\bstyle of\b|\bin the style\b|\ba photo\b|\ban image\b/.test(lower)) scores.image += 2;
  if (/^\s*(what|why|how|when|where|who|which|explain|describe|define)\b/.test(lower)) scores.research += 2;
  const sorted = (Object.entries(scores) as [CategoryType, number][])
    .filter(([cat]) => cat !== "general")
    .sort(([, a], [, b]) => b - a);
  const [topCat, topScore] = sorted[0];
  return topScore > 0 ? topCat : "chat";
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function timeLabel(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function shortHash(tx: string) {
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
  if (p.includes("stability")) return "#84cc16";
  if (p.includes("meta") || p.includes("llama")) return "#60a5fa";
  return "#6b7280";
}

function providerInitials(provider: string): string {
  const map: Record<string, string> = {
    anthropic: "CL", openai: "GP", google: "GM", perplexity: "PX",
    deepseek: "DS", midjourney: "MJ", runway: "RW", stability: "SB",
    meta: "MT", mistral: "MS",
  };
  const p = provider.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (p.includes(k)) return v;
  }
  return provider.slice(0, 2).toUpperCase();
}

function catMeta(cat: CategoryType) {
  const m: Record<CategoryType, { emoji: string; label: string; description: string }> = {
    chat: { emoji: "💬", label: "Chat", description: "Conversational AI" },
    research: { emoji: "🔬", label: "Research", description: "Deep analysis & synthesis" },
    code: { emoji: "⌨️", label: "Code", description: "Write, debug & review code" },
    image: { emoji: "🎨", label: "Image", description: "Generate visuals" },
    video: { emoji: "🎬", label: "Video", description: "Create video content" },
    general: { emoji: "⚡", label: "General", description: "All-purpose" },
  };
  return m[cat] ?? m.general;
}

function priceForAgent(agent: AgentOption): number {
  if (agent.priceUsdc) return agent.priceUsdc;
  const p = agent.provider.toLowerCase();
  if (p.includes("anthropic")) return 0.50;
  if (p.includes("openai")) return 0.50;
  if (p.includes("google")) return 0.40;
  if (p.includes("midjourney") || p.includes("dall")) return 0.80;
  if (p.includes("runway") || p.includes("sora") || p.includes("pika")) return 1.50;
  return 0.30;
}

// ─── localStorage Persistence ─────────────────────────────────────────────────

const STORAGE_KEY = "zap402_conversations_v2";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(convos: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
  } catch { }
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function callGroq(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("VITE_GROQ_API_KEY not set");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.75,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Groq ${res.status}: ${e?.error?.message ?? "error"}`);
  }
  const d = await res.json();
  return d.choices?.[0]?.message?.content ?? "No response.";
}

async function callClaude(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("VITE_ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Claude ${res.status}: ${e?.error?.message ?? "error"}`);
  }
  const d = await res.json();
  return d.content?.filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text).join("") ?? "No response.";
}

function buildSystemPrompt(agent: AgentOption, category: CategoryType): string {
  const { label } = catMeta(category);
  return `You are ${agent.name}, an AI agent specializing in ${label} tasks on the Zap402 pay-per-query marketplace powered by Stellar blockchain.

You operate via the x402 payment protocol — users pay USDC per query to receive your premium response.

Be direct, specific, and high-quality. Tailor your response to the ${label} category. Max 400 words unless the task genuinely requires more.

Agent profile: ${agent.name} by ${agent.provider}, handle @${agent.handle}.`;
}

async function getResponse(
  agent: AgentOption,
  category: CategoryType,
  history: { role: string; content: string }[],
  usedMediaSrcs: string[] = []
): Promise<{ text: string; fallback: boolean; mediaType?: "image" | "video"; mediaSrc?: string }> {
  const effectiveCategory =
    agent.category === "video" || agent.category === "image"
      ? (agent.category as CategoryType)
      : category;

  if (effectiveCategory === "image" || effectiveCategory === "video") {
    const pool = effectiveCategory === "video" ? AI_VIDEOS : AI_IMAGES;
    const available = pool.filter(src => !usedMediaSrcs.includes(src));
    const src = pickRandom(available.length > 0 ? available : pool);
    return {
      text: effectiveCategory === "video" ? `__MEDIA_VIDEO__:${src}` : `__MEDIA_IMAGE__:${src}`,
      fallback: true,
      mediaType: effectiveCategory,
      mediaSrc: src,
    };
  }

  const system = buildSystemPrompt(agent, category);
  const isAnthropic = agent.provider.toLowerCase().includes("anthropic") || agent.id === "claude-default";

  try {
    const text = isAnthropic
      ? await callClaude(history, system)
      : await callGroq(history, system);
    return { text, fallback: false };
  } catch (primaryErr) {
    console.warn(`[Primary model failed for ${agent.name}] Falling back to Llama:`, primaryErr);
    try {
      const fallbackSystem = `${system}\n\n[Note: Responding as a Llama-3.3 fallback on behalf of ${agent.name}]`;
      const text = await callGroq(history, fallbackSystem);
      return { text, fallback: true };
    } catch (fallbackErr) {
      throw new Error(`Both primary and fallback models failed. Last error: ${fallbackErr}`);
    }
  }
}

// ─── Agent Avatar ─────────────────────────────────────────────────────────────

const AgentAvatar: React.FC<{ agent: AgentOption; size?: number; fontSize?: number }> = ({
  agent, size = 28, fontSize = 10,
}) => (
  agent.imageUrl
    ? <img src={agent.imageUrl} alt={agent.name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
    : <span
      className="rounded-full flex items-center justify-center font-bold text-black shrink-0"
      style={{ width: size, height: size, fontSize, background: providerColor(agent.provider) }}
    >
      {providerInitials(agent.provider)}
    </span>
);

// ─── Category Discovery Panel ─────────────────────────────────────────────────
// Step 1: category pills → Step 2: filtered agent list → Step 3: prompt suggestions

type DiscoveryStep =
  | { phase: "idle" }
  | { phase: "agents"; category: CategoryType }
  | { phase: "prompts"; category: CategoryType; agent: AgentOption };

const CategoryDiscoveryPanel: React.FC<{
  allAgents: AgentOption[];
  agentsLoading: boolean;
  onSelectPrompt: (prompt: string, agent: AgentOption) => void;
}> = ({ allAgents, agentsLoading, onSelectPrompt }) => {
  const [step, setStep] = useState<DiscoveryStep>({ phase: "idle" });

  const categories: CategoryType[] = ["chat", "research", "code", "image", "video", "general"];

  const filteredAgents = step.phase !== "idle"
    ? allAgents.filter(a =>
      a.category === step.category ||
      a.category === "general" ||
      step.category === "general"
    )
    : [];

  const prompts = step.phase === "prompts"
    ? CATEGORY_PROMPTS[step.category] ?? []
    : [];

  const handleCategoryClick = (cat: CategoryType) => {
    setStep(prev =>
      prev.phase === "agents" && prev.category === cat
        ? { phase: "idle" }
        : { phase: "agents", category: cat }
    );
  };

  const handleAgentClick = (agent: AgentOption) => {
    if (step.phase === "agents") {
      setStep({ phase: "prompts", category: step.category, agent });
    }
  };

  const handleBack = () => {
    if (step.phase === "prompts") {
      setStep({ phase: "agents", category: step.category });
    } else {
      setStep({ phase: "idle" });
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (step.phase === "prompts") {
      onSelectPrompt(prompt, step.agent);
      setStep({ phase: "idle" });
    }
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      {/* Category pills row */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {categories.map(cat => {
          const { emoji, label } = catMeta(cat);
          const isActive = step.phase !== "idle" && step.category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border border-zap-bg-alt px-3.5 py-1.5 font-body text-[12px] transition-all duration-150 ${isActive
                ? "border-zap-bg-alt/60 bg-zap-brand/10 text-zap-ink"
                : "border-zap-bg-alt bg-zap-bg-raised text-zap-ink-muted hover:border-zap-bg-alt/40 hover:text-zap-ink"
                }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Expanded panel */}
      {step.phase !== "idle" && (
        <div className="rounded-2xl border border-zap-bg-alt bg-zap-bg-raised overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zap-bg-alt">
            {step.phase === "prompts" && (
              <button
                type="button"
                onClick={handleBack}
                className="text-zap-ink-faint hover:text-zap-ink transition-colors mr-1"
              >
                <ArrowLeft size={13} strokeWidth={2} />
              </button>
            )}
            <span className="font-mono text-[9px] uppercase tracking-widest text-zap-ink-faint flex-1">
              {step.phase === "agents"
                ? `${catMeta(step.category).emoji} ${catMeta(step.category).label} agents`
                : `Suggested prompts · ${step.agent.name}`}
            </span>
            <button
              type="button"
              onClick={() => setStep({ phase: "idle" })}
              className="text-zap-ink-faint hover:text-zap-ink transition-colors"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>

          {/* Agent list */}
          {step.phase === "agents" && (
            <div className="max-h-56 overflow-y-auto overscroll-contain divide-y divide-zap-border/10">
              {agentsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 size={13} className="animate-spin text-zap-ink-faint" />
                  <span className="font-body text-[11px] text-zap-ink-faint">Loading agents…</span>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="font-body text-[11px] text-zap-ink-faint">No agents in this category yet</p>
                </div>
              ) : (
                filteredAgents.map(agent => {
                  const price = priceForAgent(agent);
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleAgentClick(agent)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zap-bg-alt/60 transition-colors group border-b border-zap-bg-alt last:border-b-0"
                    >
                      {/* Avatar */}
                      <AgentAvatar agent={agent} size={30} fontSize={10} />

                      {/* Agent Info - takes available space */}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[12px] font-semibold text-zap-ink truncate">
                          {agent.name}
                        </p>
                        <p className="font-body text-[10px] text-zap-ink-faint">
                          @{agent.handle} · {agent.provider}
                        </p>
                      </div>

                      {/* Price + Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] text-zap-ink-faint">
                          ${price.toFixed(2)}/req
                        </span>
                        <ChevronDown
                          size={11}
                          strokeWidth={2}
                          className="text-zap-ink-faint -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Prompt suggestions */}
          {step.phase === "prompts" && (
            <div className="divide-y divide-zinc-800/50">
              {/* Selected agent mini header */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zap-bg-alt/30 border-b border-zap-bg-alt/70">
                <AgentAvatar agent={step.agent} size={20} fontSize={8} />
                <span className="font-body text-[11px] text-zap-ink-muted">
                  {step.agent.name} · ${priceForAgent(step.agent).toFixed(2)}/req
                </span>
              </div>

              {/* Prompts */}
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left px-4 py-3.5 hover:bg-zap-bg-alt/60 transition-colors group flex items-start gap-3 border-b border-zap-bg-alt/50 last:border-b-0"
                >
                  <span className="font-mono text-[9px] text-zap-ink-faint mt-0.5 shrink-0 w-3">
                    {i + 1}.
                  </span>
                  <p className="font-body text-[12px] text-zap-ink-muted group-hover:text-zap-ink transition-colors leading-relaxed flex-1">
                    {prompt}
                  </p>
                  <Send
                    size={11}
                    strokeWidth={2}
                    className="text-zap-ink-faint shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Payment Gate Card ────────────────────────────────────────────────────────

const PaymentGateCard: React.FC<{
  agent: AgentOption;
  price: number;
  category: CategoryType;
  onPay: () => void;
  onDecline: () => void;
  paying: boolean;
  error?: string;
}> = ({ agent, price, category, onPay, onDecline, paying, error }) => {
  const { emoji, label } = catMeta(category);

  return (
    <div className="rounded-2xl border border-zap-bg-alt bg-zap-bg-alt overflow-hidden max-w-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zap-bg-alt flex items-center gap-2.5">
        <Zap size={13} className="text-zap-brand" strokeWidth={2.5} />
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-brand">
          x402 · Payment Required
        </p>
      </div>

      {/* Agent Info */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-zap-bg-alt">
        <AgentAvatar agent={agent} size={38} fontSize={13} />
        <div className="min-w-0 flex-1">
          <p className="font-body text-[13px] font-semibold text-zap-ink truncate">
            {agent.name}
          </p>
          <p className="font-body text-[10px] text-zap-ink-faint">
            {emoji} {label} · @{agent.handle}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 pt-4 space-y-4">
        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-body text-3xl font-bold text-zap-ink">
            ${price.toFixed(2)}
          </span>
          <span className="font-body text-sm text-zap-ink-muted">USDC · Stellar</span>
        </div>

        {/* Description */}
        <p className="font-body text-[11px] text-zap-ink-muted leading-relaxed">
          Unlocked via{" "}
          <strong className="text-zap-ink">{agent.name}</strong> — payment confirmed on-chain.
        </p>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2.5">
            <p className="font-body text-xs text-red-500">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onPay}
            disabled={paying}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zap-brand py-3 font-body text-sm font-semibold text-black transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paying ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Zap size={13} strokeWidth={2.5} />
            )}
            {paying ? "Processing…" : `Pay $${price.toFixed(2)}`}
          </button>

          <button
            type="button"
            onClick={onDecline}
            disabled={paying}
            className="rounded-xl border border-zap-bg-alt px-5 font-body text-sm text-zap-ink-muted hover:text-zap-ink hover:border-zap-bg-alt transition-colors disabled:opacity-40"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Transaction Confirmed Bubble ─────────────────────────────────────────────

const TxConfirmedBubble: React.FC<{ txHash: string; agentName: string; price: number }> = ({
  txHash, agentName, price,
}) => {
  const { network } = useWallet();
  const [copied, setCopied] = useState(false);
  const explorerUrl = `https://stellar.expert/explorer/${network === "PUBLIC" ? "public" : "testnet"}/tx/${txHash}`;
  const copy = () => { navigator.clipboard.writeText(txHash); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
        <CheckCircle2 size={13} strokeWidth={2.5} className="text-emerald-500" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 max-w-sm space-y-2">
        <p className="font-body text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
          Payment confirmed — ${price.toFixed(2)} USDC sent to {agentName}
        </p>
        {/* <p className="font-mono text-[9px] text-zap-ink-faint break-all">{txHash}</p> */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zap-bg-alt bg-zap-bg px-3 py-1.5 font-body text-[11px] text-zap-ink-muted hover:text-zap-ink transition-colors"
          >
            <Copy size={11} strokeWidth={2} />
            {copied ? "Copied!" : "Copy Hash"}
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zap-bg-alt/30 bg-zap-brand/5 px-3 py-1.5 font-body text-[11px] text-zap-brand hover:bg-zap-brand/10 transition-colors"
          >
            <ExternalLink size={11} strokeWidth={2} />
            View on Explorer
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Agent Response Bubble ────────────────────────────────────────────────────

const AgentResponseBubble: React.FC<{
  msg: ConvMessage;
  isFallback?: boolean;
  compareAgents: AgentOption[];
  onCompare: (agent: AgentOption) => void;
  busy: boolean;
  isLatest: boolean;
}> = ({ msg, compareAgents, onCompare, busy, isLatest }) => {
  const { emoji, label } = catMeta(msg.category ?? "general");
  const agentColor = providerColor(msg.agentProvider);

  return (
    <div className="flex gap-3 items-start">
      <span
        className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-black mt-0.5"
        style={{ background: agentColor }}
      >
        {providerInitials(msg.agentProvider)}
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-body text-[12px] font-semibold text-zap-ink">{msg.agentName}</span>
          <span className="font-body text-[9px] text-zap-ink-faint border border-zap-bg-alt rounded-full px-1.5 py-0.5">
            {emoji} {label}
          </span>
        </div>
        {msg.mediaType === "video" && msg.mediaSrc ? (
          <video
            src={msg.mediaSrc}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-xl max-h-64 object-cover"
          />
        ) : msg.mediaType === "image" && msg.mediaSrc ? (
          <img
            src={msg.mediaSrc}
            alt="AI generated"
            className="w-full rounded-xl max-h-64 object-cover"
          />
        ) : (
          <div className="rounded-2xl rounded-tl-sm bg-zap-bg-raised border border-zap-bg-alt px-4 py-3 text-zap-ink">
            <MarkdownRenderer content={msg.content} />
          </div>
        )}
        <p className="font-mono text-[9px] text-zap-ink-faint">
          {timeLabel(msg.timestamp)}
          {msg.txHash && ` · TX ${shortHash(msg.txHash)}`}
        </p>
        {isLatest && compareAgents.length > 0 && (
          <div className="pt-1 space-y-2">
            <p className="font-body text-[10px] text-zap-ink-faint uppercase tracking-[0.1em]">
              Compare in {label}:
            </p>
            <div className="flex flex-wrap gap-2">
              {compareAgents.map(ca => (
                <button
                  key={ca.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onCompare(ca)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zap-bg-alt bg-zap-bg px-3 py-1.5 font-body text-[11px] text-zap-ink-muted hover:border-zap-bg-alt/60 hover:text-zap-ink transition-all disabled:opacity-40"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: providerColor(ca.provider) }}
                  />
                  {ca.name}
                  <span className="opacity-50 text-[9px]">${priceForAgent(ca).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC<{ agentName: string }> = ({ agentName }) => (
  <div className="flex gap-3 items-start">
    <div className="shrink-0 h-7 w-7 rounded-full bg-zap-brand flex items-center justify-center">
      <Zap size={11} strokeWidth={2.5} className="text-black" />
    </div>
    <div className="rounded-2xl rounded-tl-sm bg-zap-bg-raised border border-zap-bg-alt px-4 py-3">
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-zap-ink-faint animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
        <span className="font-body text-[10px] text-zap-ink-faint ml-1">{agentName} is thinking…</span>
      </div>
    </div>
  </div>
);

// ─── Voice Input Bar ──────────────────────────────────────────────────────────

const VoiceInputBar: React.FC<{
  state: "connecting" | "listening" | "processing";
  transcript: string;
  onStop: () => void;
}> = ({ state, transcript, onStop }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="flex items-center gap-[3px] h-5 shrink-0">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${state === "listening" ? "bg-zap-brand" : "bg-zap-border"}`}
          style={{
            height: state === "listening" ? `${30 + Math.sin(i * 0.9) * 50}%` : "30%",
            animationName: state === "listening" ? "waveBar" : "none",
            animationDuration: `${0.4 + (i % 5) * 0.1}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
    <span className="flex-1 font-body text-sm text-zap-ink-muted truncate italic">
      {transcript ? `"${transcript}"` : state === "connecting" ? "Connecting…" : state === "processing" ? "Processing…" : "Listening…"}
    </span>
    <button
      type="button"
      onClick={onStop}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-zap-bg-alt px-3 py-1.5 font-body text-xs text-zap-ink-muted hover:text-zap-ink transition-colors"
    >
      <Square size={9} strokeWidth={2} /> Stop
    </button>
    <style>{`@keyframes waveBar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
  </div>
);

// ─── Input Bar ────────────────────────────────────────────────────────────────
// AgentSelector removed — replaced with plain text agent name + price display

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onVoiceToggle: () => void;
  onImageAttach: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  busy: boolean;
  attachedImage: string | null;
  voiceState: "idle" | "connecting" | "listening" | "processing";
  transcript: string;
  selectedAgent: AgentOption;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  placeholder?: string;
}

const InputBar: React.FC<InputBarProps> = ({
  value, onChange, onSend, onVoiceToggle, onImageAttach, onImageRemove,
  busy, attachedImage, voiceState, transcript,
  selectedAgent, textareaRef, fileInputRef, placeholder = "Ask anything…",
}) => {
  const isVoice = voiceState !== "idle";
  const price = priceForAgent(selectedAgent);


  return (
    <div className="w-full">
      {attachedImage && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative h-12 w-12 rounded-lg overflow-hidden">
            <img src={attachedImage} alt="Attached" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
            >
              <X size={11} className="text-white" />
            </button>
          </div>
          <span className="font-body text-xs text-zap-ink-muted">Image attached</span>
        </div>
      )}
      <div className="rounded-2xl bg-zap-bg-raised overflow-hidden focus-within:ring-1 focus-within:ring-zap-brand/20 transition-all">
        {isVoice ? (
          <VoiceInputBar
            state={voiceState as "connecting" | "listening" | "processing"}
            transcript={transcript}
            onStop={onVoiceToggle}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder={placeholder}
            rows={1}
            disabled={busy}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-3 font-body text-sm text-zap-ink placeholder:text-zap-ink-faint outline-none border-none ring-0 focus:ring-0 focus:outline-none"
          />
        )}
        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
          {/* Left: image + voice */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || isVoice}
              className="rounded-lg p-2 text-zap-ink-faint hover:text-zap-ink hover:bg-zap-bg-alt transition-colors disabled:opacity-40"
            >
              <ImageIcon size={15} strokeWidth={1.75} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageAttach} />
            <button
              type="button"
              onClick={onVoiceToggle}
              disabled={busy}
              className={`rounded-lg p-2 transition-colors disabled:opacity-40 ${isVoice ? "text-zap-brand" : "text-zap-ink-faint hover:text-zap-ink hover:bg-zap-bg-alt"}`}
            >
              {isVoice ? <MicOff size={15} strokeWidth={1.75} /> : <Mic size={15} strokeWidth={1.75} />}
            </button>
          </div>

          {/* Right: agent label (plain text) + send */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: providerColor(selectedAgent.provider) }}
              />
              <span className="font-body text-[11px] text-zap-ink-muted truncate max-w-[80px]">
                {selectedAgent.name}
              </span>
              <span className="font-mono text-[10px] text-zap-ink-faint">
                ${price.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={onSend}
              disabled={(!value.trim() && !isVoice) || busy}
              className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-zap-ink text-zap-bg transition-opacity hover:opacity-80 disabled:opacity-30"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center font-body text-[10px] text-zap-ink-faint">Powered by x402 on Stellar</p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TerminalChatPage: React.FC = () => {
  const { connected } = useWallet();
  const openWalletConnect = useOpenWalletConnect();
  const { payToAsk } = useZapPayment();
  const profile = useProfileStore(s => s.profile);
  const navigate = useNavigate();
  const location = useLocation();

  const { agents: rawAgents, loading: agentsLoading } = useOnChainAgents({ onlyAgents: true });
  const allAgents: AgentOption[] = rawAgents.length > 0
    ? rawAgents.map(a => ({
      id: a.id, name: a.name, handle: a.handle,
      provider: a.provider, category: a.category,
      imageUrl: a.imageUrl, priceUsdc: 0.50,
    }))
    : [CLAUDE_DEFAULT];

  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentOption>(CLAUDE_DEFAULT);

  const [pendingPayment, setPendingPayment] = useState<{
    convId: string;
    agent: AgentOption;
    prompt: string;
    price: number;
    category: CategoryType;
    history: { role: string; content: string }[];
  } | null>(null);


  const currentAgent =
    pendingPayment?.agent || selectedAgent;
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "connecting" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [fallbackIds, setFallbackIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceLoopRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const isCenterState = !activeConv || activeConv.messages.length === 0;

  useEffect(() => { saveConversations(conversations); }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length, busy, pendingPayment]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; }
  }, [input]);

  useEffect(() => {
    const state = location.state as {
      agent?: AgentOption;
      resumeConvId?: string;
      newChat?: boolean;
    } | null;
    if (!state) return;
    if (state.newChat) {
      setPendingPayment(null);
      setPaymentError(null);
      setActiveConvId(null);
      setInput("");
      setAttachedImage(null);
      setBusy(false);
      return;
    }
    if (state.agent) setSelectedAgent(state.agent);
    if (state.resumeConvId) setActiveConvId(state.resumeConvId);
  }, [location.state]);

  const addMessageToConv = useCallback((convId: string, msg: ConvMessage) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return {
        ...c,
        messages: [...c.messages, msg],
        updatedAt: Date.now(),
        usedAgentIds: msg.role === "assistant"
          ? [...new Set([...c.usedAgentIds, msg.agentId])]
          : c.usedAgentIds,
      };
    }));
  }, []);

  const startNewConversation = useCallback(() => {
    setPendingPayment(null);
    setPaymentError(null);
    setActiveConvId(null);
    setInput("");
    setAttachedImage(null);
    setBusy(false);
    saveActiveConvId(null);
    saveDraftInput("");
  }, []);

  const queueRequest = useCallback((
    convId: string,
    agent: AgentOption,
    prompt: string,
    category: CategoryType,
    history: { role: string; content: string }[],
  ) => {
    const price = priceForAgent(agent);
    setPendingPayment({ convId, agent, prompt, price, category, history });
    setPaymentError(null);
  }, []);

  const handleSend = useCallback(async (overrideText?: string, overrideAgent?: AgentOption) => {
    const text = (overrideText ?? input).trim();
    if (!text || busy) return;
    if (!connected) { openWalletConnect(); return; }

    const agent = overrideAgent ?? selectedAgent;
    const category =
      agent.category && agent.category !== "general"
        ? (agent.category as CategoryType)
        : classifyCategory(text);

    setInput("");
    saveDraftInput("");
    setAttachedImage(null);

    let convId = activeConvId;
    if (!convId) {
      convId = uid();
      const newConv: Conversation = {
        id: convId,
        title: text.slice(0, 50) + (text.length > 50 ? "…" : ""),
        category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        usedAgentIds: [],
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(convId);
    }

    const userMsg: ConvMessage = {
      id: uid(),
      role: "user",
      content: attachedImage ? `[Image attached]\n${text}` : text,
      agentId: agent.id,
      agentName: agent.name,
      agentProvider: agent.provider,
      timestamp: Date.now(),
      category,
      phase: "pending_payment",
    };
    addMessageToConv(convId, userMsg);

    const history: { role: string; content: string }[] = [
      { role: "user", content: text },
    ];

    queueRequest(convId, agent, text, category, history);
  }, [input, busy, connected, selectedAgent, activeConvId, attachedImage, openWalletConnect, addMessageToConv, queueRequest]);

  // ─── Inside TerminalChatPage component ─────────────────────────────────────

  const handleDiscoverySelect = useCallback((
    prompt: string,
    agent: AgentOption
  ) => {
    // Force a completely fresh conversation (same as "New chat" button)
    startNewConversation();
    setSelectedAgent(agent);

    // Tiny delay to let state settle, then send
    setTimeout(() => {
      void handleSend(prompt, agent);
    }, 10);
  }, [startNewConversation, handleSend]);

  const handleConfirmPay = useCallback(async () => {
    if (!pendingPayment || paying) return;
    const { convId, agent, prompt, price, category, history } = pendingPayment;

    setPaying(true);
    setPaymentError(null);

    let txHash: string | null = null;
    try {
      const recipientAddress = agent.walletAddress ?? "GAEJDS76I7ZDTJCOWPQVY777AGAQK56HNBPPWL2H64JSPPBBXMOBUYUI";
      txHash = await payToAsk(recipientAddress, prompt, price.toFixed(2));
      if (!txHash) throw new Error("Payment failed — no transaction hash returned.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = msg.includes("InsufficientBalance") || msg.includes("#10")
        ? "Insufficient wallet balance. Please top up and retry."
        : msg.includes("Contract")
          ? "Smart contract error. Please check your wallet and retry."
          : "Payment failed. Please try again.";
      setPaymentError(friendly);
      setPaying(false);
      return;
    }

    setPendingPayment(null);
    setPaying(false);

    const txMsg: ConvMessage = {
      id: uid(),
      role: "assistant",
      content: `__TX_CONFIRMED__:${txHash}:${price}`,
      agentId: agent.id,
      agentName: agent.name,
      agentProvider: agent.provider,
      timestamp: Date.now(),
      txHash,
      category,
      phase: "paid",
    };
    addMessageToConv(convId, txMsg);
    setBusy(true);

    try {
      const usedMediaSrcs = conversations
        .find(c => c.id === convId)?.messages
        .map(m => m.mediaSrc)
        .filter(Boolean) as string[] ?? [];

      const { text: responseText, fallback, mediaType, mediaSrc } = await getResponse(agent, category, history, usedMediaSrcs);
      const responseMsg: ConvMessage = {
        id: uid(),
        role: "assistant",
        content: responseText,
        agentId: agent.id,
        agentName: agent.name,
        agentProvider: agent.provider,
        timestamp: Date.now(),
        txHash,
        category,
        phase: "paid",
        mediaSrc,
        mediaType,
      };
      if (fallback) setFallbackIds(prev => new Set([...prev, responseMsg.id]));
      addMessageToConv(convId, responseMsg);
    } catch {
      addMessageToConv(convId, {
        id: uid(),
        role: "assistant",
        content: "Failed to get a response. Your payment was processed — please try resending your prompt.",
        agentId: agent.id,
        agentName: agent.name,
        agentProvider: agent.provider,
        timestamp: Date.now(),
        txHash,
        category,
        phase: "paid",
      });
    }

    setBusy(false);
  }, [pendingPayment, paying, payToAsk, addMessageToConv, conversations]);

  const handleDeclinePay = useCallback(() => {
    setPendingPayment(null);
    setPaymentError(null);
  }, []);

  const handleCompare = useCallback((compareAgent: AgentOption) => {
    if (!activeConv || busy) return;
    if (!connected) { openWalletConnect(); return; }
    const lastUserMsg = [...activeConv.messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;
    const prompt = lastUserMsg.content.replace("[Image attached]\n", "");
    const category =
      compareAgent.category && compareAgent.category !== "general"
        ? (compareAgent.category as CategoryType)
        : lastUserMsg.category ?? classifyCategory(prompt);
    const history: { role: string; content: string }[] = [{ role: "user", content: prompt }];
    queueRequest(activeConv.id, compareAgent, prompt, category, history);
  }, [activeConv, busy, connected, openWalletConnect, queueRequest]);

  const getCompareAgents = useCallback((conv: Conversation, responseCategory: CategoryType): AgentOption[] => {
    return allAgents
      .filter(a =>
        (a.category === responseCategory || responseCategory === "general" || a.category === "general") &&
        !conv.usedAgentIds.includes(a.id)
      )
      .slice(0, 5);
  }, [allAgents]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 600));
    u.rate = 1.05;
    const t = setTimeout(() => onEnd?.(), 15000);
    u.onend = () => { clearTimeout(t); onEnd?.(); };
    u.onerror = () => { clearTimeout(t); onEnd?.(); };
    window.speechSynthesis.speak(u);
  }, []);

  const startVoiceRound = useCallback(async () => {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setVoiceState("connecting");
    setTranscript(""); transcriptRef.current = "";
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setVoiceState("idle"); voiceLoopRef.current = false; return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    recognitionRef.current = rec;
    rec.onstart = () => setVoiceState("listening");
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t); transcriptRef.current = t;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => { if (transcriptRef.current.trim()) rec.stop(); }, 3000);
    };
    rec.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const cap = transcriptRef.current.trim();
      setVoiceState("processing");
      if (cap && voiceLoopRef.current) {
        setInput(cap);
        void handleSend(cap);
        if (voiceLoopRef.current) setTimeout(() => void startVoiceRound(), 500);
      } else { setVoiceState("idle"); voiceLoopRef.current = false; }
    };
    rec.onerror = () => { setVoiceState("idle"); voiceLoopRef.current = false; };
    rec.start();
  }, [handleSend]);

  const handleVoiceToggle = useCallback(() => {
    if (voiceState !== "idle") {
      voiceLoopRef.current = false;
      recognitionRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      window.speechSynthesis?.cancel();
      setVoiceState("idle"); setTranscript(""); transcriptRef.current = "";
    } else {
      voiceLoopRef.current = true;
      void startVoiceRound();
    }
  }, [voiceState, startVoiceRound]);

  const [greeting] = useState(() => {
    const h = new Date().getHours();
    const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
    const name = profile?.displayName?.split(" ")[0] ?? profile?.username ?? "";
    return `Good ${time}${name ? `, ${name}` : ""}`;
  });

  const renderMessage = (msg: ConvMessage, conv: Conversation, idx: number) => {
    if (msg.content.startsWith("__TX_CONFIRMED__:")) {
      const parts = msg.content.split(":");
      const txHash = parts[1];
      const price = parseFloat(parts[2] ?? "0");
      return <TxConfirmedBubble key={msg.id} txHash={txHash} agentName={msg.agentName} price={price} />;
    }

    if (msg.role === "user") {
      return (
        <div key={msg.id} className="flex gap-3 flex-row-reverse items-start">
          <div className="shrink-0 h-7 w-7 rounded-full bg-zap-ink flex items-center justify-center text-[9px] font-bold text-zap-bg mt-0.5">
            YOU
          </div>
          <div className="max-w-[78%] space-y-1">
            <div className="rounded-2xl rounded-tr-sm bg-zap-ink px-4 py-3 font-body text-sm text-zap-bg leading-relaxed whitespace-pre-wrap">
              {msg.content.replace("[Image attached]\n", "")}
              {msg.content.startsWith("[Image attached]") && (
                <span className="block mt-1 text-[10px] opacity-60">📎 Image attached</span>
              )}
            </div>
            <p className="font-mono text-[9px] text-zap-ink-faint text-right">{timeLabel(msg.timestamp)}</p>
          </div>
        </div>
      );
    }

    const assistantMessages = conv.messages.filter(m =>
      m.role === "assistant" && !m.content.startsWith("__TX_CONFIRMED__:")
    );
    const isLatest = assistantMessages[assistantMessages.length - 1]?.id === msg.id;
    const compareAgents = isLatest ? getCompareAgents(conv, msg.category ?? "general") : [];
    const isFallback = fallbackIds.has(msg.id);

    return (
      <AgentResponseBubble
        key={msg.id}
        msg={msg}
        isFallback={isFallback}
        compareAgents={compareAgents}
        onCompare={handleCompare}
        busy={busy || !!pendingPayment}
        isLatest={isLatest}
      />
    );
  };

  const inputBarProps = {
    value: input,
    onChange: setInput,
    onSend: () => void handleSend(),
    onVoiceToggle: handleVoiceToggle,
    onImageAttach: (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => setAttachedImage(r.result as string);
      r.readAsDataURL(f);
      e.target.value = "";
    },
    onImageRemove: () => setAttachedImage(null),
    busy,
    attachedImage,
    voiceState,
    transcript,
    selectedAgent,
    textareaRef,
    fileInputRef,
  };

  return (
    <div className="h-screen flex flex-col">
      <div
        className={`mx-auto w-full max-w-2xl flex flex-col flex-1 ${isCenterState ? "min-h-0" : "min-h-0"
          }`}
      >
        {/* ── CENTER STATE ── */}
        {isCenterState && (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold text-zap-ink tracking-tight mb-1">
                {greeting}
              </h1>
              <p className="font-body text-sm text-zap-ink-muted">
                Pay-per-query AI. One prompt · One payment · On-chain receipt.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <InputBar
                {...inputBarProps}
                selectedAgent={currentAgent}
                placeholder={`Ask ${currentAgent.name} anything…`}
              />
            </div>

            {/* Category discovery: pills → agents → prompts */}
            <CategoryDiscoveryPanel
              allAgents={allAgents}
              agentsLoading={agentsLoading}
              onSelectPrompt={handleDiscoverySelect}
            />
          </div>
        )}

        {/* ── ACTIVE CHAT ── */}
        {!isCenterState && activeConv && (
          <div className="flex flex-col flex-1 min-h-0 pt-20">
            <div className="flex items-center gap-3 py-3 border-b border-zap-bg-alt mb-4 shrink-0">
              <div className="flex-1 min-w-0">
                <p className="font-body text-[13px] font-semibold text-zap-ink uppercase truncate">
                  {activeConv.title}
                </p>
                <p className="font-body text-[10px] text-zap-ink-faint">
                  {catMeta(activeConv.category).emoji} {catMeta(activeConv.category).label}
                  {" · "}
                  {activeConv.usedAgentIds.length} agent{activeConv.usedAgentIds.length !== 1 ? "s" : ""} used
                </p>
              </div>
              <button
                type="button"
                onClick={startNewConversation}
                className="inline-flex items-center gap-1.5 rounded-full border border-zap-bg-alt bg-zap-bg-alt px-3 py-1.5 font-body text-[14px] text-zap-ink-muted hover:border-zap-bg-alt hover:text-zap-ink transition-all"
              >
                <Plus size={14} strokeWidth={2} /> New
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-4 space-y-4">
              {activeConv.messages.map((msg, idx) => renderMessage(msg, activeConv, idx))}

              {pendingPayment && pendingPayment.convId === activeConv.id && (
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 h-7 w-7 rounded-full bg-zap-brand flex items-center justify-center mt-0.5">
                    <Zap size={11} strokeWidth={2.5} className="text-black" />
                  </div>
                  <PaymentGateCard
                    agent={pendingPayment.agent}
                    price={pendingPayment.price}
                    category={pendingPayment.category}
                    onPay={handleConfirmPay}
                    onDecline={handleDeclinePay}
                    paying={paying}
                    error={paymentError ?? undefined}
                  />
                </div>
              )}

              {busy && <TypingIndicator agentName={selectedAgent.name} />}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 pt-3 pb-2 border-t border-zap-bg-alt">
              <InputBar
                {...inputBarProps}
                selectedAgent={currentAgent}
                placeholder={`Continue with ${currentAgent.name}…`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalChatPage;