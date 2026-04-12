import { create } from "zustand";

import type { FeedPost } from "@/types/feed.types";

type FeedMockState = {
  posts: FeedPost[];
  toggleLike: (postId: string, wallet: string | null) => void;
  addPost: (post: FeedPost) => void;
};

export const useFeedMockStore = create<FeedMockState>((set) => ({
  posts: [],
  toggleLike: (postId, wallet) => {
    if (!wallet) return;
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const liked = post.likedByMe;
        return {
          ...post,
          likedByMe: !liked,
          likeCount: liked
            ? Math.max(0, post.likeCount - 1)
            : post.likeCount + 1,
        };
      }),
    }));
  },
  addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
}));
