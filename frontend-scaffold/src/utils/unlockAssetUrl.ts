/**
 * Dev API file downloads require `?viewer=<Stellar address>` so assets are not world-readable by URL alone.
 */
export function unlockAssetHref(
  fileUrl: string | undefined,
  viewerAddress: string | null | undefined,
): string | undefined {
  if (!fileUrl) return undefined;
  if (!fileUrl.startsWith("/api/unlock/assets/")) return fileUrl;
  const q = viewerAddress
    ? `?viewer=${encodeURIComponent(viewerAddress)}`
    : "";
  return `${fileUrl}${q}`;
}
