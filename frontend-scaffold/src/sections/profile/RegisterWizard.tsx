import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import TransactionStatus from "@/components/feedback/TransactionStatus";
import { useContract } from "@/hooks";
import { useToastStore } from "@/state/toastStore";
import { useWalletStore } from "@/state/walletStore";
import { ProfileFormData } from "@/types/profile";
import {
  ERRORS,
  formatUserFacingContractError,
  isAlreadyRegisteredContractError,
  isLikelyNetworkError,
} from "@/utils/error";
import { TERMINAL_DEFAULT_PATH } from "@/constants/terminalNav";
import { getSiteOrigin } from "@/config/site";
import RegisterSuccessCelebration from "@/sections/profile/RegisterSuccessCelebration";
import { useInteractionHistoryStore } from "@/state/interactionHistoryStore";
import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";

type TxStatus = "idle" | "signing" | "submitting" | "confirming" | "success" | "error";

// ─── Profile generators ────────────────────────────────────────────────────

const BIOS = [
  "Building in public. Sharing the journey one post at a time.",
  "Creator on Zap402. Here to connect, share, and get supported.",
  "Making things worth supporting. Appreciate every tip.",
  "Independent creator. Fuelled by curiosity and community.",
  "Shipping ideas, stories, and experiments. Support welcome.",
  "On-chain creator. Every contribution keeps the work going.",
  "Creating freely. Supported by people who get it.",
  "New to Zap402. Still figuring it out — come along for the ride.",
];

/** Derive a short, URL-safe handle from a Stellar public key */
function generateUsername(publicKey: string): string {
  // Take characters from different parts of the key for more uniqueness
  const segment = (publicKey.slice(2, 6) + publicKey.slice(-6)).toLowerCase();
  return `user_${segment}`;
}

function generateDisplayName(publicKey: string): string {
  const suffix = publicKey.slice(-4).toUpperCase();
  return `User ${suffix}`;
}

function generateBio(): string {
  return BIOS[Math.floor(Math.random() * BIOS.length)];
}

// ──────────────────────────────────────────────────────────────────────────

const REGISTER_WALLET_REQUIRED_MESSAGE = "Connect Wallet · then retry.";

const RegisterWizard: React.FC = () => {
  const navigate = useNavigate();
  const connected = useWalletStore((s) => s.connected);
  const publicKey = useWalletStore((s) => s.publicKey);
  const openWalletConnect = useOpenWalletConnect();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);
  const [celebrationUsername, setCelebrationUsername] = useState<string | null>(null);

  const { registerProfile } = useContract();
  const { addToast } = useToastStore();
  const siteOrigin = getSiteOrigin();

  // Prevent double-firing in StrictMode / re-renders
  const hasFired = useRef(false);

  const autoRegister = async (key: string) => {
    if (hasFired.current) return;
    hasFired.current = true;

    const data: ProfileFormData = {
      username: generateUsername(key),
      displayName: generateDisplayName(key),
      bio: generateBio(),
      imageUrl: "",
      xHandle: "",
      instagramUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
    };

    try {
      setCelebrationUsername(null);
      setTxError(undefined);
      setTxHash(undefined);
      setTxStatus("signing");

      setTxStatus("submitting");
      const hash = await registerProfile(data);

      setTxStatus("confirming");
      setTxHash(hash);

      setTxStatus("success");
      setCelebrationUsername(data.username);

      addToast({
        message: "You're live — share your link to start receiving tips.",
        type: "success",
        duration: 5000,
      });
    } catch (err) {
      hasFired.current = false; // allow retry

      if (isAlreadyRegisteredContractError(err)) {
        addToast({
          message: "You already have a creator page — opening your dashboard.",
          type: "success",
          duration: 4000,
        });
        useInteractionHistoryStore.getState().setActiveJourneyId(null);
        navigate(TERMINAL_DEFAULT_PATH, { replace: true });
        setTxStatus("idle");
        setTxError(undefined);
        return;
      }

      setTxStatus("error");

      if (isLikelyNetworkError(err)) {
        setTxError(ERRORS.NETWORK);
        return;
      }

      const msg = formatUserFacingContractError(err);
      const lower = msg.toLowerCase();

      if (lower.includes("wallet not connected")) {
        setTxError(REGISTER_WALLET_REQUIRED_MESSAGE);
      } else if (
        lower.includes("reject") ||
        lower.includes("denied") ||
        lower.includes("cancel") ||
        lower.includes("user declined")
      ) {
        setTxError("You declined the signature — try again when ready.");
      } else {
        setTxError(msg);
      }
    }
  };

  // Fire auto-register as soon as wallet is connected
  useEffect(() => {
    if (connected && publicKey && txStatus === "idle") {
      void autoRegister(publicKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  const handleRetry = () => {
    if (txError === REGISTER_WALLET_REQUIRED_MESSAGE) {
      openWalletConnect();
    }
    hasFired.current = false;
    setTxStatus("idle");
    setTxError(undefined);
    // Re-trigger if still connected
    if (connected && publicKey) {
      void autoRegister(publicKey);
    }
  };

  // ── Celebration screen ──────────────────────────────────────────────────
  if (txStatus === "success" && celebrationUsername) {
    return (
      <RegisterSuccessCelebration
        username={celebrationUsername}
        pageUrl={`${siteOrigin}/@${celebrationUsername}`}
        txHash={txHash}
      />
    );
  }

  // ── Main screen ─────────────────────────────────────────────────────────
  const isSubmitting = ["signing", "submitting", "confirming"].includes(txStatus);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="font-body text-2xl font-semibold tracking-tight text-zap-ink">
          {connected ? "Setting up your profile…" : "Get started on Zap402"}
        </h2>
        <p className="font-body text-sm leading-relaxed text-zap-ink-muted">
          {connected
            ? "We're creating your creator profile on-chain. This takes one signature."
            : "Connect your wallet and your profile is created automatically — no forms needed."}
        </p>
      </div>

      {/* Wallet status */}
      {!connected ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-zap-bg-alt bg-zap-bg-alt px-4 py-3 font-body text-sm text-zap-ink-muted">
            Connect your wallet to get live instantly. No form to fill out.
          </div>
          <button
            type="button"
            onClick={() => openWalletConnect()}
            className="btn-primary inline-flex w-full min-h-[48px] items-center justify-center font-body normal-case tracking-normal"
          >
            Connect wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Auto-generating indicator */}
          {isSubmitting && (
            <div className="flex items-center gap-3 rounded-xl border border-zap-bg-alt/60 bg-zap-bg-alt px-4 py-3">
              <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zap-bg-alt border-t-zap-brand" />
              <p className="font-body text-sm text-zap-ink-muted">
                {txStatus === "signing" && "Waiting for wallet signature…"}
                {txStatus === "submitting" && "Submitting to Stellar…"}
                {txStatus === "confirming" && "Confirming on-chain…"}
              </p>
            </div>
          )}

          {/* Tx status (error / retry) */}
          {txStatus !== "idle" && !isSubmitting && (
            <TransactionStatus
              variant="editorial"
              status={txStatus}
              txHash={txHash}
              errorMessage={txError}
              onRetry={handleRetry}
              retryLabel={
                txError === REGISTER_WALLET_REQUIRED_MESSAGE
                  ? "Connect wallet"
                  : "Try again"
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterWizard;