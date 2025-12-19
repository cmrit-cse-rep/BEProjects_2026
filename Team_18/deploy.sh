#!/bin/bash

# Landslide Risk Assessment Project - Deployment Script
# This script helps deploy the project to Render

set -e

echo "🚀 Landslide Risk Assessment - Deployment Helper"
echo "================================================"
echo ""

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  You're not on main branch. Current: $CURRENT_BRANCH"
    read -p "Switch to main? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
    fi
fi

echo "✅ Repository is ready for deployment"
echo ""
echo "📋 Deployment Options:"
echo ""
echo "1. Render (Recommended - Free tier available)"
echo "2. Railway (Alternative - Free tier available)"
echo "3. Manual deployment instructions"
echo ""
read -p "Choose deployment option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🎯 Deploying to Render..."
        echo ""
        echo "Step 1: Backend Deployment"
        echo "---------------------------"
        echo "1. Go to: https://dashboard.render.com"
        echo "2. Click 'New +' → 'Web Service'"
        echo "3. Connect GitHub repo: a3094/Major-project01"
        echo "4. Configure:"
        echo "   - Name: landslide-backend"
        echo "   - Root Directory: landslide-backend"
        echo "   - Environment: Python 3"
        echo "   - Build Command: pip install -r requirements.txt"
        echo "   - Start Command: gunicorn app:app --bind 0.0.0.0:\$PORT"
        echo "5. Click 'Create Web Service'"
        echo "6. Wait for deployment (~3-5 min)"
        echo "7. Copy the backend URL"
        echo ""
        read -p "Press Enter when backend is deployed and you have the URL..."
        read -p "Enter your backend URL: " BACKEND_URL
        
        echo ""
        echo "Step 2: Frontend Deployment"
        echo "---------------------------"
        echo "1. In Render Dashboard, click 'New +' → 'Static Site'"
        echo "2. Connect same GitHub repo"
        echo "3. Configure:"
        echo "   - Name: landslide-frontend"
        echo "   - Root Directory: landslide-frontend"
        echo "   - Build Command: npm install && npm run build"
        echo "   - Publish Directory: build"
        echo "4. Add Environment Variable:"
        echo "   - Key: REACT_APP_API_BASE"
        echo "   - Value: $BACKEND_URL"
        echo "5. Click 'Create Static Site'"
        echo ""
        echo "✅ Deployment instructions provided!"
        ;;
    2)
        echo ""
        echo "🎯 Deploying to Railway..."
        echo "See DEPLOYMENT.md for Railway-specific instructions"
        echo ""
        echo "Quick steps:"
        echo "1. Go to: https://railway.app"
        echo "2. New Project → Deploy from GitHub"
        echo "3. Add two services (backend and frontend)"
        ;;
    3)
        echo ""
        echo "📖 See DEPLOYMENT.md for detailed instructions"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Deployment process initiated!"
echo "Check QUICK_DEPLOY.md for step-by-step visual guide"

