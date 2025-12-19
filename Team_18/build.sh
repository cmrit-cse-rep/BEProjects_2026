#!/bin/bash
# Build script for Render deployment
# This ensures pip is upgraded and dependencies install correctly

set -e

echo "Checking Python version..."
python --version

echo "Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel

echo "Installing requirements (preferring pre-built wheels)..."
# Remove --only-binary line from requirements.txt temporarily
grep -v "^--only-binary" requirements.txt > requirements_temp.txt || cp requirements.txt requirements_temp.txt
pip install -r requirements_temp.txt
rm requirements_temp.txt

echo "Build complete!"

