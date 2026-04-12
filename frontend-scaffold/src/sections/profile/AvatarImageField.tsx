import React, { useCallback, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import Avatar from "@/components/primitives/Avatar";
import Button from "@/components/primitives/Button";
import Input from "@/components/primitives/Input";
import { env } from "@/config/env";
import {
  resizeImageFileToJpegBlob,
  uploadProfileImageToImgbb,
} from "@/utils/profileImageUrl";

export type AvatarFieldVariant = "editorial" | "default";

export interface AvatarImageFieldProps {
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
  variant?: AvatarFieldVariant;
  /** Display name or username for avatar initials when no image */
  fallbackLabel: string;
}

const AvatarImageField: React.FC<AvatarImageFieldProps> = ({
  value,
  onChange,
  error,
  disabled,
  variant = "editorial",
  fallbackLabel,
}) => {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [inputMode, setInputMode] = useState<"upload" | "url">(
    value ? "url" : "upload",
  );

  const hasImgbb = Boolean(env.imgbbApiKey);
  const previewSrc = localPreview || value || undefined;

  const clearLocalPreview = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
  }, [localPreview]);

  const handlePickFile = useCallback(() => {
    setUploadError(null);
    fileRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || disabled) return;
      setUploadError(null);
      setSelectedFileName(file.name);

      if (!file.type.startsWith("image/")) {
        setUploadError("Choose an image file (JPEG, PNG, WebP, or GIF).");
        return;
      }

      clearLocalPreview();
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      if (!hasImgbb) {
        setUploadError(
          "Add VITE_IMGBB_API_KEY to your .env for one-click uploads (free key at api.imgbb.com), or paste a direct https image link below.",
        );
        return;
      }

      try {
        setUploading(true);
        const blob = await resizeImageFileToJpegBlob(file);
        const url = await uploadProfileImageToImgbb(blob, env.imgbbApiKey);
        clearLocalPreview();
        onChange(url);
        setSelectedFileName("");
      } catch (err) {
        clearLocalPreview();
        setUploadError(
          err instanceof Error ? err.message : "Upload failed. Try again or paste a URL.",
        );
      } finally {
        setUploading(false);
      }
    },
    [clearLocalPreview, disabled, hasImgbb, onChange],
  );

  const handleRemove = useCallback(() => {
    clearLocalPreview();
    setUploadError(null);
    setSelectedFileName("");
    onChange("");
  }, [clearLocalPreview, onChange]);

  const inputVariant = variant === "editorial" ? "editorial" : "default";

  return (
    <div className="space-y-3">
      <p className="font-body text-sm font-semibold text-zap-ink">Profile photo (optional)</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <Avatar
            src={previewSrc}
            alt=""
            size="xl"
            fallback={fallbackLabel.slice(0, 2) || "?"}
          />
          {uploading ? (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full bg-zap-ink/40"
              aria-live="polite"
            >
              <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <p className="font-body text-xs font-semibold text-zap-ink">Image source</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`rounded-full border px-3 py-1.5 font-body text-sm transition-colors ${
                  inputMode === "upload"
                    ? "border-zap-bg-alt bg-zap-brand text-zap-bg"
                    : "border-zap-bg-alt-bright bg-zap-bg-raised text-zap-ink"
                }`}
              >
                Upload photo
              </button>
              <button
                type="button"
                onClick={() => setInputMode("url")}
                className={`rounded-full border px-3 py-1.5 font-body text-sm transition-colors ${
                  inputMode === "url"
                    ? "border-zap-bg-alt bg-zap-brand text-zap-bg"
                    : "border-zap-bg-alt-bright bg-zap-bg-raised text-zap-ink"
                }`}
              >
                Image URL
              </button>
            </div>
          </div>

          {inputMode === "upload" ? (
            <div className="grid gap-3 rounded-2xl border border-zap-bg-alt bg-zap-bg-alt p-3">
              <p className="font-body text-xs font-semibold text-zap-ink">Upload</p>
              <input
                ref={fileRef}
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={disabled || uploading}
                onChange={(e) => void handleFileChange(e)}
              />
              <Button
                type="button"
                variant={variant === "editorial" ? "editorialGhost" : "outline"}
                size="sm"
                disabled={disabled || uploading}
                icon={<ImagePlus size={16} aria-hidden />}
                onClick={handlePickFile}
                className="!w-fit shrink-0 whitespace-nowrap"
              >
                {hasImgbb ? "Upload a photo" : "Choose a photo"}
              </Button>
              {selectedFileName ? (
                <span className="inline-flex items-center rounded-xl border border-zap-bg-alt bg-zap-bg-alt px-3 py-2 font-body text-xs text-zap-ink-muted">
                  {selectedFileName}
                </span>
              ) : null}
              {(value || localPreview) && !uploading ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zap-bg-alt bg-transparent px-3 py-2 font-body text-sm font-medium text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:text-zap-ink disabled:opacity-45"
                >
                  <Trash2 size={14} aria-hidden />
                  Remove
                </button>
              ) : null}
              <p className="text-xs text-zap-ink-muted">JPG, PNG, WebP, or GIF.</p>
            </div>
          ) : (
            <div className="grid gap-2 rounded-2xl border border-zap-bg-alt bg-zap-bg-alt p-3">
              <p className="font-body text-xs font-semibold text-zap-ink">Image URL</p>
              <Input
                variant={inputVariant}
                label=""
                placeholder="https://…"
                type="url"
                value={value}
                onChange={(e) => {
                  setUploadError(null);
                  if (localPreview) {
                    URL.revokeObjectURL(localPreview);
                    setLocalPreview(null);
                  }
                  setSelectedFileName("");
                  onChange(e.target.value);
                }}
                error={undefined}
                disabled={disabled || uploading}
              />
            </div>
          )}

          {!hasImgbb ? null : null}

          {(error || uploadError) && (
            <p className="text-sm font-medium text-zap-error" role="alert">
              {error || uploadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarImageField;
