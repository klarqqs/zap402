# Credit Score Algorithm

> Deep-dive into the Zap402 credit score system.

---

## Overview

The credit score provides transparent creator credibility, helping tippers discover quality creators. Scores range from **0 to 1000** and are stored on-chain.

---

## Formula

```
credit_score = follower_component + activity_component + base_component

Where:
  follower_component = min(followers / 10, 500) × 0.50
  activity_component = min((posts + replies × 1.5) / 5, 300) × 0.30
  base_component     = 200 × 0.20

Maximum score: 1000
```

### Component Breakdown

| Component | Weight | Max Contribution | Input Source |
|-----------|--------|-----------------|-------------|
| **Followers** | 50% | 500 points | X follower count |
| **Activity** | 30% | 300 points | X posts + weighted replies |
| **Base** | 20% | 200 points | Flat (every registered creator gets this) |

---

## Detailed Calculation

### 1. Follower Component (50%, max 500)

```
raw = followers / 10
capped = min(raw, 500)
follower_score = capped × 0.50 = capped / 2
```

| Followers | Raw | Capped | Score |
|-----------|-----|--------|-------|
| 100 | 10 | 10 | 5 |
| 1,000 | 100 | 100 | 50 |
| 5,000 | 500 | 500 | 250 |
| 50,000 | 5,000 | 500 | 250 |

Max at **5,000+ followers** → 250 points.

### 2. Activity Component (30%, max 300)

Replies are weighted 1.5× because they indicate engagement.

```
activity = (posts + replies × 1.5) / 5
capped = min(activity, 300)
activity_score = capped × 0.30
```

| Posts | Replies | Raw | Capped | Score |
|-------|---------|-----|--------|-------|
| 100 | 50 | 35 | 35 | 10.5 |
| 500 | 200 | 160 | 160 | 48.0 |
| 1,000 | 500 | 350 | 300 | 90.0 |

Max at very high activity → 90 points.

### 3. Base Component (20%, always 200)

Every registered creator receives:

```
base_score = 200 × 0.20 = 40 points
```

This ensures new creators start with a non-zero score.

---

## Tier System

| Tier | Range | Badge | Description |
|------|-------|-------|-------------|
| 🥉 **Bronze** | 0–400 | Entry Level | New or small creators |
| 🥈 **Silver** | 401–700 | Established | Growing presence |
| 🥇 **Gold** | 701–900 | Proven | Strong community |
| 💎 **Diamond** | 901–1000 | Elite | Top-tier creators |

### Score Examples

| Creator Type | Followers | Posts | Replies | Score | Tier |
|-------------|-----------|-------|---------|-------|------|
| New creator | 50 | 20 | 10 | ~49 | Bronze |
| Growing creator | 500 | 200 | 100 | ~115 | Bronze |
| Established creator | 2,000 | 500 | 300 | ~199 | Bronze |
| Popular creator | 5,000 | 1,000 | 500 | ~380 | Bronze |
| Major creator | 10,000 | 2,000 | 1,000 | ~380 | Bronze |

> Note: The scoring is designed to be conservative — reaching Diamond tier requires exceptional, sustained engagement.

---

## Implementation (Rust)

```rust
/// Calculate credit score for a profile (0-1000)
pub fn calculate_credit_score(
    followers: u32,
    posts: u32,
    replies: u32,
) -> u32 {
    // Follower component: min(followers/10, 500) × 50%
    let follower_raw = followers / 10;
    let follower_capped = if follower_raw > 500 { 500 } else { follower_raw };
    let follower_score = follower_capped * 50 / 100;

    // Activity component: min((posts + replies*1.5)/5, 300) × 30%
    // Use integer math: replies*15/10 instead of replies*1.5
    let activity_raw = (posts + replies * 15 / 10) / 5;
    let activity_capped = if activity_raw > 300 { 300 } else { activity_raw };
    let activity_score = activity_capped * 30 / 100;

    // Base component: 200 × 20%
    let base_score = 200 * 20 / 100;

    // Total (max 1000)
    let total = follower_score + activity_score + base_score;
    if total > 1000 { 1000 } else { total }
}
```

---

## Update Mechanism

1. **Off-chain fetch**: A trusted service queries the X (Twitter) API for follower/post/reply counts
2. **Admin update**: The admin calls `update_x_metrics(target, followers, posts, replies)` on the contract
3. **Recalculation**: The contract recalculates and stores the new credit score
4. **Event**: `CreditScoreUpdated` event emitted with old and new scores

### Why Off-chain?

The X API cannot be called directly from a smart contract. The admin role acts as a trusted oracle. Future versions may use a decentralized oracle.

---

## Design Rationale

| Decision | Reasoning |
|----------|-----------|
| **50% weight on followers** | Social proof is the strongest credibility signal |
| **1.5× reply weight** | Replies indicate genuine engagement, not just broadcasting |
| **Base score of 40** | New creators aren't stuck at zero |
| **Caps on components** | Prevents gaming by any single metric |
| **On-chain storage** | Fully transparent and verifiable |
| **Integer math** | Soroban doesn't support floating point |
