# Deployment Checklist - What's Left

## ✅ What's Already Done For You:
- ✅ Railway & Vercel CLI installed
- ✅ JWT secret generated: `a52a9f68f4fd4d506820af96f97951d9e715d31fb6f12bb9089cb7dfa3349492`
- ✅ All config files created
- ✅ Smart contract deployed
- ✅ Database migration file ready

## 📋 What You Need to Do:

### 1. Backend (Railway) - 5 minutes
```bash
railway login                          # Opens browser
cd src/server
railway init                           # Creates project
railway add mysql                      # Adds database
railway variables set JWT_SECRET='a52a9f68f4fd4d506820af96f97951d9e715d31fb6f12bb9089cb7dfa3349492'
railway variables set ESCROW_CONTRACT_ID='CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE'
railway variables set NETWORK_PASSPHRASE='Test SDF Network ; September 2015'
railway up                             # Deploys!
railway domain                         # Copy this URL
```

**Copy the backend URL that appears!**

### 2. Database - 30 seconds
```bash
railway mysql < setup_database.sql
```

### 3. Frontend (Vercel) - 3 minutes
```bash
cd ../client
vercel login                           # Opens browser
vercel env add REACT_APP_API_URL production   # Paste your Railway URL
vercel --prod                          # Deploys!
```

**Copy the frontend URL that appears!**

### 4. Update CORS - 10 seconds
```bash
cd ../server
railway variables set CORS_ORIGIN='YOUR_VERCEL_URL'
railway restart
```

## Total Time: ~10 minutes ⏱️

## That's It!

Your app will be live at your Vercel URL! 🎉

## Need Help?

Check these files:
- `SIMPLE_DEPLOY.md` - Detailed instructions
- `DEPLOY_NOW.md` - Quick commands
- `DEPLOYMENT_GUIDE.md` - Full guide

