import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const REQUESTS_PATH = path.join(DATA_DIR, "ask-requests.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function loadAskRequests() {
  ensureDir();
  const arr = readJson(REQUESTS_PATH, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveAskRequests(rows) {
  writeJson(REQUESTS_PATH, rows);
}

export function newAskRequestId() {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `ask_${hex}`;
}
