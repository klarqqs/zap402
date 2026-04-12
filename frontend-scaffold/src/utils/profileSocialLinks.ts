/**
 * Optional social URLs are stored in the on-chain bio after a short delimiter
 * (same URLs surface on public profiles via bio parsing).
 */

export const PROFILE_SOCIAL_MARKER = "\n\n— Social —\n";

export interface ProfileSocialFields {
  instagram: string;
  tiktok: string;
  youtube: string;
}

export function splitProfileBio(bio: string): { core: string } & ProfileSocialFields {
  const idx = bio.indexOf(PROFILE_SOCIAL_MARKER);
  if (idx === -1) {
    return { core: bio, instagram: "", tiktok: "", youtube: "" };
  }
  const core = bio.slice(0, idx);
  const rest = bio.slice(idx + PROFILE_SOCIAL_MARKER.length);
  const lines = rest
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let instagram = "";
  let tiktok = "";
  let youtube = "";

  for (const line of lines) {
    const href = line.startsWith("http") ? line : `https://${line}`;
    try {
      const host = new URL(href).hostname.replace(/^www\./, "").toLowerCase();
      if (host.includes("instagram")) instagram = line;
      else if (host.includes("tiktok")) tiktok = line;
      else if (host.includes("youtube") || host === "youtu.be") youtube = line;
    } catch {
      /* ignore invalid */
    }
  }

  return { core, instagram, tiktok, youtube };
}

export function mergeProfileBio(
  core: string,
  social: ProfileSocialFields,
): string {
  const lines = [social.instagram, social.tiktok, social.youtube]
    .map((s) => s.trim())
    .filter(Boolean);
  const trimmedCore = core.trim();
  if (lines.length === 0) return trimmedCore;
  return `${trimmedCore}${PROFILE_SOCIAL_MARKER}${lines.join("\n")}`;
}
