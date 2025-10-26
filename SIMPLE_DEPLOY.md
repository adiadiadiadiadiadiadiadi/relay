# Super Simple Deployment - Just Copy & Paste

## Here's Everything You Need

Your JWT secret is already generated: `a52a9f68f4fd4d506820af96f97951d9e715d31fb6f12bb9089cb7dfa3349492`

## Commands to Run (Copy Each Section)

### 1️⃣ Install Tools
```bash
npm install -g @railway/cli vercel
```

### 2️⃣ Backend Deployment
```bash
# Login to Railway (opens browser)
railway login

# Go to server folder
cd src/server

# Initialize Railway
railway init

# Add database
railway add mysql

# Set secrets
railway variables set JWT_SECRET='a52a9f68f4fd4d506820af96f97951d9e715d31fb6f12bb9089cb7dfa3349492'
railway variables set ESCROW_CONTRACT_ID='CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE'
railway variables set NETWORK_PASSPHRASE='Test SDF Network ; September 2015'

# Deploy
railway up

# Get your backend URL
railway domain
```
**Copy the URL that appears!**

### 3️⃣ Setup Database
```bash
railway mysql < setup_database.sql
```

### 4️⃣ Frontend Deployment
```bash
# Go to client folder
cd ../../src/client

# Login to Vercel (opens browser)
vercel login

# Add backend URL
vercel env add REACT_APP_API_URL production
# When prompted, paste your Railway backend URL from step 2

# Deploy
vercel --prod
```
**Copy the Vercel URL that appears!**

### 5️⃣ Update CORS
```bash
# Go back to server
cd ../server

# Update CORS with your Vercel URL
railway variables set CORS_ORIGIN='https://your-app-name.vercel.app'

# Restart
railway restart
```

## That's It! 🎉

Your app is now live at your Vercel URL!

## Need Help?

Run these to check status:
```bash
# Check backend
railway logs

# Check frontend  
vercel logs

# Check database
railway mysql
```

## Your URLs
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.railway.app

