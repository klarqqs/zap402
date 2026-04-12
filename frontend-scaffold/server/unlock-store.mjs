/**
 * File-backed unlock listings + purchase index (verified on-chain before append).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const ITEMS_PATH = path.join(DATA_DIR, "unlock-items.json");
const PURCHASES_PATH = path.join(DATA_DIR, "unlock-purchases.json");

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

export function loadItems() {
  ensureDir();
  const arr = readJson(ITEMS_PATH, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveItems(items) {
  writeJson(ITEMS_PATH, items);
}

export function loadPurchases() {
  ensureDir();
  const arr = readJson(PURCHASES_PATH, []);
  return Array.isArray(arr) ? arr : [];
}

export function savePurchases(rows) {
  writeJson(PURCHASES_PATH, rows);
}

export function newItemId() {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `u_${hex}`;
}
