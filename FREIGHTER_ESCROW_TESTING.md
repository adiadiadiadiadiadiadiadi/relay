# Freighter Escrow Testing Guide

## How the Escrow System Works

### The Escrow Flow
1. **Job Claimed** → Payment reservation created (XDR stored in database)
2. **Funds Stay in Employer's Wallet** → No money moves yet
3. **Employee Submits Work** → Status changes to "submitted"
4. **Employer Approves** → Signs XDR with Freighter → Payment sent
5. **OR Employer Withdraws** → Cancels job → Funds stay in wallet

### Key Points
- ✅ Payment is RESERVED when job is claimed (escrow created)
- ✅ Funds stay in employer's wallet until approval
- ✅ Employer can withdraw/cancel anytime before approval
- ✅ Employee only gets paid when employer signs with Freighter

## How to Test with Freighter

### 1. Install Freighter Wallet
```bash
# Freighter is a browser extension
# Download from: https://freighter.app/
```

### 2. Create Test Accounts
You need TWO Stellar test accounts:
1. **Employer account** - Pays for jobs
2. **Employee account** - Receives payments

#### Create Accounts via Stellar Laboratory:
1. Visit: https://www.stellar.org/laboratory/#account-creator
2. Create Account 1 (Employer)
3. Create Account 2 (Employee)
4. Save the **Secret Keys** (you'll need these)

#### Fund the Accounts:
Each account needs XLM for fees. Use Stellar Friendbot:
```
# For TESTNET
curl "https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY"
```

Or use the Freighter UI:
1. Open Freighter
2. Click "Settings"
3. Click "Add Account"
4. Import secret key

### 3. Set Up Your Database Migration

```bash
cd src/server

# Connect to MySQL
mysql -u root payroll_app

# Run the migration
source migrations/add_payment_reservation.sql;

# Exit MySQL
exit;
```

### 4. Start Your Application

#### Terminal 1 - Backend
```bash
cd src/server
npm run dev
```

#### Terminal 2 - Frontend
```bash
npm start
```

### 5. Register Wallets in Your App

#### For Employer:
1. Open your app in browser
2. Install Freighter extension
3. Sign up/log in as employer
4. Add wallet → Use employer account address
5. Save wallet

#### For Employee:
1. Open app in incognito window
2. Sign up/log in as employee
3. Add wallet → Use employee account address
4. Save wallet

## Complete Test Flow

### Step 1: Employer Posts a Job
1. Login as employer
2. Click "Post Job"
3. Fill in job details
4. Set price (e.g., 100 XLM)
5. Submit

**Result**: Job is created, status: "open"

### Step 2: Employee Claims the Job
1. Login as employee
2. Find the job
3. Click "Claim Job"

**What Happens**:
```
Server logs:
=== RESERVING PAYMENT (Creating escrow) ===
Creating payment reservation...
✅ Payment reservation created
Payment will be held until employer approves work
Payment reservation stored in database
Job claimed successfully. Payment is reserved (escrow).
```

**Result**: 
- Job status: "in_progress"
- Payment XDR stored in database
- Money stays in employer's wallet

### Step 3: Employee Submits Work
1. Employee adds work submission
2. Click "Submit Work"

**Result**: Job status: "submitted"

### Step 4a: Employer Approves Work
1. Login as employer
2. Open job details
3. Click "verify work" button

**What Happens**:
```
Freighter popup appears:
"Sign this transaction to send 100 XLM to [employee address]"
Click "Sign"
```

**Result**:
- Job status: "completed"
- Payment sent to employee
- Employee receives funds

### Step 4b: OR Employer Withdraws (Cancels)
1. Login as employer
2. Cancel the job (if not yet submitted)
3. OR call withdraw endpoint

**What Happens**:
```
Server logs:
=== WITHDRAW ENDPOINT CALLED ===
Processing withdrawal (canceling payment reservation)
✅ Payment reservation cleared - funds remain in employer wallet
```

**Result**:
- Job status: "cancelled"
- Payment XDR cleared from database
- Money stays in employer's wallet
- No payment made

## Testing Commands

### Check if Payment Reservation Exists
```sql
SELECT id, title, status, payment_reservation 
FROM jobs 
WHERE id = 'YOUR_JOB_ID';
```

If `payment_reservation` has a long string (starts with "AAAA") → ✅ Escrow created

### Test Withdraw Endpoint
```bash
curl -X POST http://localhost:3002/api/jobs/JOB_ID/withdraw \
  -H "Content-Type: application/json" \
  -d '{"employer_id": YOUR_EMPLOYER_ID}'
```

### Check Wallet Balances
Use Stellar Laboratory:
1. Visit: https://www.stellar.org/laboratory/#explorer
2. Enter wallet address
3. View balance

## Expected Behavior

### When Job is Claimed:
- ✅ Payment XDR created and stored
- ✅ No money moves
- ✅ Employer keeps all funds
- ✅ Employee sees job is claimed
- ✅ Database has `payment_reservation` set

### When Employer Approves:
- ✅ Freighter popup appears
- ✅ Employer signs transaction
- ✅ Payment sent to employee
- ✅ Employee receives funds
- ✅ `payment_reservation` cleared

### When Employer Withdraws:
- ✅ No payment occurs
- ✅ Job marked as cancelled
- ✅ Employee notified
- ✅ `payment_reservation` cleared
- ✅ Funds stay in employer wallet

## Troubleshooting

### Issue: "Freighter not detected"
**Fix**: 
1. Install Freighter extension
2. Refresh browser
3. Check Freighter icon in browser bar

### Issue: "Payment XDR expired"
**Fix**: 
- XDRs can expire after some time
- Just claim the job again (creates new XDR)

### Issue: "Insufficient balance"
**Fix**: 
- Employer wallet needs XLM
- Use Friendbot to fund: https://friendbot.stellar.org/

### Issue: "Account doesn't exist"
**Fix**: 
- Account must exist on Stellar network
- Fund it using Friendbot first

## Checking Logs

### Backend Logs:
```bash
# Look for these messages:
=== RESERVING PAYMENT (Creating escrow) ===
✅ Payment reservation created
=== USING STORED PAYMENT RESERVATION (Escrow) ===
Payment ready for signing with Freighter
```

### Frontend Logs:
```javascript
// Browser console should show:
Signing and submitting payment XDR...
✅ Payment transaction submitted successfully
```

## Key Differences from Previous System

| Old System | New Escrow System |
|------------|-------------------|
| Payment on approval | Payment reserved on claim |
| No escrow | Payment held until approval |
| Can't withdraw | Can withdraw anytime |
| Money moves immediately | Money stays until approval |

## Database Schema

The `payment_reservation` column stores the unsigned XDR:
```sql
ALTER TABLE jobs 
ADD COLUMN payment_reservation TEXT NULL;
```

This XDR represents a payment that:
- ✅ Is ready to be signed
- ✅ Holds funds in "escrow"
- ✅ Can be cancelled (withdrawn)
- ✅ Gets submitted when approved

## Advanced: Check Transaction History

Use Stellar Explorer:
```
https://stellar.expert/explorer/testnet/account/YOUR_ADDRESS
```

This shows all transactions (deposits, payments, etc.)

## Summary

The escrow system ensures:
1. ✅ Money is committed when job is claimed
2. ✅ Employer can withdraw before approval
3. ✅ Employee only gets paid after approval
4. ✅ Employer signs with Freighter to release funds
5. ✅ All happens on Stellar blockchain

Test it by running the complete flow above!

