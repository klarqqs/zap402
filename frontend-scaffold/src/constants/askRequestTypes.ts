export interface AskRequestType {
  id: string;
  /** Short glyph for chips and lists (single emoji). */
  emoji: string;
  label: string;
  defaultPriceUsdc: string;
}

/** Up to 25 paid request types (Q&A included). */
export const ASK_REQUEST_TYPES: AskRequestType[] = [
  { id: "answer_question", emoji: "💬", label: "Answer a question", defaultPriceUsdc: "0.50" },
  { id: "rewrite_text", emoji: "✍️", label: "Rewrite text", defaultPriceUsdc: "0.80" },
  { id: "summarize_content", emoji: "🧾", label: "Summarize content", defaultPriceUsdc: "1.00" },
  { id: "generate_thread", emoji: "🧵", label: "Generate thread", defaultPriceUsdc: "1.20" },
  { id: "analyze_idea", emoji: "🧠", label: "Analyze idea", defaultPriceUsdc: "2.50" },
];

export const ASK_DEFAULT_REQUEST_TYPE_ID = "answer_question";

/** Label + emoji for tables, history, and selects (no price). */
export function formatAskRequestTitle(type: AskRequestType): string {
  return `${type.emoji} ${type.label}`;
}
