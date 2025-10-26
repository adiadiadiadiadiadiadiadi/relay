# Quick Deployment - Get Live in 10 Minutes

## Step-by-Step Deployment

### 1. Prepare Your Code

First, make sure everything is committed to Git:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy Backend (Railway - Easiest)

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Create and deploy backend
cd src/server
railway init
railway add mysql  # Add MySQL database
railway up  # Deploy

# Get your backend URL
railway domain
# Copy this URL - you'll need it for frontend
```

**Note the backend URL** (e.g., `https://your-app.railway.app`)

### 3. Set Backend Environment Variables

```bash
# Set these in Railway dashboard or via CLI
railway variables set DB_HOST=localhost
railway variables set DB_USER=root
railway variables set DB_PASSWORD=your_password
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set ESCROW_CONTRACT_ID=CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
```

### 4. Run Database Migrations

```bash
railway mysql -e "source src/server/setup_database.sql"
```

Or use Railway's MySQL console:
```bash
railway mysql
# Then run: source src/server/setup_database.sql
```

### 5. Deploy Frontend (Vercel)

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy frontend
cd src/client

# Create .env.production
echo "REACT_APP_API_URL=YOUR_BACKEND_URL_FROM_STEP_2" > .env.production

# Deploy
vercel --prod
```

Or use Vercel dashboard:
1. Go to https://vercel.com
2. Import your GitHub repo
3. Root directory: `src/client`
4. Add environment variable: `REACT_APP_API_URL` = your backend URL
5. Deploy!

### 6. Update Frontend API URL (If needed)

If your frontend is already deployed, update the API URL:

```bash
vercel env add REACT_APP_API_URL production
# Enter your backend URL when prompted
```

### 7. Test Your Deployment

1. Visit your Vercel frontend URL
2. Try signing up
3. Post a job
4. Claim it
5. Test payment flow

## Alternative: Render.com

### Backend:
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: stellar-marketplace-backend
   - **Root Directory**: `src/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables
6. Deploy

### Frontend:
1. On Render, click "New +" → "Static Site"
2. Connect same GitHub repo
3. Configure:
   - **Name**: stellar-marketplace-frontend
   - **Root Directory**: `src/client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add environment variable: `REACT_APP_API_URL`
5. Deploy

## Environment Variables Checklist

### Backend (All Required):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=(from Railway/Render)
DB_NAME=stellar_marketplace
PORT=3002
JWT_SECRET=(random string)
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
ESCROW_CONTRACT_ID=CBQRMSHT6JPJNVHNW4ZQOOWVZKAEVBAJKS3WKGJUUEGFFULYA75444WE
REVIEWS_CONTRACT_ID=(your contract)
CORS_ORIGIN=(frontend URL)
TRUSTLESS_KEY=(your API key)
```

### Frontend (Required):
```
REACT_APP_API_URL=(backend URL)
```

## Post-Deployment Testing

1. **Test Authentication**
   - Sign up new account
   - Login
   - Logout

2. **Test Jobs**
   - Post a job
   - View jobs
   - Delete a job

3. **Test Escrow**
   - Claim a job
   - Submit work
   - Approve work
   - Check payment

4. **Test Messaging**
   - Send message
   - View conversation

## Troubleshooting

### Backend won't start:
- Check Railway/Render logs
- Verify database connection
- Check environment variables

### Frontend can't connect:
- Verify CORS_ORIGIN is set to frontend URL
- Check REACT_APP_API_URL in frontend
- Test backend URL directly

### Database errors:
- Run migrations
- Check database credentials
- Verify database exists

## Quick Commands Reference

```bash
# Backend
railway up           # Deploy backend
railway logs         # View logs
railway mysql        # Access database
railway shell        # SSH into container

# Frontend
vercel --prod        # Deploy to production
vercel logs          # View logs
vercel env ls        # List env variables

# Database
railway mysql < src/server/setup_database.sql  # Run migrations
```

## That's It!

Your app is now live! 🎉

- Frontend: https://your-app.vercel.app
- Backend: https://your-app.railway.app
- Smart Contract: Deployed on Testnet

Test it out and share the links!

