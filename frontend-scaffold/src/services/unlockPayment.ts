import {
  BASE_FEE,
  getServer,
  getTxBuilder,
  makePayment,
  submitTx,
} from "@/services/soroban";
import type { NetworkDetails } from "@/utils/network";

const USDC_DECIMALS = 7;

/**
 * Soroban SEP-41 `transfer` (e.g. USDC SAC). No classic memo; unlock verification uses envelope XDR.
 */
export async function sendSorobanTokenPayment(params: {
  networkDetails: NetworkDetails;
  tokenContractId: string;
  payerPublicKey: string;
  recipientAddress: string;
  amountHuman: string;
  signTransaction: (xdr: string) => Promise<string>;
}): Promise<string> {
  const raw = Math.round(parseFloat(params.amountHuman) * 10 ** USDC_DECIMALS);
  if (!Number.isFinite(raw) || raw <= 0) {
    throw new Error("Invalid token amount");
  }
  const server = getServer(params.networkDetails);
  const txBuilder = await getTxBuilder(
    params.payerPublicKey,
    BASE_FEE,
    server,
    params.networkDetails.networkPassphrase,
  );
  const xdrOut = await makePayment(
    params.tokenContractId,
    raw,
    params.recipientAddress,
    params.payerPublicKey,
    "",
    txBuilder,
    server,
  );
  const signed = await params.signTransaction(xdrOut);
  return submitTx(signed, params.networkDetails.networkPassphrase, server);
}

/** Unlock purchase: USDC (or same-decimals SAC) to creator. */
export async function sendUnlockTokenPayment(params: {
  networkDetails: NetworkDetails;
  tokenContractId: string;
  buyerPublicKey: string;
  creatorAddress: string;
  amountHuman: string;
  signTransaction: (xdr: string) => Promise<string>;
}): Promise<string> {
  return sendSorobanTokenPayment({
    networkDetails: params.networkDetails,
    tokenContractId: params.tokenContractId,
    payerPublicKey: params.buyerPublicKey,
    recipientAddress: params.creatorAddress,
    amountHuman: params.amountHuman,
    signTransaction: params.signTransaction,
  });
}
