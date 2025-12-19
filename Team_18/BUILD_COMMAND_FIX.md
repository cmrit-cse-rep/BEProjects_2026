# Build Command Fix

## Current Issue
The build command can't find `requirements.txt` because it's not running from the correct directory.

## Solution: Update Build Command in Render

### Go to Settings → Build & Deploy

**Current Build Command (WRONG):**
```
pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

**New Build Command (CORRECT):**
```
cd landslide-backend && pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

**OR if Root Directory is already set to `landslide-backend`:**
```
pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

## Check Your Root Directory Setting

1. Go to Settings
2. Check "Root Directory" field
3. It should be: `landslide-backend`
4. If it's empty or wrong, set it to: `landslide-backend`

## Recommended Build Command

Use this exact command:
```
cd landslide-backend && pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

This ensures it works regardless of Root Directory setting.

