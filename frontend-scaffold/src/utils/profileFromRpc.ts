import type {
  ContractConfig,
  ContractStats,
  NetworkEntry,
  Profile,
  Tip,
} from "@/types/contract";

type RpcRecord = Record<string, unknown>;

function pick(r: RpcRecord, camel: string, snake: string): unknown {
  if (r[camel] !== undefined && r[camel] !== null) return r[camel];
  return r[snake];
}

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
  if (typeof v === "object" && "toString" in v && typeof (v as { toString: () => string }).toString === "function") {
    return (v as { toString: () => string }).toString();
  }
  return String(v);
}

function asU32(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return fallback;
}

function asI128String(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
  if (typeof v === "string" && v.length > 0) return v;
  return "0";
}

function asU64Seconds(v: unknown, fallback = 0): number {
  if (typeof v === "bigint") return Number(v);
  return asU32(v, fallback);
}

/**
 * Map Soroban `scValToNative` profile structs to app `Profile`.
 * The SDK returns field names as snake_case (matching the contract Rust), not camelCase.
 */
export function profileFromRpc(raw: unknown): Profile {
  const r = raw as RpcRecord;

  return {
    owner: asString(pick(r, "owner", "owner")),
    username: asString(pick(r, "username", "username")),
    displayName: asString(pick(r, "displayName", "display_name")),
    bio: asString(pick(r, "bio", "bio")),
    imageUrl: asString(pick(r, "imageUrl", "image_url")),
    xHandle: asString(pick(r, "xHandle", "x_handle")),
    xFollowers: asU32(pick(r, "xFollowers", "x_followers"), 0),
    xEngagementAvg: asU32(pick(r, "xEngagementAvg", "x_engagement_avg"), 0),
    creditScore: asU32(pick(r, "creditScore", "credit_score"), 0),
    totalTipsReceived: asI128String(pick(r, "totalTipsReceived", "total_tips_received")),
    totalTipsCount: asU32(pick(r, "totalTipsCount", "total_tips_count"), 0),
    balance: asI128String(pick(r, "balance", "balance")),
    registeredAt: asU64Seconds(pick(r, "registeredAt", "registered_at"), 0),
    updatedAt: asU64Seconds(pick(r, "updatedAt", "updated_at"), 0),
  };
}

/**
 * Map Soroban `get_network` struct elements to `NetworkEntry`.
 * SDK / `scValToNative` uses snake_case (`total_tips_received`); the UI expects camelCase.
 */
export function networkEntryFromRpc(raw: unknown): NetworkEntry {
  const r = raw as RpcRecord;
  const tips = pick(r, "totalTipsCount", "total_tips_count");
  const reg = pick(r, "registeredAt", "registered_at");

  return {
    address: asString(pick(r, "address", "address")),
    username: asString(pick(r, "username", "username")),
    totalTipsReceived: asI128String(
      pick(r, "totalTipsReceived", "total_tips_received"),
    ),
    creditScore: asU32(pick(r, "creditScore", "credit_score"), 0),
    totalTipsCount:
      tips === undefined || tips === null ? undefined : asU32(tips, 0),
    registeredAt:
      reg === undefined || reg === null ? undefined : asU64Seconds(reg, 0),
  };
}

/**
 * Map Soroban `Tip` structs from `get_recent_tips` / `get_tips_by_tipper`.
 * i128 `amount` and u64 `timestamp` often arrive as `bigint` from `scValToNative`;
 * normalizing avoids `Cannot mix BigInt and other types` in UI math.
 */
export function tipFromRpc(raw: unknown): Tip {
  const r = raw as RpcRecord;
  return {
    id: asU32(pick(r, "id", "id"), 0),
    tipper: asString(pick(r, "tipper", "tipper")),
    creator: asString(pick(r, "creator", "creator")),
    amount: asI128String(pick(r, "amount", "amount")),
    message: asString(pick(r, "message", "message")),
    timestamp: asU64Seconds(pick(r, "timestamp", "timestamp"), 0),
  };
}

/** Map `get_stats` struct to `ContractStats` (snake_case + bigint i128 fields). */
export function contractStatsFromRpc(raw: unknown): ContractStats {
  const r = raw as RpcRecord;
  return {
    totalCreators: asU32(pick(r, "totalCreators", "total_creators"), 0),
    totalTipsCount: asU32(pick(r, "totalTipsCount", "total_tips_count"), 0),
    totalTipsVolume: asI128String(
      pick(r, "totalTipsVolume", "total_tips_volume"),
    ),
    totalFeesCollected: asI128String(
      pick(r, "totalFeesCollected", "total_fees_collected"),
    ),
    feeBps: asU32(pick(r, "feeBps", "fee_bps"), 0),
  };
}

/** Map `get_config` to `ContractConfig`. */
export function contractConfigFromRpc(raw: unknown): ContractConfig {
  const r = raw as RpcRecord;
  const init = pick(r, "isInitialized", "is_initialized");
  return {
    admin: asString(pick(r, "admin", "admin")),
    feeCollector: asString(pick(r, "feeCollector", "fee_collector")),
    feeBps: asU32(pick(r, "feeBps", "fee_bps"), 0),
    nativeToken: asString(pick(r, "nativeToken", "native_token")),
    totalCreators: asU32(pick(r, "totalCreators", "total_creators"), 0),
    totalTipsCount: asU32(pick(r, "totalTipsCount", "total_tips_count"), 0),
    totalTipsVolume: asI128String(
      pick(r, "totalTipsVolume", "total_tips_volume"),
    ),
    totalFeesCollected: asI128String(
      pick(r, "totalFeesCollected", "total_fees_collected"),
    ),
    isInitialized: init === true || init === "true",
    version: asU32(pick(r, "version", "version"), 0),
  };
}
