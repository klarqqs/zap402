import type { AskThread } from "@/components/clone/CloneMessagesLayout";

/** Demo threads — replace with API when Ask / Inbox ships */
export const ASK_INBOX_DEMO_THREADS: AskThread[] = [
  {
    id: "t1",
    title: "Fan · @river",
    preview: "Thanks for the quick answer on Stellar fees.",
    timeLabel: "2d ago",
    unread: false,
    requestTypeLabel: "Answer a question",
    amountUsdc: "0.50",
    status: "done",
    messages: [
      {
        id: "m1",
        role: "fan",
        body: "Hey — what wallet do you recommend for USDC on Stellar for small tips?",
        timeLabel: "2d ago",
      },
      {
        id: "m2",
        role: "you",
        body:
          "I use Freighter for day-to-day; any Stellar-compatible wallet that shows Soroban balances works. Keep your seed offline!",
        timeLabel: "2d ago",
      },
    ],
  },
  {
    id: "t2",
    title: "Question · @maya",
    preview: "What stack do you use for streaming?",
    timeLabel: "1w ago",
    unread: true,
    requestTypeLabel: "Product idea brainstorm",
    amountUsdc: "1.80",
    status: "pending",
    messages: [
      {
        id: "m3",
        role: "fan",
        body: "What stack do you use for streaming and tips?",
        timeLabel: "1w ago",
      },
    ],
  },
];
