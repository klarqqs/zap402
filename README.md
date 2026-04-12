# ZAP402

> **The payment layer for AI commerce. Pay-per-query agent marketplace on Stellar — every prompt is a closed on-chain deal.**

[![Built with Scaffold Stellar](https://img.shields.io/badge/Built%20with-Scaffold%20Stellar-7B3FF2?style=flat-square&logo=stellar)](https://github.com/stellar/scaffold-soroban)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-09B3AF?style=flat-square&logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-blueviolet?style=flat-square)](https://soroban.stellar.org)
[![x402](https://img.shields.io/badge/Protocol-x402-ff6b00?style=flat-square)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## What is Zap402?

Zap402 is a **pay-per-query AI agent marketplace** built on Stellar. Users browse 20+ specialized AI agents — chat, research, code, image, video — and pay a small USDC amount per request via the x402 payment protocol. Every query is a closed deal: payment confirmed on-chain, response delivered, transaction hash recorded on Stellar.

The core thesis: **AI inference should be priced like a utility, not a subscription.** One prompt. One payment. One receipt.

```
User types prompt → Category auto-classified → Payment gate appears
→ User pays USDC via Stellar → TX confirmed on-chain → Agent responds
→ Compare same prompt with other agents in same category → History saved
```

---

## The three layers

| Layer | What it does | Status |
|-------|-------------|--------|
| **Pay** | x402-style payment gate — USDC on Stellar via Soroban. Every query triggers a wallet confirmation before the response is unlocked. | **Live** (testnet) |
| **Ask** | Pay-per-query AI — user sends a prompt, pays, gets a premium response from their chosen agent. Claude (Anthropic) for research/chat, Groq/Llama-3.3 for all others with automatic fallback. | **Live** |
| **Compare** | After any response settles, a compare strip appears with other agents in the same category. Same prompt, new payment, new response — stacked in the conversation thread. | **Live** |

---

## Agent categories

| Category | Examples | Price/req |
|----------|----------|-----------|
| 💬 Chat | Grok, DeepSeek, Llama, Mistral | $0.10–$0.30 |
| 🔬 Research | Claude, ChatGPT, Gemini, Perplexity | $0.35–$0.50 |
| ⌨️ Code | Codex, Cursor, Copilot | $0.40–$0.45 |
| 🎨 Image | Midjourney, FLUX, DALL·E, SDXL | $0.50–$1.20 |
| 🎬 Video | Pika, Sora | $1.50–$2.00 |

Prices settle in USDC on Stellar. Each agent profile is an on-chain identity — wallet address, handle, category, provider.

---

## Key flows

### Pay-per-query
1. User opens the **Chat** tab and selects an agent from the sidebar
2. Types a prompt → hits Send
3. **Category classifier** auto-detects intent (code / research / image / video / chat) using keyword scoring + regex patterns
4. **PaymentGateCard** appears — shows agent name, category, USDC price
5. User clicks **Pay** → `payToAsk()` fires → Stellar wallet signs → transaction confirmed
6. **TxConfirmedBubble** renders with hash + "Copy Hash" + "View on Explorer" buttons
7. AI response streams in (Claude for Anthropic agents, Groq/Llama-3.3 for others, automatic fallback if primary fails)
8. **Compare strip** appears under the response — same-category agents not yet used, with price tags

### Compare flow
- Click any agent in the compare strip
- New PaymentGateCard queued with same prompt
- Pay → response stacked below previous one
- Repeat across any number of agents in the category
- All responses remain visible in the same conversation thread

### History & resume
- Every closed deal saved to `localStorage` (key: `zap402_conversations_v2`)
- **Deal History** tab shows all conversations with: agents used, USDC spent, TX hashes, response previews
- **Continue** resumes any conversation with full compare capability
- **Compare in [Category]** on any history item re-opens a modal with unused agents

### Agent portfolio pages
- Every agent has a **ZapPage** at `/@handle`
- Shows: category, provider, capabilities, how-it-works flow, price, live stats
- Sample prompt buttons → click → navigates to Chat with that agent pre-selected and prompt auto-sent
- "Try Agent" button → Chat page with agent activated, keyboard focused

---

## Tech stack

### Frontend
- **React 18 + TypeScript** — component architecture
- **Vite** — dev server, HMR, production build
- **TailwindCSS** — utility classes with Zap402 design tokens (dark bg, orange/teal accents, Space Mono, Bebas Neue)
- **Zustand** — wallet + profile + chat state
- **React Router v6** — dashboard shell, terminal tabs, public `/@handle` pages
- **Groq API** (`llama-3.3-70b-versatile`) — primary model for most agents + automatic fallback
- **Anthropic API** (`claude-sonnet-4-20250514`) — premium model for Anthropic-provider agents

### Chain
- **Stellar testnet** — payment settlement, on-chain identity
- **Soroban smart contracts** (Rust) — profiles, zap payments, withdrawals, credit scores, leaderboard
- **x402 protocol** — pay-before-response pattern
- **USDC** — default payment asset; XLM for gas

### Key files
```
src/
  pages/terminal/
    TerminalChatPage.tsx     # pay-per-query chat, payment gate, compare flow
    SearchPage.tsx           # agent discovery with category filters
    PurchasesTab.tsx         # deal history with resume + compare
  pages/
    ZapPage.tsx              # agent portfolio page
  lib/
    categoryClassifier.ts    # keyword + regex intent classifier
  components/layout/
    DashboardLayout.tsx      # app shell (fixed header + scrollable main)
    DashboardSidebar.tsx     # navigation
```

---

## Category classifier

The classifier auto-detects prompt intent before routing to a payment gate. It uses weighted keyword matching + structural regex patterns:

```typescript
classifyCategory("write a Soroban smart contract in Rust")
// → "code"

classifyCategory("what is the competitive landscape for fintech in Africa")
// → "research"

classifyCategory("a neon cyberpunk portrait of a warrior at night")
// → "image"
```

Signals: ~200 weighted keywords per category, code pattern detection (camelCase, backticks, arrow functions), question-starter detection, early-word position bonuses.

---

## Quick start

### Prerequisites

- Node.js 18+
- Rust + Cargo (for contracts)
- Soroban CLI (for deploy)
- Freighter wallet browser extension

### Run the app

```bash
git clone https://github.com/<your-org>/zap402.git
cd zap402/frontend-scaffold

cp .env.example .env
# Set VITE_CONTRACT_ID, VITE_GROQ_API_KEY, VITE_ANTHROPIC_API_KEY in .env

npm install
npm run dev
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_CONTRACT_ID` | Yes | Deployed Soroban contract address (`C…`) |
| `VITE_GROQ_API_KEY` | Yes | Groq API key — powers Llama-3.3 (primary model + fallback) |
| `VITE_ANTHROPIC_API_KEY` | Yes | Anthropic API key — powers Claude for research/chat agents |
| `VITE_NETWORK` | No | `TESTNET` (default) \| `MAINNET` |
| `VITE_HORIZON_URL` | No | Horizon HTTP base URL |
| `VITE_USDC_CONTRACT_ID` | No | USDC SAC override |

### Deploy the contract

```bash
# From repo root — fast path
./scripts/deploy-testnet.sh

# Or manually
cd contracts
cargo build --target wasm32-unknown-unknown --release

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zap402_contract.wasm \
  --source mykey \
  --network testnet
```

Initialize with USDC SAC:

```bash
soroban contract invoke \
  --id "$CONTRACT_ID" \
  --source mykey \
  --network testnet \
  -- initialize \
  --admin "$ADMIN" \
  --fee_collector "$ADMIN" \
  --fee_bps 200 \
  --native_token "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"
```

Copy the printed contract ID into `frontend-scaffold/.env` as `VITE_CONTRACT_ID=...` and restart the dev server.

---

## Project structure

```
zap402/
├── contracts/                 # Soroban smart contract (Rust)
│   ├── src/lib.rs             # Contract entrypoints
│   └── README.md
├── frontend-scaffold/         # React app
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI
│   │   ├── hooks/             # Contract, wallet, payment hooks
│   │   ├── state/             # Zustand stores
│   │   └── lib/               # Classifier, API helpers
│   ├── server/
│   │   └── dev-api.mjs        # Local dev API (legacy Clone/Ask proxy)
│   └── README.md
├── docs/                      # Setup, deployment, contract spec
└── scripts/                   # Deploy helpers
```

---

## Design system

Zap402 uses a terminal/protocol aesthetic throughout:

- **Fonts:** Bebas Neue (display headings) + Space Mono (body, labels, monospace)
- **Colors:** Near-black backgrounds (`#0a0a0a`), orange accent (`#ff6b00`), teal accent (`#00d4aa`), emerald for success
- **Corners:** Zero border-radius on structural elements; rounded-full for pills and avatars only
- **Motion:** Subtle pulse animations for live indicators; fade-in for new messages
- **Density:** High information density — receipts, TX hashes, category labels, prices all visible

---

## Smart contract

The Soroban contract backs identity and payment:

- **`register_profile`** — creates on-chain profile with handle, bio, social links
- **`send_tip`** — USDC payment from supporter to creator
- **`withdraw_tips`** — creator pulls earnings (platform fee in bps deducted)
- **`get_profile`** — fetch profile by wallet or username
- **`get_leaderboard`** — ranked creators by on-chain activity
- **`calculate_credit_score`** — reputation score from X metrics + on-chain activity

Full spec: [`docs/CONTRACT_SPEC.md`](docs/CONTRACT_SPEC.md)

---

## Credit score

```
Score = (Followers/10 × 50%) + ((Posts + Replies×1.5)/5 × 30%) + (Base 200 × 20%)
Maximum: 1000 points
```

| Tier | Range |
|------|-------|
| Bronze | 0–400 |
| Silver | 401–700 |
| Gold | 701–900 |
| Diamond | 901–1000 |

---

## Roadmap

| Now | Next | Later |
|-----|------|-------|
| Testnet pay-per-query with real USDC | Mainnet deployment + audit | Mobile app |
| Agent comparison across categories | Real x402 challenge/receipt protocol | Subscriptions |
| Deal history with full TX record | Agent inbox for creator-led replies | Public API |
| Agent portfolio pages | Push notifications | Custom agent deployment |
| Category classifier | Multi-asset support | Agent analytics dashboard |

---

## Security

- Contract: input validation, access control, integer safety — audit planned before mainnet
- Client: no private keys on servers; all signing local via Freighter
- API keys: server-side only; never bundled into client
- Payment: each request requires fresh wallet confirmation — no stored authorization

---

## License

MIT — use with attribution.

---

## Links

- [Architecture](./ARCHITECTURE.md) · [Setup](./docs/SETUP.md) · [Contract spec](./docs/CONTRACT_SPEC.md)
- [Stellar](https://stellar.org) · [Soroban](https://soroban.stellar.org) · [x402](https://x402.org)

---

<div align="center">

**ZAP402 — The payment layer for AI commerce.**

Pay-per-query · On-chain receipts · Compare across 20+ agents · Built on Stellar

*Built for the Stellar Hacks hackathon.*

</div>