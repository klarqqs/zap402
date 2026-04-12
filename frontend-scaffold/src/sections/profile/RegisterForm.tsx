import React, { useState } from 'react';
import Input from '@/components/primitives/Input';
import Textarea from '@/components/primitives/Textarea';
import Button from '@/components/primitives/Button';
import TransactionStatus from "@/components/feedback/TransactionStatus";
import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import {
  validateBio,
  validateDisplayName,
  validateUsername,
} from '@/utils/validation';
import { useContract, useUsernameCheck } from '@/hooks';
import { useToastStore } from '@/state/toastStore';
import { ProfileFormData } from '@/types/profile';
import {
  ERRORS,
  formatUserFacingContractError,
  isLikelyNetworkError,
} from '@/utils/error';
import { getSiteOrigin } from '@/config/site';
import RegisterSuccessCelebration from '@/sections/profile/RegisterSuccessCelebration';
import AvatarImageField from '@/sections/profile/AvatarImageField';
import { validateProfileImageUrlField } from '@/utils/profileImageUrl';

type TxStatus = 'idle' | 'signing' | 'submitting' | 'confirming' | 'success' | 'error';

/** Shown when register runs without a connected wallet; pairs with “Connect wallet” retry action. */
export const REGISTER_WALLET_REQUIRED_MESSAGE =
  "Connect Wallet · then retry.";

export type RegisterFormVisualVariant = 'default' | 'editorial';

interface FormErrors {
  username?: string;
  displayName?: string;
  bio?: string;
  imageUrl?: string;
  xHandle?: string;
}

function validate(data: ProfileFormData, available: boolean | null, checking: boolean): FormErrors {
  const errors: FormErrors = {};

  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.valid) {
    errors.username = usernameValidation.error;
  } else if (!checking && available === false) {
    errors.username = 'HANDLE_TAKEN: try another';
  } else if (checking) {
    errors.username = 'PROCESSING...';
  }

  const displayNameValidation = validateDisplayName(data.displayName);
  if (!displayNameValidation.valid) {
    errors.displayName = displayNameValidation.error;
  }

  const bioValidation = validateBio(data.bio);
  if (!bioValidation.valid) {
    errors.bio = bioValidation.error;
  }

  if (data.imageUrl.trim()) {
    const imgErr = validateProfileImageUrlField(data.imageUrl);
    if (imgErr) errors.imageUrl = imgErr;
  }

  return errors;
}

interface RegisterFormProps {
  /** `editorial` matches landing / claim hero (soft inputs, primary CTA). */
  visualVariant?: RegisterFormVisualVariant;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ visualVariant = 'default' }) => {
  const editorial = visualVariant === 'editorial';
  const [form, setForm] = useState<ProfileFormData>({
    username: '',
    displayName: '',
    bio: '',
    imageUrl: '',
    xHandle: '',
    instagramUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);
  const [celebrationUsername, setCelebrationUsername] = useState<string | null>(null);

  const { registerProfile } = useContract();
  const { addToast } = useToastStore();
  const openWalletConnect = useOpenWalletConnect();
  
  // Username availability check
  const { available, checking, error: availabilityError } = useUsernameCheck(form.username);

  const handleChange =
    (field: keyof ProfileFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      const err = (errors as Record<string, string | undefined>)[field];
      if (err) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(form, available, checking);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setCelebrationUsername(null);
      setTxStatus('signing');
      setTxError(undefined);
      setTxHash(undefined);

      const formData: ProfileFormData = {
        ...form,
        username: form.username.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        imageUrl: form.imageUrl.trim(),
        xHandle: form.xHandle.trim().replace(/^@/, ''),
        instagramUrl: '',
        tiktokUrl: '',
        youtubeUrl: '',
      };

      setTxStatus('submitting');
      const hash = await registerProfile(formData);

      setTxStatus('confirming');
      setTxHash(hash);

      setTxStatus('success');
      setCelebrationUsername(formData.username);
      addToast({
        message: "You're live — share your link to start receiving tips.",
        type: 'success',
        duration: 5000,
      });
    } catch (err) {
      setTxStatus('error');
      if (isLikelyNetworkError(err)) {
        setTxError(ERRORS.NETWORK);
        return;
      }
      const msg = formatUserFacingContractError(err);
      const lower = msg.toLowerCase();
      if (lower.includes('wallet not connected')) {
        setTxError(REGISTER_WALLET_REQUIRED_MESSAGE);
      } else if (
        lower.includes('reject') ||
        lower.includes('denied') ||
        lower.includes('cancel') ||
        lower.includes('user declined')
      ) {
        setTxError('ABORT · user declined signature');
      } else {
        setTxError(msg);
      }
    }
  };

  const isSubmitting = ['signing', 'submitting', 'confirming'].includes(txStatus);
  const siteOrigin = getSiteOrigin();

  const handleRegisterTxRetry = () => {
    if (txError === REGISTER_WALLET_REQUIRED_MESSAGE) {
      openWalletConnect();
    }
    setTxStatus("idle");
    setTxError(undefined);
  };

  const registerTxRetryLabel =
    txError === REGISTER_WALLET_REQUIRED_MESSAGE ? "Connect Wallet" : undefined;

  const fieldVariant = editorial ? 'editorial' : 'default';

  const showUsernameAvailability =
    Boolean(form.username && !errors.username) &&
    (checking || available === true || available === false);

  if (txStatus === 'success' && celebrationUsername) {
    return (
      <RegisterSuccessCelebration
        username={celebrationUsername}
        pageUrl={`${siteOrigin}/@${celebrationUsername}`}
        txHash={txHash}
      />
    );
  }

  const usernameAvailabilityAdornment = showUsernameAvailability ? (
      <>
        {checking && (
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-zap-bg-alt border-t-zap-brand dark:border-zap-bg-alt dark:border-t-white"
            aria-hidden
          />
        )}
        {!checking && available === true && (
          <span className="text-green-600 dark:text-green-400" aria-hidden>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
        {!checking && available === false && (
          <span className="text-red-600 dark:text-red-400" aria-hidden>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </>
  ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
      {/* Username */}
      <div>
        <Input
          variant={fieldVariant}
          label="HANDLE"
          placeholder="your_handle"
          value={form.username}
          onChange={handleChange("username")}
          error={errors.username}
          disabled={isSubmitting}
          maxLength={32}
          required
          className="pr-11"
          endAdornment={usernameAvailabilityAdornment}
        />
        <p
          className={
            editorial
              ? 'mt-3 break-all text-sm text-zap-ink-muted dark:text-zinc-400'
              : 'mt-2 break-all border-l-2 border-zap-bg-alt pl-3 text-xs font-medium text-zap-ink-muted dark:border-zap-bg-alt dark:text-zinc-400'
          }
        >
          <span
            className={
              editorial
                ? 'font-semibold text-zap-ink dark:text-zinc-200'
                : 'font-bold uppercase tracking-wide text-zap-ink dark:text-zinc-300'
            }
          >
            LINK_PREVIEW
          </span>{' '}
          <span className="font-mono text-zap-ink dark:text-white">
            {siteOrigin}/@{form.username || 'username'}
          </span>
        </p>
        {form.username && !errors.username && (
          <div className="mt-2 space-y-1">
            {checking && (
              <p className="text-xs font-semibold text-zap-ink-muted">
                FETCHING...
              </p>
            )}
            {!checking && available === true && (
              <p
                className={
                  editorial
                    ? 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-200'
                    : 'inline-block border border-green-700 bg-green-50 px-2 py-1 text-xs font-bold text-green-800 dark:border-green-500 dark:bg-green-950/50 dark:text-green-300'
                }
              >
                HANDLE_AVAILABLE: true ✓
              </p>
            )}
            {!checking && available === false && (
              <p
                className={
                  editorial
                    ? 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900 dark:bg-red-950/50 dark:text-red-200'
                    : 'inline-block border border-red-600 bg-red-50 px-2 py-1 text-xs font-bold text-red-800 dark:border-red-500 dark:bg-red-950/50 dark:text-red-300'
                }
              >
                HANDLE_TAKEN: try another
              </p>
            )}
            {availabilityError && (
              <p
                className={
                  editorial
                    ? 'text-xs font-semibold text-amber-800 dark:text-amber-300'
                    : 'text-xs font-bold text-amber-800 dark:text-amber-300'
                }
              >
                {availabilityError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Display Name */}
      <Input
        variant={fieldVariant}
        label="DISPLAY_NAME"
        placeholder="public_display_name"
        value={form.displayName}
        onChange={handleChange("displayName")}
        error={errors.displayName}
        disabled={isSubmitting}
        maxLength={64}
        required
      />

      <Textarea
        variant={fieldVariant}
        label="BIO_STRING"
        placeholder="// describe yourself in one line"
        value={form.bio}
        onChange={handleChange("bio")}
        error={errors.bio}
        disabled={isSubmitting}
        maxLength={280}
        rows={4}
      />

      <Input
        variant={fieldVariant}
        label="X_HANDLE (optional)"
        placeholder="@yourhandle"
        value={form.xHandle}
        onChange={handleChange("xHandle")}
        error={errors.xHandle}
        disabled={isSubmitting}
      />

      <AvatarImageField
        value={form.imageUrl}
        onChange={(next) => {
          setForm((prev) => ({ ...prev, imageUrl: next }));
          if (errors.imageUrl) {
            setErrors((prev) => ({ ...prev, imageUrl: undefined }));
          }
        }}
        error={errors.imageUrl}
        disabled={isSubmitting}
        variant={editorial ? "editorial" : "default"}
        fallbackLabel={form.displayName.trim() || form.username.trim() || "?"}
      />

      {/* Transaction status — editorial variant supplies its own card chrome */}
      {txStatus !== "idle" &&
        (editorial ? (
          <TransactionStatus
            variant="editorial"
            status={txStatus}
            txHash={txHash}
            errorMessage={txError}
            onRetry={handleRegisterTxRetry}
            retryLabel={registerTxRetryLabel}
          />
        ) : (
          <div className="border-2 border-dashed border-black bg-zap-bg-alt p-4 dark:border-white dark:bg-zinc-800/50">
            <TransactionStatus
              status={txStatus}
              txHash={txHash}
              errorMessage={txError}
              onRetry={handleRegisterTxRetry}
              retryLabel={registerTxRetryLabel}
            />
          </div>
        ))}

      <div
        className={
          editorial
            ? 'border-t border-zap-bg-alt pt-6 dark:border-zap-bg-alt'
            : 'border-t-2 border-dashed border-zap-bg-alt pt-6 dark:border-zap-bg-alt'
        }
      >
        <Button
          type="submit"
          variant={editorial ? 'brandCta' : 'primary'}
          size="lg"
          disabled={
            isSubmitting ||
            txStatus === 'success' ||
            checking ||
            available === false
          }
          className="w-full"
        >
          {isSubmitting ? "Creating…" : "Create your page"}
        </Button>
      </div>
    </form>
  );
};

export default RegisterForm;
