# Zap402 — Smart Contracts

> Soroban smart contracts for **Zap402**: Layer 1 zaps (tip asset is a configurable SAC — use **USDC SAC** at `initialize` for USDC tips; see `scripts/deploy-testnet.sh`), profiles, withdrawals, credit, and leaderboard.

## Structure

```
contracts/
├── Cargo.toml              # Workspace manifest
├── Makefile                 # Build/test shortcuts
└── zap402/                  # Main contract crate (package: zap402-contract)
    ├── Cargo.toml
    └── src/
        ├── lib.rs           # Contract entry point (public interface)
        ├── types.rs         # Data structures (Profile, Tip, etc.)
        ├── storage.rs       # Storage keys & helpers
        ├── errors.rs        # ContractError enum
        ├── admin.rs         # Initialization & admin ops
        ├── credit.rs        # Credit score algorithm
        ├── zaps.rs          # Zap (tip) transfer & withdrawal logic
        ├── events.rs        # Event emission helpers
        ├── leaderboard.rs   # Leaderboard tracking
        └── test/            # Test modules
            ├── mod.rs
            ├── test_register.rs
            ├── test_zaps.rs
            ├── test_withdraw.rs
            ├── test_credit.rs
            ├── test_leaderboard.rs
            ├── test_admin.rs
            └── test_events.rs
```

## Quick Start

```bash
cd contracts
cargo build
cargo test
```

Optimized WASM:

```bash
make wasm
```

Output artifact: `target/wasm32-unknown-unknown/release/zap402_contract.wasm`

## On-chain interface

Exported entrypoints retain Soroban names such as `send_tip` and `withdraw_tips` for compatibility with existing deployments and indexers. The Rust crate and repo layout use **Zap402** naming.
