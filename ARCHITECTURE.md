# Zap402 — Project Architecture

> Canonical reference for the repository structure, module boundaries, and data flow.

---

## Directory Layout

```
zap402/
│
├── .github/                        # GitHub configuration
│   ├── workflows/                  # CI/CD pipelines
│   │   ├── contract-ci.yml         # Soroban contract build + test
│   │   ├── frontend-ci.yml         # Frontend lint + build check
│   │   └── pr-checks.yml          # Pull-request gate (runs both)
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── contract_task.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CONTRIBUTING.md
│
├── contracts/                      # Soroban smart contracts (Rust)
│   ├── Cargo.toml                  # Workspace Cargo manifest
│   ├── Makefile                    # Build / test / deploy shortcuts
│   ├── README.md                   # Contract-specific documentation
│   └── zap402/                     # Main Zap402 contract crate
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs              # Contract entry point & public interface
│           ├── types.rs            # On-chain data structures (Profile, Tip, etc.)
│           ├── storage.rs          # Storage helpers & keys
│           ├── credit.rs           # Credit-score algorithm
│           ├── tips.rs             # Tipping logic (send, withdraw)
│           ├── admin.rs            # Admin / fee management
│           ├── events.rs           # Contract event definitions
│           ├── errors.rs           # Custom error codes
│           ├── leaderboard.rs      # Leaderboard tracking
│           └── test/
│               ├── mod.rs
│               ├── test_register.rs
│               ├── test_zaps.rs
│               ├── test_withdraw.rs
│               ├── test_credit.rs
│               ├── test_leaderboard.rs
│               ├── test_admin.rs
│               └── test_events.rs
│
├── docs/                           # Project documentation
│   ├── CONTRIBUTING.md             # Step-by-step contribution guide
│   ├── SETUP.md                    # Local development environment setup
│   ├── CONTRACT_SPEC.md            # Smart contract specification & ABI
│   ├── FRONTEND_GUIDE.md           # Frontend architecture & conventions
│   ├── DEPLOYMENT.md               # Testnet / mainnet deployment runbook
│   ├── CREDIT_SCORE.md             # Credit score algorithm deep-dive
│   └── API_REFERENCE.md            # Contract function reference
│
├── frontend-scaffold/              # React + TypeScript frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── config/                     # Webpack configs
│   ├── public/
│   │   ├── index.html
│   │   └── img/
│   └── src/
│       ├── index.tsx               # App entry point
│       ├── index.scss              # Global styles + Tailwind
│       ├── App.tsx                 # Router + layout wrapper
│       ├── routes.tsx              # Route definitions
│       │
│       ├── components/             # Reusable UI building blocks
│       │   ├── ui/                 # Design-system atoms
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Loader.tsx
│       │   │   └── Toast.tsx
│       │   ├── layout/             # Structural components
│       │   │   ├── Header.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── PageContainer.tsx
│       │   └── shared/             # Feature-agnostic composites
│       │       ├── WalletConnect.tsx
│       │       ├── CreditBadge.tsx
│       │       └── TransactionStatus.tsx
│       │
│       ├── features/               # Feature modules (domain-driven)
│       │   ├── landing/
│       │   │   └── LandingPage.tsx
│       │   ├── profile/
│       │   │   ├── ProfilePage.tsx
│       │   │   ├── ProfileCard.tsx
│       │   │   └── EditProfile.tsx
│       │   ├── zap402/
│       │   │   ├── ZapPage.tsx
│       │   │   ├── TipForm.tsx
│       │   │   ├── TipConfirm.tsx
│       │   │   └── TipResult.tsx
│       │   ├── dashboard/
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── EarningsChart.tsx
│       │   │   ├── TipHistory.tsx
│       │   │   └── WithdrawForm.tsx
│       │   └── leaderboard/
│       │       ├── LeaderboardPage.tsx
│       │       └── LeaderboardRow.tsx
│       │
│       ├── hooks/                  # Custom React hooks
│       │   ├── useWallet.ts
│       │   ├── useContract.ts
│       │   ├── useZap402.ts
│       │   └── useProfile.ts
│       │
│       ├── store/                  # Zustand state stores
│       │   ├── walletStore.ts
│       │   └── profileStore.ts
│       │
│       ├── services/               # External integrations
│       │   ├── soroban.ts          # Contract interaction layer
│       │   ├── stellar.ts          # Stellar SDK helpers
│       │   └── ipfs.ts            # IPFS upload/fetch
│       │
│       ├── helpers/                # Pure utility functions
│       │   ├── dom.ts
│       │   ├── error.ts
│       │   ├── format.ts
│       │   └── network.ts
│       │
│       └── types/                  # TypeScript type definitions
│           ├── contract.ts         # Contract response types
│           ├── profile.ts          # Profile & credit types
│           └── stellar-wallets-kit.d.ts
│
├── scripts/                        # Developer helper scripts
│   ├── deploy-testnet.sh           # Deploy contract to Stellar Testnet
│   ├── fund-account.sh             # Fund testnet account via Friendbot
│   └── generate-bindings.sh        # Generate TS bindings from contract
│
├── .gitignore
├── ARCHITECTURE.md                 # ← This file
├── README.md                       # Project overview
├── LICENSE                         # MIT license
└── vercel.json                     # Vercel deployment config
```

---

## Module Boundaries

### 1. Smart Contract Layer (`contracts/`)

Self-contained Rust workspace. Has **zero dependency** on the frontend.

| Module | Responsibility |
|--------|---------------|
| `lib.rs` | Public contract trait + function dispatch |
| `types.rs` | `Profile`, `Tip`, `CreditScore`, `LeaderboardEntry` structs |
| `storage.rs` | `DataKey` enum, persistent/temporary storage access |
| `credit.rs` | Score calculation: `(followers/10 × 0.5) + ((posts + replies×1.5)/5 × 0.3) + (200 × 0.2)` |
| `tips.rs` | `send_tip()`, `withdraw_tips()`, balance tracking |
| `admin.rs` | Fee config, contract initialization, admin-only ops |
| `events.rs` | Structured contract events for indexers |
| `errors.rs` | `ContractError` enum with descriptive codes |
| `leaderboard.rs` | Top-N tracking, sorted by total tips received |

### 2. Frontend Layer (`frontend-scaffold/`)

React SPA that talks to the contract through the Stellar SDK.

| Layer | Directory | Responsibility |
|-------|-----------|---------------|
| **UI Atoms** | `components/ui/` | Stateless design-system primitives (Button, Card, Input, Badge) |
| **Layout** | `components/layout/` | Page chrome (Header, Footer, PageContainer) |
| **Shared** | `components/shared/` | Feature-agnostic composites (WalletConnect, CreditBadge) |
| **Features** | `features/` | Page-level modules with their own components |
| **Hooks** | `hooks/` | React hooks wrapping contract calls & wallet state |
| **Store** | `store/` | Zustand stores for global state (wallet, profile) |
| **Services** | `services/` | External integrations (Soroban RPC, IPFS, Stellar SDK) |
| **Helpers** | `helpers/` | Pure functions (formatting, error codes, DOM utils) |

### 3. CI/CD Layer (`.github/workflows/`)

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `contract-ci.yml` | Push/PR touching `contracts/` | `cargo fmt --check` → `cargo clippy` → `cargo test` → `cargo build --release` |
| `frontend-ci.yml` | Push/PR touching `frontend-scaffold/` | `npm ci` → `eslint` → `tsc --noEmit` → `npm run build` |
| `pr-checks.yml` | All PRs | Runs both contract + frontend jobs |

---

## Data Flow

```
┌─────────────┐   REST/RPC    ┌──────────────────┐   Soroban TX    ┌───────────────┐
│   Browser    │ ────────────► │  Soroban RPC      │ ──────────────► │  Zap402 Contract │
│  (React UI)  │ ◄──────────── │  (Horizon+RPC)   │ ◄────────────── │  (on Stellar)  │
└──────┬───────┘               └──────────────────┘                 └───────────────┘
       │
       │  Sign TX
       ▼
┌──────────────┐
│  Freighter    │
│  Wallet       │
└──────────────┘
```

### Tip Flow (Happy Path)

1. **Fan** visits `/@creator` on Zap402 → frontend loads creator profile from contract
2. Tipper enters amount → frontend builds `send_tip` transaction
3. Freighter signs the transaction
4. Frontend submits signed XDR to Soroban RPC
5. Contract executes: validates amount, transfers XLM, updates balances, emits event
6. Frontend polls for confirmation (3-5 seconds) → shows success

### Withdrawal Flow

1. Creator clicks "Withdraw" on dashboard
2. Frontend builds `withdraw_tips` transaction with creator's full balance
3. Freighter signs
4. Contract executes: calculates 2% fee, transfers net amount, updates storage
5. Confirmation displayed

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Monorepo** | Contract + frontend in one repo simplifies contributor onboarding |
| **Soroban (Rust)** | Stellar's native smart contract platform, 3-5s finality |
| **Webpack (not Vite)** | Scaffold Stellar compatibility; battle-tested with Stellar SDK |
| **Zustand over Redux** | Minimal boilerplate for small-to-medium state |
| **Feature-based frontend** | Each page owns its components; avoids cross-feature coupling |
| **Brutalist design** | Distinctive brand; fast to implement with Tailwind utilities |
| **2% fee model** | Sustainable revenue while being 95% cheaper than competitors |

---

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `SOROBAN_RPC_URL` | Contract deploy scripts | RPC endpoint |
| `SOROBAN_NETWORK_PASSPHRASE` | Contract deploy scripts | Network identifier |
| `CONTRACT_ID` | Frontend `.env` | Deployed Zap402 contract address |
| `REACT_APP_NETWORK` | Frontend `.env` | `TESTNET` or `PUBLIC` |

---

## For Contributors

1. Read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for workflow
2. Read [docs/SETUP.md](docs/SETUP.md) for local environment
3. Pick an issue → fork → branch → PR
4. All PRs must pass CI checks before merge
