import React, { useState } from "react";

import type { CreateUnlockItemInput, UnlockContentType } from "@/types/unlock.types";
import Input from "@/components/primitives/Input";
import Textarea from "@/components/primitives/Textarea";
import {
  UNLOCK_UPLOAD_MAX_BYTES,
  UNLOCK_UPLOAD_MAX_LABEL,
  uploadUnlockAsset,
} from "@/services/unlock.service";

export interface UnlockFormProps {
  onPublish: (input: CreateUnlockItemInput) => Promise<void>;
  /** When set, shows a second action to create a draft (hidden in edit-only flows). */
  onSaveDraft?: (input: CreateUnlockItemInput) => Promise<void>;
  onCancel: () => void;
  initial?: Partial<CreateUnlockItemInput> & { id?: string };
  /** `edit` — single save button, no draft action. */
  mode?: "create" | "edit";
  /** Required to upload FILE assets to the dev API. */
  creatorAddress?: string | null;
  /** Strip outer card chrome when rendered inside `Modal` (no duplicate border/header). */
  embedded?: boolean;
}

const CONTENT_TYPES: {
  value: UnlockContentType;
  label: string;
  description: string;
}[] = [
  {
    value: "TEXT",
    label: "PRIVATE POST",
    description: "Write content directly — essay, thread, notes",
  },
  {
    value: "FILE",
    label: "FILE DOWNLOAD",
    description: "Upload a PDF, image, zip, or any file",
  },
  {
    value: "LINK",
    label: "PRIVATE LINK",
    description: "A private URL — Notion, Drive, video, etc.",
  },
  {
    value: "PROMPT",
    label: "PROMPT PACK",
    description: "AI prompts or text-based resource pack",
  },
];

export function UnlockForm({
  onPublish,
  onSaveDraft,
  onCancel,
  initial,
  mode = "create",
  creatorAddress,
  embedded = false,
}: UnlockFormProps) {
  const [contentType, setContentType] = useState<UnlockContentType>(
    initial?.contentType ?? "TEXT",
  );
  const [submitting, setSubmitting] = useState(false);
  const [useExternalFileUrl, setUseExternalFileUrl] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateUnlockItemInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    contentType: initial?.contentType ?? "TEXT",
    price: initial?.price ?? 1,
    currency: "USDC",
    content: initial?.content ?? "",
    previewText: initial?.previewText ?? "",
    fileUrl: initial?.fileUrl,
    externalLink: initial?.externalLink,
  });

  const update = (key: keyof CreateUnlockItemInput, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): CreateUnlockItemInput => ({
    ...form,
    contentType,
    description: form.description || "",
    currency: "USDC",
  });

  /** Create + publish immediately: FILE listings need a file. Drafts and edits rely on server rules. */
  const publishBlockedByFile =
    mode === "create" &&
    contentType === "FILE" &&
    !Boolean((form.fileUrl || "").trim());

  const handleFileSelected = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setUploadError(null);
    if (!creatorAddress?.trim()) {
      setUploadError("Connect your wallet to upload files.");
      return;
    }
    if (file.size > UNLOCK_UPLOAD_MAX_BYTES) {
      setUploadError(`File too large (max ${UNLOCK_UPLOAD_MAX_LABEL}).`);
      return;
    }
    setUploadingFile(true);
    try {
      const { url } = await uploadUnlockAsset(creatorAddress, file);
      update("fileUrl", url);
      setUseExternalFileUrl(false);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      await onPublish(buildPayload());
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    setSubmitting(true);
    try {
      await onSaveDraft(buildPayload());
    } finally {
      setSubmitting(false);
    }
  };

  const fields = (
    <div className="flex flex-col gap-5">
        <div>
          <p className="block font-body text-sm font-semibold tracking-normal text-zap-ink mb-2">
            CONTENT TYPE
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CONTENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setContentType(t.value);
                  update("contentType", t.value);
                }}
                className={`border p-3 text-left transition-colors ${
                  contentType === t.value
                    ? "border-zap-accent bg-zap-accent-dim/30"
                    : "border-zap-bg-alt bg-zap-bg-alt hover:border-zap-bg-alt-bright"
                }`}
              >
                <p
                  className={`font-body text-[16px] uppercase tracking-[0.12em] ${
                    contentType === t.value ? "text-zap-accent" : "text-zap-ink-muted"
                  }`}
                >
                  {t.label}
                </p>
                <p className="mt-1 font-body text-[11px] leading-snug text-zap-ink-faint">
                  {t.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="TITLE"
          variant="editorial"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Name your unlock item"
          maxLength={80}
        />

        <Textarea
          label="DESCRIPTION"
          variant="editorial"
          placeholder="Short summary for your dashboard"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={280}
          rows={3}
        />

        <div>
          <Input
            label="PREVIEW_TEXT"
            variant="editorial"
            value={form.previewText ?? ""}
            onChange={(e) => update("previewText", e.target.value)}
            placeholder="Tease what's inside"
            maxLength={120}
          />
          <p className="mt-1.5 font-body text-[11px] leading-snug text-zap-ink-faint">
            Shown before payment.
          </p>
        </div>

        {contentType === "TEXT" ? (
          <Textarea
            label="CONTENT"
            variant="editorial"
            placeholder="Write your private content here"
            value={form.content ?? ""}
            onChange={(e) => update("content", e.target.value)}
            rows={8}
          />
        ) : null}

        {contentType === "PROMPT" ? (
          <Textarea
            label="PROMPT_PACK"
            variant="editorial"
            placeholder={"// Prompt 1: ...\n// Prompt 2: ...\n// Prompt 3: ..."}
            value={form.content ?? ""}
            onChange={(e) => update("content", e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        ) : null}

        {contentType === "LINK" ? (
          <Input
            label="PRIVATE_URL"
            variant="editorial"
            type="url"
            value={form.externalLink ?? ""}
            onChange={(e) => update("externalLink", e.target.value)}
            placeholder="https://notion.so/your-private-page"
          />
        ) : null}

        {contentType === "FILE" ? (
          <div className="space-y-3">
            <div>
              <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-ink-muted">
                FILE
              </p>
              <p className="mb-2 font-body text-[11px] text-zap-ink-faint">
                Upload up to {UNLOCK_UPLOAD_MAX_LABEL} (pdf, images, zip, audio/video, etc.). Files
                are stored by the dev API and only downloadable by you and paying buyers.
              </p>
              <label className="flex cursor-pointer flex-col gap-2 border border-dashed border-zap-bg-alt bg-zap-bg-alt px-4 py-4 font-body text-sm text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:text-zap-ink">
                <span className="font-semibold uppercase tracking-[0.08em] text-zap-ink">
                  {uploadingFile ? "UPLOADING…" : "CHOOSE_FILE"}
                </span>
                <input
                  type="file"
                  className="sr-only"
                  disabled={uploadingFile || !creatorAddress}
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.txt,.md,.csv,.json,.mp3,.wav,.mp4,.mov,.webm,.7z,.rar,.gz"
                  onChange={(e) => void handleFileSelected(e.target.files)}
                />
              </label>
              {form.fileUrl ? (
                <p className="mt-2 font-body text-[11px] text-zap-teal">
                  Linked:{" "}
                  <span className="break-all font-mono text-zap-ink-muted">{form.fileUrl}</span>
                </p>
              ) : null}
              {uploadError ? (
                <p className="mt-2 font-body text-[11px] text-zap-error" role="alert">
                  {uploadError}
                </p>
              ) : null}
              {!creatorAddress ? (
                <p className="mt-1 font-body text-[11px] text-zap-ink-faint">
                  Connect your wallet to enable uploads.
                </p>
              ) : null}
            </div>
            <div>
              <button
                type="button"
                className="font-body text-[11px] uppercase tracking-[0.1em] text-zap-teal underline decoration-zap-teal/40 underline-offset-2"
                onClick={() => {
                  setUseExternalFileUrl((v) => !v);
                  setUploadError(null);
                }}
              >
                {useExternalFileUrl ? "Hide hosted URL field" : "Use a hosted URL instead"}
              </button>
              {useExternalFileUrl ? (
                <div className="mt-2">
                  <Input
                    label="FILE_URL"
                    variant="editorial"
                    type="url"
                    value={form.fileUrl ?? ""}
                    onChange={(e) => update("fileUrl", e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label="PRICE"
            variant="editorial"
            type="number"
            min={0.01}
            step={0.01}
            value={String(form.price)}
            onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
          />
          <div>
            <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-ink-muted">
              TOKEN
            </p>
            <div className="flex min-h-[48px] items-center border border-zap-bg-alt bg-zap-bg-alt px-4 font-body text-sm font-medium text-zap-ink">
              USDC
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-zap-bg-alt pt-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={
              submitting || !form.title.trim() || uploadingFile || publishBlockedByFile
            }
            className="btn-primary flex-1 justify-center !h-10 !min-h-10 !max-h-10 !py-2 !px-5 text-sm font-medium normal-case tracking-normal sm:min-w-[200px]"
          >
            {submitting
              ? "Saving…"
              : mode === "edit"
                ? "Save Changes"
                : "Publish Content"}
          </button>
          {mode === "create" && onSaveDraft ? (
            <button
              type="button"
              onClick={() => void handleSaveDraft()}
              disabled={submitting || !form.title.trim() || uploadingFile}
              className="btn-ghost flex-1 justify-center !h-10 !min-h-10 !max-h-10 !py-2 !px-5 text-sm font-medium normal-case tracking-normal sm:min-w-[160px]"
            >
              Save as draft
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost justify-center !h-10 !min-h-10 !max-h-10 !py-2 !px-5 text-sm font-medium normal-case tracking-normal sm:min-w-[120px]"
          >
            Abort
          </button>
        </div>
    </div>
  );

  if (embedded) {
    return fields;
  }

  return (
    <div className="border border-zap-bg-alt bg-zap-surface">
      <div className="flex items-center gap-2 border-b border-zap-bg-alt px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-zap-live" aria-hidden />
        <span className="font-body text-[10px] uppercase tracking-[0.2em] text-zap-ink-muted">
          // CREATE_UNLOCK_ITEM
        </span>
      </div>

      <div className="p-5">{fields}</div>
    </div>
  );
}

export default UnlockForm;
