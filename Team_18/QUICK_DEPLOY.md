# Quick Deployment Guide - Render

## 🚀 Fastest Way to Deploy

### Step 1: Deploy Backend (5 minutes)

1. Go to https://dashboard.render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub and select repository: `a3094/Major-project01`
4. Fill in:
   - **Name**: `landslide-backend`
   - **Root Directory**: `landslide-backend` (important!)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Click **"Create Web Service"**
6. Wait ~3-5 minutes for deployment
7. **Copy the URL** (e.g., `https://landslide-backend-xxxx.onrender.com`)

### Step 2: Deploy Frontend (5 minutes)

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Fill in:
   - **Name**: `landslide-frontend`
   - **Root Directory**: `landslide-frontend` (important!)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. **Add Environment Variable**:
   - Key: `REACT_APP_API_BASE`
   - Value: Your backend URL from Step 1 (e.g., `https://landslide-backend-xxxx.onrender.com`)
5. Click **"Create Static Site"**
6. Wait ~3-5 minutes for deployment

### Step 3: Test

1. Visit your frontend URL
2. Try searching for a location (e.g., "San Francisco")
3. You should see landslide risk predictions!

## ⚠️ Important Notes

- **Free tier services** on Render spin down after 15 min of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- For always-on service, upgrade to paid plan ($7/month)

## 🔧 Troubleshooting

**Backend not working?**
- Check logs in Render dashboard
- Ensure Root Directory is set to `landslide-backend`
- Verify `gunicorn` is in requirements.txt (it is!)

**Frontend can't connect?**
- Double-check `REACT_APP_API_BASE` environment variable
- Make sure it's the full backend URL (with https://)
- Rebuild the frontend after changing env vars

**CORS errors?**
- Backend already has CORS enabled
- If issues persist, check backend logs

## 📝 Alternative: Railway Deployment

Railway is another great option:

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add two services:
   - Backend: Root = `landslide-backend`, Start = `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Frontend: Root = `landslide-frontend`, Build = `npm install && npm run build`, Start = `npx serve -s build -p $PORT`
4. Set `REACT_APP_API_BASE` in frontend service

