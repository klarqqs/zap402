import { describe, expect, it } from "vitest";

import {
  contractStatsFromRpc,
  profileFromRpc,
  tipFromRpc,
} from "../profileFromRpc";

describe("profileFromRpc", () => {
  it("maps snake_case Soroban struct to Profile", () => {
    const p = profileFromRpc({
      owner: "GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      username: "kolap",
      display_name: "Kolawole Paul",
      bio: "Meme",
      image_url: "",
      x_handle: "",
      x_followers: 0,
      x_engagement_avg: 0,
      credit_score: 40,
      total_tips_received: 0n,
      total_tips_count: 0,
      balance: 0n,
      registered_at: 1710000000n,
      updated_at: 1710000000n,
    });

    expect(p.displayName).toBe("Kolawole Paul");
    expect(p.imageUrl).toBe("");
    expect(p.xHandle).toBe("");
    expect(p.xFollowers).toBe(0);
    expect(p.xEngagementAvg).toBe(0);
    expect(p.creditScore).toBe(40);
    expect(p.totalTipsReceived).toBe("0");
    expect(p.totalTipsCount).toBe(0);
    expect(p.balance).toBe("0");
    expect(p.registeredAt).toBe(1710000000);
    expect(p.updatedAt).toBe(1710000000);
  });

  it("prefers camelCase when both exist", () => {
    const p = profileFromRpc({
      owner: "GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      username: "u",
      displayName: "Camel",
      display_name: "Snake",
      xFollowers: 42,
      x_followers: 1,
      bio: "",
      imageUrl: "",
      image_url: "",
      xHandle: "",
      x_handle: "",
      xEngagementAvg: 0,
      x_engagement_avg: 0,
      creditScore: 0,
      credit_score: 0,
      totalTipsReceived: "0",
      total_tips_received: "9",
      totalTipsCount: 0,
      total_tips_count: 0,
      balance: "0",
      registeredAt: 0,
      registered_at: 0,
      updatedAt: 0,
      updated_at: 0,
    });
    expect(p.displayName).toBe("Camel");
    expect(p.xFollowers).toBe(42);
    expect(p.totalTipsReceived).toBe("0");
  });
});

describe("tipFromRpc", () => {
  it("maps bigint i128 amount and u64 timestamp to strings and numbers", () => {
    const t = tipFromRpc({
      id: 3,
      tipper: "GTIPPERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      creator: "GCREATORAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      amount: 125000000n,
      message: "gm",
      timestamp: 1710000000n,
    });
    expect(t.amount).toBe("125000000");
    expect(t.timestamp).toBe(1710000000);
  });
});

describe("contractStatsFromRpc", () => {
  it("maps snake_case stats and bigint volumes", () => {
    const s = contractStatsFromRpc({
      total_creators: 12,
      total_tips_count: 99,
      total_tips_volume: 45000000000n,
      total_fees_collected: 900000000n,
      fee_bps: 200,
    });
    expect(s.totalCreators).toBe(12);
    expect(s.totalTipsVolume).toBe("45000000000");
    expect(s.totalFeesCollected).toBe("900000000");
    expect(s.feeBps).toBe(200);
  });
});
