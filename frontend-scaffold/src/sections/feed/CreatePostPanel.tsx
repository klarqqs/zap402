import React, { useState } from "react";

import type { CreatePostInput, PostMediaType } from "@/types/feed.types";

interface Props {
  profile: { username: string; displayName: string };
  posting: boolean;
  onSubmit: (input: CreatePostInput) => Promise<void>;
  onCancel: () => void;
}

const labelClass =
  "mb-1.5 block font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted";

export function CreatePostPanel({
  profile,
  posting,
  onSubmit,
  onCancel,
}: Props) {
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<PostMediaType>("TEXT");
  const [mediaUrl, setMediaUrl] = useState("");
  const MAX = 500;

  const handleSubmit = async () => {
    if (!caption.trim()) return;
    await onSubmit({
      caption: caption.trim(),
      mediaType,
      mediaUrl: mediaUrl.trim() || undefined,
    });
    setCaption("");
    setMediaUrl("");
    setMediaType("TEXT");
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-accent)",
        background: "var(--color-bg-raised)",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          color: "var(--color-accent)",
          letterSpacing: "0.15em",
          marginBottom: "16px",
        }}
      >
        // CREATE_POST · @{profile.username}
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {(["TEXT", "IMAGE", "VIDEO"] as PostMediaType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMediaType(type)}
            style={{
              background:
                mediaType === type ? "var(--color-accent-dim)" : "transparent",
              border: `1px solid ${
                mediaType === type ? "var(--color-accent)" : "var(--color-border)"
              }`,
              borderRadius: 0,
              padding: "6px 14px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              color:
                mediaType === type ? "var(--color-accent)" : "var(--color-ink-muted)",
              cursor: "crosshair",
              transition: "all 100ms",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {mediaType === "IMAGE" || mediaType === "VIDEO" ? (
        <div style={{ marginBottom: "12px" }}>
          <label className={labelClass} htmlFor="feed-create-media-url">
            {mediaType}_URL
          </label>
          <input
            id="feed-create-media-url"
            type="url"
            className="input-web3"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder={
              mediaType === "IMAGE"
                ? "https://... (paste image URL)"
                : "https://... (paste video URL)"
            }
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-ink-faint)",
              marginTop: "4px",
              letterSpacing: "0.06em",
            }}
          >
            Upload to ImgBB, Cloudinary, or any public URL first.
          </p>
        </div>
      ) : null}

      <div style={{ marginBottom: "16px" }}>
        <label className={labelClass} htmlFor="feed-create-caption">
          <span>CAPTION</span>
          <span
            style={{
              float: "right",
              color:
                caption.length > MAX * 0.9
                  ? "var(--color-error)"
                  : "var(--color-ink-faint)",
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "none",
            }}
          >
            {caption.length} / {MAX}
          </span>
        </label>
        <textarea
          id="feed-create-caption"
          className="input-web3"
          value={caption}
          onChange={(e) => {
            if (e.target.value.length <= MAX) {
              setCaption(e.target.value);
            }
          }}
          placeholder={
            "// What do you want to share with your fans?\n" +
            "// Link to your profile for purchases and zaps."
          }
          rows={4}
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={posting || !caption.trim()}
          className="btn-editorial-primary btn-editorial-primary--compact font-body normal-case tracking-normal"
          style={{
            opacity: !caption.trim() || posting ? 0.4 : 1,
            fontSize: "12px",
          }}
        >
          {posting ? "[ POSTING... ]" : "Post"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-editorial-ghost btn-editorial-ghost--compact font-body normal-case tracking-normal"
          style={{ fontSize: "12px" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
