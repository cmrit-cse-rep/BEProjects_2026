# CRITICAL: Render Python Version Fix

Render is using Python 3.13 by default, which pandas doesn't support yet.

## ⚠️ YOU MUST DO THIS IN RENDER DASHBOARD:

1. Go to your `landslide-backend` service in Render
2. Click **"Settings"**
3. Scroll to **"Environment Variables"** section
4. Click **"Add Environment Variable"**
5. Add:
   - **Key**: `PYTHON_VERSION`
   - **Value**: `3.12.7`
6. **Save Changes**
7. Go to **"Settings"** → **"Build & Deploy"**
8. Update **Build Command** to:
   ```
   pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
   ```
9. **Save Changes**
10. Click **"Manual Deploy"** → **"Deploy latest commit"**

## Alternative: Delete and Recreate Service

If the above doesn't work:

1. **Delete** the current `landslide-backend` service
2. **Create New Web Service**
3. Use these **EXACT** settings:

### Basic Settings:
- Name: `landslide-backend`
- Region: Your choice
- Branch: `main`
- Root Directory: `landslide-backend`

### Environment:
- Runtime: `Python 3`
- **IMPORTANT**: In Environment Variables section, add:
  - `PYTHON_VERSION` = `3.12.7`

### Build & Deploy:
- Build Command: `pip install --upgrade pip setuptools wheel && pip install -r requirements.txt`
- Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`

### Why This Works:
- The `PYTHON_VERSION` environment variable forces Render to use Python 3.12.7
- Python 3.12.7 is fully supported by pandas 2.2.3
- Pre-built wheels will be used instead of compiling from source

