/**
 * Shared empty state when `get_network` returns no rows (board fills only after zaps).
 */

export const NETWORK_EMPTY_BOARD_EYEBROW = "// ZAP_VOLUME";

export const NETWORK_EMPTY_BOARD_TITLE = "No earners in this view";

export const NETWORK_EMPTY_BOARD_BODY =
  "Creators are registered, but this list only fills after completed zaps. Share your page or open Terminal to move volume on-chain.";

/** Creator page to share, profile hub if handle not loaded yet, or register. */
export function networkSharePagePath(
  username: string | undefined,
  isRegistered: boolean,
): string {
  if (isRegistered && username) return `/@${username}`;
  if (isRegistered) return "/terminal/profile";
  return "/register";
}
