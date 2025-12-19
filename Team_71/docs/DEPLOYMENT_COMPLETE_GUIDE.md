# 🚀 Complete Deployment Guide

**Step-by-step guide to deploy SentinelIQ - Local Docker or Cloud (Railway)**

---

## 📋 Table of Contents

1. [Local Deployment (Docker)](#local-deployment-docker)
2. [Cloud Deployment (Railway)](#cloud-deployment-railway-recommended)
3. [Custom Domain Setup](#custom-domain-setup)
4. [Troubleshooting](#troubleshooting)

---

## 🐳 Local Deployment (Docker)

### Prerequisites

- **Docker Desktop:** v20.10 or higher
- **Docker Compose:** v2.0 or higher
- **4GB RAM minimum**
- **Ports Available:** 3000, 8000, 5432

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd insider-threat-detection
```

### Step 2: Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 3: Initialize Database

```bash
# Initialize database schema
docker-compose exec backend python -c "from database import init_db; init_db()"

# Populate with demo data
docker-compose exec backend python populate_database.py
```

### Step 4: Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin Login:** `admin` / `admin123`

### Service Management

```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild services
docker-compose build --no-cache
docker-compose up -d
```

---

## ☁️ Cloud Deployment (Railway) - Recommended

---

## 📋 Important: Domain vs Hosting

### Buying a Domain (.in for ₹350/year)

**What a domain gives you:**
- ✅ Custom URL (e.g., `sentineliq.in` instead of `sentineliq.up.railway.app`)
- ✅ Professional appearance
- ✅ Brand identity

**What a domain does NOT give you:**
- ❌ **Does NOT provide hosting** (you still need Railway/Render/etc.)
- ❌ **Does NOT eliminate hosting costs**
- ❌ **Does NOT provide servers or databases**

**How it works:**
1. Buy domain (₹350/year from providers like GoDaddy, Namecheap)
2. Deploy on Railway (free with $5 credit/month)
3. Point domain to Railway (free, takes 5 minutes)
4. Result: `sentineliq.in` → Railway hosting

**Recommendation:** Deploy first, add domain later if needed.

---

## 🎯 Recommended Solution: Railway

**Why Railway?**
- ✅ **$5 free credit monthly** (renews forever)
- ✅ **No 90-day limit** (unlike Render)
- ✅ **PostgreSQL included** (free tier)
- ✅ **Easy deployment** (GitHub integration)
- ✅ **Auto-deploy** on every push
- ✅ **Custom domain support** (free)
- ✅ **Cost:** ~$7/month after credits (very affordable)

**Total Cost:**
- Hosting: ~$7/month (Railway)
- Domain (optional): ₹350/year (~₹30/month)
- **Total: ~$7/month or ~₹600/month**

---

## 📋 Prerequisites

- ✅ GitHub repository with your code
- ✅ Railway account (sign up at https://railway.app - free, no credit card)
- ✅ 15 minutes of time

---

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. **Sign up with GitHub** (recommended - one click)
4. Authorize Railway to access your repositories
5. **No credit card required for free tier!**

---

### Step 2: Create PostgreSQL Database

1. In Railway dashboard, click **"New Project"**
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Wait for database to be created (~30 seconds)
4. Click on the database service
5. Go to **"Variables"** tab
6. **Copy the `DATABASE_URL`** - you'll need this!

**Note:** Keep this tab open, you'll need the DATABASE_URL in next step.

---

### Step 3: Deploy Backend

1. In the same project, click **"New"** → **"GitHub Repo"**
2. Select your repository: `insider-threat-detection`
3. Railway will detect it's a Python project
4. **Configure Service:**
   - Click on the service
   - Go to **"Settings"** tab
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty - auto-detected)
   - **Start Command:** `python startup.py && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables:**
   - Go to **"Variables"** tab
   - Click **"New Variable"**
   - Add these variables one by one:
     ```
     DATABASE_URL = <paste from PostgreSQL service>
     SECRET_KEY = <generate random key - see below>
     MODEL_PATH = /app/models
     CORS_ORIGINS = https://sentineliq-frontend.up.railway.app
     PORT = ${{PORT}}
     ```
6. **Generate SECRET_KEY:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Copy the output and paste as SECRET_KEY value.
7. **Generate Domain:**
   - Go to **"Settings"** tab
   - Scroll to **"Networking"** section
   - Click **"Generate Domain"**
   - Copy the domain (e.g., `sentineliq-backend.up.railway.app`)
   - **Update CORS_ORIGINS** with this URL (we'll update it later with frontend URL)
8. **Wait for deployment** (~3-5 minutes)
   - Watch the logs to see database initialization
   - Should see: "✅ Database initialization complete!"

---

### Step 4: Deploy Frontend

1. In the same project, click **"New"** → **"GitHub Repo"**
2. Select the same repository: `insider-threat-detection`
3. **Configure Service:**
   - Click on the service
   - Go to **"Settings"** tab
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l $PORT`
4. **Add Environment Variables:**
   - Go to **"Variables"** tab
   - Click **"New Variable"**
   - Add:
     ```
     REACT_APP_API_URL = https://sentineliq-backend.up.railway.app
     PORT = ${{PORT}}
     ```
   - **Replace** `sentineliq-backend.up.railway.app` with your actual backend URL
5. **Generate Domain:**
   - Go to **"Settings"** tab
   - Scroll to **"Networking"** section
   - Click **"Generate Domain"**
   - Copy the domain (e.g., `sentineliq-frontend.up.railway.app`)
6. **Update Backend CORS:**
   - Go back to backend service
   - Go to **"Variables"** tab
   - Update `CORS_ORIGINS` with your frontend URL:
     ```
     CORS_ORIGINS = https://sentineliq-frontend.up.railway.app
     ```
   - Service will auto-redeploy
7. **Wait for deployment** (~3-5 minutes)

---

### Step 5: Verify Deployment

1. **Check Backend Health:**
   ```bash
   curl https://sentineliq-backend.up.railway.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "models_loaded": true
   }
   ```

2. **Check Frontend:**
   - Visit: `https://sentineliq-frontend.up.railway.app`
   - Should load the dashboard

3. **Test Login:**
   - Use credentials from `docs/LOGIN_CREDENTIALS.md`
   - Admin: `admin` / `admin123`

---

## 🌐 Adding Custom Domain (Optional)

### If you bought a domain (e.g., sentineliq.in):

1. **For Backend:**
   - Go to backend service → **"Settings"** → **"Networking"**
   - Click **"Custom Domain"**
   - Enter: `api.sentineliq.in` (or `backend.sentineliq.in`)
   - Follow DNS instructions

2. **For Frontend:**
   - Go to frontend service → **"Settings"** → **"Networking"**
   - Click **"Custom Domain"**
   - Enter: `sentineliq.in` (or `www.sentineliq.in`)
   - Follow DNS instructions

3. **Update Environment Variables:**
   - Update `REACT_APP_API_URL` in frontend to use custom domain
   - Update `CORS_ORIGINS` in backend to include custom domain

**DNS Records to Add (in your domain provider):**
```
Type: CNAME
Name: api (or backend)
Value: sentineliq-backend.up.railway.app

Type: CNAME
Name: @ (or www)
Value: sentineliq-frontend.up.railway.app
```

**Note:** DNS propagation takes 5-60 minutes.

---

## 💰 Pricing & Free Credits

### Free Tier:
- **$5 free credit monthly** (renews every month)
- **500 hours free** per month
- **No credit card required**

### What $5 Covers:
- Backend service: ~$5/month
- PostgreSQL: ~$5/month
- Frontend: ~$2/month

**Total:** ~$12/month, but $5 is free!

**You pay:** ~$7/month (~₹600/month)

**With domain:** ~₹630/month total

---

## 🔄 Auto-Deploy

Railway automatically deploys when you push to GitHub!

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update code"
   git push
   ```
3. Railway detects changes
4. Auto-deploys (takes ~3-5 minutes)

---

## 📊 Monitoring & Logs

### View Logs:
1. Click on service in Railway dashboard
2. Go to **"Deployments"** tab
3. Click on latest deployment
4. View real-time logs

### Check Usage:
1. Click **"Project Settings"**
2. View **"Usage"** tab
3. See credit usage and costs

---

## 🐛 Troubleshooting

### Issue: Build fails

**Check:**
- Root directory is correct (`backend` or `frontend`)
- Build command is correct
- Check logs for specific errors

**Solution:**
- Verify `backend/Dockerfile` exists
- Check `frontend/package.json` exists
- Review build logs in Railway

### Issue: Database connection fails

**Check:**
- DATABASE_URL is correct (use from PostgreSQL service)
- Database service is running
- Connection string format is correct

**Solution:**
- Use "Internal Database URL" from PostgreSQL service
- Format: `postgresql://user:pass@host:port/dbname`
- Verify database is running in Railway dashboard

### Issue: Frontend can't connect to backend

**Check:**
- REACT_APP_API_URL is correct
- Backend is running
- CORS_ORIGINS includes frontend URL
- Rebuild frontend after changing env vars

**Solution:**
- Update `REACT_APP_API_URL` in frontend variables
- Update `CORS_ORIGINS` in backend variables
- Wait for redeploy

### Issue: Models not loading

**Check:**
- Models are in repository (`models/` folder)
- MODEL_PATH env var is set to `/app/models`
- Check logs for model loading errors

**Solution:**
- Verify models are committed to Git
- Check startup logs for model loading messages
- Ensure MODEL_PATH is correct

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database initialized (check logs)
- [ ] Demo data populated (check logs)
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] Health check endpoint working
- [ ] Login functionality tested
- [ ] API endpoints responding
- [ ] ML models loading correctly
- [ ] Custom domain configured (if applicable)

---

## 🎉 Success!

Your application is now live!

**URLs:**
- **Frontend:** `https://sentineliq-frontend.up.railway.app`
- **Backend API:** `https://sentineliq-backend.up.railway.app`
- **API Docs:** `https://sentineliq-backend.up.railway.app/docs`
- **Health Check:** `https://sentineliq-backend.up.railway.app/api/health`

**With custom domain:**
- **Frontend:** `https://sentineliq.in`
- **Backend:** `https://api.sentineliq.in`

---

## 📚 Additional Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Domain Providers:** GoDaddy, Namecheap, Google Domains

---

## 🆘 Need Help?

1. **Check logs** in Railway dashboard
2. **Verify environment variables**
3. **Test database connection**
4. **Review troubleshooting section above**

---

**Ready to deploy?** Follow the steps above and you'll be live in 15 minutes! 🚀

