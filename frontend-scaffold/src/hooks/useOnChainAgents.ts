import { useEffect, useMemo, useState } from "react";

import { useContract } from "@/hooks/useContract";
import { useNetwork } from "@/hooks/useNetwork";
import type { Profile } from "@/types/contract";

export type OnChainAgent = {
  id: string;
  name: string;
  handle: string;
  imageUrl?: string;
  provider: string;
  category: "chat" | "image" | "video" | "research" | "code";
  active: boolean;
  tag: "agent";
  walletAddress?: string;
};

type UseOnChainAgentsOptions = {
  onlyAgents?: boolean;
};

function isAgentProfile(profile: Profile): boolean {
  return /\btag\s*:\s*agent\b/i.test(profile.bio || "");
}

function inferCategory(profile: Profile): OnChainAgent["category"] {
  const text = `${profile.bio} ${profile.displayName} ${profile.xHandle}`.toLowerCase();
  if (text.includes("image") || text.includes("visual")) return "image";
  if (text.includes("video") || text.includes("voice")) return "video";
  if (text.includes("research")) return "research";
  if (text.includes("code") || text.includes("dev")) return "code";
  return "chat";
}

function inferProvider(profile: Profile): string {
  const text = `${profile.bio} ${profile.displayName}`.toLowerCase();
  if (text.includes("anthropic") || text.includes("claude")) return "Anthropic";
  if (text.includes("openai") || text.includes("chatgpt")) return "OpenAI";
  if (text.includes("google") || text.includes("gemini")) return "Google";
  return "On-chain";
}

export function useOnChainAgents(options: UseOnChainAgentsOptions = {}) {
  const { onlyAgents = true } = options;
  const { entries, loading: networkLoading, error: networkError } = useNetwork();
  const { getProfileByUsername, getProfilesPage } = useContract();
  const [agents, setAgents] = useState<OnChainAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (networkLoading) {
      Promise.resolve().then(() => setLoading(true));
      return;
    }
    if (networkError) {
      Promise.resolve().then(() => {
        setError(networkError);
        setLoading(false);
      });
      return;
    }

    const load = async () => {
      try {
        const page = await getProfilesPage(0, 500);
        if (page.length > 0) {
          const rows = page
            .filter((profile) => (onlyAgents ? isAgentProfile(profile) : true))
            .map((profile) => ({
              id: profile.owner || profile.username,
              name: profile.displayName || profile.username,
              handle: profile.username,
              imageUrl: profile.imageUrl || undefined,
              provider: inferProvider(profile),
              category: inferCategory(profile),
              active: true,
              tag: "agent" as const,
              walletAddress: profile.owner || undefined,
            }));
          const deduped = new Map<string, OnChainAgent>();
          for (const row of rows) {
            deduped.set(row.handle, row);
          }
          if (!cancelled) {
            setAgents(Array.from(deduped.values()));
            setLoading(false);
            setError(null);
          }
          return;
        }
      } catch {
        // Older contract version: fall through to legacy discovery path.
      }

      const usernames = new Set(entries.map((e) => e.username).filter(Boolean));
      const usernameList = Array.from(usernames);
      if (usernameList.length === 0) {
        if (!cancelled) {
          setAgents([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      Promise.resolve().then(() => {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }
      });

      return Promise.allSettled(
        usernameList.map(async (username) => {
          const profile = await getProfileByUsername(username);
          if (onlyAgents && !isAgentProfile(profile)) return null;
          return {
            id: profile.owner || username,
            name: profile.displayName || username,
            handle: profile.username,
            imageUrl: profile.imageUrl || undefined,
            provider: inferProvider(profile),
            category: inferCategory(profile),
            active: true,
            tag: "agent" as const,
            walletAddress: profile.owner || undefined,
          };
        }),
      )
        .then((results) => {
          if (cancelled) return;
          const fetchedRows: OnChainAgent[] = [];
          for (const result of results) {
            if (result.status === "fulfilled" && result.value) {
              fetchedRows.push(result.value);
            }
          }
          const deduped = new Map<string, OnChainAgent>();
          for (const row of fetchedRows) {
            deduped.set(row.handle, row);
          }
          setAgents(Array.from(deduped.values()));
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to load on-chain agents");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [
    entries,
    getProfileByUsername,
    getProfilesPage,
    networkError,
    networkLoading,
    onlyAgents,
  ]);

  return useMemo(
    () => ({ agents, loading, error }),
    [agents, loading, error],
  );
}