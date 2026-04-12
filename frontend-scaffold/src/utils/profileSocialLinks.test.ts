import { describe, expect, it } from "vitest";

import { mergeProfileBio, PROFILE_SOCIAL_MARKER, splitProfileBio } from "./profileSocialLinks";

describe("profileSocialLinks", () => {
  it("merge and split round-trip", () => {
    const core = "Hello world";
    const merged = mergeProfileBio(core, {
      instagram: "https://instagram.com/u",
      tiktok: "",
      youtube: "https://youtube.com/@u",
    });
    expect(merged).toContain(PROFILE_SOCIAL_MARKER);
    const back = splitProfileBio(merged);
    expect(back.core.trim()).toBe(core);
    expect(back.instagram).toBe("https://instagram.com/u");
    expect(back.youtube).toBe("https://youtube.com/@u");
  });
});
