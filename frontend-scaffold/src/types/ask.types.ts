export type AskRequestStatus =
  | "pending_payment"
  | "paid_escrowed"
  | "in_progress"
  | "done_notified"
  | "refunded";

export interface AskRequest {
  requestId: string;
  type: string;
  price: number;
  status: AskRequestStatus;
  fanAddress: string;
  creatorAddress: string;
  messageHash: string;
  messageText: string;
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
  doneAt: string | null;
  notifiedAt: string | null;
  messages?: {
    id: string;
    role: "fan" | "you";
    body: string;
    timeLabel: string;
  }[];
}
