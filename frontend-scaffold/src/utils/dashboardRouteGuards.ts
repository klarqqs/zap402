/** Single-segment paths that are not public creator pages. */
const RESERVED_SINGLE = new Set([
  "terminal",
  "network",
  "profile",
  "register",
  "leaderboard",
  "dashboard",
]);

/**
 * True for `/foo` or `/@foo` when `foo` is not a reserved app path.
 * Multi-segment paths (e.g. `/profile/edit`) are false.
 */
export function isPublicZapPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return false;
  const seg = parts[0]!;
  const normalized = seg.startsWith("@") ? seg.slice(1) : seg;
  if (RESERVED_SINGLE.has(seg)) return false;
  if (RESERVED_SINGLE.has(normalized)) return false;
  return true;
}

/** Whether the URL is the connected user's public creator page (`/handle` or `/@handle`). */
export function isOwnCreatorPage(
  pathname: string,
  username: string | null | undefined,
): boolean {
  if (!username) return false;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return false;
  const seg = parts[0]!;
  const fromPath = seg.startsWith("@") ? seg.slice(1) : seg;
  return fromPath === username;
}
