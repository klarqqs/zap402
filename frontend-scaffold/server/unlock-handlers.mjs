import {
  loadItems,
  saveItems,
  loadPurchases,
  savePurchases,
  newItemId,
} from "./unlock-store.mjs";
import { verifyUnlockTransaction, purchaseRecordId } from "./unlock-verify.mjs";

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function stripSecrets(item) {
  return {
    ...item,
    content: undefined,
    fileUrl: undefined,
    externalLink: undefined,
  };
}

function buyerHasAccess(itemId, buyer, purchases) {
  return purchases.some(
    (p) =>
      p.unlockItemId === itemId &&
      p.buyerAddress === buyer &&
      p.status === "CONFIRMED",
  );
}

/** Published FILE rows must point at an uploaded asset or external URL. */
function fileListingValid(item) {
  if (item.contentType !== "FILE") return true;
  if (item.status !== "PUBLISHED") return true;
  return Boolean(String(item.fileUrl || "").trim());
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname - e.g. /api/unlock/create
 * @param {URLSearchParams} searchParams
 * @param {unknown} body - parsed JSON or null
 * @param {{
 *   horizonUrl: string;
 *   networkPassphrase: string;
 *   usdcContractId: string;
 *   zap402ContractId?: string;
 * }} ctx
 */
export async function handleUnlockRoute(req, res, pathname, searchParams, body, ctx) {
  const method = req.method || "GET";
  const horizonUrl = ctx.horizonUrl;
  const networkPassphrase = ctx.networkPassphrase;
  const usdcContractId = ctx.usdcContractId;
  const zap402ContractId = (ctx.zap402ContractId || "").trim();

  try {
    // POST /api/unlock/create
    if (method === "POST" && pathname === "/api/unlock/create") {
      const b = body && typeof body === "object" ? body : {};
      const creatorAddress = String(b.creatorAddress || "").trim();
      if (!creatorAddress) {
        sendJson(res, 400, { error: "creatorAddress required" });
        return;
      }
      const status = b.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
      const now = new Date().toISOString();
      const id = newItemId();
      const item = {
        id,
        creatorId: creatorAddress,
        title: String(b.title || "").slice(0, 200),
        description: String(b.description || "").slice(0, 2000),
        contentType: b.contentType || "TEXT",
        price: Number(b.price),
        currency: "USDC",
        status,
        content: b.content,
        fileUrl: b.fileUrl,
        externalLink: b.externalLink,
        previewText: b.previewText,
        thumbnailUrl: b.thumbnailUrl,
        purchaseCount: 0,
        totalEarned: 0,
        createdAt: now,
        updatedAt: now,
      };
      if (!item.title) {
        sendJson(res, 400, { error: "title required" });
        return;
      }
      if (!Number.isFinite(item.price) || item.price <= 0) {
        sendJson(res, 400, { error: "invalid price" });
        return;
      }
      if (!fileListingValid(item)) {
        sendJson(res, 400, {
          error: "published file listings require an uploaded file or file URL",
        });
        return;
      }
      const items = loadItems();
      items.unshift(item);
      saveItems(items);
      sendJson(res, 200, item);
      return;
    }

    // GET /api/unlock/creator/:addr
    if (method === "GET" && pathname.startsWith("/api/unlock/creator/")) {
      const addr = decodeURIComponent(pathname.slice("/api/unlock/creator/".length));
      const items = loadItems().filter((i) => i.creatorId === addr);
      sendJson(res, 200, items);
      return;
    }

    // GET /api/unlock/profile/:addr
    if (method === "GET" && pathname.startsWith("/api/unlock/profile/")) {
      const addr = decodeURIComponent(pathname.slice("/api/unlock/profile/".length));
      const buyer = searchParams.get("buyer")?.trim() || null;
      const purchases = loadPurchases();
      const ownerViewingSelf = Boolean(buyer && buyer === addr);
      const items = loadItems()
        .filter((i) => i.creatorId === addr && i.status === "PUBLISHED")
        .map((i) => {
          if (ownerViewingSelf) return { ...i };
          if (buyer && buyerHasAccess(i.id, buyer, purchases)) return { ...i };
          return stripSecrets(i);
        });
      sendJson(res, 200, items);
      return;
    }

    // GET /api/unlock/purchases/:buyer
    if (method === "GET" && pathname.startsWith("/api/unlock/purchases/")) {
      const buyer = decodeURIComponent(pathname.slice("/api/unlock/purchases/".length));
      const purchases = loadPurchases().filter((p) => p.buyerAddress === buyer);
      const items = loadItems();
      const enriched = purchases.map((p) => {
        const item = items.find((i) => i.id === p.unlockItemId);
        return {
          purchase: p,
          item: item
            ? {
                id: item.id,
                title: item.title,
                contentType: item.contentType,
                creatorId: item.creatorId,
                currency: item.currency,
              }
            : null,
        };
      });
      sendJson(res, 200, enriched);
      return;
    }

    // GET /api/unlock/:id/access
    if (method === "GET" && /\/api\/unlock\/[^/]+\/access$/.test(pathname)) {
      const base = pathname.replace(/\/access$/, "");
      const itemId = decodeURIComponent(base.split("/").pop() || "");
      const buyer = searchParams.get("buyer")?.trim() || "";
      if (!itemId || !buyer) {
        sendJson(res, 400, { error: "item id and buyer required" });
        return;
      }
      const hasAccess = buyerHasAccess(itemId, buyer, loadPurchases());
      sendJson(res, 200, { hasAccess });
      return;
    }

    // PATCH /api/unlock/:id
    const patchMatch = pathname.match(/^\/api\/unlock\/([^/]+)$/);
    if (method === "PATCH" && patchMatch) {
      const itemId = decodeURIComponent(patchMatch[1]);
      const b = body && typeof body === "object" ? body : {};
      const items = loadItems();
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx < 0) {
        sendJson(res, 404, { error: "not found" });
        return;
      }
      const prev = items[idx];
      const next = { ...prev, updatedAt: new Date().toISOString() };
      if (b.title !== undefined) next.title = String(b.title).slice(0, 200);
      if (b.description !== undefined) next.description = String(b.description).slice(0, 2000);
      if (b.contentType !== undefined) next.contentType = b.contentType;
      if (b.price !== undefined) next.price = Number(b.price);
      next.currency = "USDC";
      if (b.content !== undefined) next.content = b.content;
      if (b.fileUrl !== undefined) next.fileUrl = b.fileUrl;
      if (b.externalLink !== undefined) next.externalLink = b.externalLink;
      if (b.previewText !== undefined) next.previewText = b.previewText;
      if (b.thumbnailUrl !== undefined) next.thumbnailUrl = b.thumbnailUrl;
      if (b.status !== undefined) next.status = b.status;
      if (!fileListingValid(next)) {
        sendJson(res, 400, {
          error: "published file listings require an uploaded file or file URL",
        });
        return;
      }
      items[idx] = next;
      saveItems(items);
      sendJson(res, 200, next);
      return;
    }

    // DELETE /api/unlock/:id
    const deleteMatch = pathname.match(/^\/api\/unlock\/([^/]+)$/);
    if (method === "DELETE" && deleteMatch) {
      const itemId = decodeURIComponent(deleteMatch[1]);
      const items = loadItems();
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx < 0) {
        sendJson(res, 404, { error: "not found" });
        return;
      }
      const target = items[idx];
      if (Number(target.purchaseCount || 0) > 0) {
        sendJson(res, 409, {
          error: "cannot delete content with purchases; archive instead",
        });
        return;
      }
      items.splice(idx, 1);
      saveItems(items);
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /api/unlock/:id/archive
    const archMatch = pathname.match(/^\/api\/unlock\/([^/]+)\/archive$/);
    if (method === "POST" && archMatch) {
      const itemId = decodeURIComponent(archMatch[1]);
      const items = loadItems();
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx < 0) {
        sendJson(res, 404, { error: "not found" });
        return;
      }
      items[idx] = {
        ...items[idx],
        status: "ARCHIVED",
        updatedAt: new Date().toISOString(),
      };
      saveItems(items);
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /api/unlock/purchase
    if (method === "POST" && pathname === "/api/unlock/purchase") {
      const b = body && typeof body === "object" ? body : {};
      const itemId = String(b.itemId || "").trim();
      const buyerAddress = String(b.buyerAddress || "").trim();
      const txHash = String(b.txHash || "").trim();
      const amount = Number(b.amount);
      const currency = "USDC";

      if (!itemId || !buyerAddress || !txHash || !Number.isFinite(amount)) {
        sendJson(res, 400, { error: "itemId, buyerAddress, txHash, amount required" });
        return;
      }

      const items = loadItems();
      const item = items.find((i) => i.id === itemId);
      if (!item) {
        sendJson(res, 404, { error: "item not found" });
        return;
      }
      if (item.status !== "PUBLISHED") {
        sendJson(res, 400, { error: "item not published" });
        return;
      }
      if (buyerAddress === item.creatorId) {
        sendJson(res, 400, { error: "cannot purchase your own content" });
        return;
      }

      const purchases = loadPurchases();
      if (purchases.some((p) => p.txHash === txHash)) {
        sendJson(res, 400, { error: "transaction already recorded" });
        return;
      }

      const v = await verifyUnlockTransaction({
        horizonUrl,
        networkPassphrase,
        tokenContractId: usdcContractId,
        zap402ContractId,
        txHash,
        buyer: buyerAddress,
        creator: item.creatorId,
        itemId,
        expectedAmount: amount,
        currency,
      });

      if (!v.ok) {
        sendJson(res, 402, { error: "payment verification failed", reason: v.reason, detail: v });
        return;
      }

      const purchase = {
        id: purchaseRecordId(),
        unlockItemId: itemId,
        buyerAddress,
        creatorAddress: item.creatorId,
        amount,
        currency,
        status: "CONFIRMED",
        txHash,
        purchasedAt: new Date().toISOString(),
      };
      purchases.push(purchase);
      savePurchases(purchases);

      const iidx = items.findIndex((i) => i.id === itemId);
      if (iidx >= 0) {
        items[iidx] = {
          ...items[iidx],
          purchaseCount: items[iidx].purchaseCount + 1,
          totalEarned: items[iidx].totalEarned + amount,
          updatedAt: new Date().toISOString(),
        };
        saveItems(items);
      }

      const full = loadItems().find((i) => i.id === itemId);
      sendJson(res, 200, { purchase, content: full ? { ...full } : item });
      return;
    }

    sendJson(res, 404, { error: "unlock route not found" });
  } catch (e) {
    console.error("[unlock-handlers]", e);
    sendJson(res, 500, { error: "unlock_internal_error", message: String(e?.message || e) });
  }
}
