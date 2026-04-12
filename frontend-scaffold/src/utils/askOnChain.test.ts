import { describe, expect, it } from "vitest";

import {
  ASK_MESSAGE_PREFIX,
  buildAskTipMessage,
  isAskTipMessage,
  parseAskTipHex,
  truncateAskCommitHex,
} from "./askOnChain";

describe("askOnChain", () => {
  it("buildAskTipMessage matches known SHA-256 of hello", async () => {
    const msg = await buildAskTipMessage("hello");
    expect(msg).toBe(
      `${ASK_MESSAGE_PREFIX}2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824`,
    );
  });

  it("isAskTipMessage and parseAskTipHex accept valid ask tips", async () => {
    const msg = await buildAskTipMessage("question?");
    expect(isAskTipMessage(msg)).toBe(true);
    expect(parseAskTipHex(msg)?.length).toBe(64);
  });

  it("rejects wrong prefix or length", () => {
    expect(isAskTipMessage("unlock:foo")).toBe(false);
    expect(isAskTipMessage(`${ASK_MESSAGE_PREFIX}abc`)).toBe(false);
    expect(parseAskTipHex("not-ask")).toBe(null);
  });

  it("truncateAskCommitHex shortens long digests", () => {
    const full = "a".repeat(64);
    expect(truncateAskCommitHex(full)).toBe(
      `${"a".repeat(8)}…${"a".repeat(6)}`,
    );
    expect(truncateAskCommitHex("abcd")).toBe("abcd");
  });
});
