# Payment Testing Guide

## Current Payment System

### What Currency?
**Currently using: XLM (Stellar's native currency)**

The system converts:
- **Your display**: "100 USDC" (what you enter in the form)
- **Actual payment**: XLM (Stellar Lumens)

### Units Explained

1. **User Interface**: You enter prices like "100 USDC" or "50 EURC"
2. **Database**: Stores as numeric value (e.g., `100`)
3. **Payment**: Currently sends **XLM**, not USDC tokens

### Why XLM?

The `stellarPayment.js` service uses:
```javascript
asset: Asset.native() // This means XLM, not USDC
```

XLM is the native currency of Stellar, so:
- ✅ Works on all Stellar accounts
- ✅ No token setup needed
- ✅ Fees are paid in XLM
- ⚠️ **But it's not what you display in the UI!**

## How to Test Payment

### 1. Get Testnet XLM

Each wallet needs XLM for:
- Account minimum balance (~2 XLM)
- Transaction fees (~0.00001 XLM per transaction)

```bash
# Fund your test accounts
curl "https://friendbot.stellar.org/?addr=YOUR_ADDRESS"
```

### 2. Test Payment Flow

1. **Post a Job** with price "100" (will pay 100 XLM, not 100 USDC!)
2. **Claim Job** as employee
3. **Submit Work** as employee
4. **Approve Work** as employer
   - Freighter popup appears
   - Shows amount in XLM (e.g., "Send 100.0000000 XLM")
5. **Sign Transaction** 
6. **Check Balances** in Freighter

### 3. Freighter Balance Updates

- ✅ You'll see the transaction in Freighter
- ✅ Balance updates AFTER transaction confirms (~5 seconds)
- ✅ Click on transaction to see details
- ✅ Check both employer (reduced) and employee (increased) balances

## Important Notes

### Currency Mismatch

**Problem**: UI shows "100 USDC" but payment sends "100 XLM"

**Why**: Code is using XLM as the payment asset, not USDC tokens

**Solution**: You have two options:

#### Option 1: Keep Using XLM (Easiest)
- Update UI to say "XLM" instead of "USDC"
- Payment works as-is

#### Option 2: Switch to USDC Tokens (More Complex)
- Need to update code to use USDC Asset
- Users need USDC tokens in their wallet
- More setup required

## Testing with Different Units

### Example Flow:

1. **Job Created**: "Build website for 100"
   - Employer wallet: 10,000 XLM
   - Employee wallet: 1,000 XLM

2. **Payment Approved**: Employer signs
   - Freighter shows: "Send 100 XLM to [employee address]"
   
3. **Transaction Confirms**: ~5 seconds
   - Employer wallet: 9,900 XLM (-100)
   - Employee wallet: 1,100 XLM (+100)
   
4. **Freighter Updates**: Balance refreshes automatically

## How to See Transaction in Freighter

1. Open Freighter extension
2. Click on "Recent Transactions"
3. You'll see the payment transaction
4. Click to expand for details:
   - Amount: 100 XLM
   - Destination: Employee address
   - Fee: ~0.00001 XLM
   - Status: Confirmed

## Checking Balances

### In Freighter:
1. Open Freighter
2. See balance at top (e.g., "1,100.0000000 XLM")
3. Click "Activity" tab to see all transactions

### On Stellar Explorer:
1. Visit: https://stellar.expert/explorer/testnet/account/YOUR_ADDRESS
2. See balance and transaction history

## Common Issues

### "Insufficient balance"
- **Fix**: Fund your testnet account
- Use: `curl "https://friendbot.stellar.org/?addr=YOUR_ADDRESS"`

### "Transaction failed"
- Check account has enough balance
- Make sure you're on testnet (not mainnet)
- Check transaction hash on explorer

### "Balance not updating"
- Refresh Freighter (click refresh button)
- Check transaction status on explorer
- Wait a few seconds (blockchain takes time)

## Expected Behavior

When you approve work:

1. ✅ Freighter popup appears automatically
2. ✅ Shows payment amount in XLM
3. ✅ Shows destination address
4. ✅ Employer clicks "Sign"
5. ✅ Transaction submits
6. ✅ **After 5-10 seconds**:
   - ✅ Balance updates in Freighter
   - ✅ Transaction appears in "Activity"
   - ✅ Employee receives payment

## Summary

- **Current system**: Pays in **XLM** (not USDC tokens)
- **Units**: Stroops (1 XLM = 10,000,000 stroops)
- **Display**: Shows as whole numbers (e.g., 100)
- **Actual payment**: Sends 100 XLM
- **Auto-update**: Yes, Freighter updates after confirmation
- **Timing**: Takes ~5-10 seconds after signing

Test it and you'll see the balances update! 🎉

