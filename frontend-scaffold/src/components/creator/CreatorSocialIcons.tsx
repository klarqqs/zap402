import React from "react";

import type { CreatorSocialKind, CreatorSocialLink } from "@/utils/creatorSocialLinks";

const ICON_CLASS = "h-[18px] w-[18px]";

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.307l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      />
    </svg>
  );
}

function IconTiktok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      />
    </svg>
  );
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
    </svg>
  );
}

function SocialGlyph({ kind }: { kind: CreatorSocialKind }) {
  switch (kind) {
    case "x":
      return <IconX className={ICON_CLASS} />;
    case "instagram":
      return <IconInstagram className={ICON_CLASS} />;
    case "tiktok":
      return <IconTiktok className={ICON_CLASS} />;
    case "youtube":
      return <IconYoutube className={ICON_CLASS} />;
    default:
      return null;
  }
}

function labelFor(kind: CreatorSocialKind): string {
  switch (kind) {
    case "x":
      return "X (Twitter)";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    default:
      return "Social link";
  }
}

export interface CreatorSocialIconsProps {
  links: CreatorSocialLink[];
  /** Shown in X button tooltip when the X link comes from handle + followers known */
  xFollowers?: number;
}

const CreatorSocialIcons: React.FC<CreatorSocialIconsProps> = ({
  links,
  xFollowers,
}) => {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const title =
          link.kind === "x" && typeof xFollowers === "number" && xFollowers > 0
            ? `${labelFor(link.kind)} · ${xFollowers.toLocaleString()} followers`
            : `Open ${labelFor(link.kind)}`;
        return (
          <a
            key={`${link.kind}-${link.href}`}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={title}
            aria-label={title}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zap-bg-alt/90 bg-zap-bg-alt/60 text-zap-ink transition-colors hover:border-zap-bg-alt hover:bg-zap-bg-alt hover:text-zap-brand"
          >
            <SocialGlyph kind={link.kind} />
          </a>
        );
      })}
    </div>
  );
};

export default CreatorSocialIcons;
