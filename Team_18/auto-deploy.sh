#!/bin/bash

# Automated Deployment Script for Render
# This script will guide you through deployment

echo "🚀 Automated Deployment to Render"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed"
    exit 1
fi

if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI not found. Installing..."
    npm install -g render-cli
fi

echo "✅ Prerequisites met"
echo ""

# Check authentication
echo "🔐 Checking Render authentication..."
if ! render whoami &> /dev/null; then
    echo "⚠️  Not authenticated with Render"
    echo ""
    echo "Please authenticate:"
    echo "1. Run: render auth login"
    echo "2. This will open a browser for authentication"
    echo "3. After authentication, run this script again"
    echo ""
    read -p "Open authentication now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        render auth login
        echo ""
        echo "✅ Authentication complete! Run this script again to deploy."
    fi
    exit 0
fi

echo "✅ Authenticated as: $(render whoami)"
echo ""

# Get repository info
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename -s .git "$REPO_URL")
OWNER=$(echo "$REPO_URL" | sed -E 's/.*[:/]([^/]+)\/.*/\1/')

echo "📦 Repository: $OWNER/$REPO_NAME"
echo ""

# Deploy backend
echo "🔧 Deploying Backend..."
echo ""

read -p "Enter service name for backend (default: landslide-backend): " BACKEND_NAME
BACKEND_NAME=${BACKEND_NAME:-landslide-backend}

echo "Creating backend service..."
render services create web \
    --name "$BACKEND_NAME" \
    --repo "$REPO_URL" \
    --branch main \
    --root-dir landslide-backend \
    --env PYTHON_VERSION=3.12.2 \
    --build-command "pip install -r requirements.txt" \
    --start-command "gunicorn app:app --bind 0.0.0.0:\$PORT" || {
    echo "⚠️  Service might already exist or there was an error"
    echo "Continuing..."
}

echo ""
echo "✅ Backend deployment initiated!"
echo ""

# Get backend URL
echo "⏳ Waiting for backend URL..."
sleep 5
BACKEND_URL=$(render services list --format json | jq -r ".[] | select(.name==\"$BACKEND_NAME\") | .serviceDetails.url" 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  Could not automatically get backend URL"
    read -p "Enter your backend URL: " BACKEND_URL
else
    echo "✅ Backend URL: $BACKEND_URL"
fi

echo ""
echo "🔧 Deploying Frontend..."
echo ""

read -p "Enter service name for frontend (default: landslide-frontend): " FRONTEND_NAME
FRONTEND_NAME=${FRONTEND_NAME:-landslide-frontend}

echo "Creating frontend service..."
render services create static \
    --name "$FRONTEND_NAME" \
    --repo "$REPO_URL" \
    --branch main \
    --root-dir landslide-frontend \
    --build-command "npm install && npm run build" \
    --publish-dir build \
    --env REACT_APP_API_BASE="$BACKEND_URL" || {
    echo "⚠️  Service might already exist or there was an error"
    echo "You may need to set REACT_APP_API_BASE manually in the dashboard"
}

echo ""
echo "✅ Frontend deployment initiated!"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Backend: $BACKEND_URL"
echo "Frontend: Check Render dashboard for frontend URL"
echo ""
echo "Note: It may take 3-5 minutes for services to be fully deployed"

