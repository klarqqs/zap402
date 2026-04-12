import { loadAskRequests, newAskRequestId, saveAskRequests } from "./ask-store.mjs";
import crypto from "node:crypto";
import { verifyAskTransaction } from "./ask-verify.mjs";

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

const VALID_STATUS = new Set([
  "pending_payment",
  "paid_escrowed",
  "in_progress",
  "done_notified",
  "refunded",
]);

function isAddr(v) {
  return typeof v === "string" && /^G[A-Z0-9]{55}$/.test(v.trim());
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {URLSearchParams} searchParams
 * @param {unknown} body
 * @param {{
 *   horizonUrl?: string;
 *   networkPassphrase?: string;
 *   usdcContractId?: string;
 *   zap402ContractId?: string;
 * }} [ctx]
 */
export async function handleAskRoute(req, res, pathname, searchParams, body, ctx) {
  const method = req.method || "GET";
  const b = body && typeof body === "object" ? body : {};
  const horizonUrl = ctx?.horizonUrl;
  const networkPassphrase = ctx?.networkPassphrase;
  const usdcContractId = ctx?.usdcContractId;
  const zap402ContractId = ctx?.zap402ContractId;

  try {
    if (method === "POST" && pathname === "/api/ask/create") {
      const type = String(b.type || "answer_question").trim();
      const price = Number(b.price);
      const fanAddress = String(b.fanAddress || "").trim();
      const creatorAddress = String(b.creatorAddress || "").trim();
      const messageHash = String(b.messageHash || "").trim().toLowerCase();
      const messageText = String(b.messageText || "").trim().slice(0, 4000);
      if (!type || !Number.isFinite(price) || price <= 0) {
        sendJson(res, 400, { error: "type and positive price required" });
        return;
      }
      if (!isAddr(fanAddress) || !isAddr(creatorAddress)) {
        sendJson(res, 400, { error: "fanAddress and creatorAddress must be Stellar addresses" });
        return;
      }
      if (!/^[0-9a-f]{64}$/.test(messageHash)) {
        sendJson(res, 400, { error: "messageHash must be 64 lowercase hex chars" });
        return;
      }
      const now = new Date().toISOString();
      const row = {
        requestId: newAskRequestId(),
        type,
        price,
        status: "pending_payment",
        fanAddress,
        creatorAddress,
        messageHash,
        messageText,
        txHash: null,
        createdAt: now,
        updatedAt: now,
        doneAt: null,
        notifiedAt: null,
        messages: [
          {
            id: `m_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
            role: "fan",
            body: messageText || "(No message body recorded)",
            timeLabel: now,
          },
        ],
      };
      const rows = loadAskRequests();
      rows.unshift(row);
      saveAskRequests(rows);
      sendJson(res, 200, row);
      return;
    }

    if (method === "POST" && pathname === "/api/ask/confirm") {
      const requestId = String(b.requestId || "").trim();
      const txHash = String(b.txHash || "").trim();
      if (!requestId || !txHash) {
        sendJson(res, 400, { error: "requestId and txHash required" });
        return;
      }
      const rows = loadAskRequests();
      const idx = rows.findIndex((r) => r.requestId === requestId);
      if (idx < 0) {
        sendJson(res, 404, { error: "request not found" });
        return;
      }

      // Verify on-chain payment (unlock API uses the same 402 pattern).
      const row = rows[idx];
      if (!horizonUrl || !networkPassphrase) {
        sendJson(res, 503, {
          error: "ask payment verification is not configured on the server",
          hint: "Set HORIZON_URL/VITE_HORIZON_URL and VITE_NETWORK_PASSPHRASE (or NETWORK_PASSPHRASE).",
        });
        return;
      }
      const messageHash = String(row.messageHash || "").trim().toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(messageHash)) {
        sendJson(res, 400, { error: "request messageHash is invalid; cannot verify payment" });
        return;
      }

      const v = await verifyAskTransaction({
        horizonUrl,
        networkPassphrase,
        tokenContractId: usdcContractId,
        zap402ContractId,
        txHash,
        fan: row.fanAddress,
        creator: row.creatorAddress,
        messageHash,
        expectedAmount: Number(row.price),
        currency: "USDC",
      });
      if (!v.ok) {
        sendJson(res, 402, {
          error: "payment verification failed",
          reason: v.reason,
          detail: v,
        });
        return;
      }

      rows[idx] = {
        ...row,
        status: "paid_escrowed",
        txHash,
        updatedAt: new Date().toISOString(),
      };
      saveAskRequests(rows);
      sendJson(res, 200, rows[idx]);
      return;
    }

    if (method === "POST" && pathname === "/api/ask/status") {
      const requestId = String(b.requestId || "").trim();
      const status = String(b.status || "").trim();
      if (!requestId || !VALID_STATUS.has(status)) {
        sendJson(res, 400, { error: "valid requestId and status required" });
        return;
      }
      const rows = loadAskRequests();
      const idx = rows.findIndex((r) => r.requestId === requestId);
      if (idx < 0) {
        sendJson(res, 404, { error: "request not found" });
        return;
      }
      const next = {
        ...rows[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      if (status === "done_notified") {
        next.doneAt = next.doneAt ?? new Date().toISOString();
        next.notifiedAt = new Date().toISOString();
      }
      rows[idx] = next;
      saveAskRequests(rows);
      sendJson(res, 200, next);
      return;
    }

    if (method === "POST" && pathname === "/api/ask/reply") {
      const requestId = String(b.requestId || "").trim();
      const bodyText = String(b.body || "").trim().slice(0, 4000);
      if (!requestId || !bodyText) {
        sendJson(res, 400, { error: "requestId and body required" });
        return;
      }
      const rows = loadAskRequests();
      const idx = rows.findIndex((r) => r.requestId === requestId);
      if (idx < 0) {
        sendJson(res, 404, { error: "request not found" });
        return;
      }
      const prevMsgs = Array.isArray(rows[idx].messages) ? rows[idx].messages : [];
      const next = {
        ...rows[idx],
        status: rows[idx].status === "paid_escrowed" ? "in_progress" : rows[idx].status,
        messages: [
          ...prevMsgs,
          {
            id: `m_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
            role: "you",
            body: bodyText,
            timeLabel: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      rows[idx] = next;
      saveAskRequests(rows);
      sendJson(res, 200, next);
      return;
    }

    if (method === "POST" && pathname === "/api/ask/reply-video") {
      const requestId = String(b.requestId || "").trim();
      const videoUrl = String(b.videoUrl || "").trim();
      const durationSec = Number(b.durationSec);
      if (!requestId || !videoUrl || !Number.isFinite(durationSec)) {
        sendJson(res, 400, { error: "requestId, videoUrl, durationSec required" });
        return;
      }
      if (durationSec < 30) {
        sendJson(res, 400, { error: "video must be at least 30 seconds" });
        return;
      }
      if (
        !videoUrl.startsWith("/api/ask/assets/") &&
        !/^https:\/\//i.test(videoUrl)
      ) {
        sendJson(res, 400, { error: "videoUrl must be https or /api/ask/assets/..." });
        return;
      }

      const rows = loadAskRequests();
      const idx = rows.findIndex((r) => r.requestId === requestId);
      if (idx < 0) {
        sendJson(res, 404, { error: "request not found" });
        return;
      }

      const prevMsgs = Array.isArray(rows[idx].messages) ? rows[idx].messages : [];
      const now = new Date().toISOString();
      const next = {
        ...rows[idx],
        status: "done_notified",
        messages: [
          ...prevMsgs,
          {
            id: `m_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
            role: "you",
            body: `VIDEO_REPLY (${Math.round(durationSec)}s): ${videoUrl}`,
            timeLabel: now,
          },
        ],
        doneAt: rows[idx].doneAt ?? now,
        notifiedAt: now,
        updatedAt: now,
      };
      rows[idx] = next;
      saveAskRequests(rows);
      sendJson(res, 200, next);
      return;
    }

    if (method === "GET" && pathname.startsWith("/api/ask/creator/")) {
      const creator = decodeURIComponent(pathname.slice("/api/ask/creator/".length));
      const rows = loadAskRequests()
        .filter((r) => r.creatorAddress === creator)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      sendJson(res, 200, rows);
      return;
    }

    if (method === "GET" && pathname.startsWith("/api/ask/fan/")) {
      const fan = decodeURIComponent(pathname.slice("/api/ask/fan/".length));
      const rows = loadAskRequests()
        .filter((r) => r.fanAddress === fan)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      sendJson(res, 200, rows);
      return;
    }

    if (method === "GET" && pathname === "/api/ask/by-hash") {
      const messageHash = String(searchParams.get("messageHash") || "").trim().toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(messageHash)) {
        sendJson(res, 400, { error: "messageHash required" });
        return;
      }
      const row =
        loadAskRequests().find((r) => r.messageHash === messageHash) || null;
      sendJson(res, 200, { request: row });
      return;
    }

    sendJson(res, 404, { error: "ask route not found" });
  } catch (e) {
    console.error("[ask-handlers]", e);
    sendJson(res, 500, { error: "ask route failure" });
  }
}
