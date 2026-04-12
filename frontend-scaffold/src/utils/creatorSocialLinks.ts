/**
 * Resolve social profile links for public Zap pages. On-chain profile only stores
 * `xHandle`; other networks are picked up from URLs in the bio when present.
 */

export type CreatorSocialKind = "x" | "instagram" | "tiktok" | "youtube";

export interface CreatorSocialLink {
  kind: CreatorSocialKind;
  href: string;
}

const ORDER: CreatorSocialKind[] = ["x", "instagram", "tiktok", "youtube"];

function normalizeHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto =
      /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/\//, "")}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function classifyUrl(href: string): CreatorSocialKind | null {
  let host: string;
  try {
    host = new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
  if (host === "x.com" || host === "twitter.com") return "x";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (
    host === "youtube.com" ||
    host === "youtu.be" ||
    host.endsWith(".youtube.com")
  ) {
    return "youtube";
  }
  return null;
}

/** Pull URL-like strings from bio (with or without protocol). */
function extractUrlCandidates(bio: string): string[] {
  const out: string[] = [];
  const withProto = bio.match(/https?:\/\/[^\s<>\])"'`]+/gi) ?? [];
  out.push(...withProto);
  const bare = bio.match(
    /\b(?:www\.)?(?:instagram\.com|tiktok\.com|youtube\.com|youtu\.be|x\.com|twitter\.com)\/[^\s<>\])"'`]+/gi,
  ) ?? [];
  for (const b of bare) {
    if (!/^https?:\/\//i.test(b)) out.push(`https://${b}`);
    else out.push(b);
  }
  return out;
}

/**
 * One link per platform: explicit bio URLs win; X falls back to `xHandle` when set.
 */
export function collectCreatorSocialLinks(
  xHandle: string,
  bio: string,
): CreatorSocialLink[] {
  const byKind = new Map<CreatorSocialKind, string>();

  for (const raw of extractUrlCandidates(bio)) {
    const href = normalizeHref(raw);
    if (!href) continue;
    const kind = classifyUrl(href);
    if (kind && !byKind.has(kind)) byKind.set(kind, href);
  }

  const xh = xHandle.trim().replace(/^@+/, "");
  if (xh && !byKind.has("x")) {
    byKind.set("x", `https://x.com/${encodeURIComponent(xh)}`);
  }

  return ORDER.filter((k) => byKind.has(k)).map((k) => ({
    kind: k,
    href: byKind.get(k)!,
  }));
}
