#!/bin/bash

# Script to submit project to BEProjects_2026 repository
# This automates steps 3-5 of the submission process

set -e  # Exit on error

echo "🚀 BEProjects_2026 Submission Helper"
echo "======================================"
echo ""

# Get team number
read -p "Enter your team number (e.g., 12): " TEAM_NUMBER
if [ -z "$TEAM_NUMBER" ]; then
    echo "❌ Team number is required!"
    exit 1
fi

TEAM_FOLDER="Team_${TEAM_NUMBER}"

# Get path to BEProjects_2026 repository
read -p "Enter the full path to your BEProjects_2026 repository (or press Enter to use current directory): " BEPROJECTS_PATH

if [ -z "$BEPROJECTS_PATH" ]; then
    # Check if we're already in BEProjects_2026
    if [ -d ".git" ] && git remote -v | grep -q "BEProjects_2026"; then
        BEPROJECTS_PATH="$(pwd)"
        echo "✅ Using current directory: $BEPROJECTS_PATH"
    else
        echo "❌ Please provide the path to your BEProjects_2026 repository"
        exit 1
    fi
fi

# Validate path
if [ ! -d "$BEPROJECTS_PATH" ]; then
    echo "❌ Directory not found: $BEPROJECTS_PATH"
    exit 1
fi

# Get current project path (where this script is located)
CURRENT_PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "📋 Summary:"
echo "  Team Folder: $TEAM_FOLDER"
echo "  BEProjects Path: $BEPROJECTS_PATH"
echo "  Source Project: $CURRENT_PROJECT_PATH"
echo ""

read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Cancelled"
    exit 1
fi

# Navigate to BEProjects_2026 repository
cd "$BEPROJECTS_PATH"

# Check if it's a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository: $BEPROJECTS_PATH"
    exit 1
fi

# Check if team folder already exists
if [ -d "$TEAM_FOLDER" ]; then
    echo "⚠️  Warning: $TEAM_FOLDER already exists!"
    read -p "Do you want to overwrite it? (y/n): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "❌ Cancelled"
        exit 1
    fi
    rm -rf "$TEAM_FOLDER"
fi

# Create team folder
echo "📁 Creating team folder: $TEAM_FOLDER"
mkdir -p "$TEAM_FOLDER"

# Copy project files (excluding .git, node_modules, __pycache__, etc.)
echo "📦 Copying project files..."
rsync -av --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='.DS_Store' \
    --exclude='build' \
    --exclude='.pytest_cache' \
    --exclude='.venv' \
    --exclude='venv' \
    "$CURRENT_PROJECT_PATH/" "$TEAM_FOLDER/"

echo ""
echo "✅ Files copied successfully!"

# Show what will be committed
echo ""
echo "📝 Files to be committed:"
git status --short "$TEAM_FOLDER/" | head -20
if [ $(git status --short "$TEAM_FOLDER/" | wc -l) -gt 20 ]; then
    echo "... and more"
fi

echo ""
read -p "Commit and push these changes? (y/n): " COMMIT_CONFIRM
if [ "$COMMIT_CONFIRM" != "y" ] && [ "$COMMIT_CONFIRM" != "Y" ]; then
    echo "ℹ️  Files copied but not committed. You can commit manually later."
    exit 0
fi

# Add files
echo "➕ Adding files to git..."
git add "$TEAM_FOLDER/"

# Commit
COMMIT_MSG="Add ${TEAM_FOLDER} project: Insider Threat Detection System"
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Push
echo "🚀 Pushing to remote repository..."
git push origin main

echo ""
echo "✅ Success! Your project has been pushed to your fork."
echo ""
echo "📋 Next steps:"
echo "1. Go to your forked repository on GitHub"
echo "2. Click 'Contribute' → 'Open Pull Request'"
echo "3. Review and submit your pull request"
echo ""

