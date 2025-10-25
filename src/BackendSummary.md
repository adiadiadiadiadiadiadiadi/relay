# backend/DOCUMENTATION.md

```markdown
# Trustless Jobs Backend - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Setup Instructions](#setup-instructions)
4. [Project Structure](#project-structure)
5. [API Documentation](#api-documentation)
6. [Job Lifecycle](#job-lifecycle)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Overview

Fiverr-style marketplace for the unbanked using Trustless Work escrow on Stellar blockchain.

**Key Features:**
- Job posting and marketplace
- Blockchain escrow via Trustless Work API
- USDC payments on Stellar
- No traditional authentication (wallet = identity)

**Target Users:**
- Employers: Post jobs and pay in USDC
- Employees: Claim jobs and receive instant crypto payments

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Blockchain:** Stellar (via Trustless Work API)
- **Payment:** USDC stablecoin

---

## Setup Instructions

### Prerequisites
- Node.js v18+ and npm
- MySQL 8+
- Trustless Work API key ([Get one here](https://trustlesswork.com))

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Database
```sql
CREATE DATABASE trustless_jobs;
USE trustless_jobs;

CREATE TABLE jobs (
    id char(36) PRIMARY KEY,
    employee_id char(36),
    employer_id char(36),
    title varchar(100),
    description text,
    tags text,
    price decimal(18,6),
    currency varchar(10),
    status enum('open','in_progress','submitted','completed','cancelled') DEFAULT 'open',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    name varchar(100),
    escrow_id varchar(64)
);

CREATE INDEX idx_status ON jobs(status);
CREATE INDEX idx_employer ON jobs(employer_id);
CREATE INDEX idx_employee ON jobs(employee_id);
```

### 3. Configure Environment
Create `.env` file in `backend/`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=trustless_jobs

# Trustless Work API
TRUSTLESS_WORK_API_KEY=your_trustless_work_api_key
TRUSTLESS_WORK_API_URL=https://api.trustlesswork.com

# Server Configuration
PORT=3001

# Stellar Network (Reference)
USDC_TOKEN_ADDRESS=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DISPUTE_RESOLVER_ADDRESS=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 4. Install Additional Dependencies
```bash
npm install uuid
```

### 5. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:3001`

### 6. Verify Installation
```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

---

## Project Structure

```
backend/
├── server.js                   # Express app entry point
├── .env                        # Environment variables (not in git)
├── package.json                # Dependencies
├── config/
│   └── database.js            # MySQL connection pool
├── routes/
│   └── jobs.js                # Job-related endpoints (API layer)
├── services/
│   └── trustlessWork.js       # Trustless Work API client (service layer)
└── DOCUMENTATION.md           # This file
```

**Architecture Pattern:**
- `server.js` → Main app, middleware, route registration
- `routes/jobs.js` → REST endpoints (controller layer)
- `services/trustlessWork.js` → External API calls (service layer)
- `config/database.js` → Database connection

---

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Response Format
All responses return JSON.

**Success Response:**
```json
{
  "data": {},
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "error": "Error message description"
}
```

### Error Codes
| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad request (missing/invalid fields) |
| 404  | Resource not found |
| 500  | Server error (database or Trustless Work API) |

---

## Data Models

### Job Object
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "employer_id": "GABC...XYZ",
  "employee_id": "GDEF...ABC or null",
  "title": "Design a logo",
  "description": "Need modern logo for tech startup",
  "tags": "design,logo,branding",
  "price": "100.000000",
  "currency": "USDC",
  "status": "open",
  "escrow_id": "CESCROW123...ABC or null",
  "name": "Logo Design Project",
  "created_at": "2025-10-25T12:00:00Z",
  "updated_at": "2025-10-25T12:00:00Z"
}
```

**Status Values:**
- `open` - Available for claiming
- `in_progress` - Claimed by employee, work ongoing
- `submitted` - Work submitted, awaiting approval
- `completed` - Approved, ready for fund release
- `cancelled` - Cancelled by employer

---

## API Endpoints

### 1. Get All Open Jobs
```
GET /api/jobs
```

Returns all jobs with status "open".

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "employer_id": "GABC...XYZ",
    "title": "Design a logo",
    "description": "Need modern logo",
    "price": "100.000000",
    "currency": "USDC",
    "status": "open",
    "created_at": "2025-10-25T12:00:00Z"
  }
]
```

---

### 2. Get Single Job
```
GET /api/jobs/:id
```

**URL Parameters:**
- `id` (string) - Job UUID

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "employer_id": "GABC...XYZ",
  "employee_id": null,
  "title": "Design a logo",
  "description": "Need modern logo",
  "price": "100.000000",
  "currency": "USDC",
  "status": "open",
  "escrow_id": null
}
```

**Errors:**
- `404` - Job not found

---

### 3. Get Jobs by Employer
```
GET /api/jobs/employer/:id
```

Returns all jobs posted by specific employer.

**URL Parameters:**
- `id` (string) - Employer wallet address

**Response:** Array of job objects

---

### 4. Get Jobs by Employee
```
GET /api/jobs/employee/:id
```

Returns all jobs claimed by specific employee.

**URL Parameters:**
- `id` (string) - Employee wallet address

**Response:** Array of job objects

---

### 5. Create Job
```
POST /api/jobs
```

Creates a new job listing (does not create escrow yet).

**Request Body:**
```json
{
  "employer_id": "GABC...XYZ",
  "title": "Design a logo",
  "description": "Need modern logo for tech startup",
  "tags": "design,logo,branding",
  "price": 100,
  "currency": "USDC",
  "name": "Logo Design Project"
}
```

**Required Fields:**
- `employer_id` - Employer's Stellar wallet address
- `title` - Job title (max 100 chars)
- `description` - Detailed job description
- `price` - Payment amount (decimal)
- `currency` - Currency code (e.g., "USDC")

**Optional Fields:**
- `tags` - Comma-separated tags
- `name` - Project name

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Job created successfully. Next: create escrow."
}
```

**Errors:**
- `400` - Missing required fields

**Example cURL:**
```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "employer_id": "GABC...XYZ",
    "title": "Design a logo",
    "description": "Modern tech logo needed",
    "price": 100,
    "currency": "USDC"
  }'
```

---

### 6. Create Escrow for Job
```
POST /api/jobs/:id/create-escrow
```

Creates blockchain escrow via Trustless Work API. Returns **unsigned XDR transaction** that must be signed by employer.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "service_provider": "GDEF...ABC",
  "approver": "GABC...XYZ",
  "receiver": "GDEF...ABC",
  "dispute_resolver": "GHIJ...KLM",
  "deadline": 1735689600,
  "token": "CUSDC_CONTRACT_ADDRESS"
}
```

**Field Descriptions:**
- `service_provider` - Employee's Stellar wallet address
- `approver` - Employer's Stellar wallet address (who approves work completion)
- `receiver` - Where funds are sent (usually same as service_provider)
- `dispute_resolver` - Trusted third party wallet for dispute resolution
- `deadline` - Unix timestamp (seconds) for job deadline
- `token` - USDC token contract address on Stellar

**Response:**
```json
{
  "xdr": "AAAAAgAAAAC7JAuE3XLeiRjL...",
  "escrow_id": "CESCROW123...ABC",
  "message": "Escrow created. Employer must sign and submit XDR."
}
```

**Next Steps:**
1. Frontend signs `xdr` with Freighter wallet
2. Call `/jobs/:id/submit-escrow` with signed XDR

**Errors:**
- `404` - Job not found
- `500` - Trustless Work API error

---

### 7. Submit Signed Escrow Transaction
```
POST /api/jobs/:id/submit-escrow
```

Submits signed escrow creation transaction to Stellar blockchain.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "signed_xdr": "AAAAAgAAAAC7JAuE3XLeiRjL..."
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "hash": "abc123...",
    "ledger": 12345
  },
  "message": "Escrow deployed on blockchain"
}
```

**Effects:**
- USDC locked in escrow contract
- Escrow ID saved to job record

**Errors:**
- `400` - Missing signed_xdr
- `500` - Transaction submission failed

---

### 8. Claim Job
```
POST /api/jobs/:id/claim
```

Employee claims an open job.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "employee_id": "GDEF...ABC"
}
```

**Response:**
```json
{
  "message": "Job claimed successfully"
}
```

**Effects:**
- Job status changes: `open` → `in_progress`
- `employee_id` field set
- Job removed from marketplace

**Errors:**
- `400` - Job not available (already claimed or wrong status)
- `400` - Missing employee_id

---

### 9. Submit Work
```
POST /api/jobs/:id/submit
```

Employee marks work as complete and ready for review.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:** None required

**Response:**
```json
{
  "message": "Work submitted successfully"
}
```

**Effects:**
- Job status changes: `in_progress` → `submitted`
- Employer can now approve work

**Errors:**
- `400` - Cannot submit (job not in progress)

---

### 10. Approve Work
```
POST /api/jobs/:id/approve
```

Employer approves submitted work. Returns **unsigned XDR transaction**.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "approver": "GABC...XYZ"
}
```

**Response:**
```json
{
  "xdr": "AAAAAgAAAAC7JAuE3XLeiRjL...",
  "message": "Approval XDR generated. Employer must sign and submit."
}
```

**Next Steps:**
1. Frontend signs XDR with Freighter
2. Call `/jobs/:id/submit-approval` with signed XDR

**Errors:**
- `404` - Job not found
- `400` - No escrow for this job
- `400` - Work not submitted yet

---

### 11. Submit Approval Transaction
```
POST /api/jobs/:id/submit-approval
```

Submits signed work approval transaction to blockchain.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "signed_xdr": "AAAAAgAAAAC7JAuE3XLeiRjL..."
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "hash": "def456...",
    "ledger": 12346
  },
  "message": "Work approved on blockchain"
}
```

**Effects:**
- Job status changes: `submitted` → `completed`
- Funds unlocked in escrow
- Employee can now withdraw payment

**Errors:**
- `400` - Missing signed_xdr
- `500` - Transaction failed

---

### 12. Release Funds
```
POST /api/jobs/:id/release
```

Employee releases escrowed funds to their wallet. Returns **unsigned XDR transaction**.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "receiver": "GDEF...ABC"
}
```

**Response:**
```json
{
  "xdr": "AAAAAgAAAAC7JAuE3XLeiRjL...",
  "message": "Release XDR generated. Employee must sign and submit."
}
```

**Next Steps:**
1. Frontend signs XDR with Freighter
2. Call `/jobs/:id/submit-release` with signed XDR

**Errors:**
- `404` - Job not found
- `400` - Work not approved yet
- `400` - No escrow for this job

---

### 13. Submit Release Transaction
```
POST /api/jobs/:id/submit-release
```

Submits signed fund release transaction to blockchain.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "signed_xdr": "AAAAAgAAAAC7JAuE3XLeiRjL..."
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "hash": "ghi789...",
    "ledger": 12347
  },
  "message": "Funds released successfully"
}
```

**Effects:**
- USDC transferred from escrow to employee wallet
- Job complete

**Errors:**
- `400` - Missing signed_xdr
- `500` - Transaction failed

---

### 14. Cancel Job
```
DELETE /api/jobs/:id
```

Employer cancels an unclaimed job.

**URL Parameters:**
- `id` (string) - Job UUID

**Request Body:**
```json
{
  "employer_id": "GABC...XYZ"
}
```

**Response:**
```json
{
  "message": "Job cancelled successfully"
}
```

**Effects:**
- Job status changes: `open` → `cancelled`
- Job removed from marketplace

**Restrictions:**
- Can only cancel jobs with status `open`
- Cannot cancel claimed jobs

**Errors:**
- `404` - Job not found or unauthorized
- `400` - Can only cancel unclaimed jobs

---

## Job Lifecycle

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     1. CREATE JOB                           │
│                  POST /api/jobs                             │
│                  Status: open                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 2. CREATE ESCROW                            │
│         POST /api/jobs/:id/create-escrow                    │
│         Returns XDR → Sign with Freighter                   │
│         POST /api/jobs/:id/submit-escrow                    │
│         → USDC locked on blockchain                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   3. CLAIM JOB                              │
│             POST /api/jobs/:id/claim                        │
│             Status: in_progress                             │
│             Employee assigned                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  4. SUBMIT WORK                             │
│            POST /api/jobs/:id/submit                        │
│            Status: submitted                                │
│            Awaiting employer approval                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  5. APPROVE WORK                            │
│          POST /api/jobs/:id/approve                         │
│          Returns XDR → Sign with Freighter                  │
│          POST /api/jobs/:id/submit-approval                 │
│          Status: completed                                  │
│          Funds unlocked in escrow                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  6. RELEASE FUNDS                           │
│          POST /api/jobs/:id/release                         │
│          Returns XDR → Sign with Freighter                  │
│          POST /api/jobs/:id/submit-release                  │
│          → USDC sent to employee wallet ✓                   │
└─────────────────────────────────────────────────────────────┘
```

### Status Transitions

| From | To | Trigger | Who |
|------|----|----|-----|
| - | `open` | Job created | Employer |
| `open` | `in_progress` | Job claimed | Employee |
| `in_progress` | `submitted` | Work submitted | Employee |
| `submitted` | `completed` | Work approved (on-chain) | Employer |
| `open` | `cancelled` | Job cancelled | Employer |

### Blockchain Transactions

Three operations require signing with Freighter wallet:

1. **Create Escrow** - Employer locks USDC
2. **Approve Work** - Employer unlocks escrow
3. **Release Funds** - Employee withdraws USDC

---

## Frontend Integration

### Required Environment Variables

Frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_USDC_TOKEN=CUSDC_CONTRACT_ADDRESS_HERE
REACT_APP_DISPUTE_RESOLVER=GRESOLVER_WALLET_ADDRESS_HERE
```

### Signing Transactions with Freighter

All blockchain operations return unsigned XDR that must be signed:

```javascript
// Example: Creating escrow

// 1. Get unsigned XDR from backend
const response = await fetch('/api/jobs/123/create-escrow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_provider: employeeWallet,
    approver: employerWallet,
    receiver: employeeWallet,
    dispute_resolver: resolverWallet,
    deadline: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    token: USDC_TOKEN_ADDRESS
  })
});

const { xdr, escrow_id } = await response.json();

// 2. Sign with Freighter
const signedXDR = await window.freighter.signTransaction(xdr, {
  network: 'TESTNET', // or 'PUBLIC' for mainnet
  networkPassphrase: 'Test SDF Network ; September 2015'
});

// 3. Submit signed transaction
await fetch('/api/jobs/123/submit-escrow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ signed_xdr: signedXDR })
});

console.log('Escrow created! ID:', escrow_id);
```

### Full Job Creation Flow (Frontend)

```javascript
async function createJobWithEscrow(jobData, employeeWallet) {
  // Step 1: Create job in database
  const jobResponse = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employer_id: currentWallet,
      title: jobData.title,
      description: jobData.description,
      price: jobData.price,
      currency: 'USDC'
    })
  });
  
  const { job_id } = await jobResponse.json();
  
  // Step 2: Create escrow (get XDR)
  const escrowResponse = await fetch(`${API_URL}/jobs/${job_id}/create-escrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_provider: employeeWallet,
      approver: currentWallet,
      receiver: employeeWallet,
      dispute_resolver: DISPUTE_RESOLVER,
      deadline: Math.floor(Date.now() / 1000) + (86400 * 7), // 7 days
      token: USDC_TOKEN
    })
  });
  
  const { xdr } = await escrowResponse.json();
  
  // Step 3: Sign with Freighter
  const signedXDR = await window.freighter.signTransaction(xdr, {
    network: 'TESTNET'
  });
  
  // Step 4: Submit to blockchain
  await fetch(`${API_URL}/jobs/${job_id}/submit-escrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signed_xdr: signedXDR })
  });
  
  return job_id;
}
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/jobs', { method: 'POST', ... });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const data = await response.json();
  // Success
} catch (error) {
  if (error.message === 'Job not found') {
    // Handle 404
  } else if (error.message === 'Missing required fields') {
    // Handle 400
  } else {
    // Handle other errors
  }
}
```

### Checking Freighter Installation

```javascript
// Check if Freighter is installed
if (!window.freighter) {
  alert('Please install Freighter wallet extension');
  window.open('https://www.freighter.app/', '_blank');
  return;
}

// Get connected wallet
const publicKey = await window.freighter.getPublicKey();
console.log('Connected wallet:', publicKey);
```

---

## Testing

### Manual Testing with cURL

**1. Create a job:**
```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "employer_id": "GABC123XYZ",
    "title": "Design a logo",
    "description": "Modern tech startup logo",
    "price": 100,
    "currency": "USDC"
  }'
```

**2. Get all open jobs:**
```bash
curl http://localhost:3001/api/jobs
```

**3. Claim a job:**
```bash
curl -X POST http://localhost:3001/api/jobs/JOB_UUID_HERE/claim \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "GDEF456ABC"}'
```

**4. Submit work:**
```bash
curl -X POST http://localhost:3001/api/jobs/JOB_UUID_HERE/submit
```

### Testing Checklist

Before connecting frontend:

- [ ] Server starts without errors (`npm start`)
- [ ] Database connection works (check server logs)
- [ ] Health endpoint responds (`curl http://localhost:3001/health`)
- [ ] Can create job (`POST /api/jobs`)
- [ ] Can fetch jobs (`GET /api/jobs`)
- [ ] Can claim job (`POST /api/jobs/:id/claim`)
- [ ] Trustless Work API key is valid (check `.env`)
- [ ] CORS allows frontend origin (update `server.js` if needed)

### Common Issues

**Issue:** `Error: connect ECONNREFUSED`
- **Solution:** Check MySQL is running

**Issue:** `HostError: Error(Storage, MissingValue)`
- **Solution:** Contract not deployed or wrong address

**Issue:** `401 Unauthorized` from Trustless Work
- **Solution:** Check API key in `.env`

**Issue:** `CORS error` in browser
- **Solution:** Update CORS origin in `server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
```

---

## Deployment

### Environment Setup

**Production `.env`:**
```env
DB_HOST=your-prod-db-host
DB_USER=prod_user
DB_PASSWORD=strong_password
DB_NAME=trustless_jobs

TRUSTLESS_WORK_API_KEY=prod_api_key
TRUSTLESS_WORK_API_URL=https://api.trustlesswork.com

PORT=3001

# Use mainnet addresses
USDC_TOKEN_ADDRESS=CXXXXXXX
DISPUTE_RESOLVER_ADDRESS=GXXXXXXX
```

### Deployment Platforms

**Recommended platforms:**
- Railway
- Render
- Heroku
- AWS EC2

**Database:**
- AWS RDS (MySQL)
- PlanetScale
- Railway (includes MySQL)

### Security Checklist

- [ ] `.env` not in version control (add to `.gitignore`)
- [ ] Use environment variables, never hardcode secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS origin (not `*`)
- [ ] Use strong database password
- [ ] Rate limit API endpoints (consider express-rate-limit)
- [ ] Validate all user inputs
- [ ] Log errors without exposing sensitive data

### Scaling Considerations

**Database:**
- Add indexes for frequently queried fields
- Consider read replicas for heavy load
- Regular backups

**API:**
- Cache frequently accessed data (Redis)
- Load balancer for multiple instances
- Monitor Trustless Work API rate limits (50/min)

---

## Support & Resources

### Documentation Links
- [Trustless Work API Docs](https://docs.trustlesswork.com)
- [Stellar Developer Docs](https://developers.stellar.org)
- [Freighter Wallet](https://www.freighter.app)
- [Express.js Guide](https://expressjs.com)

### Troubleshooting

**Backend won't start:**
1. Check MySQL is running: `mysql -u root -p`
2. Verify `.env` file exists and has correct values
3. Check Node version: `node --version` (need v18+)
4. Reinstall dependencies: `rm -rf node_modules && npm install`

**Trustless Work API errors:**
1. Verify API key is active
2. Check rate limits (50 requests/minute)
3. Review request payload matches their schema
4. Check network (Testnet vs Mainnet)

**Database issues:**
1. Verify credentials in `.env`
2. Check database exists: `SHOW DATABASES;`
3. Verify table schema matches current version
4. Check MySQL logs for errors

---

## License

MIT

---

## Contributors

Built for Stellar Hackathon 2025
```

**Save this as `backend/DOCUMENTATION.md` and give it to your partner!**