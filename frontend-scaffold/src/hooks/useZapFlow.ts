import { useCallback, useEffect, useMemo, useState } from "react";

import { useZapPayment } from "@/hooks/useZapPayment";

export type ZapFlowStep =
  | "form"
  | "confirm"
  | "signing"
  | "submitting"
  | "success"
  | "error";

interface UseZapFlowReturn {
  step: ZapFlowStep;
  goToConfirm: (zapAmount: string, message: string) => void;
  confirmAndSign: () => Promise<void>;
  reset: () => void;
  error: string | null;
  txHash: string | null;
}

export const useZapFlow = (creatorAddress: string): UseZapFlowReturn => {
  const { executeZap, zapTxHash, zapTxStatus, zapError, resetZap } =
    useZapPayment();
  const [step, setStep] = useState<ZapFlowStep>("form");
  const [draft, setDraft] = useState<{
    zapAmount: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (zapTxStatus === "signing") {
        setStep("signing");
        return;
      }

      if (zapTxStatus === "submitting" || zapTxStatus === "confirming") {
        setStep("submitting");
        return;
      }

      if (zapTxStatus === "success") {
        setStep("success");
        return;
      }

      if (zapTxStatus === "error") {
        setStep("error");
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [zapTxStatus]);

  const goToConfirm = useCallback((zapAmount: string, message: string) => {
    setDraft({ zapAmount, message });
    setStep("confirm");
  }, []);

  const confirmAndSign = useCallback(async () => {
    if (!draft) {
      setStep("form");
      return;
    }

    await executeZap(creatorAddress, draft.zapAmount, draft.message);
  }, [creatorAddress, draft, executeZap]);

  const reset = useCallback(() => {
    setStep("form");
    setDraft(null);
    resetZap();
  }, [resetZap]);

  return useMemo(
    () => ({
      step,
      goToConfirm,
      confirmAndSign,
      reset,
      error: zapError,
      txHash: zapTxHash,
    }),
    [step, goToConfirm, confirmAndSign, reset, zapError, zapTxHash],
  );
};
