/**
 * Verify Stellar unlock payments:
 * - Preferred: Zap402 `send_tip` with message `unlock:<itemId>` (USDC into contract escrow).
 * - Legacy: direct Soroban USDC `transfer` buyer → creator.
 */
import crypto from "node:crypto";

import { Address, scValToNative, TransactionBuilder } from "@stellar/stellar-sdk";

const USDC_DECIMALS = 7;

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) return { ok: false, status: r.status };
  const data = await r.json();
  return { ok: true, data };
}

/**
 * @param {object} op - Operation.fromXDRObject output
 * @param {object} opts
 * @param {string} opts.tokenContractId
 * @param {string} opts.buyer
 * @param {string} opts.creator
 * @param {bigint} opts.minAmountRaw
 */
function invokeFunctionName(ic) {
  try {
    const fn = ic.functionName();
    if (typeof fn === "string") return fn;
    if (fn && typeof fn.toString === "function") return String(fn.toString());
    return String(fn);
  } catch {
    return "";
  }
}

/**
 * Zap402 `send_tip(tipper, creator, amount, message)` — message must be exactly `unlock:<itemId>`.
 */
function sorobanZap402SendTipMatches(op, opts) {
  if (!op || op.type !== "invokeHostFunction" || !op.func) return false;
  const hf = op.func;
  try {
    if (hf.switch().name !== "hostFunctionTypeInvokeContract") return false;
    const ic = hf.invokeContract();
    const contractStr = Address.fromScAddress(ic.contractAddress()).toString();
    if (contractStr !== opts.zap402ContractId) return false;
    if (invokeFunctionName(ic) !== "send_tip") return false;
    const args = ic.args();
    if (!args || args.length < 4) return false;
    const tipper = String(scValToNative(args[0]));
    const creator = String(scValToNative(args[1]));
    if (tipper !== opts.buyer || creator !== opts.creator) return false;
    const amtVal = scValToNative(args[2]);
    const paid =
      typeof amtVal === "bigint"
        ? amtVal
        : BigInt(Math.floor(Number(amtVal)));
    if (paid < opts.minAmountRaw) return false;
    const msgRaw = scValToNative(args[3]);
    const msgStr = typeof msgRaw === "string" ? msgRaw : String(msgRaw ?? "");
    const expected = `unlock:${opts.itemId}`;
    return msgStr === expected;
  } catch {
    return false;
  }
}

function sorobanTransferMatches(op, opts) {
  if (!op || op.type !== "invokeHostFunction" || !op.func) return false;
  const hf = op.func;
  try {
    if (hf.switch().name !== "hostFunctionTypeInvokeContract") return false;
    const ic = hf.invokeContract();
    const contractStr = Address.fromScAddress(ic.contractAddress()).toString();
    if (contractStr !== opts.tokenContractId) return false;
    const fn = String(ic.functionName());
    if (fn !== "transfer") return false;
    const args = ic.args();
    if (!args || args.length < 3) return false;
    const from = String(scValToNative(args[0]));
    const to = String(scValToNative(args[1]));
    if (from !== opts.buyer || to !== opts.creator) return false;
    const amtVal = scValToNative(args[2]);
    const paid =
      typeof amtVal === "bigint"
        ? amtVal
        : BigInt(Math.floor(Number(amtVal)));
    return paid >= opts.minAmountRaw;
  } catch {
    return false;
  }
}

/**
 * @param {object} p
 * @param {string} p.horizonUrl
 * @param {string} p.networkPassphrase
 * @param {string} [p.tokenContractId] - USDC (SAC) contract id (legacy path)
 * @param {string} [p.zap402ContractId] - Zap402 contract id (`send_tip` path)
 * @param {string} p.txHash
 * @param {string} p.buyer
 * @param {string} p.creator
 * @param {string} p.itemId
 * @param {number} p.expectedAmount - human USDC
 * @param {'USDC'} p.currency
 */
export async function verifyUnlockTransaction(p) {
  const base = p.horizonUrl.replace(/\/$/, "");
  const txUrl = `${base}/transactions/${p.txHash}`;
  const txRes = await fetchJson(txUrl);
  if (!txRes.ok) return { ok: false, reason: "tx_fetch_failed", status: txRes.status };
  const tx = txRes.data;
  if (!tx.successful) return { ok: false, reason: "tx_not_successful" };

  if (tx.source_account !== p.buyer) {
    return { ok: false, reason: "source_not_buyer" };
  }

  const tokenId = (p.tokenContractId || "").trim();
  const zapId = (p.zap402ContractId || "").trim();
  if (!tokenId && !zapId) {
    return { ok: false, reason: "unlock_verify_unconfigured" };
  }

  const envB64 = tx.envelope_xdr;
  if (!envB64 || typeof envB64 !== "string") {
    return { ok: false, reason: "missing_envelope_xdr" };
  }

  let parsed;
  try {
    parsed = TransactionBuilder.fromXDR(envB64, p.networkPassphrase);
  } catch (e) {
    return { ok: false, reason: "envelope_parse_failed", detail: String(e?.message || e) };
  }

  const inner = parsed.innerTransaction ? parsed.innerTransaction : parsed;
  const minRaw = BigInt(Math.round(p.expectedAmount * 10 ** USDC_DECIMALS));

  for (const op of inner.operations || []) {
    if (
      zapId &&
      sorobanZap402SendTipMatches(op, {
        zap402ContractId: zapId,
        buyer: p.buyer,
        creator: p.creator,
        itemId: p.itemId,
        minAmountRaw: minRaw,
      })
    ) {
      return { ok: true };
    }
    if (
      tokenId &&
      sorobanTransferMatches(op, {
        tokenContractId: tokenId,
        buyer: p.buyer,
        creator: p.creator,
        minAmountRaw: minRaw,
      })
    ) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    reason: zapId ? "no_matching_send_tip_or_transfer" : "no_matching_soroban_transfer",
  };
}

export function purchaseRecordId() {
  return `pur_${crypto.randomBytes(10).toString("hex")}`;
}
