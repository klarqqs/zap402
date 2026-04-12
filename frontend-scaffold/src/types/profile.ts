export type { Profile } from "./contract";

/** Form data for creating or updating a profile. */
export interface ProfileFormData {
  username: string;
  displayName: string;
  /** Core bio only; optional social URLs are merged on save (see `mergeProfileBio`). */
  bio: string;
  imageUrl: string;
  xHandle: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
}
