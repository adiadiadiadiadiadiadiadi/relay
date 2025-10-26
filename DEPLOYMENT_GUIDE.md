# Complete Deployment Guide

## Overview

This guide will help you deploy your Stellar freelance marketplace to production.

**Architecture:**
- Frontend: React app (deployed on Vercel)
- Backend: Node.js/Express (deployed on Railway or Render)
- Database: MySQL (on Railway or Railway MySQL)
- Smart Contracts: Deployed on Stellar Testnet

## Quick Deploy (Automated)

### Option 1: Railway (Recommended - Easiest)

Railway handles everything for you.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd src/server
railway init
railway up

# Deploy frontend (separate terminal)
cd ../..
npm run build
railway --service frontend up
```

### Option 2: Render (Free Tier Available)

1. Connect your GitHub repo to Render
2. Create Web Service for backend
3. Create Static Site for frontend
4. Add environment variables
5. Deploy!

## Manual Deploy Steps

### 1. Database Setup

First, set up your production database:

```sql
-- Run these migrations on your production database
CREATE DATABASE stellar_marketplace;
USE stellar_marketplace;

-- Run src/server/setup_database.sql
```

Or use Railway's MySQL:
```bash
railway add mysql
railway mysql < src/server/setup_database.sql
```

### 2. Environment Variables

Create `src/server/.env.production`:

```env
# Database
DB_HOST=your_production_host
DB_USER=your_production_user
DB_PASSWORD=your_production_password
DB_NAME=stellar_marketplace

# Server
PORT=3002
NODE_ENV=production

# JWT
JWT_SECRET=your_secure_random_secret_key_here

# Stellar
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contracts
ESCROW_CONTRACT_ID=CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE
REVIEWS_CONTRACT_ID=your_reviews_contract_id

# For production, use actual API keys
TRUSTLESS_KEY=your_trustless_api_key
```

### 3. Backend Deployment

#### Using Railway:
```bash
cd src/server
railway login
railway init
railway up
```

#### Using Render:
1. Create new Web Service
2. Connect your GitHub repo
3. Root directory: `src/server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables
7. Deploy

#### Using Heroku:
```bash
cd src/server
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
git push heroku main
```

### 4. Frontend Deployment

Create `src/client/.env.production`:

```env
REACT_APP_API_URL=https://your-backend-url.com
```

#### Using Vercel (Recommended):
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd src/client
vercel --prod
```

Or connect GitHub repo directly on vercel.com

#### Using Netlify:
```bash
cd src/client
npm run build
npx netlify deploy --prod
```

#### Build command:
```bash
npm run build
```

**Output directory:** `build`

## Environment Variables Summary

### Backend (.env in src/server):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=payroll_app
PORT=3002
JWT_SECRET=your-secret-key
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
ESCROW_CONTRACT_ID=CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE
REVIEWS_CONTRACT_ID=your_contract_id
TRUSTLESS_KEY=your_api_key
```

### Frontend (.env.production in src/client):
```env
REACT_APP_API_URL=https://your-backend.railway.app
```

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Backend is accessible via URL
- [ ] Frontend can connect to backend
- [ ] Authentication works
- [ ] Jobs CRUD works
- [ ] Wallet integration works
- [ ] Payments work with Freighter
- [ ] Error handling works
- [ ] All environment variables set

## Testing Production

1. Visit your frontend URL
2. Sign up a new account
3. Post a job
4. Claim the job
5. Submit work
6. Approve and pay
7. Check transactions on Stellar Explorer

## Troubleshooting

### Backend won't start:
- Check database connection
- Verify all environment variables
- Check logs: `railway logs` or `render logs`

### Frontend can't connect:
- Update API_URL in frontend .env
- Check CORS settings in backend
- Verify backend URL is accessible

### Database errors:
- Run migrations: `src/server/setup_database.sql`
- Check database credentials
- Verify database exists

## Scaling

### For larger scale:
1. Use CDN for static assets (Vercel handles this)
2. Add Redis for sessions (optional)
3. Use connection pooling for database
4. Monitor with Railway/Render dashboards
5. Set up error tracking (Sentry)

## Security Checklist

- [ ] JWT_SECRET is strong random string
- [ ] Database credentials are secure
- [ ] API keys not exposed in frontend
- [ ] CORS configured properly
- [ ] HTTPS enabled
- [ ] Rate limiting enabled (optional)

## Estimated Costs

**Free tier available on:**
- Railway: 500 hours/month free
- Render: Free tier available
- Vercel: Free for hobby projects
- Netlify: Free tier available

**Total: $0/month for small projects**

Ready to deploy! Follow the steps above. 🚀

