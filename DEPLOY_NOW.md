# Deploy Your App Right Now

## Quick Start (5 Minutes)

### Step 1: Install CLI Tools

```bash
# Install Railway CLI
npm install -g @railway/cli

# Install Vercel CLI
npm install -g vercel

# Verify installation
railway --version
vercel --version
```

### Step 2: Deploy Backend

```bash
cd src/server

# Login to Railway
railway login

# Create new project
railway init
railway add mysql

# Set environment variables
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set ESCROW_CONTRACT_ID=CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE
railway variables set CORS_ORIGIN=https://your-frontend-name.vercel.app

# Deploy
railway up

# Get your backend URL
railway domain
```

**Copy the backend URL** (e.g., `https://stellar-backend.railway.app`)

### Step 3: Run Database Setup

```bash
# Connect to MySQL
railway mysql

# Then run:
source setup_database.sql;
exit;
```

Or use this one-liner:
```bash
railway mysql < setup_database.sql
```

### Step 4: Deploy Frontend

```bash
cd ../client

# Login to Vercel
vercel login

# Set backend URL
# Replace YOUR_BACKEND_URL with the URL from Step 2
vercel env add REACT_APP_API_URL production
# When prompted, enter: https://your-backend.railway.app

# Deploy to production
vercel --prod --yes
```

**Copy the frontend URL** (e.g., `https://stellar-marketplace.vercel.app`)

### Step 5: Update Backend CORS

Go back to Railway and update CORS_ORIGIN:
```bash
cd src/server
railway variables set CORS_ORIGIN=https://your-frontend-name.vercel.app
railway restart
```

### Step 6: Test It!

1. Visit your Vercel frontend URL
2. Sign up
3. Post a job
4. Test the full flow!

## One Command Deployment

After CLIs are installed, just run:

```bash
./deploy.sh
```

And follow the prompts!

## Environment Variables Needed

### Backend (Railway):
```
DB_HOST=localhost (auto-set by Railway)
DB_USER=root (auto-set by Railway)
DB_PASSWORD=(auto-set by Railway)
DB_NAME=railway (auto-set by Railway)
PORT=3002
JWT_SECRET=random_string
ESCROW_CONTRACT_ID=CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE
CORS_ORIGIN=your_frontend_url
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### Frontend (Vercel):
```
REACT_APP_API_URL=https://your-backend.railway.app
```

## Troubleshooting

### Backend won't deploy:
```bash
# Check logs
railway logs

# Check if MySQL is running
railway mysql
```

### Frontend won't connect:
```bash
# Check environment variable
vercel env ls

# Update API URL
vercel env add REACT_APP_API_URL production
```

### Database errors:
```bash
# Reset database
railway mysql
DROP DATABASE railway;
CREATE DATABASE railway;
source setup_database.sql;
```

## Your URLs After Deploy

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app  
- **Smart Contract**: CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE (Testnet)

## Need Help?

Run this to get all your deployment info:
```bash
echo "Backend: $(railway domain)"
echo "Frontend: Check Vercel dashboard"
echo "Database: Railway MySQL"
```

Your app will be live in **~10 minutes**! 🚀

