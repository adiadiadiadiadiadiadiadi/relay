# PROJECT CONTEXT - Stablecoin Payroll System

## What We're Building
A blockchain-based payroll escrow system where:
1. Employers deposit USDC and create payments for workers
2. Employers release payments when work is done
3. Workers claim released payments
4. All payments recorded on-chain for tax purposes

## Tech Stack
- **Smart Contracts:** Soroban (Rust) on Stellar blockchain
- **Frontend:** React + JavaScript
- **Wallet:** Freighter (Stellar wallet extension)
- **Network:** Stellar Testnet

## Project Structure
```
project/
├── contract/                    # Soroban smart contract
│   ├── src/
│   │   └── lib.rs              # Main contract code
│   ├── Cargo.toml
│   └── README.md
└── frontend/                    # React frontend
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── ConnectWallet.jsx
    │   │   ├── EmployerView.jsx
    │   │   └── WorkerView.jsx
    │   └── utils/
    │       └── stellar.js       # Contract interaction
    └── package.json
```

## Critical Data Types (MUST MATCH EVERYWHERE)

### Payment Object Structure:
```rust
// In Rust contract:
pub struct Payment {
    pub id: u64,
    pub employer: Address,
    pub worker: Address,
    pub amount: i128,          // In stroops (1 USDC = 10,000,000 stroops)
    pub status: u32,           // 0=pending, 1=released, 2=claimed
    pub created_at: u64,       // Unix timestamp
    pub description: String,
}
```
```javascript
// In JavaScript frontend:
{
  id: number,
  employer: string,           // Stellar address
  worker: string,             // Stellar address  
  amount: number,             // In stroops
  status: number,             // 0=pending, 1=released, 2=claimed
  created_at: number,         // Unix timestamp
  description: string
}
```

## Contract Functions (Exact Names)

1. **deposit(employer: Address, amount: i128) -> Result<(), Error>**
   - Employer adds USDC to their escrow balance

2. **create_payment(employer: Address, worker: Address, amount: i128, description: String) -> Result<u64, Error>**
   - Returns payment ID
   - Deducts from employer's balance
   - Creates payment with status=0 (pending)

3. **release_payment(employer: Address, payment_id: u64) -> Result<(), Error>**
   - Changes status from 0 to 1 (released)
   - Only employer can call

4. **claim_payment(worker: Address, payment_id: u64) -> Result<(), Error>**
   - Transfers USDC to worker
   - Changes status from 1 to 2 (claimed)
   - Only worker can call

5. **get_payment(payment_id: u64) -> Payment**
   - Returns payment details

6. **get_worker_payments(worker: Address) -> Vec<Payment>**
   - Returns all payments for a worker

## Key Constants
- Contract ID: `[TO BE FILLED AFTER DEPLOYMENT]`
- Network: Stellar Testnet
- RPC URL: `https://soroban-testnet.stellar.org`
- Network Passphrase: `StellarSDK.Networks.TESTNET`
- USDC conversion: 1 USDC = 10,000,000 stroops

## Testing Requirements
- Test with TWO wallets (one employer, one worker)
- Each piece must work before moving to next
- Console.log all important values
- Handle errors gracefully

## Current Task
[FILL THIS IN FOR EACH AI CONVERSATION]

---
When generating code:
1. Use EXACT function names above
2. Use EXACT data structure
3. Include error handling
4. Add console.logs for debugging
5. Match the file path structure shown above
6. Ask clarifying questions if anything is ambiguous
