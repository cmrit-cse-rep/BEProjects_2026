# 🚀 Deploy Now - Quick Start

**Get your app live in 15 minutes!**

---

## ⚡ Fastest Path to Production

### Option 1: Railway (Recommended - Free for 2+ months)

**Cost:** ~$7/month (after $5 free credit)  
**Duration:** Works forever  
**Time:** 15 minutes

👉 **Follow:** [docs/DEPLOYMENT_COMPLETE_GUIDE.md](docs/DEPLOYMENT_COMPLETE_GUIDE.md#cloud-deployment-railway-recommended)

**Quick Steps:**
1. Sign up: https://railway.app (free, no credit card)
2. Create PostgreSQL database
3. Deploy backend (GitHub repo)
4. Deploy frontend (same repo)
5. Done!

---

### Option 2: Local Docker (For Testing)

**Cost:** FREE  
**Duration:** As long as you want  
**Time:** 5 minutes

👉 **Follow:** [docs/DEPLOYMENT_COMPLETE_GUIDE.md](docs/DEPLOYMENT_COMPLETE_GUIDE.md#local-deployment-docker)

**Quick Steps:**
```bash
git clone <your-repo>
cd insider-threat-detection
docker-compose up -d
docker-compose exec backend python populate_database.py
# Access: http://localhost:3000
```

---

## 🌐 Custom Domain (Optional)

**Buying a domain (.in for ₹350/year) does NOT eliminate hosting costs.**

**What domain gives you:**
- ✅ Custom URL (e.g., `sentineliq.in`)
- ✅ Professional appearance

**What domain does NOT give:**
- ❌ Does NOT provide hosting (still need Railway/Render)
- ❌ Does NOT eliminate hosting costs

**How it works:**
1. Buy domain (₹350/year)
2. Deploy on Railway (~$7/month)
3. Point domain to Railway (free, 5 minutes)
4. Result: `sentineliq.in` → Railway hosting

**Total Cost:** ~₹630/month (₹600 hosting + ₹30 domain)

---

## 📋 Prerequisites

- ✅ GitHub repository with your code
- ✅ Railway account (free, no credit card)
- ✅ 15 minutes

---

## 🎯 Recommended: Railway

**Why Railway?**
- ✅ $5 free credit monthly (renews forever)
- ✅ No 90-day limit
- ✅ PostgreSQL included
- ✅ Auto-deploy from GitHub
- ✅ Custom domain support (free)
- ✅ Cost: ~$7/month (~₹600/month)

---

## 📚 Full Guide

**Complete step-by-step instructions:**
👉 [docs/DEPLOYMENT_COMPLETE_GUIDE.md](docs/DEPLOYMENT_COMPLETE_GUIDE.md)

---

## ✅ After Deployment

**Your app will be live at:**
- Frontend: `https://sentineliq-frontend.up.railway.app`
- Backend: `https://sentineliq-backend.up.railway.app`
- API Docs: `https://sentineliq-backend.up.railway.app/docs`

**Login:**
- Admin: `admin` / `admin123`
- See [docs/LOGIN_CREDENTIALS.md](docs/LOGIN_CREDENTIALS.md)

---

**Ready?** Open [docs/DEPLOYMENT_COMPLETE_GUIDE.md](docs/DEPLOYMENT_COMPLETE_GUIDE.md) and follow the Railway deployment section! 🚀



