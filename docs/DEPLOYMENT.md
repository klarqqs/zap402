# Deployment Guide

> Deploy the Zap402 Soroban contract and the Vite frontend (testnet / mainnet).

---

## Prerequisites

- **Soroban CLI** (`soroban --version` → 21.x+)
- **Rust** + `wasm32-unknown-unknown` target
- **Funded deployer** on the target network (testnet: Friendbot)
- **Node.js 18+** for the frontend

---

## 1. Contract (Zap402)

### WASM artifact

From the repo root:

```bash
cd contracts
cargo test
cargo build --target wasm32-unknown-unknown --release
```

Output:

`contracts/target/wasm32-unknown-unknown/release/zap402_contract.wasm`

### Option B — Fresh testnet deploy (recommended for new environments)

Use the script (initializes with **USDC** as tip / withdrawal SAC):

```bash
./scripts/deploy-testnet.sh
# or with an existing Soroban key name:
./scripts/deploy-testnet.sh mykey
```

The script:

1. Builds `zap402_contract.wasm`
2. Deploys to testnet
3. Calls `initialize` with **`native_token` = testnet Circle USDC SAC**  
   `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`  
   (same default as `frontend-scaffold` when `VITE_USDC_CONTRACT_ID` is unset)

### Manual deploy + initialize (testnet)

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zap402_contract.wasm \
  --source YOUR_KEY \
  --network testnet
```

Save the printed **contract id** (`C…`), then:

```bash
CONTRACT_ID="<C...>"
ADMIN="$(soroban keys address YOUR_KEY)"
# Testnet USDC SAC (use mainnet USDC SAC + network when on public)
USDC_SAC="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

soroban contract invoke \
  --id "$CONTRACT_ID" \
  --source YOUR_KEY \
  --network testnet \
  -- \
  initialize \
  --admin "$ADMIN" \
  --fee_collector "$ADMIN" \
  --fee_bps 200 \
  --native_token "$USDC_SAC"
```

The fourth parameter is still named `native_token` in the contract ABI, but it must be the **Stellar Asset Contract id for the asset you want for tips and withdrawals** (here **USDC**), not the native XLM SAC, if you want USDC zaps.

### Verify

```bash
soroban contract invoke \
  --id "$CONTRACT_ID" \
  --source YOUR_KEY \
  --network testnet \
  -- \
  get_config
```

Confirm `native_token` equals your USDC SAC.

---

## 2. Frontend (`frontend-scaffold`)

Create or update `frontend-scaffold/.env`:

```env
VITE_CONTRACT_ID=<deployed-contract-id>
VITE_NETWORK=TESTNET
# Optional on testnet (defaults match deploy script if unset):
# VITE_USDC_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

Restart `npm run dev` after changes.

```bash
cd frontend-scaffold
npm install
npm run build
```

Production output: `frontend-scaffold/build/` (or `dist/` if your Vite config uses `dist` — check `vite.config`).

---

## 3. Mainnet (later)

- Security review before real funds.
- Deploy + `initialize` with **mainnet USDC SAC** (from Stellar Expert / issuer docs), not the testnet id above.
- Set `VITE_NETWORK` / RPC / passphrase for **public** network and `VITE_USDC_CONTRACT_ID` to mainnet USDC.

---

## 4. Helper scripts

| Script | Purpose |
|--------|---------|
| `./scripts/deploy-testnet.sh` | Build, deploy, initialize with testnet USDC SAC |
| `./scripts/fund-account.sh` | Fund a testnet account |
| `./scripts/generate-bindings.sh` | TS bindings from a contract id |

---

## 5. Post-deploy checklist

- [ ] `get_config` shows expected `native_token` (USDC SAC for USDC tips)
- [ ] `VITE_CONTRACT_ID` set; app banner cleared after restart
- [ ] Register → tip (USDC + trustline) → withdraw tested on testnet
- [ ] Fee collector / creators can receive USDC (trustlines)
