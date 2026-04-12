import React, { useState } from "react";
import { HeartHandshake, Wallet, ArrowRight } from "lucide-react";

import Button from "@/components/primitives/Button";
import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import { useWallet } from "@/hooks";
import { Profile } from "@/types/contract";
import ZapAmountInput from "./ZapAmountInput";
import ZapMessageInput from "./ZapMessageInput";

interface ZapFormProps {
  creator: Profile;
  onSubmit: (zapAmount: string, message: string) => void;
  isSubmitting?: boolean;
}

const ZapForm: React.FC<ZapFormProps> = ({ creator, onSubmit, isSubmitting = false }) => {
  const { connected } = useWallet();
  const openWalletConnect = useOpenWalletConnect();
  const [zapAmount, setZapAmount] = useState("5");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!connected) {
      openWalletConnect();
      return;
    }
    onSubmit(zapAmount, message);
  };

  const isInvalid = !zapAmount || Number(zapAmount) <= 0;
  const isDisabled = isSubmitting || isInvalid;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ZapAmountInput
        zapAmount={zapAmount}
        onZapAmountChange={setZapAmount}
        balance={creator.balance}
      />

      <ZapMessageInput
        message={message}
        onChange={setMessage}
        disabled={isSubmitting}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {connected ? (
          <Button
            type="submit"
            variant="editorial"
            size="sm"
            loading={isSubmitting}
            disabled={isDisabled}
            icon={<HeartHandshake size={16} />}
            iconRight={<ArrowRight size={16} />}
            className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
          >
            Sign & Send · {zapAmount || "0"} @{creator.username}
          </Button>
        ) : (
          <Button
            type="button"
            variant="editorial"
            size="sm"
            icon={<Wallet size={16} />}
            onClick={openWalletConnect}
            className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
          >
            Connect Wallet
          </Button>
        )}

        <Button
          type="button"
          variant="editorialGhost"
          size="sm"
          onClick={() => {
            setZapAmount("5");
            setMessage("");
          }}
          disabled={isSubmitting}
          className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
        >
          Abort
        </Button>
      </div>
    </form>
  );
};

export default ZapForm;
