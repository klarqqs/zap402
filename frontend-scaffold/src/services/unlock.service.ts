import type {
  CreateUnlockItemInput,
  UnlockItem,
  UnlockPurchase,
} from "@/types/unlock.types";

const API_BASE = "/api/unlock";

/** Must match `MAX_UNLOCK_FILE_BYTES` in `server/unlock-upload.mjs`. */
export const UNLOCK_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
export const UNLOCK_UPLOAD_MAX_LABEL = "20 MB";

async function httpJson<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  if (r.status === 204) return undefined as T;
  const text = await r.text();
  if (!r.ok) {
    throw new Error(text || `${r.status} ${r.statusText}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

export type BuyerUnlockRow = {
  purchase: UnlockPurchase;
  item: {
    id: string;
    title: string;
    contentType: UnlockItem["contentType"];
    creatorId: string;
    currency: UnlockItem["currency"];
  } | null;
};

/** Unlock listings and purchase index: always `GET/POST/PATCH` the dev API (`npm run dev` → `/api/unlock`). */
/**
 * Multipart upload for FILE unlocks. Returns `fileUrl` to store on the item (`/api/unlock/assets/...`).
 */
export async function uploadUnlockAsset(
  creatorAddress: string,
  file: File,
): Promise<{ url: string }> {
  if (file.size > UNLOCK_UPLOAD_MAX_BYTES) {
    throw new Error(`File too large (max ${UNLOCK_UPLOAD_MAX_LABEL})`);
  }
  const fd = new FormData();
  fd.append("creatorAddress", creatorAddress);
  fd.append("file", file);
  const r = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: fd,
  });
  const text = await r.text();
  if (!r.ok) {
    let msg = text || `${r.status} ${r.statusText}`;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* keep msg */
    }
    throw new Error(msg);
  }
  return JSON.parse(text) as { url: string };
}

export async function createUnlockItem(
  creatorAddress: string,
  input: CreateUnlockItemInput,
  status: UnlockItem["status"] = "PUBLISHED",
): Promise<UnlockItem> {
  return httpJson<UnlockItem>("/create", {
    method: "POST",
    body: JSON.stringify({
      creatorAddress,
      status,
      ...input,
    }),
  });
}

export async function getCreatorUnlockItems(
  creatorAddress: string,
): Promise<UnlockItem[]> {
  return httpJson<UnlockItem[]>(
    `/creator/${encodeURIComponent(creatorAddress)}`,
  );
}

export async function updateUnlockItem(
  itemId: string,
  updates: Partial<CreateUnlockItemInput> & { status?: UnlockItem["status"] },
): Promise<UnlockItem> {
  return httpJson<UnlockItem>(`/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function archiveUnlockItem(itemId: string): Promise<void> {
  await httpJson<void>(`/${encodeURIComponent(itemId)}/archive`, {
    method: "POST",
  });
}

export async function deleteUnlockItem(itemId: string): Promise<void> {
  await httpJson<void>(`/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export async function getProfileUnlockItems(
  creatorAddress: string,
  viewerBuyerAddress?: string | null,
): Promise<UnlockItem[]> {
  const q = viewerBuyerAddress
    ? `?buyer=${encodeURIComponent(viewerBuyerAddress)}`
    : "";
  return httpJson<UnlockItem[]>(
    `/profile/${encodeURIComponent(creatorAddress)}${q}`,
  );
}

export async function checkPurchaseAccess(
  itemId: string,
  buyerAddress: string,
): Promise<boolean> {
  try {
    const data = await httpJson<{ hasAccess: boolean }>(
      `/${encodeURIComponent(itemId)}/access?buyer=${encodeURIComponent(buyerAddress)}`,
    );
    return Boolean(data?.hasAccess);
  } catch {
    return false;
  }
}

export async function recordPurchaseAndReveal(
  itemId: string,
  buyerAddress: string,
  txHash: string,
  amount: number,
  currency: "USDC",
): Promise<{ purchase: UnlockPurchase; content: UnlockItem }> {
  return httpJson<{ purchase: UnlockPurchase; content: UnlockItem }>(
    "/purchase",
    {
      method: "POST",
      body: JSON.stringify({
        itemId,
        buyerAddress,
        txHash,
        amount,
        currency,
      }),
    },
  );
}

export async function getBuyerPurchases(
  buyerAddress: string,
): Promise<UnlockPurchase[]> {
  const rows = await getBuyerUnlockLibrary(buyerAddress);
  return rows.map((r) => r.purchase);
}

export async function getBuyerUnlockLibrary(
  buyerAddress: string,
): Promise<BuyerUnlockRow[]> {
  return httpJson<BuyerUnlockRow[]>(
    `/purchases/${encodeURIComponent(buyerAddress)}`,
  );
}
