#!/bin/bash
# HuggingFace Spaces Deployment Script
# Run this to prepare your files for deployment

set -e

echo "================================"
echo "Privacy Policy API - Deployment Prep"
echo "================================"
echo ""

# Check if required files exist
echo "✓ Checking required files..."
required_files=("server.py" "scraper.py" "privacy_policy_clean.txt" "requirements.txt" "Dockerfile")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "✗ Missing: $file"
        exit 1
    else
        echo "  ✓ $file"
    fi
done

echo ""
echo "✓ All required files present"
echo ""

# Check Python version
echo "✓ Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "  Python: $python_version"

# Build Docker image locally for testing (optional)
if [ "$1" == "build" ]; then
    echo ""
    echo "🔨 Building Docker image..."
    docker build -t privacy-policy-api:latest .
    echo "✓ Build complete"
    echo ""
    echo "To test locally, run:"
    echo "  docker-compose up"
    exit 0
fi

# Display deployment instructions
echo "📋 Deployment Instructions:"
echo ""
echo "1. Create a new Space on HuggingFace:"
echo "   - Go to https://huggingface.co/spaces"
echo "   - Click 'Create new Space'"
echo "   - Select 'Docker' as SDK"
echo "   - Name your space 'privacy-policy-api'"
echo ""
echo "2. Clone the Space repository:"
echo "   git clone https://huggingface.co/spaces/YOUR_USERNAME/privacy-policy-api"
echo "   cd privacy-policy-api"
echo ""
echo "3. Copy your files:"
echo "   cp /path/to/Dockerfile ."
echo "   cp /path/to/server.py ."
echo "   cp /path/to/scraper.py ."
echo "   cp /path/to/requirements.txt ."
echo "   cp /path/to/privacy_policy_clean.txt ."
echo ""
echo "4. Commit and push:"
echo "   git add ."
echo "   git commit -m 'Add Privacy Policy API'"
echo "   git push"
echo ""
echo "5. Monitor deployment:"
echo "   - Check the 'Logs' tab in your Space"
echo "   - Wait for the build to complete (5-10 minutes)"
echo ""
echo "================================"
echo "Files ready for deployment! ✓"
echo "================================"
