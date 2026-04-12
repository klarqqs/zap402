//! Network ranking for the Zap402 contract.
//!
//! Maintains a sorted list (descending by `total_tips_received`) of up to
//! [`MAX_NETWORK_SIZE`] creators. The list is refreshed after every tip
//! via [`update_network`].
//!
//! ## Storage
//! The contract stores a single `Vec<NetworkEntry>` under
//! `DataKey::Network` in instance storage.
//!
//! ## Complexity
//! Updates are O(n) for n ≤ 50 using insertion sort.
//!
//! ## Tie-breaking
//! When two creators have equal `total_tips_received`, the one who reached
//! that amount first keeps the higher rank. This is achieved by using a
//! **stable** insertion sort that only moves an entry forward when its total
//! is *strictly greater* than the entry ahead of it.

use soroban_sdk::{Address, Env, Vec};

use crate::storage::DataKey;
use crate::types::{NetworkEntry, Profile};

/// Maximum number of entries retained on the network ranking.
pub const MAX_NETWORK_SIZE: u32 = 50;

// ── internal helpers ──────────────────────────────────────────────────────────

fn load_entries(env: &Env) -> Vec<NetworkEntry> {
    env.storage()
        .instance()
        .get(&DataKey::Network)
        .unwrap_or_else(|| Vec::new(env))
}

fn save_entries(env: &Env, entries: &Vec<NetworkEntry>) {
    env.storage().instance().set(&DataKey::Network, entries);
}

/// Stable insertion sort: sorts `list` in descending order by
/// `total_tips_received`.
///
/// Entries with equal totals are **not** reordered — the one that was inserted
/// earlier (i.e. reached that total first) retains its higher position.  This
/// implements the documented tie-breaking rule: equal totals → first-to-arrive
/// wins.
fn sort_network_entries(list: &mut Vec<NetworkEntry>) {
    let mut i: u32 = 1;
    while i < list.len() {
        let key = list.get(i).unwrap().clone();
        let mut j = i - 1;
        // Only move `key` forward when the entry ahead has a *strictly lower*
        // total.  Equal totals are left in place (stable / first-in wins).
        while j < i {
            let current = list.get(j).unwrap();
            if current.total_tips_received >= key.total_tips_received {
                break;
            }
            // Shift current down one position.
            let next = list.get(j + 1).unwrap().clone();
            list.set(j, next);
            list.set(j + 1, current.clone());
            if j == 0 {
                break;
            }
            j -= 1;
        }
        i += 1;
    }
}

// ── public API ────────────────────────────────────────────────────────────────

/// Refresh the network ranking after `profile` has received a tip.
///
/// Three cases:
/// - If the creator already has an entry, it is updated and the list re-sorted.
/// - If the creator is new and the list has fewer than 50 entries, a new entry
///   is added and the list re-sorted.
/// - If the list is at capacity (50) and the creator's total is strictly greater
///   than the lowest entry's total, the lowest entry is replaced and the list
///   re-sorted. Otherwise no change is made.
///
/// The list is always kept in descending order by `total_tips_received` and
/// trimmed to at most 50 entries.
pub fn update_network(env: &Env, profile: &Profile) {
    let mut entries = load_entries(env);

    // Ensure the list is sorted before any operations (maintains invariant)
    if !entries.is_empty() {
        sort_network_entries(&mut entries);
    }

    // Find existing entry if present
    let mut existing_index: Option<u32> = None;
    let mut i: u32 = 0;
    let len_u32 = entries.len();
    while i < len_u32 {
        if entries.get(i).unwrap().address == profile.owner {
            existing_index = Some(i);
            break;
        }
        i += 1;
    }

    if let Some(idx) = existing_index {
        // Update existing entry in place
        entries.set(
            idx,
            NetworkEntry {
                address: profile.owner.clone(),
                username: profile.username.clone(),
                total_tips_received: profile.total_tips_received,
                credit_score: profile.credit_score,
            },
        );
    } else {
        // New creator: check capacity
        if entries.len() >= MAX_NETWORK_SIZE {
            // List is full; after sorting, the last entry is the lowest
            let last_idx = entries.len() - 1;
            let last_entry = entries.get(last_idx).unwrap();
            if profile.total_tips_received <= last_entry.total_tips_received {
                // Not enough to enter the top 50; do nothing
                return;
            }
            // Replace the lowest entry
            entries.set(
                last_idx,
                NetworkEntry {
                    address: profile.owner.clone(),
                    username: profile.username.clone(),
                    total_tips_received: profile.total_tips_received,
                    credit_score: profile.credit_score,
                },
            );
        } else {
            // Room available: append
            entries.push_back(NetworkEntry {
                address: profile.owner.clone(),
                username: profile.username.clone(),
                total_tips_received: profile.total_tips_received,
                credit_score: profile.credit_score,
            });
        }
    }

    // Sort the list after modification
    sort_network_entries(&mut entries);

    // Trim to max size (should already be ≤50, but ensure invariant)
    while entries.len() > MAX_NETWORK_SIZE {
        entries.pop_back();
    }

    save_entries(env, &entries);
}

/// Return up to `limit` network ranking entries sorted descending by total tips.
///
/// Passing `limit = 0` returns the full list. If `limit` exceeds the number of
/// stored entries, all entries are returned. The returned vector is in descending
/// order by `total_tips_received`.
pub fn get_network(env: &Env, limit: u32) -> Vec<NetworkEntry> {
    let entries = load_entries(env);
    if limit == 0 || limit >= entries.len() {
        return entries;
    }
    let mut result = Vec::new(env);
    let mut i: u32 = 0;
    while i < limit && i < entries.len() {
        result.push_back(entries.get(i).unwrap().clone());
        i += 1;
    }
    result
}

#[allow(dead_code)]
/// Return `true` if `address` is currently on the network ranking.
pub fn is_on_network(env: &Env, address: &Address) -> bool {
    let entries = load_entries(env);
    let mut i: u32 = 0;
    let len_u32 = entries.len();
    while i < len_u32 {
        if entries.get(i).unwrap().address == *address {
            return true;
        }
        i += 1;
    }
    false
}

#[allow(dead_code)]
/// Return the 1-based rank of `address` on the network ranking, or `None` when
/// the address is not present.
pub fn get_network_rank(env: &Env, address: &Address) -> Option<u32> {
    let entries = load_entries(env);
    let mut i: u32 = 0;
    let len_u32 = entries.len();
    while i < len_u32 {
        if entries.get(i).unwrap().address == *address {
            return Some(i + 1);
        }
        i += 1;
    }
    None
}

/// Remove `address` from the network ranking (used during profile deregistration).
///
/// If the address is not present this is a no-op.  Entries above the removed
/// slot shift down by one position, preserving relative order.
///
/// Public API for the upcoming deregister flow; currently exercised only in tests.
#[allow(dead_code)]
pub fn remove_from_network(env: &Env, address: &Address) {
    let entries = load_entries(env);
    let mut new_entries: Vec<NetworkEntry> = Vec::new(env);
    let mut i: u32 = 0;
    while i < entries.len() {
        let entry = entries.get(i).unwrap();
        if entry.address != *address {
            new_entries.push_back(entry);
        }
        i += 1;
    }
    save_entries(env, &new_entries);
}

/// Return the current number of entries on the network ranking.
pub fn get_network_size(env: &Env) -> u32 {
    load_entries(env).len()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Zap402Contract;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    // Helper to create a Profile with minimal required fields
    fn make_profile(
        env: &Env,
        address: Address,
        username: &str,
        total_tips_received: i128,
    ) -> Profile {
        let now = env.ledger().timestamp();
        Profile {
            owner: address.clone(),
            username: String::from_str(env, username),
            display_name: String::from_str(env, username),
            bio: String::from_str(env, ""),
            image_url: String::from_str(env, ""),
            x_handle: String::from_str(env, ""),
            x_followers: 0,
            x_engagement_avg: 0,
            credit_score: 40,
            total_tips_received,
            total_tips_count: 0,
            balance: 0,
            registered_at: now,
            updated_at: now,
        }
    }

    #[test]
    fn test_sort_network_entries_empty() {
        let env = Env::default();
        let mut list = Vec::new(&env);
        sort_network_entries(&mut list);
        assert_eq!(list.len(), 0);
    }

    #[test]
    fn test_sort_network_entries_single() {
        let env = Env::default();
        let mut list = Vec::new(&env);
        let addr = Address::generate(&env);
        list.push_back(NetworkEntry {
            address: addr.clone(),
            username: String::from_str(&env, "user"),
            total_tips_received: 100,
            credit_score: 50,
        });
        sort_network_entries(&mut list);
        assert_eq!(list.get(0).unwrap().total_tips_received, 100);
    }

    #[test]
    fn test_sort_network_entries_two_elements() {
        let env = Env::default();
        let mut list = Vec::new(&env);
        let addr1 = Address::generate(&env);
        let addr2 = Address::generate(&env);
        list.push_back(NetworkEntry {
            address: addr1.clone(),
            username: String::from_str(&env, "user1"),
            total_tips_received: 50,
            credit_score: 50,
        });
        list.push_back(NetworkEntry {
            address: addr2.clone(),
            username: String::from_str(&env, "user2"),
            total_tips_received: 100,
            credit_score: 50,
        });
        sort_network_entries(&mut list);
        assert_eq!(list.get(0).unwrap().total_tips_received, 100);
        assert_eq!(list.get(1).unwrap().total_tips_received, 50);
    }

    #[test]
    fn test_sort_network_entries_reverse_sorted() {
        let env = Env::default();
        let mut list = Vec::new(&env);
        let mut i: u32 = 0;
        while i < 5 {
            let addr = Address::generate(&env);
            list.push_back(NetworkEntry {
                address: addr,
                username: String::from_str(&env, "user"),
                total_tips_received: (5 - i) as i128 * 10,
                credit_score: 50,
            });
            i += 1;
        }
        sort_network_entries(&mut list);
        let mut i: u32 = 0;
        while i < 5 - 1 {
            let curr = list.get(i).unwrap().total_tips_received;
            let next = list.get(i + 1).unwrap().total_tips_received;
            assert!(curr >= next);
            i += 1;
        }
    }

    #[test]
    fn test_sort_network_entries_tie_breaking() {
        let env = Env::default();
        let mut list = Vec::new(&env);
        let addr_a = Address::generate(&env);
        let addr_b = Address::generate(&env);
        // Both have the same total; addr_a is inserted first.
        list.push_back(NetworkEntry {
            address: addr_a.clone(),
            username: String::from_str(&env, "a"),
            total_tips_received: 100,
            credit_score: 50,
        });
        list.push_back(NetworkEntry {
            address: addr_b.clone(),
            username: String::from_str(&env, "b"),
            total_tips_received: 100,
            credit_score: 50,
        });
        sort_network_entries(&mut list);
        // addr_a was inserted first and must keep the higher position.
        assert_eq!(
            list.get(0).unwrap().address,
            addr_a,
            "first-to-arrive should keep higher rank on tie"
        );
        assert_eq!(list.get(1).unwrap().address, addr_b);
    }

    #[test]
    fn test_update_network_case_update_existing() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let addr = Address::generate(&env);
            let mut entries = Vec::new(&env);
            entries.push_back(NetworkEntry {
                address: addr.clone(),
                username: String::from_str(&env, "user"),
                total_tips_received: 100,
                credit_score: 50,
            });
            save_entries(&env, &entries);

            let profile2 = make_profile(&env, addr.clone(), "user2", 200);
            update_network(&env, &profile2);

            let new_entries = load_entries(&env);
            assert_eq!(new_entries.len(), 1);
            assert_eq!(new_entries.get(0).unwrap().total_tips_received, 200);
            assert_eq!(new_entries.get(0).unwrap().username, profile2.username);
        });
    }

    #[test]
    fn test_update_network_case_append() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let addr = Address::generate(&env);
            let entries = Vec::new(&env);
            save_entries(&env, &entries);

            let profile = make_profile(&env, addr.clone(), "user", 100);
            update_network(&env, &profile);

            let new_entries = load_entries(&env);
            assert_eq!(new_entries.len(), 1);
            assert_eq!(new_entries.get(0).unwrap().address, addr);
        });
    }

    #[test]
    fn test_update_network_case_replace_lowest() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let addr_new = Address::generate(&env);
            let mut entries = Vec::new(&env);
            // Fill with 50 entries with totals 1..50 (unsorted)
            let mut i: u32 = 0;
            while i < 50 {
                let addr = Address::generate(&env);
                entries.push_back(NetworkEntry {
                    address: addr,
                    username: String::from_str(&env, "user"),
                    total_tips_received: i as i128 + 1,
                    credit_score: 50,
                });
                i += 1;
            }
            save_entries(&env, &entries);

            let profile_new = make_profile(&env, addr_new.clone(), "newuser", 100);
            update_network(&env, &profile_new);

            let new_entries = load_entries(&env);
            assert_eq!(new_entries.len(), 50);
            // The new entry should be present
            let mut found = false;
            let mut j: u32 = 0;
            while j < new_entries.len() {
                if new_entries.get(j).unwrap().address == addr_new {
                    found = true;
                    break;
                }
                j += 1;
            }
            assert!(found, "new high-scoring creator should be on network ranking");
            // The lowest (total=1) should be gone
            let mut has_lowest = false;
            let mut k: u32 = 0;
            while k < new_entries.len() {
                let e = new_entries.get(k).unwrap();
                if e.total_tips_received == 1 {
                    has_lowest = true;
                }
                k += 1;
            }
            assert!(!has_lowest, "lowest entry should be evicted");
        });
    }

    #[test]
    fn test_update_network_case_no_replace_if_not_greater() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let addr_new = Address::generate(&env);
            let mut entries = Vec::new(&env);
            // Fill with 50 entries with totals 1..50 (unsorted)
            let mut i: u32 = 0;
            while i < 50 {
                let addr = Address::generate(&env);
                entries.push_back(NetworkEntry {
                    address: addr,
                    username: String::from_str(&env, "user"),
                    total_tips_received: i as i128 + 1,
                    credit_score: 50,
                });
                i += 1;
            }
            save_entries(&env, &entries);

            let profile_equal = make_profile(&env, addr_new.clone(), "newuser", 1);
            update_network(&env, &profile_equal);

            let new_entries = load_entries(&env);
            assert_eq!(new_entries.len(), 50);
            let mut found = false;
            let mut j: u32 = 0;
            while j < new_entries.len() {
                if new_entries.get(j).unwrap().address == addr_new {
                    found = true;
                    break;
                }
                j += 1;
            }
            assert!(
                !found,
                "creator with total equal to lowest should not be added"
            );
        });
    }

    #[test]
    fn test_get_network_returns_correct_limit() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let mut entries = Vec::new(&env);
            let mut i: u32 = 0;
            while i < 10 {
                let addr = Address::generate(&env);
                entries.push_back(NetworkEntry {
                    address: addr,
                    username: String::from_str(&env, "user"),
                    total_tips_received: (10 - i) as i128 * 100,
                    credit_score: 50,
                });
                i += 1;
            }
            save_entries(&env, &entries);

            let result = get_network(&env, 5);
            assert_eq!(result.len(), 5);
            // Verify descending order
            let mut j: u32 = 0;
            while j < 4 {
                let curr = result.get(j).unwrap().total_tips_received;
                let next = result.get(j + 1).unwrap().total_tips_received;
                assert!(curr >= next);
                j += 1;
            }
        });
    }

    #[test]
    fn test_get_network_limit_zero_returns_all() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let mut entries = Vec::new(&env);
            let mut i: u32 = 0;
            while i < 5 {
                let addr = Address::generate(&env);
                entries.push_back(NetworkEntry {
                    address: addr,
                    username: String::from_str(&env, "user"),
                    total_tips_received: i as i128 * 10,
                    credit_score: 50,
                });
                i += 1;
            }
            save_entries(&env, &entries);

            let result = get_network(&env, 0);
            assert_eq!(result.len(), 5);
        });
    }

    #[test]
    fn test_get_network_empty_returns_empty() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let result = get_network(&env, 10);
            assert_eq!(result.len(), 0);
        });
    }

    #[test]
    fn test_is_on_network() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let addr = Address::generate(&env);
            let mut entries = Vec::new(&env);
            entries.push_back(NetworkEntry {
                address: addr.clone(),
                username: String::from_str(&env, "user"),
                total_tips_received: 100,
                credit_score: 50,
            });
            save_entries(&env, &entries);

            assert!(is_on_network(&env, &addr));
            let other = Address::generate(&env);
            assert!(!is_on_network(&env, &other));
        });
    }

    #[test]
    fn test_get_network_rank() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let mut entries = Vec::new(&env);
            let addr1 = Address::generate(&env);
            let addr2 = Address::generate(&env);
            entries.push_back(NetworkEntry {
                address: addr1.clone(),
                username: String::from_str(&env, "user1"),
                total_tips_received: 200,
                credit_score: 50,
            });
            entries.push_back(NetworkEntry {
                address: addr2.clone(),
                username: String::from_str(&env, "user2"),
                total_tips_received: 100,
                credit_score: 50,
            });
            save_entries(&env, &entries);

            assert_eq!(get_network_rank(&env, &addr1), Some(1));
            assert_eq!(get_network_rank(&env, &addr2), Some(2));
            let other = Address::generate(&env);
            assert_eq!(get_network_rank(&env, &other), None);
        });
    }

    /// Two creators with the same tip total must maintain their insertion order
    /// (first-to-arrive keeps the higher rank) after `update_network`.
    #[test]
    fn test_network_tiebreaking() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let addr_first = Address::generate(&env);
            let addr_second = Address::generate(&env);

            // addr_first reaches 100 first.
            let profile_first = make_profile(&env, addr_first.clone(), "first", 100);
            update_network(&env, &profile_first);

            // addr_second reaches the same total afterwards.
            let profile_second = make_profile(&env, addr_second.clone(), "second", 100);
            update_network(&env, &profile_second);

            let entries = load_entries(&env);
            assert_eq!(entries.len(), 2);
            assert_eq!(
                entries.get(0).unwrap().address,
                addr_first,
                "first-to-arrive must hold the higher rank on tie"
            );
            assert_eq!(entries.get(1).unwrap().address, addr_second);
        });
    }

    /// Removing an entry shifts the remaining entries up and reduces the size.
    #[test]
    fn test_network_remove() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Zap402Contract);
        env.as_contract(&contract_id, || {
            let addr1 = Address::generate(&env);
            let addr2 = Address::generate(&env);
            let addr3 = Address::generate(&env);

            update_network(&env, &make_profile(&env, addr1.clone(), "u1", 300));
            update_network(&env, &make_profile(&env, addr2.clone(), "u2", 200));
            update_network(&env, &make_profile(&env, addr3.clone(), "u3", 100));

            assert_eq!(get_network_size(&env), 3);

            // Remove the middle entry.
            remove_from_network(&env, &addr2);

            let entries = load_entries(&env);
            assert_eq!(entries.len(), 2, "size must decrease by one");
            assert_eq!(entries.get(0).unwrap().address, addr1, "rank 1 unchanged");
            assert_eq!(
                entries.get(1).unwrap().address,
                addr3,
                "addr3 shifts up to rank 2"
            );
            assert!(
                !is_on_network(&env, &addr2),
                "removed entry must be gone"
            );
        });
    }
}
