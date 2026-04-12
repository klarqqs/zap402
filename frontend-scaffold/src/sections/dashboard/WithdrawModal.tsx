import React, { useMemo } from "react";
import BigNumber from "bignumber.js";

import Modal, { MODAL_FOOTER_CANCEL_CLASS } from "@/components/primitives/Modal";
import Button from "@/components/primitives/Button";
import Input from "@/components/primitives/Input";
import TransactionStatus from "@/components/feedback/TransactionStatus";
import { useZap402, useProfile } from "@/hooks";
import { useToastStore } from "@/state/toastStore";
import { ERRORS, categorizeError } from "@/utils/error";
import { formatZapAmountAsUsdc, stroopToXlmBigNumber } from "@/utils/format";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: string;
  feeBps: number;
}

function trimTrailingZeros(s: string): string {
  return s.replace(/\.?0+$/, "") || "0";
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  balance,
  feeBps,
}) => {
  const [amount, setAmount] = React.useState("");
  const { withdrawTips, withdrawing, error, txHash, txStatus, reset } = useZap402();
  const { refetch } = useProfile();
  const { addToast } = useToastStore();

  const balanceHuman = useMemo(
    () => stroopToXlmBigNumber(new BigNumber(balance || "0")),
    [balance],
  );

  const amountHuman = useMemo(() => {
    const raw = amount.trim();
    if (!raw) return new BigNumber(0);
    const bn = new BigNumber(raw);
    return bn.isFinite() ? bn : new BigNumber(0);
  }, [amount]);

  const feeHuman = amountHuman.multipliedBy(feeBps).dividedBy(10_000);
  const netHuman = BigNumber.max(0, amountHuman.minus(feeHuman));

  const canWithdraw =
    amountHuman.gt(0) && amountHuman.lte(balanceHuman) && balanceHuman.gt(0);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw) return;

    try {
      await withdrawTips(amount.trim());
      addToast({
        type: "success",
        message: `Successfully withdrawn ${amount.trim()} USDC`,
        duration: 5000,
      });
      refetch();
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error("Withdrawal failed:", err);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const setMaxAmount = () => {
    if (!balanceHuman.isFinite() || balanceHuman.lte(0)) {
      setAmount("");
      return;
    }
    const rounded = balanceHuman.decimalPlaces(7, BigNumber.ROUND_DOWN);
    setAmount(trimTrailingZeros(rounded.toFixed(7)));
  };

  const feePercentLabel = (feeBps / 100).toFixed(2);
  const totalAvailableLabel = formatZapAmountAsUsdc(balance || "0");
  const disabledInput = withdrawing || txStatus === "success";

  const confirmBtnClass =
    "w-full !min-h-11 !h-11 max-h-11 shrink-0 normal-case tracking-normal";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Withdraw">
      <form onSubmit={handleWithdraw} className="space-y-6">
        <p className="text-pretty text-sm font-medium leading-relaxed text-zap-ink-muted">
          Transfer your available balance to your connected Stellar wallet. A platform fee of{" "}
          <span className="font-semibold text-zap-ink">{feePercentLabel}%</span> applies.
        </p>

        <div className="space-y-2">
          <label
            htmlFor="withdraw-amount"
            className="block font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-zap-ink-muted"
          >
            Amount to withdraw
          </label>
          <Input
            id="withdraw-amount"
            variant="editorial"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={disabledInput}
            className="min-w-0 pr-[4.5rem]"
            endAdornment={
              <button
                type="button"
                onClick={setMaxAmount}
                disabled={disabledInput || !balanceHuman.gt(0)}
                className="pointer-events-auto rounded-full border-0 bg-transparent px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-brand transition-colors hover:bg-zap-bg-alt/70 disabled:pointer-events-none disabled:opacity-40"
              >
                Max
              </button>
            }
          />
        </div>

        <div className="kofi-dashboard-card space-y-0 p-4 shadow-none">
          <dl className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between gap-4">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-muted">Platform fee</dt>
              <dd className="tabular-nums text-zap-ink">
                {feeHuman.isFinite() ? feeHuman.toFixed(2) : "0.00"} USDC
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-dashed border-[var(--card-border-soft)] pt-3">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-muted">You&apos;ll receive</dt>
              <dd className="tabular-nums font-semibold text-zap-brand">
                {netHuman.isFinite() ? netHuman.toFixed(2) : "0.00"} USDC
              </dd>
            </div>
          </dl>
        </div>

        <div className="kofi-dashboard-card px-4 py-5 text-center shadow-none">
          <p className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-zap-ink-muted">
            Total available balance
          </p>
          <p className="mt-2 font-body text-2xl font-semibold tabular-nums tracking-tight text-zap-ink sm:text-3xl">
            {totalAvailableLabel}
          </p>
        </div>

        {txStatus === "signing" || txStatus === "submitting" || txStatus === "confirming" ? (
          <div className="space-y-3">
            <TransactionStatus
              variant="editorial"
              status={txStatus}
              txHash={txHash ?? undefined}
              errorMessage={
                error ? (categorizeError(error) === "network" ? ERRORS.NETWORK : ERRORS.CONTRACT) : undefined
              }
            />
            {txStatus === "signing" ? (
              <p className="text-pretty text-center text-xs leading-relaxed text-zap-ink-muted">
                Withdrawal waits on your wallet: open Freighter or xBull and confirm the transaction.
                If nothing appears, check the extension icon or your popup blocker.
              </p>
            ) : null}
          </div>
        ) : null}

        {txStatus === "success" && (
          <div className="kofi-dashboard-card border-none bg-zap-teal/10 px-4 py-3 text-center text-sm font-semibold text-zap-ink shadow-none dark:bg-zap-teal/15">
            Withdrawal successful
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          <Button
            variant="brandCta"
            size="sm"
            type="submit"
            className={confirmBtnClass}
            loading={withdrawing}
            disabled={withdrawing || !canWithdraw || txStatus === "success"}
          >
            {withdrawing ? "Processing…" : "Confirm withdrawal"}
          </Button>
          <button
            type="button"
            onClick={handleClose}
            disabled={withdrawing}
            className={MODAL_FOOTER_CANCEL_CLASS}
          >
            {txStatus === "success" ? "Done" : "Cancel"}
          </button>
        </div>

        <p className="mx-auto max-w-md text-center text-xs leading-relaxed text-zap-ink-muted">
          A tiny Stellar network fee is paid from your account reserve (not from this USDC withdrawal).
          USDC arrives in your wallet as soon as the transaction confirms.
        </p>
      </form>
    </Modal>
  );
};

export default WithdrawModal;
