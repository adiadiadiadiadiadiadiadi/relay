# Debugging Guide - How to See Console Logs

## Running the Backend Server

### 1. Navigate to the server directory
```bash
cd src/server
```

### 2. Start the server

**For development (with auto-reload):**
```bash
npm run dev
```

**For production:**
```bash
npm start
```

### 3. View Console Logs

All console.log statements will appear in the terminal where you started the server.

**Example output you should see:**
```
📥 REQUEST: POST /api/jobs/123/claim
=== CLAIM REQUEST RECEIVED ===
Job ID: 123
Employee ID: 456
=== CREATING ESCROW ===
Token: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
Amount (stroops): 10000000
✅ Escrow XDR received, escrow_id: xxx-xxx-xxx
```

## Checking if Server is Running

Visit: http://localhost:3001/

You should see:
```json
{
  "message": "Stellar Marketplace API",
  "version": "1.0.1",
  "debug": "Updated server"
}
```

## Troubleshooting

### Server won't start
1. Check if MySQL is running
2. Check your .env file has correct database credentials
3. Check if port 3001 is already in use

### No console logs appearing
1. Make sure you're starting the server correctly with `npm run dev` or `npm start`
2. Check if the request is actually reaching the backend (check Network tab in browser)
3. Look at the terminal where you started the server

### Database connection errors
1. Make sure MySQL is running
2. Verify database credentials in `.env` file
3. Check that the database exists

## Key Endpoints for Testing Escrow Flow

1. **POST /api/jobs/:id/claim** - Creates escrow when job is claimed
   - Console logs: "=== CREATING ESCROW ==="
   
2. **POST /api/jobs/:id/submit** - Employee submits work
   - Console logs: "Submitting work"
   
3. **POST /api/jobs/:id/approve** - Employer approves and pays
   - Console logs: "=== ESCROW APPROVAL PROCESS ==="
   - "=== FUNDING ESCROW ==="
   - "✅ Escrow funded successfully"
   - "✅ Milestone approved"
   - "✅ Funds released"

## Environment Variables (.env file)

Make sure these are set:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=payroll_app
PORT=3002
TRUSTLESS_KEY=your_trustless_api_key_here
TOKEN_CONTRACT=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

## Common Issues

### Issue: "Escrow isn't working"
**Root cause:** The escrow was created but never funded.

**Solution:** The code has been updated to automatically fund the escrow when the employer approves work.

**Flow:**
1. Job claimed → Escrow created (empty)
2. Work submitted 
3. Employer approves → Escrow funded → Approved → Funds released ✅

### Issue: "Trustless API errors"
**Check:** 
1. Is TRUSTLESS_KEY set in .env?
2. Is the API key valid?
3. Check the error message in console logs

### Issue: "Missing wallets"
**Check:**
1. Do both employer and employee have wallets?
2. Check the wallets table in the database
3. Look for console log: "❌ Missing wallets"

## Testing the Full Flow

1. **Start server:** `npm run dev`
2. **Open browser:** http://localhost:3001/
3. **Post a job** from the frontend
4. **Claim the job** (check server logs)
5. **Submit work** (check server logs)
6. **Approve work** (check server logs for funding, approval, and release)

## Server Console vs Browser Console

- **Server Console** (Terminal) - Shows backend logs, database queries, API calls
- **Browser Console** (DevTools) - Shows frontend logs, React errors, network requests

Make sure to check BOTH for full debugging information!

