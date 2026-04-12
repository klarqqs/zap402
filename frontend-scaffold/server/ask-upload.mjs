import busboy from "busboy";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASK_UPLOAD_DIR = path.join(__dirname, "data", "ask-replies");
const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80 MiB (dev-friendly)
const ALLOWED_EXT = new Set(["mp4", "mov", "webm"]);

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function ensureUploadDir() {
  fs.mkdirSync(ASK_UPLOAD_DIR, { recursive: true });
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

export function handleAskVideoUpload(req, res) {
  const ct = req.headers["content-type"] || "";
  if (!ct.toLowerCase().startsWith("multipart/form-data")) {
    sendJson(res, 400, { error: "expected multipart/form-data" });
    return Promise.resolve();
  }

  ensureUploadDir();

  return new Promise((resolve) => {
    let uploaded = null;
    let rejected = false;
    let limitHit = false;

    const fail = (status, obj) => {
      if (rejected) return;
      rejected = true;
      sendJson(res, status, obj);
      resolve();
    };

    const bb = busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_VIDEO_BYTES },
    });

    bb.on("file", (name, fileStream, info) => {
      if (name !== "video") {
        fileStream.resume();
        return;
      }
      if (uploaded !== null) {
        fileStream.resume();
        return;
      }

      const ext = parseExtension(info.filename);
      if (!ext || !ALLOWED_EXT.has(ext)) {
        fileStream.resume();
        fail(400, { error: "unsupported video type (use mp4, mov, or webm)" });
        return;
      }

      const id = crypto.randomBytes(16).toString("hex");
      const storedName = `${id}.${ext}`;
      const dest = path.join(ASK_UPLOAD_DIR, storedName);
      const out = fs.createWriteStream(dest);

      fileStream.on("limit", () => {
        limitHit = true;
        fileStream.unpipe(out);
        out.destroy();
        fs.unlink(dest, () => {});
        fail(413, { error: "video too large (max 80 MiB)" });
      });

      out.on("error", () => {
        fs.unlink(dest, () => {});
        if (!rejected && !limitHit) fail(500, { error: "failed to save video" });
      });

      out.on("finish", () => {
        if (rejected || limitHit) return;
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
      if (!uploaded?.storedName) {
        fail(400, { error: "video file is required (field name: video)" });
        return;
      }
      sendJson(res, 200, {
        url: `/api/ask/assets/${uploaded.storedName}`,
        maxBytes: MAX_VIDEO_BYTES,
      });
      resolve();
    });

    req.pipe(bb);
  });
}

export function handleAskVideoAsset(req, res, pathname) {
  const suffix = pathname.slice("/api/ask/assets/".length);
  if (!suffix || suffix.includes("/") || suffix.includes("\\") || suffix.includes("..")) {
    sendJson(res, 400, { error: "invalid asset path" });
    return;
  }
  const safeName = path.basename(suffix);
  const filePath = path.join(ASK_UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(res, 404, { error: "file not found" });
    return;
  }
  const ext = safeName.slice(safeName.lastIndexOf(".") + 1).toLowerCase();
  const mime =
    ext === "mp4" ? "video/mp4" : ext === "mov" ? "video/quicktime" : "video/webm";
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Length": stat.size,
    "Access-Control-Allow-Origin": "*",
  });
  fs.createReadStream(filePath).pipe(res);
}

