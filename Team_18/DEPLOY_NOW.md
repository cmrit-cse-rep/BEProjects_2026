# 🚀 Deploy Now - Step by Step Guide

Follow these exact steps to deploy your project to Render (takes ~10 minutes).

## Prerequisites
- ✅ Your code is on GitHub (already done: https://github.com/a3094/Major-project01)
- ✅ You have a Render account (sign up at https://render.com - it's free!)

---

## Step 1: Deploy Backend (Flask API)

### 1.1 Go to Render Dashboard
1. Open https://dashboard.render.com
2. Sign in or create a free account

### 1.2 Create Web Service
1. Click the **"New +"** button (top right)
2. Select **"Web Service"**

### 1.3 Connect Repository
1. Click **"Connect account"** if you haven't connected GitHub
2. Authorize Render to access your GitHub
3. Select repository: **`a3094/Major-project01`**
4. Click **"Connect"**

### 1.4 Configure Backend Service
Fill in these **exact** values:

- **Name**: `landslide-backend`
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `landslide-backend` ⚠️ **IMPORTANT!**
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
- **Plan**: `Free` (or choose paid for always-on)

### 1.5 Deploy
1. Scroll down and click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. **Copy the URL** when it's ready (e.g., `https://landslide-backend-xxxx.onrender.com`)
   - ⚠️ **SAVE THIS URL** - you'll need it for the frontend!

---

## Step 2: Deploy Frontend (React App)

### 2.1 Create Static Site
1. In Render Dashboard, click **"New +"** again
2. Select **"Static Site"**

### 2.2 Connect Repository
1. Select the same repository: **`a3094/Major-project01`**
2. Click **"Connect"**

### 2.3 Configure Frontend Service
Fill in these **exact** values:

- **Name**: `landslide-frontend`
- **Branch**: `main`
- **Root Directory**: `landslide-frontend` ⚠️ **IMPORTANT!**
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`
- **Plan**: `Free`

### 2.4 Add Environment Variable
1. Scroll to **"Environment Variables"** section
2. Click **"Add Environment Variable"**
3. Add:
   - **Key**: `REACT_APP_API_BASE`
   - **Value**: Your backend URL from Step 1.5 (e.g., `https://landslide-backend-xxxx.onrender.com`)
4. ⚠️ Make sure there's **no trailing slash** in the URL!

### 2.5 Deploy
1. Click **"Create Static Site"**
2. Wait 3-5 minutes for deployment
3. **Copy the frontend URL** when ready

---

## Step 3: Test Your Deployment

### 3.1 Test Backend
1. Open your backend URL in browser
2. You should see a simple page or JSON response
3. Test API: `https://your-backend-url.onrender.com/predict?location=San Francisco`
4. You should get JSON with landslide risk data

### 3.2 Test Frontend
1. Open your frontend URL
2. Try searching for a location (e.g., "San Francisco", "Tokyo")
3. You should see landslide risk predictions!

---

## ✅ Success Checklist

- [ ] Backend is deployed and accessible
- [ ] Backend API returns predictions (test with `/predict?location=San Francisco`)
- [ ] Frontend is deployed and accessible
- [ ] Frontend can connect to backend (no CORS errors)
- [ ] Search functionality works on frontend
- [ ] Risk predictions display correctly

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend shows "Application Error"
- **Solution**: Check logs in Render dashboard → Your Service → Logs
- Common issues:
  - Wrong root directory (should be `landslide-backend`)
  - Missing dependencies (check requirements.txt)
  - Port binding issue (should use `$PORT`)

**Problem**: "Module not found" errors
- **Solution**: Ensure `gunicorn` is in requirements.txt (it is!)

### Frontend Issues

**Problem**: Frontend shows blank page or errors
- **Solution**: 
  1. Check browser console (F12) for errors
  2. Verify `REACT_APP_API_BASE` is set correctly
  3. Rebuild: In Render dashboard → Manual Deploy → Clear build cache & deploy

**Problem**: "Cannot connect to backend" or CORS errors
- **Solution**:
  1. Verify `REACT_APP_API_BASE` points to your backend URL
  2. Check backend is running (visit backend URL directly)
  3. Backend already has CORS enabled, so this shouldn't happen

**Problem**: Environment variable not working
- **Solution**: 
  1. After adding `REACT_APP_API_BASE`, you MUST rebuild
  2. Go to Render dashboard → Your Service → Manual Deploy
  3. Or wait for automatic rebuild (may take a few minutes)

### General Issues

**Problem**: Services are slow to respond
- **Solution**: This is normal on free tier! Services spin down after 15 min of inactivity. First request takes 30-60 seconds (cold start).

**Problem**: "Service not found" after deployment
- **Solution**: Wait a few more minutes. Initial deployment can take 5-10 minutes.

---

## 📝 Next Steps

1. **Custom Domain** (Optional): Add your own domain in Render settings
2. **Environment Variables**: Add any additional config in Render dashboard
3. **Monitoring**: Check Render dashboard for logs and metrics
4. **Upgrades**: Consider paid plan ($7/month) for always-on service (no spin-down)

---

## 🎉 You're Done!

Your Landslide Risk Assessment app is now live! Share your frontend URL with others.

**Need Help?**
- Check Render docs: https://render.com/docs
- Check project README or DEPLOYMENT.md
- Review logs in Render dashboard

