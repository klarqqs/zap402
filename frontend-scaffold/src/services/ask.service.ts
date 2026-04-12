import type { AskRequest, AskRequestStatus } from "@/types/ask.types";

const API_BASE = "/api/ask";

async function httpJson<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  if (r.status === 204) return undefined as T;
  const text = await r.text();
  if (!r.ok) throw new Error(text || `${r.status} ${r.statusText}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function createAskRequest(input: {
  type: string;
  price: number;
  fanAddress: string;
  creatorAddress: string;
  messageHash: string;
  messageText: string;
}): Promise<AskRequest> {
  return httpJson<AskRequest>("/create", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function confirmAskRequestPayment(input: {
  requestId: string;
  txHash: string;
}): Promise<AskRequest> {
  return httpJson<AskRequest>("/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAskRequestStatus(input: {
  requestId: string;
  status: AskRequestStatus;
}): Promise<AskRequest> {
  return httpJson<AskRequest>("/status", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCreatorAskRequests(
  creatorAddress: string,
): Promise<AskRequest[]> {
  return httpJson<AskRequest[]>(`/creator/${encodeURIComponent(creatorAddress)}`);
}

export async function replyToAskRequest(input: {
  requestId: string;
  body: string;
}): Promise<AskRequest> {
  return httpJson<AskRequest>("/reply", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getFanAskRequests(
  fanAddress: string,
): Promise<AskRequest[]> {
  return httpJson<AskRequest[]>(`/fan/${encodeURIComponent(fanAddress)}`);
}

export async function uploadAskReplyVideo(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("video", file);
  const r = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: fd,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `${r.status} ${r.statusText}`);
  return (text ? JSON.parse(text) : {}) as { url: string };
}

export async function replyToAskRequestWithVideo(input: {
  requestId: string;
  videoUrl: string;
  durationSec: number;
}): Promise<AskRequest> {
  return httpJson<AskRequest>("/reply-video", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
