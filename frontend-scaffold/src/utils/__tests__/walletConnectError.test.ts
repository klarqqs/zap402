import { describe, expect, it } from "vitest";

import { formatWalletConnectionError } from "../walletConnectError";

describe("formatWalletConnectionError", () => {
  it("returns Freighter install hint for empty rejection on freighter", () => {
    const msg = formatWalletConnectionError({}, "freighter");
    expect(msg).toMatch(/freighter\.app/i);
    expect(msg).toMatch(/refresh/i);
  });

  it("returns xBull hint for empty rejection on xbull", () => {
    const msg = formatWalletConnectionError({}, "xbull");
    expect(msg).toMatch(/xbull\.app/i);
  });

  it("preserves real Error messages", () => {
    expect(formatWalletConnectionError(new Error("Custom SDK text"), "freighter")).toBe(
      "Custom SDK text",
    );
  });

  it("detects user cancel", () => {
    expect(formatWalletConnectionError(new Error("User rejected request"), "freighter")).toMatch(
      /cancelled/i,
    );
  });
});
