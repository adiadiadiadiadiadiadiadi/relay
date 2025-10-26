#!/bin/bash

# Stellar Marketplace - One-Command Deployment
# This script deploys both backend and frontend

set -e  # Exit on error

echo "🚀 Stellar Marketplace - Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo ""
echo "Choose deployment method:"
echo "1) 🚂 Railway (Backend) + Vercel (Frontend) - Recommended"
echo "2) 📦 Render (Both)"
echo "3) 📋 Print instructions only"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}=== Deploying to Railway + Vercel ===${NC}"
        echo ""
        
        # Backend deployment
        echo -e "${BLUE}Deploying backend to Railway...${NC}"
        cd src/server
        
        # Login if not logged in
        if ! railway whoami &>/dev/null; then
            echo "Logging in to Railway..."
            railway login
        fi
        
        # Initialize if not already initialized
        if [ ! -f .railway ]; then
            railway init
        fi
        
        # Deploy
        echo "Deploying..."
        railway up
        
        # Get backend URL
        BACKEND_URL=$(railway domain 2>/dev/null || echo "https://your-backend.railway.app")
        echo ""
        echo -e "${GREEN}✅ Backend deployed!${NC}"
        echo -e "${GREEN}Backend URL: $BACKEND_URL${NC}"
        
        cd ../..
        
        # Frontend deployment
        echo ""
        echo -e "${BLUE}Deploying frontend to Vercel...${NC}"
        cd src/client
        
        # Create production env file
        echo "REACT_APP_API_URL=$BACKEND_URL" > .env.production
        
        # Deploy to Vercel
        vercel --prod --yes
        
        cd ../..
        
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Set environment variables in Railway dashboard"
        echo "2. Run database migrations: railway mysql < src/server/setup_database.sql"
        echo "3. Update CORS_ORIGIN with your Vercel frontend URL"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}=== Render Deployment ===${NC}"
        echo ""
        echo "Follow these steps on Render.com:"
        echo ""
        echo "Backend Setup:"
        echo "1. Go to https://render.com"
        echo "2. Click 'New +' → 'Web Service'"
        echo "3. Connect your GitHub repository"
        echo "4. Settings:"
        echo "   - Name: stellar-marketplace-backend"
        echo "   - Root Directory: src/server"
        echo "   - Build Command: npm install"
        echo "   - Start Command: npm start"
        echo "5. Add environment variables (see DEPLOYMENT_GUIDE.md)"
        echo "6. Click 'Create Web Service'"
        echo ""
        echo "Frontend Setup:"
        echo "1. Click 'New +' → 'Static Site'"
        echo "2. Connect same repository"
        echo "3. Settings:"
        echo "   - Name: stellar-marketplace-frontend"
        echo "   - Root Directory: src/client"
        echo "   - Build Command: npm install && npm run build"
        echo "   - Publish Directory: build"
        echo "4. Add environment variable: REACT_APP_API_URL = your backend URL"
        echo "5. Click 'Create Static Site'"
        ;;
        
    3)
        echo ""
        cat QUICK_DEPLOY.md
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
