import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

import Input from "@/components/primitives/Input";
import Textarea from "@/components/primitives/Textarea";
import AvatarImageField from "@/sections/profile/AvatarImageField";
import TransactionStatus from "@/components/feedback/TransactionStatus";
import { useContract } from "@/hooks";
import { useToastStore } from "@/state/toastStore";
import { getSiteOrigin } from "@/config/site";
import type { Profile } from "@/types/contract";
import type { ProfileFormData } from "@/types/profile";
import { validateProfileImageUrlField } from "@/utils/profileImageUrl";
import {
  mergeProfileBio,
  splitProfileBio,
} from "@/utils/profileSocialLinks";

type TxStatus = "idle" | "signing" | "submitting" | "confirming" | "success" | "error";

interface FormErrors {
  displayName?: string;
  bio?: string;
  imageUrl?: string;
  xHandle?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
}

function normalizeOptionalUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function isValidOptionalUrl(raw: string): boolean {
  if (!raw.trim()) return true;
  try {
    const u = new URL(normalizeOptionalUrl(raw));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(data: ProfileFormData): FormErrors {
  const errors: FormErrors = {};
  const mergedBio = mergeProfileBio(data.bio, {
    instagram: data.instagramUrl,
    tiktok: data.tiktokUrl,
    youtube: data.youtubeUrl,
  });

  if (!data.displayName.trim() || data.displayName.length > 64) {
    errors.displayName = "Display name is required and must be 1–64 characters.";
  }

  if (mergedBio.length > 280) {
    errors.bio =
      "Bio plus social links must be 280 characters or fewer. Shorten your bio or remove a link.";
  }

  if (data.imageUrl.trim()) {
    const imgErr = validateProfileImageUrlField(data.imageUrl);
    if (imgErr) errors.imageUrl = imgErr;
  }

  if (!isValidOptionalUrl(data.instagramUrl)) {
    errors.instagramUrl = "Enter a valid URL (https://…).";
  }
  if (!isValidOptionalUrl(data.tiktokUrl)) {
    errors.tiktokUrl = "Enter a valid URL (https://…).";
  }
  if (!isValidOptionalUrl(data.youtubeUrl)) {
    errors.youtubeUrl = "Enter a valid URL (https://…).";
  }

  return errors;
}

interface EditProfileFormProps {
  profile: Profile;
}

const fieldVariant = "editorial" as const;

const EditProfileForm: React.FC<EditProfileFormProps> = ({ profile }) => {
  const split = useMemo(() => splitProfileBio(profile.bio ?? ""), [profile.bio]);
  const [form, setForm] = useState<ProfileFormData>({
    username: profile.username,
    displayName: profile.displayName,
    bio: split.core,
    imageUrl: profile.imageUrl,
    xHandle: profile.xHandle,
    instagramUrl: split.instagram,
    tiktokUrl: split.tiktok,
    youtubeUrl: split.youtube,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);

  const mergedBioForChain = useMemo(
    () =>
      mergeProfileBio(form.bio, {
        instagram: form.instagramUrl,
        tiktok: form.tiktokUrl,
        youtube: form.youtubeUrl,
      }),
    [form.bio, form.instagramUrl, form.tiktokUrl, form.youtubeUrl],
  );

  const { updateProfile } = useContract();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const siteOrigin = getSiteOrigin();

  const handleChange =
    (field: keyof ProfileFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setTxStatus("signing");
      setTxError(undefined);
      setTxHash(undefined);

      const data: Partial<ProfileFormData> = {};

      if (form.displayName.trim() !== profile.displayName) {
        data.displayName = form.displayName.trim();
      }
      const bioNormalized = mergedBioForChain.trim();
      if (bioNormalized !== (profile.bio ?? "").trim()) {
        data.bio = bioNormalized;
      }
      if (form.imageUrl.trim() !== profile.imageUrl) {
        data.imageUrl = form.imageUrl.trim();
      }
      const xHandleFormatted = form.xHandle.trim().replace(/^@/, "");
      if (xHandleFormatted !== profile.xHandle) {
        data.xHandle = xHandleFormatted;
      }

      if (Object.keys(data).length === 0) {
        addToast({ message: "No changes to save.", type: "info", duration: 3000 });
        setTxStatus("idle");
        return;
      }

      setTxStatus("submitting");
      const hash = await updateProfile(data);

      setTxStatus("confirming");
      setTxHash(hash);

      setTxStatus("success");
      addToast({
        message: "Profile updated successfully!",
        type: "success",
        duration: 5000,
      });

      setTimeout(() => navigate("/terminal/profile"), 1500);
    } catch (err) {
      setTxStatus("error");
      setTxError(
        err instanceof Error ? err.message : "Update failed. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    navigate("/terminal/profile");
  };

  const isSubmitting = ["signing", "submitting", "confirming"].includes(txStatus);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
      <div>
        <Input
          variant={fieldVariant}
          label="Username"
          value={form.username}
          disabled
          readOnly
          className="cursor-not-allowed opacity-70 disabled:cursor-not-allowed"
          endAdornment={
            <Lock size={18} className="text-zap-ink-muted" aria-hidden />
          }
        />
        <p
          className={
            "mt-3 break-all text-sm text-zap-ink-muted dark:text-zinc-400"
          }
        >
          <span className="font-semibold text-zap-ink dark:text-zinc-200">
            Public link
          </span>{" "}
          <span className="font-mono text-zap-ink dark:text-white">
            {siteOrigin}/@{form.username}
          </span>
        </p>
        <p className="mt-2 text-xs font-medium text-zap-ink-muted">
          Username cannot be changed after registration.
        </p>
      </div>

      <Input
        variant={fieldVariant}
        label="Display name"
        placeholder="Your name"
        value={form.displayName}
        onChange={handleChange("displayName")}
        error={errors.displayName}
        disabled={isSubmitting}
        maxLength={64}
        required
      />

      <Textarea
        variant={fieldVariant}
        label="Bio"
        placeholder="Tell supporters about yourself…"
        value={form.bio}
        onChange={handleChange("bio")}
        error={errors.bio}
        disabled={isSubmitting}
        maxLength={280}
        rows={4}
      />

      <Input
        variant={fieldVariant}
        label="X handle (optional)"
        placeholder="@yourhandle"
        value={form.xHandle}
        onChange={handleChange("xHandle")}
        error={errors.xHandle}
        disabled={isSubmitting}
      />

      <div className="space-y-3 rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg-alt/30 p-4 dark:bg-zap-bg/40">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
          Social links (optional)
        </p>
        <p className="text-xs leading-relaxed text-zap-ink-muted">
          Paste profile URLs for Instagram, TikTok, or YouTube. They appear as icons on your public
          page and count toward your 280-character bio limit.
        </p>
        <Input
          variant={fieldVariant}
          label="Instagram"
          placeholder="https://instagram.com/…"
          value={form.instagramUrl}
          onChange={handleChange("instagramUrl")}
          error={errors.instagramUrl}
          disabled={isSubmitting}
          type="url"
        />
        <Input
          variant={fieldVariant}
          label="TikTok"
          placeholder="https://www.tiktok.com/@…"
          value={form.tiktokUrl}
          onChange={handleChange("tiktokUrl")}
          error={errors.tiktokUrl}
          disabled={isSubmitting}
          type="url"
        />
        <Input
          variant={fieldVariant}
          label="YouTube"
          placeholder="https://youtube.com/@…"
          value={form.youtubeUrl}
          onChange={handleChange("youtubeUrl")}
          error={errors.youtubeUrl}
          disabled={isSubmitting}
          type="url"
        />
      </div>

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
        variant="editorial"
        fallbackLabel={form.displayName.trim() || profile.displayName}
      />

      {txStatus !== "idle" && (
        <TransactionStatus
          variant="editorial"
          status={txStatus}
          txHash={txHash}
          errorMessage={txError}
          onRetry={() => {
            setTxStatus("idle");
            setTxError(undefined);
          }}
        />
      )}

      <div className="border-t border-[var(--card-border-soft)] pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="btn-editorial-ghost btn-editorial-ghost--compact order-2 w-full justify-center text-sm font-medium normal-case tracking-normal disabled:pointer-events-none disabled:opacity-45 sm:order-1 sm:w-auto sm:min-w-[10rem]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || txStatus === "success"}
            className="btn-editorial-primary btn-editorial-primary--compact order-1 w-full justify-center text-sm font-medium normal-case tracking-normal disabled:pointer-events-none disabled:opacity-45 sm:order-2 sm:w-auto sm:min-w-[12rem]"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditProfileForm;
