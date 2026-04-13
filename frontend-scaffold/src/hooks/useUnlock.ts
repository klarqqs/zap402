import { useCallback, useEffect, useState } from "react";

import type {
  CreateUnlockItemInput,
  UnlockItem,
  UnlockPurchase,
} from "@/types/unlock.types";
import * as unlockService from "@/services/unlock.service";
import { useWallet } from "@/hooks/useWallet";

export function useCreatorUnlocks() {
  const { publicKey } = useWallet();
  const [items, setItems] = useState<UnlockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!publicKey) {
      setItems([]);
      return;
    }
   Promise.resolve().then(() => setLoading(true));
    setError(null);
    try {
      const data = await unlockService.getCreatorUnlockItems(publicKey);
      setItems(data);
    } catch {
      setError("Failed to load unlock items");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  /** Creators keep TERMINAL open; poll so unlock counts / earned update after a sale without reload. */
  useEffect(() => {
    if (!publicKey) return;
    const id = window.setInterval(() => void fetchItems(), 45_000);
    return () => window.clearInterval(id);
  }, [publicKey, fetchItems]);

  const createItem = async (
    input: CreateUnlockItemInput,
    status: UnlockItem["status"] = "PUBLISHED",
  ) => {
    if (!publicKey) throw new Error("Wallet not connected");
    const newItem = await unlockService.createUnlockItem(publicKey, input, status);
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateItem = async (
    id: string,
    updates: Partial<CreateUnlockItemInput>,
  ) => {
    const updated = await unlockService.updateUnlockItem(id, updates);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  const archiveItem = async (id: string) => {
    await unlockService.archiveUnlockItem(id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "ARCHIVED" as const } : i)),
    );
  };

  const publishItem = async (id: string) => {
    const updated = await unlockService.updateUnlockItem(id, {
      status: "PUBLISHED",
    });
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  const deleteItem = async (id: string) => {
    await unlockService.deleteUnlockItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    archiveItem,
    publishItem,
    deleteItem,
    refetch: fetchItems,
  };
}

export type CreatorUnlocksApi = ReturnType<typeof useCreatorUnlocks>;

export function useProfileUnlocks(creatorAddress: string) {
  const { publicKey: buyerAddress } = useWallet();
  const [items, setItems] = useState<UnlockItem[]>([]);
  const [purchases, setPurchases] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorAddress) return;
    let cancelled = false;
    const timerId = window.setTimeout(() => {
      if (cancelled) return;
     Promise.resolve().then(() => setLoading(true));
      setError(null);
      unlockService
        .getProfileUnlockItems(creatorAddress, buyerAddress)
        .then((data) => {
          if (cancelled) return;
          setItems(data);
          if (buyerAddress) {
            return Promise.all(
              data.map((item) =>
                unlockService
                  .checkPurchaseAccess(item.id, buyerAddress)
                  .then((has) => ({ id: item.id, has })),
              ),
            ).then((results) => {
              if (cancelled) return;
              const map: Record<string, boolean> = {};
              results.forEach((r) => {
                map[r.id] = r.has;
              });
              setPurchases(map);
            });
          }
          setPurchases({});
        })
        .catch(() => {
          if (!cancelled) setError("Failed to load content");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [creatorAddress, buyerAddress]);

  const hasAccess = useCallback(
    (itemId: string) => purchases[itemId] ?? false,
    [purchases],
  );

  const recordPurchase = async (
    itemId: string,
    txHash: string,
    amount: number,
  ): Promise<{ purchase: UnlockPurchase; content: UnlockItem }> => {
    if (!buyerAddress) throw new Error("Wallet not connected");
    const result = await unlockService.recordPurchaseAndReveal(
      itemId,
      buyerAddress,
      txHash,
      amount,
      "USDC",
    );
    setPurchases((prev) => ({ ...prev, [itemId]: true }));
    return result;
  };

  return {
    items,
    loading,
    error,
    hasAccess,
    recordPurchase,
  };
}
