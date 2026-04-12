import React from "react";

import {
  CONTRACT_NOT_CONFIGURED_CODE,
  getContractSetupInstructions,
  isContractConfigurationHelpText,
} from "@/config/contractSetup";
import Button from "@/components/primitives/Button";
import { ERRORS, ErrorCategory, formatUserFacingContractError } from "@/utils/error";

interface ErrorStateProps {
  message?: string;
  /** When `message` is omitted, shown text is derived from this (e.g. caught error). */
  error?: unknown;
  onRetry?: () => void;
  category?: ErrorCategory;
  className?: string;
  /** Kept for API compatibility; layout matches editorial empty states either way. */
  variant?: "default" | "editorial";
}

const getCopy = (category: ErrorCategory) => {
  switch (category) {
    case "network":
      return {
        title: "Connection issue",
        defaultMessage: ERRORS.NETWORK,
      };
    case "not-found":
      return {
        title: "Not found",
        defaultMessage: ERRORS.NOT_FOUND,
      };
    case "contract":
    default:
      return {
        title: "Couldn't complete that",
        defaultMessage: ERRORS.CONTRACT,
      };
  }
};

/**
 * Same chrome as leaderboard / top-creators empty states (dashed card, ⚡, editorial CTA).
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  error,
  onRetry,
  category = "unknown",
  className = "",
}) => {
  const content = getCopy(category);

  const detailMessage =
    message ??
    (error !== undefined ? formatUserFacingContractError(error) : undefined);
  const bodyText = detailMessage || content.defaultMessage;
  const displayBody =
    bodyText === CONTRACT_NOT_CONFIGURED_CODE
      ? getContractSetupInstructions()
      : bodyText;

  const plainContractHelp =
    isContractConfigurationHelpText(message ?? "") ||
    isContractConfigurationHelpText(detailMessage ?? "") ||
    isContractConfigurationHelpText(bodyText);

  if (plainContractHelp) {
    return (
      <div className={`flex justify-center px-4 py-12 sm:py-16 ${className}`}>
        <div
          className="mx-auto w-full max-w-[480px] rounded-2xl bg-zap-bg-alt px-8 py-14 text-center md:px-12 md:py-16"
          role="alert"
        >
          <h2 className="font-display font-bold mx-auto w-full text-[clamp(2rem,9vw,3.5rem)] leading-[1.1] tracking-tight text-zap-ink">
            No contract data
          </h2>
          <p className="font-body mx-auto w-full max-w-[720px] text-[20px] leading-snug text-zap-ink md:mt-6 md:text-[28px]">
            {displayBody}
          </p>
          {onRetry ? (
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                variant="editorial"
                size="md"
                onClick={onRetry}
                className="btn-primary inline-flex min-w-[200px] items-center justify-center text-center normal-case tracking-normal sm:w-auto !rounded-8xl !py-5 !text-lg"

              >
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center px-4 py-12 sm:py-16 ${className}`}
    >
      <div
        className="mx-auto w-full max-w-[480px] rounded-2xl bg-zap-bg-alt px-8 py-14 text-center md:px-12 md:py-16"
        role="alert"
      >

        <h2 className="font-display font-bold mx-auto w-full text-[clamp(2rem,9vw,3.5rem)] leading-[1.1] tracking-tight text-zap-ink">
          {content.title}
        </h2>
        <p className="font-body mx-auto w-full max-w-[720px] text-[20px] leading-snug text-zap-ink md:mt-6 md:text-[28px]">
          {displayBody}
        </p>
        {onRetry ? (
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="editorial"
              size="md"
              onClick={onRetry}
              className="btn-primary inline-flex min-w-[200px] items-center justify-center text-center normal-case tracking-normal sm:w-auto !rounded-8xl !py-5 !text-lg"
            >
              Try again
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ErrorState;
