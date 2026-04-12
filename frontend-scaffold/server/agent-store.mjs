import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const AGENTS_PATH = path.join(DATA_DIR, "agents.json");

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

export function loadAgents() {
  ensureDir();
  const arr = readJson(AGENTS_PATH, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveAgents(rows) {
  writeJson(AGENTS_PATH, rows);
}

export function newAgentId() {
  return `agent_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

