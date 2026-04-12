export type UnlockContentType = "FILE" | "TEXT" | "LINK" | "PROMPT";

export type UnlockStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PurchaseStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "REFUNDED";

export interface UnlockItem {
  id: string;
  /** Stellar G... address */
  creatorId: string;
  title: string;
  description: string;
  contentType: UnlockContentType;
  /** Display / settlement amount */
  price: number;
  currency: "USDC";
  status: UnlockStatus;

  content?: string;
  fileUrl?: string;
  externalLink?: string;

  previewText?: string;
  thumbnailUrl?: string;

  purchaseCount: number;
  totalEarned: number;

  createdAt: string;
  updatedAt: string;
}

export interface UnlockPurchase {
  id: string;
  unlockItemId: string;
  buyerAddress: string;
  creatorAddress: string;
  amount: number;
  currency: "USDC";
  status: PurchaseStatus;
  txHash?: string;
  purchasedAt: string;
}

export interface CreateUnlockItemInput {
  title: string;
  description: string;
  contentType: UnlockContentType;
  price: number;
  currency: "USDC";
  content?: string;
  fileUrl?: string;
  externalLink?: string;
  previewText?: string;
  thumbnailUrl?: string;
}
