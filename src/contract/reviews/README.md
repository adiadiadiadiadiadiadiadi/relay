# Reviews Smart Contract

This Soroban smart contract stores reviews on the Stellar blockchain.

## Prerequisites

You need to install the Soroban CLI and Rust:

1. **Install Rust** (if not already installed):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. **Install Soroban CLI**:
```bash
cargo install --locked --force cargo-soroban
```

## Build the Contract

```bash
make build
```

This will create `target/wasm32-unknown-unknown/release/reviews.wasm`

## Deploy to Testnet

```bash
make deploy
```

Or manually:
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reviews.wasm \
  --source deployer \
  --network testnet
```

Copy the returned contract ID and add it to your `.env` file as `REVIEWS_CONTRACT_ID`.

## Contract Functions

- `leave_review(job_id, reviewer, reviewee, rating, comment)` - Submit a review
- `get_review(review_id)` - Get a specific review
- `get_user_reviews(user)` - Get all reviews for a user
- `get_average_rating(user)` - Get average rating for a user
- `get_review_count(user)` - Get number of reviews
- `get_rating_breakdown(user)` - Get distribution of ratings
- `has_reviewed_job(job_id, reviewer)` - Check if job was reviewed


