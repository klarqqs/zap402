import React, { useMemo, useState } from "react";
import { Search, Zap, ChevronRight, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import Loader from "@/components/primitives/Loader";
import { useOnChainAgents } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiAgent = {
  id: string;
  name: string;
  handle: string;
  imageUrl?: string;
  provider: string;
  category: "chat" | "image" | "video" | "research" | "code" | "general";
  active: boolean;
  tag: "agent" | "human";
  walletAddress?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { emoji: string; label: string; color: string }> = {
  chat: { emoji: "💬", label: "Chat", color: "#10b981" },
  research: { emoji: "🔬", label: "Research", color: "#8b5cf6" },
  code: { emoji: "⌨️", label: "Code", color: "#6366f1" },
  image: { emoji: "🎨", label: "Image", color: "#ec4899" },
  video: { emoji: "🎬", label: "Video", color: "#f97316" },
  general: { emoji: "⚡", label: "General", color: "#f59e0b" },
};

const PRICE_MAP: Record<string, number> = {
  chat: 0.30, research: 0.50, code: 0.40, image: 0.80, video: 1.50, general: 0.30,
};

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
    deepseek: "DS", midjourney: "MJ", runway: "RW", meta: "MT", mistral: "MS",
    "on-chain": "OC",
  };
  const p = provider.toLowerCase();
  for (const [k, v] of Object.entries(map)) if (p.includes(k)) return v;
  return provider.slice(0, 2).toUpperCase();
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

const AgentCard: React.FC<{ agent: ApiAgent }> = ({ agent }) => {
  const navigate = useNavigate();
  const color = providerColor(agent.provider);
  const meta = CATEGORY_META[agent.category] ?? { emoji: "⚡", label: agent.category, color: "#f59e0b" };
  const price = PRICE_MAP[agent.category] ?? 0.30;

  const agentOption = {
    id: agent.id,
    name: agent.name,
    handle: agent.handle,
    provider: agent.provider,
    category: agent.category,
    imageUrl: agent.imageUrl,
    walletAddress: agent.walletAddress,
    priceUsdc: price,
  };

  const handleUse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/terminal/chat", {
      state: { agent: agentOption, focusInput: true },
    });
  };

  return (
    <div className="group flex flex-col gap-0 rounded-2xl border border-zap-bg-alt bg-zap-bg-raised overflow-hidden transition-all hover:border-zap-bg-alt hover:shadow-sm hover:shadow-black/5">
      {/* Colored top accent bar */}
      {/* <div className="h-[3px] w-full transition-all group-hover:h-[4px]" style={{ background: color }} /> */}

      <div className="p-4 flex flex-col gap-3">
        {/* Top row: avatar + name + live */}
        <div className="flex items-start gap-3">
          {/* Avatar — click navigates to ZapPage */}
          <Link
            to={`/@${agent.handle}`}
            className="relative shrink-0 block"
            title={`View ${agent.name} profile`}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold text-black overflow-hidden transition-transform group-hover:scale-105"
              style={{ background: color }}
            >
              {agent.imageUrl ? (
                <img src={agent.imageUrl} alt={agent.name} className="h-full w-full object-cover rounded-full" loading="lazy" />
              ) : (
                providerInitials(agent.provider)
              )}
            </div>
            {/* Live dot */}
            {agent.active && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-zap-bg-raised" />
            )}
          </Link>

          {/* Name + handle */}
          <div className="flex-1 min-w-0">
            {/* Name → ZapPage */}
            <Link
              to={`/@${agent.handle}`}
              className="font-body text-[14px] font-semibold text-zap-ink hover:text-zap-brand transition-colors leading-tight block truncate"
            >
              {agent.name}
            </Link>
            <p className="font-body text-[11px] text-zap-ink-faint">@{agent.handle}</p>
          </div>

          {/* Category badge */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-body text-[9px] font-semibold shrink-0"
            style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}
          >
            {meta.emoji} {meta.label}
          </span>
        </div>

        {/* Provider + price row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] font-semibold" style={{ color }}>
              {agent.provider}
            </span>
            <span className="text-zap-border">·</span>
            <span className="font-mono text-[10px] text-zap-ink-faint">
              ${price.toFixed(2)}/req
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Profile link */}
            <Link
              to={`/@${agent.handle}`}
              className="inline-flex items-center gap-1 rounded-lg border border-zap-bg-alt bg-zap-bg px-2.5 py-1.5 font-body text-[10px] text-zap-ink-muted hover:border-zap-bg-alt hover:text-zap-ink transition-all"
              title="View profile"
            >
              <ExternalLink size={10} strokeWidth={2} />
              Profile
            </Link>
            {/* USE → activates model in chat */}
            <button
              type="button"
              onClick={handleUse}
              className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 font-body text-[11px] font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"            >
              <Zap size={10} strokeWidth={2.5} />
              Use
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SearchPage ───────────────────────────────────────────────────────────────

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { agents: apiAgents, loading, error } = useOnChainAgents({ onlyAgents: true });

  const agentProfiles = useMemo(
    () => apiAgents.filter((a) => a.tag === "agent" || a.category),
    [apiAgents],
  );

  const filteredByCategory = useMemo(() => {
    if (activeFilter === "all") return agentProfiles;
    return agentProfiles.filter(a => a.category === activeFilter);
  }, [agentProfiles, activeFilter]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredByCategory;
    return filteredByCategory.filter((a) =>
      a.handle.toLowerCase().includes(q) ||
      `@${a.handle}`.includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.provider.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
    );
  }, [filteredByCategory, query]);

  const agentsByCategory = useMemo(() => {
    const cats = ["chat", "research", "code", "image", "video", "general"] as const;
    return cats.map((cat) => ({
      cat,
      items: agentProfiles.filter((a) => a.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [agentProfiles]);

  const totalByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: agentProfiles.length };
    for (const a of agentProfiles) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, [agentProfiles]);

  const showResults = query.trim() || activeFilter !== "all";

  return (
    <div className="w-full space-y-5">
      <DashboardTabPageHeader
        kicker="DISCOVER"
        title="Discover agents"
        description="Find AI agents by capability. Every agent charges per request — no subscription. Click an agent name to view their portfolio."
      />

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            className="w-full rounded-2xl border border-zap-bg-alt bg-zap-bg-raised px-4 py-3 pl-10 font-body text-sm text-zap-ink outline-none placeholder:text-zap-ink-faint focus:border-zap-accent transition-colors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by agent name, handle, provider or category…"
            autoFocus
          />
          <Search aria-hidden size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zap-ink-faint" />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 font-body text-base text-zap-ink-faint hover:text-zap-ink transition-colors">
              ×
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-[11px] font-semibold transition-all ${activeFilter === "all"
              ? "border-zap-bg-alt bg-zap-ink text-zap-bg"
              : "border-zap-bg-alt bg-zap-bg text-zap-ink-muted hover:border-zap-bg-alt hover:text-zap-ink"
              }`}
          >
            All
            <span className="font-mono text-[9px] opacity-60">{totalByCategory.all ?? 0}</span>
          </button>
          {(["chat", "research", "code", "image", "video"] as const).map(cat => {
            const m = CATEGORY_META[cat];
            const count = totalByCategory[cat] ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-[11px] font-semibold transition-all ${activeFilter === cat
                  ? "text-black border-transparent"
                  : "border-zap-bg-alt bg-zap-bg text-zap-ink-muted hover:border-zap-bg-alt hover:text-zap-ink"
                  }`}
                style={activeFilter === cat ? { background: m.color, borderColor: m.color } : {}}
              >
                {m.emoji} {m.label}
                <span className="font-mono text-[9px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {showResults ? (
        <div className="space-y-3">
          {loading ? (
            <Loader size="sm" text="Searching…" />
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zap-bg-alt px-6 py-10 text-center">
              <p className="font-body text-2xl mb-2">🔍</p>
              <p className="font-body text-sm font-semibold text-zap-ink mb-1">No agents found</p>
              <p className="font-body text-xs text-zap-ink-muted">
                {error ? `Search unavailable: ${error}` : `No agent matching "${query}"`}
              </p>
            </div>
          ) : (
            <>
              <p className="font-body text-[10px] uppercase tracking-[0.12em] text-zap-ink-faint">
                {results.length} {results.length === 1 ? "agent" : "agents"} found
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Browse by category */
        <div className="space-y-7">
          {loading ? (
            <Loader size="sm" text="Loading agents…" />
          ) : agentProfiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zap-bg-alt px-6 py-10 text-center">
              <p className="font-body text-2xl mb-2">⚡</p>
              <p className="font-body text-sm font-semibold text-zap-ink mb-1">No agents yet</p>
              <p className="font-body text-xs text-zap-ink-muted">
                Create a profile with "Tag: agent" in the bio to appear here.
              </p>
            </div>
          ) : (
            agentsByCategory.map(({ cat, items }) => {
              const meta = CATEGORY_META[cat] ?? { emoji: "⚡", label: cat, color: "#f59e0b" };
              return (
                <section key={cat} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.emoji}</span>
                    <p className="font-body text-[11px] uppercase tracking-[0.12em] text-zap-ink-muted font-semibold">
                      {meta.label} agents
                    </p>
                    <span className="font-mono text-[10px] text-zap-ink-faint">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {items.map((agent) => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;