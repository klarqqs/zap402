import React, { useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";

import Input from "@/components/primitives/Input";
import Button from "@/components/primitives/Button";
import { env, resolveUsdcContractIdForWallet } from "@/config/env";
import { CONTRACT_NOT_CONFIGURED_CODE } from "@/config/contractSetup";
import { useWallet, useContract } from "@/hooks";
import { useWalletStore } from "@/state/walletStore";
import {
  BASE_FEE,
  getServer,
  getTxBuilder,
  getTokenBalance,
  getTokenDecimals,
} from "@/services/soroban";
import type { NetworkDetails } from "@/utils/network";

export interface ZapAmountInputProps {
  zapAmount: string;
  onZapAmountChange: (value: string) => void;
  balance?: string;
}

const QUICK_AMOUNTS = ["1", "5", "10", "25", "50"];
const DEFAULT_MIN_TIP = "0.1";

/** Peer-to-peer tips in this app are always labeled USDC in the UI (wallets may still show the raw SAC name). */
const TIP_UI_ASSET = "USDC";

const ZapAmountInput: React.FC<ZapAmountInputProps> = ({
  zapAmount,
  onZapAmountChange,
  balance,
}) => {
  const { connected, publicKey } = useWallet();
  const { network } = useWalletStore();
  const { getMinTipAmount, getContractConfig } = useContract();
  const [useCustom, setUseCustom] = useState(!QUICK_AMOUNTS.includes(zapAmount));
  const [fetchedBalance, setFetchedBalance] = useState<string>("");
  /** When false, on-chain tip SAC ≠ app USDC id — operator should call set_tip_asset. */
  const [onChainTipMatchesAppUsdc, setOnChainTipMatchesAppUsdc] = useState<
    boolean | null
  >(null);
  const [minTipDisplay, setMinTipDisplay] = useState<string>(DEFAULT_MIN_TIP);

  const networkDetails: NetworkDetails = useMemo(
    () => ({
      network,
      networkUrl:
        network === "PUBLIC"
          ? "https://horizon.stellar.org"
          : env.horizonUrl,
      networkPassphrase:
        network === "PUBLIC"
          ? "Public Global Stellar Network ; September 2015"
          : env.networkPassphrase,
    }),
    [network],
  );

  useEffect(() => {
    let active = true;

    const fetchMinTip = async () => {
      try {
        const minZap = await getMinTipAmount();
        if (active) {
          setMinTipDisplay(minZap);
        }
      } catch (err) {
        console.error("Failed to fetch minimum zap amount:", err);
        if (active) {
          setMinTipDisplay(DEFAULT_MIN_TIP);
        }
      }
    };

    void fetchMinTip();

    return () => {
      active = false;
    };
  }, [getMinTipAmount]);

  useEffect(() => {
    let active = true;

    const loadSacBalance = async () => {
      if (!connected || !publicKey || !env.contractConfigured) {
        if (active) {
          setFetchedBalance("");
          setOnChainTipMatchesAppUsdc(null);
        }
        return;
      }

      try {
        const cfg = await getContractConfig();
        const sac = cfg.nativeToken?.trim();
        if (!sac) {
          if (active) setFetchedBalance("");
          return;
        }

        const appUsdc = resolveUsdcContractIdForWallet(network);
        const matches =
          Boolean(appUsdc) && sac.toUpperCase() === appUsdc.toUpperCase();

        const srv = getServer(networkDetails);

        const tbBal = await getTxBuilder(
          publicKey,
          BASE_FEE,
          srv,
          networkDetails.networkPassphrase,
        );
        const balanceRaw = await getTokenBalance(
          publicKey,
          sac,
          tbBal,
          srv,
        );

        const tbDec = await getTxBuilder(
          publicKey,
          BASE_FEE,
          srv,
          networkDetails.networkPassphrase,
        );
        const decimals = await getTokenDecimals(sac, tbDec, srv);

        if (!active) return;

        const human = new BigNumber(balanceRaw)
          .dividedBy(new BigNumber(10).pow(decimals))
          .decimalPlaces(6, BigNumber.ROUND_DOWN)
          .toFixed();
        setFetchedBalance(human);
        setOnChainTipMatchesAppUsdc(
          appUsdc ? matches : null,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (
          msg.includes(CONTRACT_NOT_CONFIGURED_CODE) ||
          msg.includes("not configured")
        ) {
          if (active) {
            setFetchedBalance("");
            setOnChainTipMatchesAppUsdc(null);
          }
          return;
        }
        console.error("Failed to load tip asset balance:", e);
        if (active) {
          setFetchedBalance("");
          setOnChainTipMatchesAppUsdc(null);
        }
      }
    };

    void loadSacBalance();

    return () => {
      active = false;
    };
  }, [connected, publicKey, getContractConfig, networkDetails, network]);

  const effectiveBalance = balance ?? fetchedBalance;
  const numericAmount = Number(zapAmount);
  const numericBalance = Number(effectiveBalance);
  const numericMinTip = Number(minTipDisplay);

  const amountError = useMemo(() => {
    if (!zapAmount.trim()) {
      return "Enter a zap amount.";
    }

    if (Number.isNaN(numericAmount)) {
      return "Amount must be numeric.";
    }

    if (numericAmount <= 0) {
      return "Amount must be greater than 0.";
    }

    if (numericAmount < numericMinTip) {
      return `Minimum tip is ${minTipDisplay} ${TIP_UI_ASSET} (contract rule).`;
    }

    if (
      connected &&
      effectiveBalance !== "" &&
      effectiveBalance != null &&
      !Number.isNaN(numericBalance) &&
      numericAmount > numericBalance
    ) {
      return `Amount exceeds your available ${TIP_UI_ASSET} balance for tipping.`;
    }

    return undefined;
  }, [
    zapAmount,
    connected,
    effectiveBalance,
    numericAmount,
    numericBalance,
    minTipDisplay,
    numericMinTip,
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-zap-bg-alt bg-zap-teal-dim/25 p-5 text-center dark:bg-zap-teal-dim/15">
        <p className="font-body text-4xl font-semibold tabular-nums tracking-tight text-zap-ink">
          {zapAmount || "0"}{" "}
          <span className="text-2xl font-semibold text-zap-ink-muted">
            {TIP_UI_ASSET}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <Button
            key={value}
            type="button"
            variant={
              !useCustom && zapAmount === value ? "editorial" : "editorialGhost"
            }
            size="sm"
            className="!uppercase tracking-[0.06em] w-full min-w-0"
            onClick={() => {
              setUseCustom(false);
              onZapAmountChange(value);
            }}
          >
            {value} {TIP_UI_ASSET}
          </Button>
        ))}

        <Button
          type="button"
          variant={useCustom ? "editorial" : "editorialGhost"}
          size="sm"
          className="!uppercase tracking-[0.06em] w-full min-w-0"
          onClick={() => {
            setUseCustom(true);
            if (QUICK_AMOUNTS.includes(zapAmount)) {
              onZapAmountChange("");
            }
          }}
        >
          Custom
        </Button>
      </div>

      {useCustom && (
        <Input
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={zapAmount}
          onChange={(event) => onZapAmountChange(event.target.value)}
          error={amountError}
        />
      )}

      {!useCustom && amountError && (
        <p className="text-sm font-medium text-zap-error">{amountError}</p>
      )}

      {onChainTipMatchesAppUsdc === false ? (
        <p
          className="rounded-xl border border-zap-warning-dim bg-zap-warning-dim/25 px-3 py-2 text-xs font-medium leading-relaxed text-zap-ink dark:bg-zap-warning-dim/15"
          role="status"
        >
          This Zap402 contract’s on-chain tip token is not the same USDC contract this app expects.
          Until the deployer points tips at USDC (e.g. <code className="font-mono text-[11px]">set_tip_asset</code>
          with your network’s USDC SAC), your wallet may show a different asset for the same transaction.
        </p>
      ) : null}

      {connected && effectiveBalance !== "" && effectiveBalance != null ? (
        <p className="text-sm text-zap-ink-muted">
          {onChainTipMatchesAppUsdc === false ? (
            <>
              Balance on the contract&apos;s tip token:{" "}
              <span className="font-mono tabular-nums text-zap-ink">
                {Number(effectiveBalance).toLocaleString()}
              </span>
              <span className="block text-xs text-zap-ink-faint">
                Not labeled as USDC until the contract tip asset is USDC.
              </span>
            </>
          ) : (
            <>
              Available for tips:{" "}
              <span className="font-mono tabular-nums text-zap-ink">
                {Number(effectiveBalance).toLocaleString()} {TIP_UI_ASSET}
              </span>
            </>
          )}
          {env.contractConfigured ? null : (
            <span className="block text-xs text-zap-ink-faint">
              Set VITE_CONTRACT_ID to load the on-chain tip asset balance.
            </span>
          )}
        </p>
      ) : null}
    </div>
  );
};

export default ZapAmountInput;
