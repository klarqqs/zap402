export type CloneChatRequest = {
  message: string;
  creatorName: string;
  /** Optional provider hint: "Anthropic", "OpenAI", "Gemini". Falls back to inferring from creatorName. */
  provider?: string;
};

export type CloneChatResponse = {
  reply: string;
};

export type CloneChatErrorBody = {
  error: string;
};

/**
 * POST /api/clone-chat — proxied to the local dev API in dev (see server/dev-api.mjs).
 */
export async function requestCloneReply(
  body: CloneChatRequest,
): Promise<CloneChatResponse> {
  const res = await fetch("/api/clone-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as CloneChatErrorBody).error === "string"
        ? (data as CloneChatErrorBody).error
        : `Request failed (${res.status})`;
    throw new Error(err);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as CloneChatResponse).reply !== "string"
  ) {
    throw new Error("Invalid response from Clone API");
  }

  return data as CloneChatResponse;
}
