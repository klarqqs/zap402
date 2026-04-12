import { describe, expect, it } from "vitest";

import { collectCreatorSocialLinks } from "./creatorSocialLinks";

describe("collectCreatorSocialLinks", () => {
  it("adds X from handle when no bio URLs", () => {
    const links = collectCreatorSocialLinks("creator", "");
    expect(links).toEqual([{ kind: "x", href: "https://x.com/creator" }]);
  });

  it("parses instagram and youtube from bio", () => {
    const bio = `Hi! instagram.com/foo and https://www.youtube.com/@bar`;
    const links = collectCreatorSocialLinks("", bio);
    expect(links.map((l) => l.kind)).toEqual(["instagram", "youtube"]);
  });

  it("prefers explicit X URL in bio over handle", () => {
    const links = collectCreatorSocialLinks("handle", "https://x.com/realuser");
    expect(links).toEqual([{ kind: "x", href: "https://x.com/realuser" }]);
  });
});
