import { useState, useCallback } from "react";

import { useContract } from "@/hooks/useContract";

export type TxStatus =
  | "idle"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

interface ZapState {
  sending: boolean;
  withdrawing: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: TxStatus;
}

export interface UseZap402Return extends ZapState {
  sendZap: (creator: string, zapAmount: string, message: string) => Promise<void>;
  withdrawTips: (amount: string) => Promise<void>;
  reset: () => void;
}

const initialState: ZapState = {
  sending: false,
  withdrawing: false,
  error: null,
  txHash: null,
  txStatus: "idle",
};

export const useZap402 = (): UseZap402Return => {
  const [state, setState] = useState<ZapState>(initialState);
  const { sendZap: contractSendZap, withdrawTips: contractWithdrawTips } = useContract();

  const sendZap = useCallback(
    async (creator: string, zapAmount: string, message: string): Promise<void> => {
      setState({ ...initialState, sending: true, txStatus: "signing" });
      try {
        const result = await contractSendZap(creator, zapAmount, message);

        setState((prev) => ({
          ...prev,
          txStatus: "success",
          sending: false,
          txHash: result,
        }));
      } catch (err) {
        console.error("Zap transaction failed:", err);
        const msg = err instanceof Error ? err.message : "Failed to send zap";
        setState((prev) => ({
          ...prev,
          sending: false,
          error: msg,
          txStatus: "error",
        }));
        throw err;
      }
    },
    [contractSendZap]
  );

  const withdrawTips = useCallback(
    async (amount: string): Promise<void> => {
      setState({ ...initialState, withdrawing: true, txStatus: "signing" });
      try {
        const result = await contractWithdrawTips(amount);

        setState((prev) => ({
          ...prev,
          txStatus: "success",
          withdrawing: false,
          txHash: result,
        }));
      } catch (err) {
        console.error("Withdrawal failed:", err);
        const msg = err instanceof Error ? err.message : "Failed to withdraw";
        setState((prev) => ({
          ...prev,
          withdrawing: false,
          error: msg,
          txStatus: "error",
        }));
        throw err;
      }
    },
    [contractWithdrawTips]
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, sendZap, withdrawTips, reset };
};
