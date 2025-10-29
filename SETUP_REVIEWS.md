# Setting Up the Reviews System

## Current Status

✅ **Backend API endpoints are ready** in `src/server/route/jobs.js`:
- `POST /api/jobs/:id/review` - Create a review
- `GET /api/users/:id/reviews` - Get user reviews  
- `GET /api/users/:id/average-rating` - Get average rating

✅ **Soroban service** created in `src/server/services/sorobanReviews.js`

## To Complete Setup:

### Option 1: Deploy the Contract Yourself

1. Install Rust and Soroban CLI:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Soroban CLI
cargo install --locked --force cargo-soroban
```

2. Build and deploy:
```bash
cd src/contract/reviews
make build
make deploy
```

3. Copy the contract ID and add to `.env`:
```bash
REVIEWS_CONTRACT_ID=<your_contract_id_here>
```

### Option 2: Use Existing Deployed Contract

If you have a deployed reviews contract already, just add its ID to `.env`:
```bash
REVIEWS_CONTRACT_ID=<existing_contract_id>
```

### Current Architecture

1. **Backend** validates the job and generates Soroban contract call data
2. **Frontend** receives XDR data that needs signing with Freighter
3. **Freighter** signs the transaction
4. **Stellar** stores the review on blockchain permanently

### What Still Needs to Be Done

- Complete the Soroban SDK implementation in `sorobanReviews.js` (currently has TODO comments)
- Add frontend UI to call the review API
- Integrate Freighter signing for review submission (similar to escrow signing)

## API Usage Example

Once deployed, creating a review works like this:

**Frontend** makes request:
```javascript
POST /api/jobs/job-123/review
{
  "reviewer_id": 1,
  "rating": 5,
  "comment": "Great work!"
}
```

**Backend** returns XDR data:
```json
{
  "needs_signing": true,
  "xdr_data": {
    "contract_id": "...",
    "function_name": "leave_review",
    "reviewer": "GXXX...",
    "reviewee": "GYYY...",
    "rating": 5,
    "comment": "Great work!",
    "job_id": "job-123"
  }
}
```

**Frontend** then signs with Freighter and submits to Stellar blockchain.


