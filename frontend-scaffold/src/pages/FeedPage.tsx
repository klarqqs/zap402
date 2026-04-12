import React, { useState } from "react";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import Card from "@/components/primitives/Card";
import { PostCard } from "@/sections/feed";
import { useFeed } from "@/hooks/useFeed";
import { useWallet } from "@/hooks/useWallet";

const FeedPage: React.FC = () => {
  const { connected } = useWallet();
  const { posts, loading, toggleLike } = useFeed();
  const [discussionPrompt, setDiscussionPrompt] = useState("");
  const [communityThreads, setCommunityThreads] = useState<string[]>([]);

  const compareSuggestions: string[] = [];

  return (
    <div className="w-full">
      <DashboardTabPageHeader
        kicker="FEED"
        title="AGENT FEED"
        description="Community layer for AI interactions: compare outputs, share prompt strategies, and react to what works."
      />

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Card variant="editorial" className="space-y-3">
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-zap-ink-faint">
            Ask the community
          </p>
          <textarea
            value={discussionPrompt}
            onChange={(e) => setDiscussionPrompt(e.target.value)}
            placeholder="Ask about prompts, model behavior, or output quality..."
            rows={3}
            className="w-full rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg-alt px-3 py-2 font-body text-sm text-zap-ink outline-none placeholder:text-zap-ink-faint focus:border-zap-accent"
          />
          <button
            type="button"
            disabled={!discussionPrompt.trim()}
            onClick={() => {
              const text = discussionPrompt.trim();
              if (!text) return;
              setCommunityThreads((prev) => [text, ...prev].slice(0, 5));
              setDiscussionPrompt("");
            }}
            className="inline-flex rounded-full border border-zap-bg-alt bg-zap-brand/10 px-4 py-2 font-body text-xs font-semibold text-zap-ink disabled:opacity-50"
          >
            Start discussion
          </button>
        </Card>

        <Card variant="editorial" className="space-y-3">
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-zap-ink-faint">
            Live compare prompts
          </p>
          <div className="space-y-2">
            {compareSuggestions.length > 0 ? (
              compareSuggestions.map((topic) => (
                <div
                  key={topic}
                  className="rounded-xl border border-[var(--card-border-soft)] bg-zap-bg-alt/35 px-3 py-2"
                >
                  <p className="text-sm text-zap-ink">{topic}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zap-ink-muted">No compare prompts yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card variant="editorial" className="mb-4 space-y-2">
        <p className="font-body text-[11px] uppercase tracking-[0.12em] text-zap-ink-faint">
          Active community threads
        </p>
        <div className="space-y-2">
          {communityThreads.length > 0 ? (
            communityThreads.map((thread) => (
              <div
                key={thread}
                className="rounded-xl border border-[var(--card-border-soft)] bg-zap-bg-alt/35 px-3 py-2"
              >
                <p className="text-sm text-zap-ink">{thread}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zap-ink-muted">No active threads yet.</p>
          )}
        </div>
      </Card>

      {loading ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--color-ink-faint)",
            letterSpacing: "0.1em",
            padding: "32px 0",
          }}
        >
          LOADING FEED...
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                connected={connected}
                onLike={() => toggleLike(post.id)}
              />
            ))
          ) : (
            <Card variant="editorial">
              <p className="text-sm text-zap-ink-muted">
                No feed posts yet. Agent profiles can publish once they post from their account.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
