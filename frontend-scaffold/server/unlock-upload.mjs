import busboy from "busboy";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { loadItems, loadPurchases } from "./unlock-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 20 MiB — comfortable for PDFs, images, and small archives on the dev server. */
export const MAX_UNLOCK_FILE_BYTES = 20 * 1024 * 1024;

const UPLOAD_DIR = path.join(__dirname, "data", "unlock-uploads");

const ALLOWED_EXT = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "zip",
  "txt",
  "md",
  "csv",
  "json",
  "mp3",
  "wav",
  "mp4",
  "mov",
  "webm",
  "7z",
  "rar",
  "gz",
]);

const MIME_BY_EXT = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  zip: "application/zip",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  "7z": "application/x-7z-compressed",
  rar: "application/vnd.rar",
  gz: "application/gzip",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function parseExtension(filename) {
  const base = path.basename(String(filename || ""));
  const i = base.lastIndexOf(".");
  if (i <= 0 || i === base.length - 1) return null;
  return base
    .slice(i + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buyerHasAccess(itemId, buyer, purchases) {
  return purchases.some(
    (p) =>
      p.unlockItemId === itemId &&
      p.buyerAddress === buyer &&
      p.status === "CONFIRMED",
  );
}

/**
 * POST /api/unlock/upload — multipart field `creatorAddress`, file field `file`.
 */
export function handleUnlockUpload(req, res) {
  cors(res);
  const ct = req.headers["content-type"] || "";
  if (!ct.toLowerCase().startsWith("multipart/form-data")) {
    sendJson(res, 400, { error: "expected multipart/form-data" });
    return Promise.resolve();
  }

  ensureUploadDir();

  return new Promise((resolve) => {
    let creatorAddress = "";
    /** @type {{ storedName: string } | null} */
    let uploaded = null;
    let limitHit = false;
    let rejected = false;

    const fail = (status, obj) => {
      if (rejected) return;
      rejected = true;
      sendJson(res, status, obj);
      resolve();
    };

    const bb = busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_UNLOCK_FILE_BYTES },
    });

    bb.on("field", (name, val) => {
      if (name === "creatorAddress") creatorAddress = String(val).trim();
    });

    bb.on("file", (name, fileStream, info) => {
      if (name !== "file") {
        fileStream.resume();
        return;
      }
      if (uploaded !== null) {
        fileStream.resume();
        return;
      }

      const rawExt = parseExtension(info.filename);
      if (!rawExt || !ALLOWED_EXT.has(rawExt)) {
        fileStream.resume();
        fail(400, {
          error: "unsupported file type",
          hint: "Allowed: pdf, images (png, jpg, …), zip, txt, md, audio/video, …",
        });
        return;
      }

      const id = crypto.randomBytes(16).toString("hex");
      const storedName = `${id}.${rawExt}`;
      const dest = path.join(UPLOAD_DIR, storedName);
      const out = fs.createWriteStream(dest);

      fileStream.on("limit", () => {
        limitHit = true;
        fileStream.unpipe(out);
        out.destroy();
        fs.unlink(dest, () => {});
        fail(413, {
          error: `file too large (max ${MAX_UNLOCK_FILE_BYTES / (1024 * 1024)} MiB)`,
        });
      });

      out.on("error", () => {
        fs.unlink(dest, () => {});
        if (!rejected && !limitHit) fail(500, { error: "failed to save upload" });
      });

      fileStream.on("error", () => {
        fs.unlink(dest, () => {});
        if (!rejected && !limitHit) fail(500, { error: "upload interrupted" });
      });

      out.on("finish", () => {
        if (limitHit || rejected) return;
        uploaded = { storedName };
      });

      fileStream.pipe(out);
    });

    bb.on("error", () => {
      if (!rejected) fail(400, { error: "upload parse error" });
    });

    bb.on("finish", () => {
      if (rejected || limitHit) {
        resolve();
        return;
      }
      if (!creatorAddress) {
        if (uploaded?.storedName) {
          fs.unlink(path.join(UPLOAD_DIR, uploaded.storedName), () => {});
        }
        fail(400, { error: "creatorAddress required" });
        return;
      }
      if (!uploaded?.storedName) {
        fail(400, { error: "file required" });
        return;
      }
      const url = `/api/unlock/assets/${uploaded.storedName}`;
      sendJson(res, 200, {
        url,
        maxBytes: MAX_UNLOCK_FILE_BYTES,
      });
      resolve();
    });

    req.pipe(bb);
  });
}

/**
 * GET /api/unlock/assets/:file — requires `?viewer=<stellar address>` (creator or confirmed buyer).
 */
export function handleUnlockAssetDownload(req, res, pathname, searchParams) {
  cors(res);
  const suffix = pathname.slice("/api/unlock/assets/".length);
  if (!suffix || suffix.includes("/") || suffix.includes("\\") || suffix.includes("..")) {
    sendJson(res, 400, { error: "invalid asset path" });
    return;
  }
  const safeName = path.basename(suffix);
  const baseResolved = path.resolve(UPLOAD_DIR);
  const filePath = path.resolve(path.join(UPLOAD_DIR, safeName));
  if (!filePath.startsWith(baseResolved + path.sep) && filePath !== baseResolved) {
    sendJson(res, 400, { error: "invalid asset path" });
    return;
  }

  const viewer = searchParams.get("viewer")?.trim();
  if (!viewer) {
    sendJson(res, 401, {
      error: "viewer query parameter required (connect wallet and open link from Zap402)",
    });
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(res, 404, { error: "file not found" });
    return;
  }

  const purchases = loadPurchases();
  const items = loadItems();
  const assetPath = `/api/unlock/assets/${safeName}`;
  const candidates = items.filter(
    (i) => i.fileUrl === assetPath || i.fileUrl?.endsWith(`/${safeName}`),
  );

  let allowed = false;
  for (const item of candidates) {
    if (item.creatorId === viewer) {
      allowed = true;
      break;
    }
    if (buyerHasAccess(item.id, viewer, purchases)) {
      allowed = true;
      break;
    }
  }

  if (!allowed) {
    sendJson(res, 403, { error: "not authorized to download this file" });
    return;
  }

  const ext = safeName.includes(".")
    ? safeName.slice(safeName.lastIndexOf(".") + 1).toLowerCase()
    : "";
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";

  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Length": stat.size,
    "Content-Disposition": `attachment; filename="${safeName}"`,
    "Access-Control-Allow-Origin": "*",
  });
  fs.createReadStream(filePath).pipe(res);
}
