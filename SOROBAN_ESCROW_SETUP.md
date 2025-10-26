# Soroban Escrow Setup Guide

## What Was Created

### 1. Soroban Smart Contract
- **Location**: `src/contract/escrow/`
- **Language**: Rust (Soroban SDK)
- **Purpose**: Lock funds on blockchain until approved

### 2. Node.js Service
- **Location**: `src/server/services/sorobanEscrow.js`
- **Purpose**: Interact with Soroban contract from backend

### 3. Updated Routes
- **Location**: `src/server/route/jobs.js`
- **Purpose**: Use Soroban escrow when jobs are claimed

## How True On-Chain Escrow Works

### Flow:
```
1. Job Claimed
   └─ Creates Soroban escrow invocation
   └─ Employer signs to LOCK funds in escrow contract
   └─ 💰 Money moved to escrow account (locked)

2. Employee Submits Work
   └─ Status: "submitted"

3a. Employer Approves
   └─ Calls escrow.approve_escrow()
   └─ Employer signs with Freighter
   └─ 💰 Money released from escrow to employee
   
3b. Employer Cancels
   └─ Calls escrow.cancel_escrow()
   └─ Employer signs with Freighter
   └─ 💰 Money returned from escrow to employer
```

## Setup Required

### 1. Build the Soroban Contract

```bash
cd src/contract/escrow

# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Soroban CLI
cargo install --locked --force cargo-soroban

# Build the contract
cargo soroban contract build
```

### 2. Deploy the Contract

```bash
# Add to .env file
echo "ESCROW_CONTRACT_ID=YOUR_CONTRACT_ID" >> .env

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source deployer \
  --network testnet \
  --id G...
```

### 3. Add to Backend .env

```env
# In src/server/.env
ESCROW_CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### 4. Run Database Migration

```sql
-- Add escrow column if needed
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS payment_reservation TEXT NULL;

-- This stores the escrow invocation data
```

## How It Works

### When Job is Claimed:
1. Backend creates escrow invocation
2. Stores it in `payment_reservation` column
3. Employer must sign to lock funds
4. Funds move from employer → escrow contract

### When Work is Approved:
1. Backend creates approval invocation
2. Employer signs to release funds
3. Funds move from escrow → employee

### When Work is Cancelled:
1. Backend creates cancel invocation
2. Employer signs to return funds
3. Funds move from escrow → employer

## Key Features

✅ **True On-Chain Escrow**
- Money is locked in smart contract
- Cannot be accessed without signatures

✅ **Security**
- Employer must sign to lock funds
- Only employer can approve/cancel
- Funds never lost

✅ **Transparency**
- All escrows on blockchain
- Checkable via Soroban explorer
- Immutable records

✅ **Automatic Release**
- Funds auto-return after deadline
- Optional deadline protection

## Testing

### 1. Deploy Contract
```bash
cd src/contract/escrow
make build
make deploy
```

### 2. Test Escrow Creation
```bash
curl -X POST http://localhost:3002/api/jobs/JOB_ID/claim
```

Check logs for:
```
=== CREATING SOROBAN ESCROW ===
✅ Soroban escrow invocation created
```

### 3. Sign with Freighter
- Employer gets escrow invocation
- Signs with Freighter
- Funds locked!

### 4. Approve Work
```bash
curl -X POST http://localhost:3002/api/jobs/JOB_ID/approve
```

Check logs for:
```
=== APPROVING SOROBAN ESCROW ===
```

## Soroban Contract Functions

### create_escrow()
- Creates new escrow
- Locks funds in contract
- Sets deadline (optional)
- Returns escrow details

### approve_escrow()
- Releases funds to employee
- Only callable by employer
- Transfers from escrow to employee

### cancel_escrow()
- Returns funds to employer
- Only callable by employer
- Transfers from escrow to employer

### get_escrow()
- Query escrow details
- Read-only operation
- No signature needed

## Difference from Previous

| Feature | Old (Reservation) | New (Soroban) |
|---------|-------------------|---------------|
| Money moved on claim? | ❌ No | ✅ Yes (to escrow) |
| Funds locked? | ❌ No | ✅ Yes (in contract) |
| Can cancel? | ✅ Yes (just deletes) | ✅ Yes (returns from escrow) |
| Blockchain? | Partial | ✅ Fully on-chain |
| Setup required? | None | Contract deployment |

## Frontend Changes Needed

The frontend needs to handle Soroban contract invocations:

```javascript
// Old approach (simple payment)
await signAndSubmitTransaction(paymentXDR);

// New approach (Soroban escrow)
await signSorobanInvocation(escrowInvocation);
```

You'll need to use `@stellar/stellar-sdk` to build and sign Soroban transactions.

## Benefits

1. ✅ **True Escrow** - Funds are physically locked
2. ✅ **No Trust Needed** - Smart contract enforces rules
3. ✅ **Blockchain Transparency** - All escrows visible
4. ✅ **Automatic Protection** - Deadline returns funds
5. ✅ **Immutable** - Cannot be altered once created

## Next Steps

1. Build the Rust contract
2. Deploy to testnet
3. Add ESCROW_CONTRACT_ID to .env
4. Test with Freighter
5. Update frontend to sign Soroban transactions

This gives you **true on-chain escrow** on Stellar!

