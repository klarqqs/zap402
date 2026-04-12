# Smart Contract Specification

> Complete technical specification for the Zap402 Soroban smart contract.

---

## Overview

The Zap402 contract manages creator profiles, tip transactions, balance accounting, credit scores, and a leaderboard — all on-chain via Stellar's Soroban runtime.

**Contract ID**: TBD (deployed to Testnet)  
**Language**: Rust (Soroban SDK)  
**Network**: Stellar Testnet → Mainnet  

---

## Data Structures

### Profile

```rust
#[contracttype]
#[derive(Clone, Debug)]
pub struct Profile {
    pub owner: Address,           // Stellar address of the creator
    pub username: String,         // Unique @username (lowercase, alphanumeric + underscore)
    pub display_name: String,     // Display name (max 64 chars)
    pub bio: String,              // Short bio (max 280 chars)
    pub image_url: String,        // IPFS CID or URL for profile image
    pub x_handle: String,         // X (Twitter) handle
    pub x_followers: u32,         // Follower count (updated off-chain)
    pub x_posts: u32,             // Post count
    pub x_replies: u32,           // Reply count
    pub credit_score: u32,        // Calculated score (0-1000)
    pub total_tips_received: i128,// Lifetime tips received (in stroops)
    pub total_tips_count: u32,    // Number of tips received
    pub balance: i128,            // Current withdrawable balance (in stroops)
    pub registered_at: u64,       // Ledger timestamp of registration
    pub updated_at: u64,          // Last update timestamp
}
```

### Tip

```rust
#[contracttype]
#[derive(Clone, Debug)]
pub struct Tip {
    pub id: u32,              // Unique tip ID
    pub tipper: Address,      // Tipper's address
    pub creator: Address,     // Creator's address
    pub amount: i128,         // Tip amount (in stroops)
    pub message: String,      // Optional message (max 280 chars)
    pub timestamp: u64,       // Timestamp of the tip
}
```

### LeaderboardEntry

```rust
#[contracttype]
#[derive(Clone, Debug)]
pub struct LeaderboardEntry {
    pub address: Address,
    pub username: String,
    pub total_tips_received: i128,
    pub credit_score: u32,
}
```

### DataKey (Storage Keys)

```rust
#[contracttype]
pub enum DataKey {
    Admin,                     // Address — contract admin
    FeePercent,               // u32 — withdrawal fee (basis points, e.g., 200 = 2%)
    FeeCollector,             // Address — receives collected fees
    TotalFeesCollected,       // i128 — lifetime fees collected
    Profile(Address),         // Profile struct for a creator
    UsernameToAddress(String),// Reverse lookup: username → address
    TipCount,                // u32 — global tip counter
    Tip(u32),                // Individual tip record by index
    Leaderboard,             // Vec<LeaderboardEntry> — top creators
    TotalCreators,           // u32 — total registered creators
    TotalTipsVolume,         // i128 — lifetime tip volume
}
```

---

## Public Functions

### Initialization

#### `initialize(admin: Address, fee_collector: Address, fee_bps: u32)`

Initializes the contract. Can only be called once.

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | `Address` | Admin address (can update config) |
| `fee_collector` | `Address` | Address that receives withdrawal fees |
| `fee_bps` | `u32` | Fee in basis points (200 = 2%) |

**Errors**: `AlreadyInitialized`

---

### Profile Management

#### `register_profile(caller: Address, username: String, display_name: String, bio: String, image_url: String, x_handle: String)`

Register a new creator profile.

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `caller` | `Address` | Must authorize |
| `username` | `String` | 3-32 chars, lowercase alphanumeric + underscore, unique |
| `display_name` | `String` | 1-64 chars |
| `bio` | `String` | 0-280 chars |
| `image_url` | `String` | 0-256 chars |
| `x_handle` | `String` | 0-32 chars |

**Returns**: `Profile`  
**Errors**: `AlreadyRegistered`, `UsernameTaken`, `InvalidUsername`, `InvalidDisplayName`

---

#### `update_profile(caller: Address, display_name: Option<String>, bio: Option<String>, image_url: Option<String>, x_handle: Option<String>)`

Update an existing profile. Only the profile owner can call this.

**Errors**: `NotRegistered`, `InvalidDisplayName`

---

#### `update_x_metrics(caller: Address, target: Address, followers: u32, posts: u32, replies: u32)`

Update X (Twitter) metrics for a profile. Admin-only (metrics are fetched off-chain).

**Errors**: `NotAdmin`, `NotRegistered`

---

#### `get_profile(address: Address) → Profile`

Read a creator's profile.

**Errors**: `NotRegistered`

---

#### `get_profile_by_username(username: String) → Profile`

Look up a profile by username.

**Errors**: `NotFound`

---

### Tipping

#### `send_tip(tipper: Address, creator: Address, amount: i128, message: String)`

Send an XLM tip to a registered creator.

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `tipper` | `Address` | Must authorize, cannot tip self |
| `creator` | `Address` | Must be registered |
| `amount` | `i128` | > 0, in stroops (1 XLM = 10,000,000 stroops) |
| `message` | `String` | 0-280 chars |

**Pay-to-ask convention (app-level)**: The contract treats `message` as opaque. The app may use `ask:` followed by 64 lowercase hex characters (SHA-256 of the UTF-8 question body) to commit to a paid question while keeping full text off-chain. Length is 68 characters, within the 280-character limit. Escrow/refund semantics are not enforced by the contract today; those require a future `PaidAsk`-style module if needed.

**Flow**:
1. Validate tipper authorization
2. Validate creator is registered
3. Validate amount > 0
4. Transfer XLM from tipper to contract
5. Credit creator's balance
6. Update tip stats (count, volume)
7. Store tip record
8. Update leaderboard if applicable
9. Emit `TipSent` event

**Errors**: `NotRegistered`, `InvalidAmount`, `CannotTipSelf`, `InsufficientBalance`

---

#### `withdraw_tips(caller: Address, amount: i128)`

Withdraw accumulated tips. A percentage fee is deducted.

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `caller` | `Address` | Must authorize, must be registered |
| `amount` | `i128` | > 0, ≤ caller's balance |

**Flow**:
1. Validate caller authorization
2. Validate caller is registered
3. Validate amount ≤ balance
4. Calculate fee: `amount × fee_bps / 10000`
5. Transfer `amount - fee` to caller
6. Transfer `fee` to fee collector
7. Deduct `amount` from caller's balance
8. Emit `TipsWithdrawn` event

**Errors**: `NotRegistered`, `InvalidAmount`, `InsufficientBalance`

---

### Credit Score

#### `calculate_credit_score(address: Address) → u32`

Calculate and store the credit score for a profile.

**Formula**:
```
follower_score = min(followers / 10, 500) × 50%
activity_score = min((posts + replies × 1.5) / 5, 300) × 30%
base_score     = 200 × 20%

credit_score   = follower_score + activity_score + base_score
max            = 1000
```

**Tiers**:
| Range | Tier |
|-------|------|
| 0-400 | Bronze |
| 401-700 | Silver |
| 701-900 | Gold |
| 901-1000 | Diamond |

---

### Leaderboard

#### `get_leaderboard(limit: u32) → Vec<LeaderboardEntry>`

Get the top creators by total tips received.

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `limit` | `u32` | 1-100 |

---

### Admin

#### `set_fee(caller: Address, fee_bps: u32)`

Update the withdrawal fee. Admin-only.

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `fee_bps` | `u32` | 0-1000 (0-10%) |

**Errors**: `NotAdmin`, `InvalidFee`

---

#### `set_fee_collector(caller: Address, new_collector: Address)`

Update the fee collector address. Admin-only.

---

#### `set_admin(caller: Address, new_admin: Address)`

Transfer admin role. Admin-only.

---

#### `get_stats() → ContractStats`

Get global contract statistics.

```rust
pub struct ContractStats {
    pub total_creators: u32,
    pub total_tips_count: u32,
    pub total_tips_volume: i128,
    pub total_fees_collected: i128,
    pub fee_bps: u32,
}
```

---

## Events

| Event | Fields | When |
|-------|--------|------|
| `ProfileRegistered` | `(address, username)` | New profile created |
| `ProfileUpdated` | `(address)` | Profile info changed |
| `TipSent` | `(from, to, amount, message)` | Tip successfully sent |
| `TipsWithdrawn` | `(address, amount, fee)` | Tips withdrawn |
| `CreditScoreUpdated` | `(address, old_score, new_score)` | Score recalculated |
| `AdminChanged` | `(old_admin, new_admin)` | Admin role transferred |
| `FeeUpdated` | `(old_fee, new_fee)` | Fee percentage changed |

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `AlreadyInitialized` | Contract already initialized |
| 2 | `NotInitialized` | Contract not yet initialized |
| 3 | `NotAdmin` | Caller is not the admin |
| 4 | `AlreadyRegistered` | Address already has a profile |
| 5 | `NotRegistered` | Address does not have a profile |
| 6 | `UsernameTaken` | Username already in use |
| 7 | `InvalidUsername` | Username format invalid |
| 8 | `InvalidDisplayName` | Display name too long or empty |
| 9 | `InvalidAmount` | Tip/withdrawal amount invalid |
| 10 | `InsufficientBalance` | Not enough balance to withdraw |
| 11 | `CannotTipSelf` | Cannot send tip to own profile |
| 12 | `InvalidFee` | Fee exceeds maximum allowed |
| 13 | `MessageTooLong` | Tip message exceeds 280 chars |
| 14 | `NotFound` | Username not found |

---

## Storage Layout

| Key | Type | TTL |
|-----|------|-----|
| `DataKey::Admin` | `Address` | Persistent |
| `DataKey::FeePercent` | `u32` | Persistent |
| `DataKey::FeeCollector` | `Address` | Persistent |
| `DataKey::Profile(addr)` | `Profile` | Persistent |
| `DataKey::UsernameToAddress(name)` | `Address` | Persistent |
| `DataKey::TipCount` | `u32` | Persistent |
| `DataKey::Tip(index)` | `Tip` | Temporary (30 days) |
| `DataKey::Leaderboard` | `Vec<LeaderboardEntry>` | Persistent |
| `DataKey::TotalCreators` | `u32` | Persistent |
| `DataKey::TotalTipsVolume` | `i128` | Persistent |
| `DataKey::TotalFeesCollected` | `i128` | Persistent |

> **Note**: Tip records use temporary storage to keep costs low. The contract maintains aggregate stats in persistent storage.
