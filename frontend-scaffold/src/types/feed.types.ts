export type PostMediaType = "IMAGE" | "VIDEO" | "TEXT";

export interface FeedPost {
  id: string;
  creatorAddress: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatarInitials: string;

  mediaType: PostMediaType;
  mediaUrl?: string;
  caption: string;

  likeCount: number;
  likedByMe: boolean;

  createdAt: string;
  timeAgo: string;
}

export interface CreatePostInput {
  caption: string;
  mediaType: PostMediaType;
  mediaUrl?: string;
}
