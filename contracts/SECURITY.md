# Security Audit Notes

This document records a targeted review of the Zap402 contract codebase.

## Scope

- `contracts/zap402/src/zaps.rs`
- `contracts/zap402/src/fees.rs`
- `contracts/zap402/src/credit.rs`
- `contracts/zap402/src/profile.rs`
- `contracts/zap402/src/storage.rs`
- `contracts/zap402/src/token.rs`
- `contracts/zap402/src/admin.rs`

## Findings by checklist item

### Reentrancy

- Soroban contract execution is single-threaded and does not support EVM-style fallback callbacks.
- `token::transfer_xlm` uses `token::TokenClient::transfer` against the native SAC and does not expose a callback path into this contract.
- No explicit reentrancy guard is required for current call patterns.

Status: addressed.

### Integer overflow

- `fees::calculate_fee` already uses checked arithmetic.
- `storage::add_to_tips_volume` now uses `checked_add` and returns `OverflowError` on overflow.
- `storage::add_to_fees` now uses `checked_add` and returns `OverflowError` on overflow.
- Remaining arithmetic hotspots reviewed:
  - `zaps.rs` profile counters increment in bounded domains for realistic usage.
  - `credit.rs` score math is bounded and clamped to small integer ranges.
  - `storage.rs` counter increments (`TipCount`, `TotalCreators`) remain plain `+ 1` and should be migrated to checked arithmetic in a follow-up hardening patch if strict overflow safety is required for all counters.

Status: partially addressed with key monetary accumulators hardened.

### Authorization

- All key state-changing entry paths enforce authorization on the expected actor:
  - `register_profile` / `update_profile` require caller auth.
  - `send_tip` requires tipper auth.
  - `withdraw_tips` requires caller auth in `zaps.rs` path.
  - Admin operations (`set_fee`, `set_fee_collector`, `set_admin`, X-metrics updates, ttl bump) enforce admin checks.

Status: addressed.

### Storage exhaustion

- Tip records are stored in temporary storage with explicit TTL (`TIP_TTL_LEDGERS`) via `set_tip_ttl`.
- Contract instance TTL is periodically extended for active state.
- Profiles and username mappings intentionally use persistent storage and can grow with user adoption.

Status: acceptable with current model (temporary tips + persistent profiles).

### Front-running

- Tip transactions and ordering are subject to validator sequencing and mempool visibility.
- There is no contract-level mitigation for sequencing risk, and this is acceptable for the tipping use-case.

Status: documented risk accepted.

### Griefing (username squatting)

- Username registration is first-come-first-served and low-cost.
- A motivated actor can squat common names.
- Mitigations not yet implemented (examples: reservation fees, username auctions, expiry/reclamation, moderation/admin reclaim policy).

Status: open product/policy risk.

### Fee bypass

- Main withdraw flow in `zaps.rs::withdraw_tips` always computes and transfers fee before finalizing state updates.
- No public path was identified that withdraws creator balance without passing the fee calculation in `fees::calculate_fee`.

Status: addressed for active withdraw path.

## Recommended follow-ups

1. Convert all storage counter increments (`u32` counters) to checked arithmetic with explicit overflow errors.
2. Define an anti-squatting policy for usernames and implement corresponding contract or governance controls.
