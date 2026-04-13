import { useEffect, useMemo, useState } from "react";

import { useNetwork } from "@/hooks/useNetwork";
import { useContract } from "@/hooks/useContract";
import type { NetworkEntry } from "@/types/contract";
import type { Profile } from "@/types/contract";

function displayNameFromUsername(username: string): string {
  return username
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const { entries: creators, loading } = useNetwork();
  const { getProfileByUsername } = useContract();
  const [lookupResult, setLookupResult] = useState<NetworkEntry | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const raw = query.trim();
    if (!raw) {
      Promise.resolve().then(() => {
        setLookupResult(null);
        setLookupLoading(false);
      });
      return;
    }

    const normalized = raw.replace(/^@+/, "").trim().toLowerCase();
    if (!normalized) {
      Promise.resolve().then(() => {
        setLookupResult(null);
        setLookupLoading(false);
      });
      return;
    }

    const hasExactNetworkHit = creators.some(
      (c) => (c.username || "").toLowerCase() === normalized,
    );
    if (hasExactNetworkHit) {
      Promise.resolve().then(() => {
        setLookupResult(null);
        setLookupLoading(false);
      });
      return;
    }

    let cancelled = false;
    // FIX: defer setLookupLoading(true) — was direct setState in effect body
    Promise.resolve().then(() => {
      if (!cancelled) setLookupLoading(true);
    });

    const id = window.setTimeout(() => {
      void getProfileByUsername(normalized)
        .then((p: Profile) => {
          if (cancelled) return;
          setLookupResult({
            address: p.owner,
            username: p.username,
            totalTipsReceived: p.totalTipsReceived,
            creditScore: p.creditScore,
            totalTipsCount: p.totalTipsCount,
            registeredAt: p.registeredAt,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setLookupResult(null);
        })
        .finally(() => {
          if (cancelled) return;
          setLookupLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [query, creators, getProfileByUsername]);

  const results = useMemo((): NetworkEntry[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const filtered = creators.filter((c) => {
      const u = c.username?.toLowerCase() ?? "";
      const display = displayNameFromUsername(c.username).toLowerCase();
      return u.includes(q) || display.includes(q);
    });
    if (!lookupResult) return filtered;
    if (
      filtered.some(
        (c) => c.username.toLowerCase() === lookupResult.username.toLowerCase(),
      )
    ) {
      return filtered;
    }
    return [lookupResult, ...filtered];
  }, [query, creators, lookupResult]);

  const searching = Boolean(query.trim()) && lookupLoading;
  return { query, setQuery, results, loading: loading || searching, entries: creators };
}