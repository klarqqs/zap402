---
name: Contract Task
about: Smart contract implementation or testing task
title: "[CONTRACT] "
labels: contract, good first issue
assignees: ''
---

## Task Description

Clear description of what needs to be implemented.

## Scope

**File(s) to modify**:
- `contracts/zap402/src/_____.rs`

**Function(s)**:
- `function_name()`

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Technical Details

Implementation guidance and constraints.

## Tests Required

- [ ] Test case 1
- [ ] Test case 2

## Acceptance Criteria

- [ ] All requirements met
- [ ] Unit tests pass (`cargo test`)
- [ ] `cargo fmt -- --check` passes
- [ ] `cargo clippy -- -D warnings` passes
- [ ] No existing tests broken

## Resources

- [Contract Spec](docs/CONTRACT_SPEC.md)
- [API Reference](docs/API_REFERENCE.md)
- [Credit Score Algorithm](docs/CREDIT_SCORE.md)

## How to Contribute

1. Fork this repository
2. Create a branch: `feat/<issue-number>-<short-description>`
3. Implement the changes
4. Write/update tests
5. Ensure CI passes: `cargo fmt -- --check && cargo clippy -- -D warnings && cargo test`
6. Submit a PR referencing this issue
