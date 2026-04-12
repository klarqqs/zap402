/**
 * Local dev API: Clone chat + Unlock HTTP API (file store + Horizon payment verify).
 * Vite proxies /api → this server (see vite.config.ts).
 */
import http from "node:http";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { handleUnlockRoute } from "./unlock-handlers.mjs";
import {
  handleUnlockUpload,
  handleUnlockAssetDownload,
} from "./unlock-upload.mjs";
import { handleAskRoute } from "./ask-handlers.mjs";
import { handleAskVideoUpload, handleAskVideoAsset } from "./ask-upload.mjs";
import { loadAgents, newAgentId, saveAgents } from "./agent-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../../.env") });
loadEnv({ path: path.resolve(__dirname, "../.env") });

const PORT = Number(process.env.CLONE_API_PORT || 8788);
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
const MAX_BODY = 500_000;
const MAX_MESSAGE = 4_000;

const HORIZON_URL =
  process.env.HORIZON_URL ||
  process.env.VITE_HORIZON_URL ||
  "https://horizon-testnet.stellar.org";

const STELLAR_TESTNET_USDC_CONTRACT_ID =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

const NETWORK_PASSPHRASE =
  process.env.VITE_NETWORK_PASSPHRASE ||
  process.env.NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";

/** Match frontend unlock verification (env override or testnet Circle USDC SAC). */
const USDC_CONTRACT_VERIFY =
  (process.env.VITE_USDC_CONTRACT_ID || "").trim() || STELLAR_TESTNET_USDC_CONTRACT_ID;

/** Zap402 contract — unlock purchases use `send_tip` into escrow when set. */
const ZAP402_CONTRACT_VERIFY = (process.env.VITE_CONTRACT_ID || "").trim();

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function providerEnvKey(provider) {
  const p = String(provider || "").toLowerCase();
  if (p.includes("anthropic") || p.includes("claude")) return "ANTHROPIC_API_KEY";
  if (p.includes("openai") || p.includes("chatgpt") || p.includes("gpt")) return "OPENAI_API_KEY";
  if (p.includes("gemini") || p.includes("google")) return "GEMINI_API_KEY";
  return "ANTHROPIC_API_KEY"; // default to Anthropic
}

function enrichAgent(agent) {
  const envKey = providerEnvKey(agent.provider);
  const providerConfigured = envKey ? Boolean(process.env[envKey]) : false;
  const hasWalletAddress = Boolean(String(agent.walletAddress || "").trim());
  return {
    ...agent,
    active: Boolean(agent.enabled !== false && providerConfigured && hasWalletAddress),
    envKey,
    providerConfigured,
    hasWalletAddress,
  };
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      return { error: "too_large" };
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { error: "invalid_json" };
  }
}

const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // ─── Agent registry (API-key driven + admin managed) ────
  if (pathname.startsWith("/api/agents")) {
    if (req.method === "GET" && pathname === "/api/agents") {
      let agents = loadAgents();
      // Remove stale legacy handles that were renamed (e.g. "claude" → "claude_agent")
      const CANONICAL_HANDLES = new Set(["claude_agent", "chatgpt_agent", "gemini_agent"]);
      const LEGACY_HANDLES = new Set(["claude", "chatgpt"]);
      agents = agents.filter((a) => {
        const h = String(a.handle).toLowerCase();
        return !LEGACY_HANDLES.has(h) || CANONICAL_HANDLES.has(h);
      });
      // Deduplicate by handle (keep last occurrence)
      const seen = new Set();
      agents = agents.filter((a) => {
        const h = String(a.handle).toLowerCase();
        if (seen.has(h)) return false;
        seen.add(h);
        return true;
      });
      const hasClaude = agents.some((a) => String(a.handle).toLowerCase() === "claude_agent");
      const hasChatgpt = agents.some((a) => String(a.handle).toLowerCase() === "chatgpt_agent");
      const hasGemini = agents.some((a) => String(a.handle).toLowerCase() === "gemini_agent");
      if (!hasClaude || !hasChatgpt || !hasGemini) {
        const now = new Date().toISOString();
        const seeded = [...agents];
        if (!hasClaude) {
          seeded.unshift({
            id: "agent_claude_seed",
            name: "Claude Agent",
            handle: "claude_agent",
            provider: "Anthropic",
            category: "research",
            walletAddress: "",
            enabled: true,
            tag: "agent",
            createdAt: now,
            updatedAt: now,
          });
        }
        if (!hasChatgpt) {
          seeded.unshift({
            id: "agent_chatgpt_seed",
            name: "ChatGPT Agent",
            handle: "chatgpt_agent",
            provider: "OpenAI",
            category: "research",
            walletAddress: "",
            enabled: true,
            tag: "agent",
            createdAt: now,
            updatedAt: now,
          });
        }
        if (!hasGemini) {
          seeded.unshift({
            id: "agent_gemini_seed",
            name: "Gemini Agent",
            handle: "gemini_agent",
            provider: "Google",
            category: "research",
            walletAddress: "",
            enabled: true,
            tag: "agent",
            createdAt: now,
            updatedAt: now,
          });
        }
        agents = seeded;
        saveAgents(agents);
      } else {
        // Persist cleaned-up list (removes legacy handles even if all seeds are present)
        saveAgents(agents);
      }
      const enriched = agents.map(enrichAgent);
      sendJson(res, 200, {
        agents: enriched,
        activeCount: enriched.filter((a) => a.active).length,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/agents") {
      const body = await readJsonBody(req, MAX_BODY);
      if (body?.error === "too_large") return sendJson(res, 413, { error: "Request too large" });
      if (body?.error === "invalid_json") return sendJson(res, 400, { error: "Invalid JSON" });
      const name = String(body?.name || "").trim();
      const handle = String(body?.handle || "").trim().replace(/^@+/, "");
      const provider = String(body?.provider || "").trim();
      const category = String(body?.category || "").trim().toLowerCase();
      const walletAddress = String(body?.walletAddress || "").trim();
      if (!name || !handle || !provider || !category) {
        return sendJson(res, 400, { error: "name, handle, provider, and category are required" });
      }
      const rows = loadAgents();
      if (rows.some((r) => String(r.handle).toLowerCase() === handle.toLowerCase())) {
        return sendJson(res, 409, { error: "Handle already exists" });
      }
      const now = new Date().toISOString();
      const created = {
        id: newAgentId(),
        name,
        handle,
        provider,
        category,
        walletAddress,
        enabled: true,
        tag: "agent",
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(created);
      saveAgents(rows);
      return sendJson(res, 201, { agent: enrichAgent(created) });
    }

    if (req.method === "PATCH" && pathname.startsWith("/api/agents/")) {
      const id = decodeURIComponent(pathname.replace("/api/agents/", ""));
      if (!id) return sendJson(res, 400, { error: "Missing agent id" });
      const body = await readJsonBody(req, MAX_BODY);
      if (body?.error === "too_large") return sendJson(res, 413, { error: "Request too large" });
      if (body?.error === "invalid_json") return sendJson(res, 400, { error: "Invalid JSON" });
      const rows = loadAgents();
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return sendJson(res, 404, { error: "Agent not found" });
      const next = {
        ...rows[idx],
        name: body?.name != null ? String(body.name).trim() : rows[idx].name,
        handle:
          body?.handle != null
            ? String(body.handle).trim().replace(/^@+/, "")
            : rows[idx].handle,
        provider: body?.provider != null ? String(body.provider).trim() : rows[idx].provider,
        category:
          body?.category != null
            ? String(body.category).trim().toLowerCase()
            : rows[idx].category,
        walletAddress:
          body?.walletAddress != null
            ? String(body.walletAddress).trim()
            : rows[idx].walletAddress,
        enabled: body?.enabled != null ? Boolean(body.enabled) : rows[idx].enabled,
        updatedAt: new Date().toISOString(),
      };
      rows[idx] = next;
      saveAgents(rows);
      return sendJson(res, 200, { agent: enrichAgent(next) });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  }

  // ─── Chat model pricing (developer-configured) ──────────
  if (req.method === "GET" && pathname === "/api/chat-pricing") {
    const pricing = {
      Claude: Number.parseFloat(process.env.CHAT_PRICE_CLAUDE_USDC || "0.05"),
      ChatGPT: Number.parseFloat(process.env.CHAT_PRICE_CHATGPT_USDC || "0.05"),
      DeepSeek: Number.parseFloat(process.env.CHAT_PRICE_DEEPSEEK_USDC || "0.04"),
      Llama: Number.parseFloat(process.env.CHAT_PRICE_LLAMA_USDC || "0.03"),
      Mistral: Number.parseFloat(process.env.CHAT_PRICE_MISTRAL_USDC || "0.03"),
    };
    sendJson(res, 200, {
      pricing,
      source: "developer-config",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  // ─── Unlock API ─────────────────────────────────────────
  if (pathname.startsWith("/api/unlock")) {
    if (
      req.method !== "GET" &&
      req.method !== "POST" &&
      req.method !== "PATCH" &&
      req.method !== "DELETE"
    ) {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (req.method === "POST" && pathname === "/api/unlock/upload") {
      await handleUnlockUpload(req, res);
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/unlock/assets/")) {
      handleUnlockAssetDownload(req, res, pathname, url.searchParams);
      return;
    }

    let body = null;
    if (req.method === "POST" || req.method === "PATCH") {
      body = await readJsonBody(req, MAX_BODY);
      if (body?.error === "too_large") {
        sendJson(res, 413, { error: "Request too large" });
        return;
      }
      if (body?.error === "invalid_json") {
        sendJson(res, 400, { error: "Invalid JSON" });
        return;
      }
    }
    await handleUnlockRoute(req, res, pathname, url.searchParams, body, {
      horizonUrl: HORIZON_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      usdcContractId: USDC_CONTRACT_VERIFY,
      zap402ContractId: ZAP402_CONTRACT_VERIFY,
    });
    return;
  }

  // ─── Ask API ────────────────────────────────────────────
  if (pathname.startsWith("/api/ask")) {
    if (
      req.method !== "GET" &&
      req.method !== "POST" &&
      req.method !== "PATCH"
    ) {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ask/upload") {
      await handleAskVideoUpload(req, res);
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/ask/assets/")) {
      handleAskVideoAsset(req, res, pathname);
      return;
    }

    let body = null;
    if (req.method === "POST" || req.method === "PATCH") {
      body = await readJsonBody(req, MAX_BODY);
      if (body?.error === "too_large") {
        sendJson(res, 413, { error: "Request too large" });
        return;
      }
      if (body?.error === "invalid_json") {
        sendJson(res, 400, { error: "Invalid JSON" });
        return;
      }
    }
    await handleAskRoute(req, res, pathname, url.searchParams, body, {
      horizonUrl: HORIZON_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      usdcContractId: USDC_CONTRACT_VERIFY,
      zap402ContractId: ZAP402_CONTRACT_VERIFY,
    });
    return;
  }

  // ─── Clone chat (existing) ───────────────────────────────
  if (req.method !== "POST" || pathname !== "/api/clone-chat") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const body = await readJsonBody(req, 12_000);
  if (body?.error === "too_large") {
    sendJson(res, 413, { error: "Request too large" });
    return;
  }
  if (body?.error === "invalid_json") {
    sendJson(res, 400, { error: "Invalid JSON" });
    return;
  }

  const { message, creatorName, provider: providerHint } = body;
  if (typeof message !== "string" || !message.trim()) {
    sendJson(res, 400, { error: "message is required" });
    return;
  }
  if (message.length > MAX_MESSAGE) {
    sendJson(res, 400, {
      error: `message must be at most ${MAX_MESSAGE} characters`,
    });
    return;
  }

  const name =
    typeof creatorName === "string" && creatorName.trim()
      ? creatorName.trim().slice(0, 120)
      : "the creator";

  // Detect provider from explicit hint or creator name
  const providerRaw = String(providerHint || creatorName || "").toLowerCase();
  const isOpenAI = providerRaw.includes("openai") || providerRaw.includes("chatgpt") || providerRaw.includes("gpt");
  const isGemini = providerRaw.includes("gemini") || providerRaw.includes("google");

  const system = `You are helping a fan get a thoughtful answer from "${name}", a creator on Zap402 (a Stellar-based tipping and monetization app). You are a creative stand-in for demo purposes: respond in first person as ${name}, warm and concise. If you do not know biographical facts, say so briefly and still answer the spirit of the question. Stay under about 200 words unless the question clearly needs more. No financial or medical advice; no illegal content.`;

  try {
    let text = "";

    if (isOpenAI) {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        sendJson(res, 503, { error: "OpenAI API key not configured. Set OPENAI_API_KEY in .env." });
        return;
      }
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Authorization": `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          max_tokens: 1024,
          messages: [
            { role: "system", content: system },
            { role: "user", content: message.trim() },
          ],
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        const msg = data?.error?.message || "OpenAI API error";
        console.error("[dev-api] OpenAI error:", data);
        sendJson(res, 502, { error: msg });
        return;
      }
      text = data.choices?.[0]?.message?.content?.trim() || "";

    } else if (isGemini) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        sendJson(res, 503, { error: "Gemini API key not configured. Set GEMINI_API_KEY in .env." });
        return;
      }
      const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: message.trim() }] }],
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) {
        const msg = data?.error?.message || "Gemini API error";
        console.error("[dev-api] Gemini error:", data);
        sendJson(res, 502, { error: msg });
        return;
      }
      text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    } else {
      // Default: Anthropic / Claude
      if (!API_KEY) {
        sendJson(res, 503, {
          error: "Clone API is not configured. Set ANTHROPIC_API_KEY in .env.",
        });
        return;
      }
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system,
          messages: [{ role: "user", content: message.trim() }],
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        const msg =
          data?.error?.message ||
          (typeof data?.error === "string" ? data.error : null) ||
          "Anthropic API error";
        console.error("[dev-api] Anthropic error:", data);
        sendJson(res, 502, { error: msg });
        return;
      }
      text = data.content?.find((b) => b.type === "text")?.text?.trim() || "";
    }

    sendJson(res, 200, { reply: text || "(No text in response.)" });
  } catch (err) {
    console.error("[dev-api] clone-chat", err);
    sendJson(res, 500, { error: "Clone service error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.info(
    `[dev-api] listening on http://127.0.0.1:${PORT} (clone + unlock · Horizon: ${HORIZON_URL})`,
  );
});
