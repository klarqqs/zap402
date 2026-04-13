// src/pages/ZapPage.tsx
// FIXES:
// 1. "Try agent" button starts fresh conversation with agent pre-set (no welcome message)
// 2. Sample prompt clicks send promptText to chat so conversation starts immediately
// 3. Agent synced globally via useAgentStore so it persists across pages

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Zap,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  Activity,
  Code2,
  Image,
  MessageSquare,
  Video,
  BarChart2,
  Shield,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LucideIcon } from 'lucide-react';
import PageContainer from "@/components/layout/PageContainer";
import Loader from "@/components/primitives/Loader";
import Avatar from "@/components/primitives/Avatar";
import Card from "@/components/primitives/Card";
import { useWallet, useContract } from "@/hooks";
import ErrorState from "@/components/feedback/ErrorState";
import { categorizeError } from "@/utils/error";
import { TERMINAL_DEFAULT_PATH } from "@/constants/terminalNav";
import { Profile } from "@/types/contract";
import { usePageTitle } from "@/hooks/usePageTitle";
import CreatorNotFound from "@/components/zap/CreatorNotFound";
import NotFoundPage from "@/pages/NotFoundPage";
import CreatorSocialIcons from "@/components/creator/CreatorSocialIcons";
import { collectCreatorSocialLinks } from "@/utils/creatorSocialLinks";
import { useProfileStore } from "@/state/profileStore";
import { useWalletStore } from "@/state/walletStore";
import { stellarExpertAccountUrl, truncateAddress } from "@/utils/format";
import { useAgentStore } from "@/state/agentStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryType = "chat" | "research" | "code" | "image" | "video" | "general";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return "#f59e0b";
}

function detectCategory(bio: string, displayName: string): CategoryType {
  const seed = `${bio} ${displayName}`.toLowerCase();
  if (/(code|program|develop|engineer|script|debug|api|backend|frontend|solidity|rust|python|javascript)/.test(seed)) return "code";
  if (/(image|photo|visual|design|art|illustrat|logo|midjourney|dalle|flux|stable diffusion)/.test(seed)) return "image";
  if (/(video|film|clip|animation|motion|runway|pika|sora)/.test(seed)) return "video";
  if (/(research|analyz|data|market|competi|report|insight|study|deep dive)/.test(seed)) return "research";
  return "chat";
}

function detectProvider(bio: string, displayName: string): string {
  const seed = `${bio} ${displayName}`.toLowerCase();
  if (seed.includes("anthropic") || seed.includes("claude")) return "Anthropic";
  if (seed.includes("openai") || seed.includes("gpt") || seed.includes("codex") || seed.includes("dalle")) return "OpenAI";
  if (seed.includes("google") || seed.includes("gemini") || seed.includes("veo")) return "Google";
  if (seed.includes("meta") || seed.includes("llama")) return "Meta";
  if (seed.includes("mistral")) return "Mistral";
  if (seed.includes("deepseek")) return "DeepSeek";
  if (seed.includes("perplexity")) return "Perplexity";
  if (seed.includes("midjourney")) return "Midjourney";
  if (seed.includes("runway")) return "Runway";
  if (seed.includes("pika")) return "Pika";
  if (seed.includes("stability") || seed.includes("sdxl")) return "Stability AI";
  return "On-chain";
}

function priceForCategory(cat: CategoryType): number {
  const prices: Record<CategoryType, number> = {
    chat: 0.10,
    research: 0.10,
    code: 0.15,
    image: 0.50,
    video: 0.75,
    general: 0.10,
  };
  return prices[cat];
}

const CATEGORY_META: Record<CategoryType, { emoji: string; label: string; description: string; Icon: LucideIcon }> = {
  chat: { emoji: "💬", label: "Chat", description: "Conversational AI — questions, reasoning, writing", Icon: MessageSquare },
  research: { emoji: "🔬", label: "Research", description: "Deep synthesis, analysis & competitive intelligence", Icon: BarChart2 },
  code: { emoji: "⌨️", label: "Code", description: "Write, debug & review code in any language", Icon: Code2 },
  image: { emoji: "🎨", label: "Image", description: "Generate stunning visuals from text prompts", Icon: Image },
  video: { emoji: "🎬", label: "Video", description: "Create short AI video clips from descriptions", Icon: Video },
  general: { emoji: "⚡", label: "General", description: "All-purpose AI tasks", Icon: Activity },
};

function buildCapabilities(category: CategoryType, bio: string): string[] {
  const seed = bio.toLowerCase();
  const base: Record<CategoryType, string[]> = {
    chat: [
      "Answer complex questions with nuance",
      "Draft professional emails & messages",
      "Brainstorm ideas & creative concepts",
      "Summarize long documents instantly",
      "Explain technical topics in plain language",
      "Help with strategy & decision-making",
    ],
    research: [
      "Deep competitive landscape analysis",
      "Market sizing & trend identification",
      "Synthesize findings from multiple sources",
      "Generate structured research reports",
      "SWOT & strategic framework analysis",
      "Financial & economic research",
    ],
    code: [
      "Write production-ready code in any language",
      "Debug errors and fix broken logic",
      "Code review with improvement suggestions",
      "Design system architecture & APIs",
      "Smart contract development (Soroban, Solidity)",
      "Convert specifications to working code",
    ],
    image: [
      "Generate photorealistic images from prompts",
      "Create logos, icons & brand assets",
      "Design UI mockups and wireframes",
      "Produce concept art and illustrations",
      "Portrait and product photography styles",
      "Style transfer and image variations",
    ],
    video: [
      "Generate short cinematic video clips",
      "Create social media reels & content",
      "Produce explainer and promo videos",
      "Animate still images into motion",
      "Apply visual effects and styles",
      "Create loop animations & GIFs",
    ],
    general: [
      "Handle multi-step reasoning tasks",
      "Translate content across languages",
      "Format and structure complex data",
      "Generate creative and factual content",
      "Assist with planning and organization",
      "Provide expert-level task completion",
    ],
  };

  const caps = [...base[category]];
  if (seed.includes("stellar") || seed.includes("blockchain") || seed.includes("web3")) {
    caps.push("Web3 & blockchain-native tasks");
  }
  if (seed.includes("nigeria") || seed.includes("africa") || seed.includes("lagos")) {
    caps.push("African market & fintech expertise");
  }
  return caps.slice(0, 6);
}

function buildStats(category: CategoryType): { label: string; value: string }[] {
  const base: Record<CategoryType, { label: string; value: string }[]> = {
    chat: [{ label: "Avg response", value: "~2s" }, { label: "Context window", value: "128k" }, { label: "Languages", value: "95+" }],
    research: [{ label: "Avg response", value: "~4s" }, { label: "Context window", value: "200k" }, { label: "Sources cited", value: "Yes" }],
    code: [{ label: "Avg response", value: "~3s" }, { label: "Languages", value: "50+" }, { label: "Code review", value: "Yes" }],
    image: [{ label: "Generation time", value: "~15s" }, { label: "Resolution", value: "1024px" }, { label: "Variants", value: "4x" }],
    video: [{ label: "Generation time", value: "~60s" }, { label: "Max duration", value: "30s" }, { label: "Formats", value: "MP4" }],
    general: [{ label: "Avg response", value: "~2s" }, { label: "Context window", value: "128k" }, { label: "Modes", value: "Multi" }],
  };
  return base[category];
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

const StatChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col items-center gap-0.5 rounded-xl border border-zap-bg-alt bg-zap-bg px-4 py-3 min-w-[80px]">
    <span className="font-body text-[18px] font-semibold text-zap-ink leading-none">{value}</span>
    <span className="font-body text-[9px] uppercase tracking-[0.1em] text-zap-ink-faint mt-0.5">{label}</span>
  </div>
);

// ─── Sample Prompts ───────────────────────────────────────────────────────────

const SAMPLE_PROMPTS: Record<CategoryType, string[]> = {
  chat: ["Help me write a cold outreach email", "What's the best way to negotiate salary?", "Explain quantum computing simply", "Review my business plan"],
  research: ["Analyze DeFi protocols in Africa 2025", "Market overview for fintech Nigeria", "Competitive analysis: Stellar vs Ethereum", "SWOT for my e-commerce startup"],
  code: ["Write a Soroban smart contract in Rust", "Debug my React useEffect infinite loop", "Design a REST API for a marketplace", "Convert this Python to TypeScript"],
  image: ["Futuristic Lagos cityscape at night", "Minimalist logo for a fintech startup", "Abstract gradient dark wallpaper", "Portrait in cinematic golden hour"],
  video: ["15-second promo clip for a crypto app", "Cinematic ocean wave loop", "Product launch reveal dark theme", "Animated logo reveal"],
  general: ["Translate this document to Yoruba", "Summarize this article in 3 bullets", "Generate a 30-day content plan", "Help me structure my pitch deck"],
};

// ─── Try Agent CTA ────────────────────────────────────────────────────────────

interface AgentOptionShape {
  id: string;
  name: string;
  handle: string;
  provider: string;
  category: string;
  imageUrl?: string;
  walletAddress?: string;
  priceUsdc?: number;
}

interface TryAgentCTAProps {
  agentOption: AgentOptionShape;
  price: number;
  category: CategoryType;
  navigate: (to: string, options?: any) => void;
}

const TryAgentCTA: React.FC<TryAgentCTAProps> = ({
  agentOption,
  price,
  category,
  navigate
}) => {
  const prompts = SAMPLE_PROMPTS[category];
  const { emoji } = CATEGORY_META[category];
  const { setSelectedAgent } = useAgentStore();

  // FIX: Set agent globally before navigating so it's always in sync
  const handleTryAgent = () => {
    setSelectedAgent(agentOption as any);
    navigate("/terminal/chat", {
      state: {
        agent: agentOption,
        newChat: true,
        focusInput: true,
      },
    });
  };

  // FIX: Prompt click auto-sends the message (promptText triggers auto-send in TerminalChatPage)
  const handlePromptClick = (prompt: string) => {
    if (!agentOption) return;
    setSelectedAgent(agentOption as any);
    navigate("/terminal/chat", {
      state: {
        agent: agentOption,
        promptText: prompt, // This triggers auto-send in TerminalChatPage
        newChat: true,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* CTA Header */}
      <div className="rounded-2xl border border-zap-bg-alt/30 bg-zap-brand/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-zap-bg-alt/20 flex items-center gap-2.5">
          <Zap size={14} className="text-zap-brand" strokeWidth={2.5} />
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-brand">
            x402 · Pay Per Query
          </p>
          <span className="ml-auto font-body text-[12px] font-semibold text-zap-ink">
            ${price.toFixed(2)} USDC/req
          </span>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="font-body text-sm text-zap-ink-muted leading-relaxed">
            Chat with <strong className="text-zap-ink">{agentOption.name}</strong> on-demand. Pay only for what you use — each query is a closed deal settled on Stellar.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleTryAgent}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zap-brand px-5 py-3 font-body text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              <Zap size={14} strokeWidth={2.5} />
              Try {agentOption.name}
            </button>
          </div>
        </div>
      </div>

      {/* Sample prompts — clicking auto-starts the conversation */}
      <div className="space-y-2">
        <p className="font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-faint">
          Try a prompt
        </p>

        <div className="space-y-1">
          {prompts.slice(0, 4).map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className="group flex w-full items-start gap-3 rounded-xl border border-zap-bg-alt bg-zinc-950 px-4 py-3.5 hover:bg-zinc-900 hover:border-zap-bg-alt transition-all text-left"
            >
              <span className="text-lg shrink-0 mt-px">{emoji}</span>

              <div className="flex-1 text-[13px] leading-relaxed text-zap-ink-muted group-hover:text-zap-ink transition-colors">
                {prompt}
              </div>

              <ChevronRight
                size={15}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-zap-brand opacity-0 group-hover:opacity-100 transition-all"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main ZapPage ─────────────────────────────────────────────────────────────

const ZapPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const username = handle?.startsWith("@") && handle.length > 1 ? handle.slice(1) : "";
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const isRegisteredProfile = useProfileStore((s) => s.isRegistered);
  const profileLoading = useProfileStore((s) => s.loading);
  const network = useWalletStore((s) => s.network);
  const wasConnectedRef = useRef(connected);
  const { getProfileByUsername } = useContract();

  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCreator = useCallback(async () => {
    if (!username) { setLoading(false); return; }
   Promise.resolve().then(() => setLoading(true));
    setFetchError(null);
    try {
      const profile = await getProfileByUsername(username);
      setCreator(profile);
    } catch (err) {
      setFetchError(String(err));
    } finally {
      setLoading(false);
    }
  }, [username, getProfileByUsername]);

  useEffect(() => { void fetchCreator(); }, [fetchCreator]);

  useEffect(() => {
    const justConnected = !wasConnectedRef.current && connected;
    wasConnectedRef.current = connected;
    if (!justConnected || profileLoading) return;
    navigate(TERMINAL_DEFAULT_PATH, { replace: true });
  }, [connected, isRegisteredProfile, navigate, profileLoading]);

  usePageTitle(
    loading ? "FETCHING..." : creator ? `${creator.displayName || creator.username} — ZAP402` : "NOT FOUND"
  );

  const category = useMemo(() => creator ? detectCategory(creator.bio, creator.displayName) : "chat", [creator]);
  const provider = useMemo(() => creator ? detectProvider(creator.bio, creator.displayName) : "On-chain", [creator]);
  const price = useMemo(() => priceForCategory(category), [category]);
  const capabilities = useMemo(() => creator ? buildCapabilities(category, creator.bio) : [], [category, creator]);
  const stats = useMemo(() => buildStats(category), [category]);
  const catInfo = CATEGORY_META[category];
  const accentColor = useMemo(() => creator ? providerColor(provider) : "#f59e0b", [provider, creator]);

  const agentOption = useMemo(() => creator ? {
    id: creator.owner,
    name: creator.displayName || creator.username,
    handle: creator.username,
    provider,
    category,
    imageUrl: creator.imageUrl ?? undefined,
    walletAddress: creator.owner,
    priceUsdc: price,
  } : null, [creator, provider, category, price]);

  const creatorSocialLinks = useMemo(
    () => collectCreatorSocialLinks(creator?.xHandle ?? "", creator?.bio ?? ""),
    [creator?.xHandle, creator?.bio]
  );

  const explorerUrl = creator ? stellarExpertAccountUrl(creator.owner, network) : "";
  const showBack = connected && isRegisteredProfile;

  if (!handle?.startsWith("@") || handle.length <= 1) return <NotFoundPage />;

  if (loading) {
    return (
      <PageContainer tag="div" maxWidth="zapMain" className="flex min-h-[60vh] items-center justify-center bg-transparent py-10">
        <Loader size="lg" text="Loading agent…" />
      </PageContainer>
    );
  }

  if (fetchError || !creator) {
    if (!creator && !loading) return <CreatorNotFound username={username} />;
    return (
      <PageContainer tag="div" maxWidth="zapMain" className="min-w-0 bg-transparent py-20">
        <ErrorState category={categorizeError(fetchError || "Not Found")} error={fetchError} onRetry={fetchCreator} />
      </PageContainer>
    );
  }

  return (
    <PageContainer tag="div" maxWidth="zapMain" className="min-w-0 bg-transparent !py-6 pb-20 md:!py-8 md:pb-10">
      <div className="mx-auto w-full max-w-[720px] space-y-6">

        {showBack && (
          <Link
            to="/terminal/discover"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-zap-ink-muted hover:text-zap-brand transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back to Discover
          </Link>
        )}

        {/* HERO */}
        <div className="relative rounded-2xl overflow-hidden border border-zap-bg-alt bg-zap-bg-raised">
          <div className="h-1.5 w-full" style={{ background: accentColor }} />
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${accentColor}, transparent)` }}
          />

          <div className="relative px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1.5 rounded-full opacity-40 blur-lg"
                  style={{ background: accentColor }}
                />
                <Avatar
                  src={creator.imageUrl || undefined}
                  address={creator.owner}
                  alt={creator.displayName}
                  fallback={creator.displayName}
                  size="lg"
                  className="relative ring-2 ring-zap-surface shadow-lg"
                />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-zap-bg-raised flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl text-zap-ink tracking-tight leading-none">
                      {creator.displayName || `@${creator.username}`}
                    </h1>
                    <p className="font-body text-sm text-zap-ink-muted mt-1">@{creator.username}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[11px] font-semibold shrink-0"
                    style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40` }}
                  >
                    {catInfo.emoji} {catInfo.label}
                  </span>
                </div>

                {creator.bio.trim() && (
                  <p className="font-body text-sm text-zap-ink/90 leading-relaxed max-w-xl">
                    {creator.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {creatorSocialLinks.length > 0 && (
                    <CreatorSocialIcons links={creatorSocialLinks} xFollowers={creator.xFollowers} />
                  )}
                  {creator.xFollowers > 0 && creator.xHandle.trim() && (
                    <span className="font-body text-[11px] text-zap-ink-muted">
                      {creator.xFollowers.toLocaleString()} followers
                    </span>
                  )}
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[9px] text-zap-ink-faint hover:text-zap-brand transition-colors"
                  >
                    <ExternalLink size={9} strokeWidth={2} />
                    {truncateAddress(creator.owner)}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5 flex-wrap">
              {stats.map((s, i) => <StatChip key={i} label={s.label} value={s.value} />)}
              <div className="flex flex-col items-center gap-0.5 rounded-xl border border-zap-bg-alt bg-zap-bg px-4 py-3 min-w-[80px]">
                <span className="font-body text-[18px] font-semibold text-zap-ink leading-none">${price.toFixed(2)}</span>
                <span className="font-body text-[9px] uppercase tracking-[0.1em] text-zap-ink-faint mt-0.5">per query</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 min-w-[80px]">
                <span className="font-body text-[18px] font-semibold text-emerald-500 leading-none">LIVE</span>
                <span className="font-body text-[9px] uppercase tracking-[0.1em] text-emerald-500/70 mt-0.5">status</span>
              </div>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="space-y-5">
            <Card variant="editorial" padding="lg" className="space-y-4">
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-faint mb-1">
                  Specialization
                </p>
                <h2 className="font-display text-xl text-zap-ink tracking-tight">
                  {catInfo.emoji} {catInfo.description}
                </h2>
              </div>
              <div className="space-y-2.5">
                {capabilities.map((cap, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: accentColor }} />
                    <span className="font-body text-sm text-zap-ink-muted leading-snug">{cap}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="editorial" padding="lg" className="space-y-4">
              <p className="font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-faint">
                How it works
              </p>
              <div className="space-y-3">
                {[
                  { step: "01", icon: MessageSquare, label: "Send your prompt", desc: "Type your query — the classifier detects the task category automatically." },
                  { step: "02", icon: Zap, label: "Pay with USDC", desc: `A payment of $${price.toFixed(2)} USDC is confirmed on Stellar via x402 protocol.` },
                  { step: "03", icon: CheckCircle2, label: "Get your response", desc: "The agent delivers a premium response. TX hash recorded on-chain." },
                  { step: "04", icon: Activity, label: "Compare or continue", desc: "Compare the same prompt with other agents in the same category." },
                ].map(({ step, icon: Icon, label, desc }, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span
                      className="h-7 w-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: `${accentColor}18`, color: accentColor }}
                    >
                      {step}
                    </span>
                    <div>
                      <p className="font-body text-[13px] font-semibold text-zap-ink">{label}</p>
                      <p className="font-body text-[11px] text-zap-ink-faint leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="editorial" padding="md" className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-black shrink-0"
                  style={{ background: accentColor }}
                >
                  {provider.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-body text-[13px] font-semibold text-zap-ink">Powered by {provider}</p>
                  <p className="font-body text-[10px] text-zap-ink-faint">
                    {catInfo.emoji} {catInfo.label} · Stellar testnet · x402 payments
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <Shield size={12} strokeWidth={2} className="text-emerald-500" />
                  <span className="font-body text-[10px] text-emerald-500">On-chain verified</span>
                </div>
              </div>
            </Card>
          </div>

          {agentOption && (
            <div className="lg:sticky lg:top-4">
              <TryAgentCTA
                agentOption={agentOption}
                price={price}
                category={category}
                navigate={navigate}
              />
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
};

export default ZapPage;