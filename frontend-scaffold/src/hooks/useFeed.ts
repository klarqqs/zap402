import { useCallback, useState } from "react";

import { useFeedMockStore } from "@/state/feedMockStore";
import { useProfileStore } from "@/state/profileStore";
import { useWalletStore } from "@/state/walletStore";
import type { CreatePostInput, FeedPost } from "@/types/feed.types";

export function useFeed() {
  const publicKey = useWalletStore((s) => s.publicKey);
  const posts = useFeedMockStore((s) => s.posts);
  const toggleLikeStore = useFeedMockStore((s) => s.toggleLike);
  const addPost = useFeedMockStore((s) => s.addPost);
  const profile = useProfileStore((s) => s.profile);
  const isRegistered = useProfileStore((s) => s.isRegistered);

  const [loading] = useState(false);
  const [posting, setPosting] = useState(false);

  const toggleLike = useCallback(
    (postId: string) => {
      toggleLikeStore(postId, publicKey ?? null);
    },
    [publicKey, toggleLikeStore],
  );

  const createPost = useCallback(
    async (
      input: CreatePostInput,
      creatorInfo: {
        username: string;
        displayName: string;
        initials: string;
      },
    ) => {
      if (!publicKey) throw new Error("Wallet not connected");
      if (!isRegistered || !profile) {
        throw new Error("Only registered agent profiles can post");
      }
      const bio = profile.bio.toLowerCase();
      const isAgent =
        /(?:^|\n)\s*tag:\s*agent\s*(?:$|\n)/i.test(profile.bio) ||
        bio.includes(" agent") ||
        bio.includes("assistant");
      if (!isAgent) {
        throw new Error("Only agent profiles can post to feed");
      }
      if (creatorInfo.username !== profile.username) {
        throw new Error("Post author must match connected profile");
      }
      setPosting(true);
      try {
        const newPost: FeedPost = {
          id: `post_${Date.now()}`,
          creatorAddress: publicKey,
          creatorUsername: creatorInfo.username,
          creatorDisplayName:
            creatorInfo.displayName.trim() || creatorInfo.username,
          creatorAvatarInitials: creatorInfo.initials,
          mediaType: input.mediaType,
          mediaUrl: input.mediaUrl,
          caption: input.caption,
          likeCount: 0,
          likedByMe: false,
          createdAt: new Date().toISOString(),
          timeAgo: "just now",
        };
        addPost(newPost);
      } finally {
        setPosting(false);
      }
    },
    [publicKey, isRegistered, profile, addPost],
  );

  return { posts, loading, posting, toggleLike, createPost };
}
