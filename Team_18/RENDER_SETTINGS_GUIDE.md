# Render Settings - Step by Step Fix

## Current Problem
Render is using Python 3.13 by default, which pandas doesn't support. We need to force Python 3.12.7.

## Solution: Add Environment Variable

### Step-by-Step Instructions:

1. **Go to Settings**
   - In your Render dashboard, click on "Major-project01" service
   - Click "Settings" in the left sidebar

2. **Add Environment Variable**
   - Scroll down to "Environment Variables" section
   - Click "Add Environment Variable" button
   - Enter:
     - **Key**: `PYTHON_VERSION`
     - **Value**: `3.12.7`
   - Click "Save Changes"

3. **Update Build Command**
   - Still in Settings, scroll to "Build & Deploy" section
   - Find "Build Command" field
   - Change it to:
     ```
     pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
     ```
   - Click "Save Changes"

4. **Redeploy**
   - Go back to main service page
   - Click "Manual Deploy" button (top right)
   - Select "Deploy latest commit"
   - Wait 3-5 minutes

## What This Does:
- `PYTHON_VERSION=3.12.7` tells Render to use Python 3.12.7 instead of 3.13
- Python 3.12.7 is fully supported by pandas 2.2.3
- This will use pre-built wheels instead of compiling from source

## Expected Result:
- Build should complete successfully
- No more "metadata-generation-failed" errors
- Service will be live at your URL

## If It Still Fails:
1. Check the logs to see what Python version is being used
2. Verify the environment variable was saved correctly
3. Try deleting and recreating the service with the environment variable set from the start

